using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using RIDEX.Core.Interfaces;

namespace RIDEX.Infrastructure.Services;

public class LocalFileStorageService : IFileStorageService
{
    private readonly string _uploadDirectory;
    private readonly ILogger<LocalFileStorageService> _logger;

    public LocalFileStorageService(IHostEnvironment environment, ILogger<LocalFileStorageService> logger)
    {
        _logger = logger;
        _uploadDirectory = Path.Combine(environment.ContentRootPath, "wwwroot", "uploads");

        if (!Directory.Exists(_uploadDirectory))
        {
            Directory.CreateDirectory(_uploadDirectory);
        }
    }

    public async Task<string> SaveFileAsync(Stream fileStream, string fileName, string contentType, CancellationToken cancellationToken = default)
    {
        var sanitizedFileName = Path.GetFileNameWithoutExtension(fileName).Replace(" ", "_");
        var ext = Path.GetExtension(fileName);
        var uniqueFileName = $"{sanitizedFileName}_{Guid.NewGuid():N}{ext}";
        var targetFilePath = Path.Combine(_uploadDirectory, uniqueFileName);

        using (var output = new FileStream(targetFilePath, FileMode.Create, FileAccess.Write, FileShare.None, 4096, true))
        {
            await fileStream.CopyToAsync(output, cancellationToken);
        }

        _logger.LogInformation("Saved local file {FileName} to {Path}", fileName, targetFilePath);
        return $"/uploads/{uniqueFileName}";
    }

    public Task<Stream?> GetFileAsync(string filePath, CancellationToken cancellationToken = default)
    {
        var normalized = filePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
        var fullPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", normalized);

        if (!File.Exists(fullPath))
            return Task.FromResult<Stream?>(null);

        var stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read);
        return Task.FromResult<Stream?>(stream);
    }

    public Task<bool> DeleteFileAsync(string filePath, CancellationToken cancellationToken = default)
    {
        try
        {
            var normalized = filePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
            var fullPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", normalized);
            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
                return Task.FromResult(true);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to delete local file {Path}", filePath);
        }

        return Task.FromResult(false);
    }
}
