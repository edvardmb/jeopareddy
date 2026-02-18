using System.Data;
using Microsoft.EntityFrameworkCore;

namespace Jeopareddy.Api.Data;

public static class DatabaseBootstrapper
{
    public static void BootstrapLegacySqliteMigrationHistory(JeopareddyDbContext db)
    {
        var connection = db.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open)
        {
            connection.Open();
        }

        using var tableCheck = connection.CreateCommand();
        tableCheck.CommandText = "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name IN ('Games','Categories','Clues','Teams','ScoreEvents');";
        var knownTableCount = Convert.ToInt32(tableCheck.ExecuteScalar());
        var hasKnownSchemaTables = knownTableCount > 0;

        using var historyCheck = connection.CreateCommand();
        historyCheck.CommandText = "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = '__EFMigrationsHistory';";
        var historyCount = Convert.ToInt32(historyCheck.ExecuteScalar());
        var hasHistoryTable = historyCount > 0;

        if (!hasKnownSchemaTables)
        {
            return;
        }

        var initialMigrationId = db.Database.GetMigrations().FirstOrDefault();
        if (string.IsNullOrWhiteSpace(initialMigrationId))
        {
            return;
        }

        if (!hasHistoryTable)
        {
            using var createHistory = connection.CreateCommand();
            createHistory.CommandText =
                "CREATE TABLE IF NOT EXISTS \"__EFMigrationsHistory\" (" +
                "\"MigrationId\" TEXT NOT NULL CONSTRAINT \"PK___EFMigrationsHistory\" PRIMARY KEY, " +
                "\"ProductVersion\" TEXT NOT NULL);";
            createHistory.ExecuteNonQuery();
        }

        using var insertHistory = connection.CreateCommand();
        insertHistory.CommandText =
            "INSERT OR IGNORE INTO \"__EFMigrationsHistory\" (\"MigrationId\", \"ProductVersion\") VALUES (@migrationId, @productVersion);";

        var migrationParam = insertHistory.CreateParameter();
        migrationParam.ParameterName = "@migrationId";
        migrationParam.Value = initialMigrationId;
        insertHistory.Parameters.Add(migrationParam);

        var versionParam = insertHistory.CreateParameter();
        versionParam.ParameterName = "@productVersion";
        versionParam.Value = "8.0.11";
        insertHistory.Parameters.Add(versionParam);

        insertHistory.ExecuteNonQuery();
    }
}
