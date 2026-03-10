using Jeopareddy.Api.Auth;
using Jeopareddy.Api.Data;
using Jeopareddy.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace Jeopareddy.Api.Endpoints;

internal static class EndpointOwnership
{
    internal static Guid? TryGetUserId(HttpContext httpContext) =>
        UserContext.TryGetUserId(httpContext.User);

    internal static Task<Game?> FindOwnedGameAsync(JeopareddyDbContext db, Guid gameId, Guid userId) =>
        db.Games.FirstOrDefaultAsync(g => g.Id == gameId && g.OwnerUserId == userId);
}
