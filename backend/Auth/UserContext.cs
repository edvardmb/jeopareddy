using System.Security.Claims;

namespace Jeopareddy.Api.Auth;

public static class UserContext
{
    public static Guid? TryGetUserId(ClaimsPrincipal user)
    {
        var raw = user.FindFirstValue(ClaimTypes.NameIdentifier)
                  ?? user.FindFirstValue("sub");
        return Guid.TryParse(raw, out var userId) ? userId : null;
    }
}
