using Jeopareddy.Api.Data;
using Jeopareddy.Api.Domain;
using Microsoft.EntityFrameworkCore;
using System.Data;

var builder = WebApplication.CreateBuilder(args);
const string FrontendCorsPolicy = "FrontendCors";

builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCorsPolicy, policy =>
    {
        policy
            .WithOrigins("http://localhost:5173", "http://localhost:4173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddDbContext<JeopareddyDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
        ?? "Data Source=jeopareddy.db";
    options.UseSqlite(connectionString);
});

var app = builder.Build();
app.UseCors(FrontendCorsPolicy);

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<JeopareddyDbContext>();
    BootstrapLegacySqliteMigrationHistory(db);
    db.Database.Migrate();
}

app.MapPost("/api/games", async (CreateGameRequest request, JeopareddyDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(request.Title))
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["title"] = ["Title is required."]
        });
    }

    var now = DateTime.UtcNow;
    var game = new Game
    {
        Id = Guid.NewGuid(),
        Title = request.Title.Trim(),
        Status = GameStatus.Draft,
        CreatedAtUtc = now,
        UpdatedAtUtc = now
    };

    db.Games.Add(game);
    await db.SaveChangesAsync();

    return Results.Created($"/api/games/{game.Id}", new GameResponse(
        Id: game.Id,
        Title: game.Title,
        Status: game.Status.ToString(),
        CreatedAtUtc: game.CreatedAtUtc,
        UpdatedAtUtc: game.UpdatedAtUtc,
        Categories: [],
        Teams: []));
});

app.MapGet("/api/games/{gameId:guid}", async (Guid gameId, JeopareddyDbContext db) =>
{
    var game = await db.Games.AsNoTracking().FirstOrDefaultAsync(g => g.Id == gameId);
    if (game is null)
    {
        return Results.NotFound();
    }

    var categoryEntities = await db.Categories
        .AsNoTracking()
        .Where(c => c.GameId == gameId)
        .Include(c => c.Clues)
        .OrderBy(c => c.DisplayOrder)
        .ToListAsync();

    var categories = categoryEntities
        .Select(c => new CategoryResponse(
            c.Id,
            c.Name,
            c.DisplayOrder,
            c.Clues
                .OrderBy(cl => cl.RowOrder)
                .Select(cl => new ClueResponse(
                    cl.Id,
                    cl.Prompt,
                    cl.Answer,
                    cl.PointValue,
                    cl.RowOrder,
                    cl.IsRevealed,
                    cl.IsAnswered))
                .ToList()))
        .ToList();

    var scoreMap = await db.ScoreEvents
        .AsNoTracking()
        .Where(se => se.GameId == gameId)
        .GroupBy(se => se.TeamId)
        .Select(g => new { TeamId = g.Key, Score = g.Sum(x => x.DeltaPoints) })
        .ToDictionaryAsync(x => x.TeamId, x => x.Score);

    var teamEntities = await db.Teams
        .AsNoTracking()
        .Where(t => t.GameId == gameId)
        .OrderBy(t => t.DisplayOrder)
        .ToListAsync();

    var teams = teamEntities
        .Select(t => new TeamResponse(
            t.Id,
            t.Name,
            t.DisplayOrder,
            scoreMap.GetValueOrDefault(t.Id, 0)))
        .ToList();

    return Results.Ok(new GameResponse(
        Id: game.Id,
        Title: game.Title,
        Status: game.Status.ToString(),
        CreatedAtUtc: game.CreatedAtUtc,
        UpdatedAtUtc: game.UpdatedAtUtc,
        Categories: categories,
        Teams: teams));
});

app.MapPost("/api/games/{gameId:guid}/categories", async (Guid gameId, CreateCategoryRequest request, JeopareddyDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(request.Name))
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["name"] = ["Name is required."]
        });
    }

    if (request.DisplayOrder <= 0)
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["displayOrder"] = ["DisplayOrder must be greater than zero."]
        });
    }

    if (request.Clues.Count == 0)
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["clues"] = ["At least one clue is required."]
        });
    }

    var game = await db.Games.FirstOrDefaultAsync(g => g.Id == gameId);
    if (game is null)
    {
        return Results.NotFound();
    }

    var category = new Category
    {
        Id = Guid.NewGuid(),
        GameId = gameId,
        Name = request.Name.Trim(),
        DisplayOrder = request.DisplayOrder,
        Clues = request.Clues.Select(cl => new Clue
        {
            Id = Guid.NewGuid(),
            GameId = gameId,
            Prompt = cl.Prompt.Trim(),
            Answer = cl.Answer.Trim(),
            PointValue = cl.PointValue,
            RowOrder = cl.RowOrder,
            IsRevealed = false,
            IsAnswered = false
        }).ToList()
    };

    foreach (var clue in category.Clues)
    {
        clue.CategoryId = category.Id;
    }

    game.UpdatedAtUtc = DateTime.UtcNow;
    db.Categories.Add(category);

    try
    {
        await db.SaveChangesAsync();
    }
    catch (DbUpdateException)
    {
        return Results.Conflict(new
        {
            message = "Category or clue ordering conflicts with existing board slots."
        });
    }

    return Results.Created($"/api/games/{gameId}/categories/{category.Id}", new CategoryCreatedResponse(
        Id: category.Id,
        GameId: category.GameId,
        Name: category.Name,
        DisplayOrder: category.DisplayOrder));
});

app.MapPost("/api/games/{gameId:guid}/teams", async (Guid gameId, CreateTeamRequest request, JeopareddyDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(request.Name))
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["name"] = ["Name is required."]
        });
    }

    if (request.DisplayOrder <= 0)
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["displayOrder"] = ["DisplayOrder must be greater than zero."]
        });
    }

    var game = await db.Games.FirstOrDefaultAsync(g => g.Id == gameId);
    if (game is null)
    {
        return Results.NotFound();
    }

    var team = new Team
    {
        Id = Guid.NewGuid(),
        GameId = gameId,
        Name = request.Name.Trim(),
        DisplayOrder = request.DisplayOrder
    };

    game.UpdatedAtUtc = DateTime.UtcNow;
    db.Teams.Add(team);

    try
    {
        await db.SaveChangesAsync();
    }
    catch (DbUpdateException)
    {
        return Results.Conflict(new
        {
            message = "Team ordering conflicts with an existing team in this game."
        });
    }

    return Results.Created($"/api/games/{gameId}/teams/{team.Id}", new TeamCreatedResponse(
        Id: team.Id,
        GameId: team.GameId,
        Name: team.Name,
        DisplayOrder: team.DisplayOrder));
});

app.MapPost("/api/games/{gameId:guid}/start", async (Guid gameId, JeopareddyDbContext db) =>
{
    var game = await db.Games.FirstOrDefaultAsync(g => g.Id == gameId);
    if (game is null)
    {
        return Results.NotFound();
    }

    game.Status = GameStatus.InProgress;
    game.UpdatedAtUtc = DateTime.UtcNow;
    await db.SaveChangesAsync();

    return Results.Ok(new StartGameResponse(
        Id: game.Id,
        Status: game.Status.ToString(),
        UpdatedAtUtc: game.UpdatedAtUtc));
});

app.MapPost("/api/games/{gameId:guid}/score-events", async (Guid gameId, CreateScoreEventRequest request, JeopareddyDbContext db) =>
{
    if (request.DeltaPoints == 0)
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["deltaPoints"] = ["DeltaPoints cannot be zero."]
        });
    }

    var game = await db.Games.FirstOrDefaultAsync(g => g.Id == gameId);
    if (game is null)
    {
        return Results.NotFound();
    }

    var teamExists = await db.Teams.AnyAsync(t => t.Id == request.TeamId && t.GameId == gameId);
    if (!teamExists)
    {
        return Results.NotFound();
    }

    if (request.ClueId is not null)
    {
        var clueExists = await db.Clues.AnyAsync(c => c.Id == request.ClueId.Value && c.GameId == gameId);
        if (!clueExists)
        {
            return Results.NotFound();
        }
    }

    var scoreEvent = new ScoreEvent
    {
        Id = Guid.NewGuid(),
        GameId = gameId,
        TeamId = request.TeamId,
        ClueId = request.ClueId,
        DeltaPoints = request.DeltaPoints,
        Reason = string.IsNullOrWhiteSpace(request.Reason) ? null : request.Reason.Trim(),
        CreatedAtUtc = DateTime.UtcNow
    };

    game.UpdatedAtUtc = DateTime.UtcNow;
    db.ScoreEvents.Add(scoreEvent);
    await db.SaveChangesAsync();

    return Results.Created($"/api/games/{gameId}/score-events/{scoreEvent.Id}", new ScoreEventCreatedResponse(
        Id: scoreEvent.Id,
        GameId: scoreEvent.GameId,
        TeamId: scoreEvent.TeamId,
        DeltaPoints: scoreEvent.DeltaPoints,
        CreatedAtUtc: scoreEvent.CreatedAtUtc));
});

app.MapPatch("/api/games/{gameId:guid}/clues/{clueId:guid}", async (Guid gameId, Guid clueId, UpdateClueRequest request, JeopareddyDbContext db) =>
{
    if (request.IsRevealed is null && request.IsAnswered is null)
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["request"] = ["At least one field must be provided: isRevealed or isAnswered."]
        });
    }

    var game = await db.Games.FirstOrDefaultAsync(g => g.Id == gameId);
    if (game is null)
    {
        return Results.NotFound();
    }

    var clue = await db.Clues.FirstOrDefaultAsync(c => c.Id == clueId && c.GameId == gameId);
    if (clue is null)
    {
        return Results.NotFound();
    }

    if (request.IsRevealed is not null)
    {
        clue.IsRevealed = request.IsRevealed.Value;
    }

    if (request.IsAnswered is not null)
    {
        clue.IsAnswered = request.IsAnswered.Value;
    }

    game.UpdatedAtUtc = DateTime.UtcNow;
    await db.SaveChangesAsync();

    return Results.Ok(new ClueResponse(
        Id: clue.Id,
        Prompt: clue.Prompt,
        Answer: clue.Answer,
        PointValue: clue.PointValue,
        RowOrder: clue.RowOrder,
        IsRevealed: clue.IsRevealed,
        IsAnswered: clue.IsAnswered));
});

static void BootstrapLegacySqliteMigrationHistory(JeopareddyDbContext db)
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

app.Run();

public sealed record CreateGameRequest(string Title);
public sealed record CreateCategoryRequest(string Name, int DisplayOrder, IReadOnlyList<CreateClueRequest> Clues);
public sealed record CreateClueRequest(string Prompt, string Answer, int PointValue, int RowOrder);
public sealed record CreateTeamRequest(string Name, int DisplayOrder);
public sealed record CreateScoreEventRequest(Guid TeamId, Guid? ClueId, int DeltaPoints, string? Reason);
public sealed record UpdateClueRequest(bool? IsRevealed, bool? IsAnswered);

public sealed record GameResponse(
    Guid Id,
    string Title,
    string Status,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc,
    IReadOnlyList<CategoryResponse> Categories,
    IReadOnlyList<TeamResponse> Teams);

public sealed record CategoryResponse(
    Guid Id,
    string Name,
    int DisplayOrder,
    IReadOnlyList<ClueResponse> Clues);

public sealed record ClueResponse(
    Guid Id,
    string Prompt,
    string Answer,
    int PointValue,
    int RowOrder,
    bool IsRevealed,
    bool IsAnswered);

public sealed record TeamResponse(
    Guid Id,
    string Name,
    int DisplayOrder,
    int Score);

public sealed record CategoryCreatedResponse(
    Guid Id,
    Guid GameId,
    string Name,
    int DisplayOrder);

public sealed record TeamCreatedResponse(
    Guid Id,
    Guid GameId,
    string Name,
    int DisplayOrder);

public sealed record StartGameResponse(
    Guid Id,
    string Status,
    DateTime UpdatedAtUtc);

public sealed record ScoreEventCreatedResponse(
    Guid Id,
    Guid GameId,
    Guid TeamId,
    int DeltaPoints,
    DateTime CreatedAtUtc);
