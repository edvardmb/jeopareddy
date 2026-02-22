using Jeopareddy.Api.Contracts;
using Jeopareddy.Api.Data;
using Jeopareddy.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace Jeopareddy.Api.Endpoints;

public static class ClueEndpoints
{
    public static IEndpointRouteBuilder MapClueEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPatch("/api/games/{gameId:guid}/clues/{clueId:guid}", UpdateClueAsync);
        app.MapPatch("/api/games/{gameId:guid}/clues/{clueId:guid}/content", UpdateClueContentAsync);
        app.MapDelete("/api/games/{gameId:guid}/clues/{clueId:guid}", DeleteClueAsync);
        return app;
    }

    private static async Task<IResult> UpdateClueAsync(Guid gameId, Guid clueId, UpdateClueRequest request, JeopareddyDbContext db)
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
            ImageMimeType: clue.ImageMimeType,
            ImageBase64: clue.ImageBase64,
            PointValue: clue.PointValue,
            RowOrder: clue.RowOrder,
            IsRevealed: clue.IsRevealed,
            IsAnswered: clue.IsAnswered));
    }

    private static async Task<IResult> UpdateClueContentAsync(Guid gameId, Guid clueId, UpdateClueContentRequest request, JeopareddyDbContext db)
    {
        if (string.IsNullOrWhiteSpace(request.Prompt))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["prompt"] = ["Prompt is required."]
            });
        }

        if (string.IsNullOrWhiteSpace(request.Answer))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["answer"] = ["Answer is required."]
            });
        }

        if (request.PointValue <= 0)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["pointValue"] = ["PointValue must be greater than zero."]
            });
        }

        if (request.RowOrder <= 0)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["rowOrder"] = ["RowOrder must be greater than zero."]
            });
        }

        var imageValidation = ValidateClueImage(request.ImageMimeType, request.ImageBase64);
        if (imageValidation is not null)
        {
            return imageValidation;
        }

        var game = await db.Games.FirstOrDefaultAsync(g => g.Id == gameId);
        if (game is null)
        {
            return Results.NotFound();
        }

        if (game.Status != GameStatus.Draft)
        {
            return Results.Conflict(new { message = "Questions can only be edited while the game is in Draft status." });
        }

        var clue = await db.Clues.FirstOrDefaultAsync(c => c.Id == clueId && c.GameId == gameId);
        if (clue is null)
        {
            return Results.NotFound();
        }

        clue.Prompt = request.Prompt.Trim();
        clue.Answer = request.Answer.Trim();
        clue.PointValue = request.PointValue;
        clue.RowOrder = request.RowOrder;
        clue.ImageMimeType = string.IsNullOrWhiteSpace(request.ImageMimeType) ? null : request.ImageMimeType.Trim().ToLowerInvariant();
        clue.ImageBase64 = string.IsNullOrWhiteSpace(request.ImageBase64) ? null : request.ImageBase64.Trim();
        game.UpdatedAtUtc = DateTime.UtcNow;

        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Results.Conflict(new { message = "Question value/order conflicts with another question in this category." });
        }

        return Results.NoContent();
    }

    private static async Task<IResult> DeleteClueAsync(Guid gameId, Guid clueId, JeopareddyDbContext db)
    {
        var game = await db.Games.FirstOrDefaultAsync(g => g.Id == gameId);
        if (game is null)
        {
            return Results.NotFound();
        }

        if (game.Status != GameStatus.Draft)
        {
            return Results.Conflict(new { message = "Questions can only be deleted while the game is in Draft status." });
        }

        var clue = await db.Clues.FirstOrDefaultAsync(c => c.Id == clueId && c.GameId == gameId);
        if (clue is null)
        {
            return Results.NotFound();
        }

        db.Clues.Remove(clue);
        game.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return Results.NoContent();
    }

    private static IResult? ValidateClueImage(string? imageMimeType, string? imageBase64)
    {
        const int maxClueImageBytes = 1_048_576;
        var hasMimeType = !string.IsNullOrWhiteSpace(imageMimeType);
        var hasBase64 = !string.IsNullOrWhiteSpace(imageBase64);

        if (!hasMimeType && !hasBase64)
        {
            return null;
        }

        if (!hasMimeType || !hasBase64)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["image"] = ["ImageMimeType and ImageBase64 must both be provided when attaching an image."]
            });
        }

        var allowedMimeTypes = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "image/png",
            "image/jpeg",
            "image/gif"
        };

        if (!allowedMimeTypes.Contains(imageMimeType!.Trim()))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["imageMimeType"] = ["Only PNG, JPG/JPEG, and GIF images are allowed."]
            });
        }

        byte[] imageBytes;
        try
        {
            imageBytes = Convert.FromBase64String(imageBase64!.Trim());
        }
        catch (FormatException)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["imageBase64"] = ["ImageBase64 must be valid base64 data."]
            });
        }

        if (imageBytes.Length == 0)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["imageBase64"] = ["Uploaded image is empty."]
            });
        }

        if (imageBytes.Length > maxClueImageBytes)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["imageBase64"] = [$"Uploaded image exceeds the {maxClueImageBytes} byte limit."]
            });
        }

        return null;
    }
}
