namespace Jeopareddy.Api.Auth;

public sealed class JwtOptions
{
    public string Issuer { get; set; } = "Jeopareddy.Api";
    public string Audience { get; set; } = "Jeopareddy.Frontend";
    public string Key { get; set; } = "dev-only-key-change-in-production-at-least-32-chars";
    public int AccessTokenMinutes { get; set; } = 720;
}
