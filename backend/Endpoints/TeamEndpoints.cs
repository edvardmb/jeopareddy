using Jeopareddy.Api.Contracts;
using Jeopareddy.Api.Data;
using Jeopareddy.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace Jeopareddy.Api.Endpoints;

public static class TeamEndpoints
{
    public static IEndpointRouteBuilder MapTeamEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/games/{gameId:guid}/teams", CreateTeamAsync);
        app.MapDelete("/api/games/{gameId:guid}/teams/{teamId:guid}", DeleteTeamAsync);
        return app;
    }

    private static async Task<IResult> CreateTeamAsync(Guid gameId, CreateTeamRequest request, JeopareddyDbContext db)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["name"] = ["Name is required."]
            });
        }

        if (request.DisplayOrder is <= 0)
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

        var displayOrder = request.DisplayOrder;
        if (displayOrder is null)
        {
            var maxOrder = await db.Teams
                .Where(t => t.GameId == gameId)
                .Select(t => (int?)t.DisplayOrder)
                .MaxAsync();
            displayOrder = (maxOrder ?? 0) + 1;
        }

        var team = new Team
        {
            Id = Guid.NewGuid(),
            GameId = gameId,
            Name = request.Name.Trim(),
            DisplayOrder = displayOrder.Value
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
    }

    private static async Task<IResult> DeleteTeamAsync(Guid gameId, Guid teamId, JeopareddyDbContext db)
    {
        var game = await db.Games.FirstOrDefaultAsync(g => g.Id == gameId);
        if (game is null)
        {
            return Results.NotFound();
        }

        if (game.Status != GameStatus.Draft)
        {
            return Results.Conflict(new
            {
                message = "Teams can only be removed while the game is in Draft status."
            });
        }

        var team = await db.Teams.FirstOrDefaultAsync(t => t.Id == teamId && t.GameId == gameId);
        if (team is null)
        {
            return Results.NotFound();
        }

        db.Teams.Remove(team);
        game.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return Results.NoContent();
    }
}
