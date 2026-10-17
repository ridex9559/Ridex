using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using RIDEX.API.Hubs;
using RIDEX.API.Middleware;
using RIDEX.Core.Interfaces;
using RIDEX.Infrastructure.Data;
using RIDEX.Infrastructure.Providers;
using RIDEX.Infrastructure.Seed;
using RIDEX.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// 1. Configure Database (SQLite for zero-cost local execution, PostgreSQL/PostGIS for Docker/production)
var postgresConn = builder.Configuration.GetConnectionString("PostgreSQL");
var sqliteConn = builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=ridex_dev.db";

builder.Services.AddDbContext<RideXDbContext>(options =>
{
    if (!string.IsNullOrWhiteSpace(postgresConn))
    {
        options.UseNpgsql(postgresConn);
    }
    else
    {
        options.UseSqlite(sqliteConn);
    }
});

// 2. Configure Core Services & Providers
builder.Services.AddHttpClient();
builder.Services.AddSingleton<IPasswordHasher, BcryptPasswordHasher>();
builder.Services.AddScoped<ITokenService, JwtTokenService>();
builder.Services.AddSingleton<ILiveRideStateStore, InMemoryLiveRideStateStore>();
builder.Services.AddSingleton<DemoLocationProvider>();
builder.Services.AddScoped<IFileStorageService, LocalFileStorageService>();
builder.Services.AddScoped<ISyncEngine, SyncEngine>();
builder.Services.AddScoped<IRoutingService, OSRMRoutingService>();
builder.Services.AddScoped<IWeatherService, OpenMeteoWeatherService>();
builder.Services.AddScoped<IGeocodingService, NominatimGeocodingService>();

// 3. Configure SignalR Real-Time Engine
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = true;
    options.KeepAliveInterval = TimeSpan.FromSeconds(15);
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
});

// 4. Configure JWT Authentication & Authorization
var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "RIDEX_ULTRA_SECURE_ZERO_COST_DEVELOPMENT_SECRET_KEY_1234567890!@#$%";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "RIDEX.API";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "RIDEX.Mobile";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
    };

    // Extract token from SignalR WebSocket query string
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs/rides"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
    options.AddPolicy("RiderOnly", policy => policy.RequireRole("User", "Admin"));
});

// 5. Configure CORS for Mobile and Web Admin
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// 6. Swagger with JWT Bearer Definition
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "RIDEX API",
        Version = "v1",
        Description = "Zero-Cost Motorcycle Touring & Group-Riding REST API with SignalR Real-Time Engine"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token in the text input below.\n\nExample: 'Bearer eyJhbGciOi...'",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// 7. Seed Development Database on Startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<RideXDbContext>();
    var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
    await SeedData.InitializeAsync(db, hasher);
}

// 8. Configure HTTP Request Pipeline
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment() || true)
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "RIDEX API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseDefaultFiles();
app.UseStaticFiles();
app.UseRouting();
app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<RideHub>("/hubs/rides");
app.MapHub<RideHub>("/ridehub");

// Route /admin to /admin/index.html
app.MapGet("/admin", () => Results.Redirect("/admin/index.html"));

app.Run();
