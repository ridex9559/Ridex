FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["RIDEX.Shared/RIDEX.Shared.csproj", "RIDEX.Shared/"]
COPY ["RIDEX.Core/RIDEX.Core.csproj", "RIDEX.Core/"]
COPY ["RIDEX.Infrastructure/RIDEX.Infrastructure.csproj", "RIDEX.Infrastructure/"]
COPY ["RIDEX.API/RIDEX.API.csproj", "RIDEX.API/"]

RUN dotnet restore "RIDEX.API/RIDEX.API.csproj"

COPY . .
WORKDIR "/src/RIDEX.API"
RUN dotnet build "RIDEX.API.csproj" -c Release -o /app/build
RUN dotnet publish "RIDEX.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 80
EXPOSE 443
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "RIDEX.API.dll"]
