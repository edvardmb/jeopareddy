using Jeopareddy.Api.Contracts;
using Jeopareddy.Api.Data;
using Jeopareddy.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace Jeopareddy.Api.Endpoints;

public static class GameEndpoints
{
    private const int MaxClueImageBytes = 1_048_576; // 1 MiB
    private static readonly HashSet<string> AllowedClueImageMimeTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/png",
        "image/jpeg",
        "image/gif"
    };

    public static IEndpointRouteBuilder MapGameEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/games", ListGamesAsync);
        app.MapPost("/api/games", CreateGameAsync);
        app.MapGet("/api/games/{gameId:guid}", GetGameAsync);
        app.MapPost("/api/games/{gameId:guid}/categories", CreateCategoryAsync);
        app.MapPatch("/api/games/{gameId:guid}/categories/{categoryId:guid}", UpdateCategoryAsync);
        app.MapDelete("/api/games/{gameId:guid}/categories/{categoryId:guid}", DeleteCategoryAsync);
        app.MapPost("/api/games/{gameId:guid}/start", StartGameAsync);
        app.MapPost("/api/games/{gameId:guid}/reset", ResetGameAsync);
        return app;
    }

    private static async Task<IResult> ListGamesAsync(JeopareddyDbContext db)
    {
        var games = await db.Games
            .AsNoTracking()
            .OrderByDescending(g => g.UpdatedAtUtc)
            .Select(g => new GameListItemResponse(
                g.Id,
                g.Title,
                g.Status.ToString(),
                g.CreatedAtUtc,
                g.UpdatedAtUtc))
            .ToListAsync();

        return Results.Ok(games);
    }

    private static async Task<IResult> CreateGameAsync(CreateGameRequest request, JeopareddyDbContext db)
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
    }

    private static async Task<IResult> GetGameAsync(Guid gameId, JeopareddyDbContext db)
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
                        cl.ImageMimeType,
                        cl.ImageBase64,
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
    }

    private static async Task<IResult> CreateCategoryAsync(Guid gameId, CreateCategoryRequest request, JeopareddyDbContext db)
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

        var clueImageValidation = ValidateClueImages(request.Clues);
        if (clueImageValidation is not null)
        {
            return clueImageValidation;
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
                ImageMimeType = string.IsNullOrWhiteSpace(cl.ImageMimeType) ? null : cl.ImageMimeType.Trim().ToLowerInvariant(),
                ImageBase64 = string.IsNullOrWhiteSpace(cl.ImageBase64) ? null : cl.ImageBase64.Trim(),
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
    }

    private static async Task<IResult> UpdateCategoryAsync(Guid gameId, Guid categoryId, UpdateCategoryRequest request, JeopareddyDbContext db)
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

        if (game.Status != GameStatus.Draft)
        {
            return Results.Conflict(new { message = "Categories can only be edited while the game is in Draft status." });
        }

        var category = await db.Categories.FirstOrDefaultAsync(c => c.Id == categoryId && c.GameId == gameId);
        if (category is null)
        {
            return Results.NotFound();
        }

        category.Name = request.Name.Trim();
        category.DisplayOrder = request.DisplayOrder;
        game.UpdatedAtUtc = DateTime.UtcNow;

        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Results.Conflict(new { message = "Category ordering conflicts with an existing category." });
        }

        return Results.NoContent();
    }

    private static async Task<IResult> DeleteCategoryAsync(Guid gameId, Guid categoryId, JeopareddyDbContext db)
    {
        var game = await db.Games.FirstOrDefaultAsync(g => g.Id == gameId);
        if (game is null)
        {
            return Results.NotFound();
        }

        if (game.Status != GameStatus.Draft)
        {
            return Results.Conflict(new { message = "Categories can only be deleted while the game is in Draft status." });
        }

        var category = await db.Categories.FirstOrDefaultAsync(c => c.Id == categoryId && c.GameId == gameId);
        if (category is null)
        {
            return Results.NotFound();
        }

        db.Categories.Remove(category);
        game.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return Results.NoContent();
    }

    private static async Task<IResult> StartGameAsync(Guid gameId, JeopareddyDbContext db)
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
    }

    private static async Task<IResult> ResetGameAsync(Guid gameId, JeopareddyDbContext db)
    {
        var game = await db.Games.FirstOrDefaultAsync(g => g.Id == gameId);
        if (game is null)
        {
            return Results.NotFound();
        }

        var clues = await db.Clues.Where(c => c.GameId == gameId).ToListAsync();
        foreach (var clue in clues)
        {
            clue.IsRevealed = false;
            clue.IsAnswered = false;
        }

        var scoreEvents = await db.ScoreEvents.Where(se => se.GameId == gameId).ToListAsync();
        db.ScoreEvents.RemoveRange(scoreEvents);

        game.Status = GameStatus.Draft;
        game.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return Results.Ok(new ResetGameResponse(
            Id: game.Id,
            Status: game.Status.ToString(),
            UpdatedAtUtc: game.UpdatedAtUtc));
    }

    private static IResult? ValidateClueImages(IReadOnlyList<CreateClueRequest> clues)
    {
        for (var i = 0; i < clues.Count; i++)
        {
            var clue = clues[i];
            var hasMimeType = !string.IsNullOrWhiteSpace(clue.ImageMimeType);
            var hasBase64 = !string.IsNullOrWhiteSpace(clue.ImageBase64);

            if (!hasMimeType && !hasBase64)
            {
                continue;
            }

            if (!hasMimeType || !hasBase64)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    [$"clues[{i}]"] = ["ImageMimeType and ImageBase64 must both be provided when attaching an image."]
                });
            }

            var mimeType = clue.ImageMimeType!.Trim();
            if (!AllowedClueImageMimeTypes.Contains(mimeType))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    [$"clues[{i}].imageMimeType"] = ["Only PNG, JPG/JPEG, and GIF images are allowed."]
                });
            }

            byte[] imageBytes;
            try
            {
                imageBytes = Convert.FromBase64String(clue.ImageBase64!.Trim());
            }
            catch (FormatException)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    [$"clues[{i}].imageBase64"] = ["ImageBase64 must be valid base64 data."]
                });
            }

            if (imageBytes.Length == 0)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    [$"clues[{i}].imageBase64"] = ["Uploaded image is empty."]
                });
            }

            if (imageBytes.Length > MaxClueImageBytes)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    [$"clues[{i}].imageBase64"] = [$"Uploaded image exceeds the {MaxClueImageBytes} byte limit."]
                });
            }
        }

        return null;
    }
}
