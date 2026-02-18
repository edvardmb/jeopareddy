using Jeopareddy.Api.Contracts;
using Jeopareddy.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Jeopareddy.Api.Endpoints;

public static class ClueEndpoints
{
    public static IEndpointRouteBuilder MapClueEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPatch("/api/games/{gameId:guid}/clues/{clueId:guid}", UpdateClueAsync);
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
            PointValue: clue.PointValue,
            RowOrder: clue.RowOrder,
            IsRevealed: clue.IsRevealed,
            IsAnswered: clue.IsAnswered));
    }
}
