using Jeopareddy.Api.Contracts;
using Jeopareddy.Api.Data;
using Jeopareddy.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace Jeopareddy.Api.Endpoints;

public static class ScoreEventEndpoints
{
    public static IEndpointRouteBuilder MapScoreEventEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/games/{gameId:guid}/score-events", CreateScoreEventAsync);
        return app;
    }

    private static async Task<IResult> CreateScoreEventAsync(Guid gameId, CreateScoreEventRequest request, JeopareddyDbContext db)
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

        var currentScore = await db.ScoreEvents
            .Where(se => se.GameId == gameId && se.TeamId == request.TeamId)
            .SumAsync(se => se.DeltaPoints);

        var effectiveDelta = request.DeltaPoints;
        if (currentScore + effectiveDelta < 0)
        {
            effectiveDelta = -currentScore;
        }

        var scoreEvent = new ScoreEvent
        {
            Id = Guid.NewGuid(),
            GameId = gameId,
            TeamId = request.TeamId,
            ClueId = request.ClueId,
            DeltaPoints = effectiveDelta,
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
    }
}
