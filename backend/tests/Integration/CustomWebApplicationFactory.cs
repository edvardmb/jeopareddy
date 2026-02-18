using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace Jeopareddy.Api.Tests.Integration;

public sealed class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _dbFilePath = Path.Combine(Path.GetTempPath(), $"jeopareddy-tests-{Guid.NewGuid():N}.db");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Test");
        builder.ConfigureAppConfiguration((_, configBuilder) =>
        {
            var config = new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = $"Data Source={_dbFilePath}"
            };
            configBuilder.AddInMemoryCollection(config);
        });
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        TryDelete(_dbFilePath);
        TryDelete($"{_dbFilePath}-wal");
        TryDelete($"{_dbFilePath}-shm");
    }

    private static void TryDelete(string path)
    {
        try
        {
            if (File.Exists(path))
            {
                File.Delete(path);
            }
        }
        catch (IOException)
        {
        }
        catch (UnauthorizedAccessException)
        {
        }
    }
}
