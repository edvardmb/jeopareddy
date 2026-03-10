using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Jeopareddy.Api.Domain;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Jeopareddy.Api.Auth;

public interface IJwtTokenIssuer
{
    string CreateAccessToken(User user);
}

public sealed class JwtTokenIssuer(IOptions<JwtOptions> options) : IJwtTokenIssuer
{
    private readonly JwtOptions _options = options.Value;

    public string CreateAccessToken(User user)
    {
        var now = DateTime.UtcNow;
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new("display_name", user.DisplayName),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Name, user.DisplayName)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.Key));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            notBefore: now,
            expires: now.AddMinutes(_options.AccessTokenMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
