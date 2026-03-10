using Jeopareddy.Api.Auth;
using Jeopareddy.Api.Contracts;
using Jeopareddy.Api.Data;
using Jeopareddy.Api.Domain;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Jeopareddy.Api.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/auth/register", RegisterAsync)
            .AllowAnonymous()
            .Produces<AuthResponse>(StatusCodes.Status201Created)
            .ProducesValidationProblem(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status409Conflict);

        app.MapPost("/api/auth/login", LoginAsync)
            .AllowAnonymous()
            .Produces<AuthResponse>(StatusCodes.Status200OK)
            .ProducesValidationProblem(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status401Unauthorized);

        app.MapGet("/api/me", GetCurrentUserAsync)
            .RequireAuthorization()
            .Produces<UserProfileResponse>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status401Unauthorized);

        return app;
    }

    private static async Task<IResult> RegisterAsync(
        RegisterRequest request,
        JeopareddyDbContext db,
        IPasswordHasher<User> passwordHasher,
        IJwtTokenIssuer tokenIssuer)
    {
        var validation = ValidateRegisterRequest(request);
        if (validation is not null)
        {
            return validation;
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var emailExists = await db.Users.AnyAsync(x => x.Email == normalizedEmail);
        if (emailExists)
        {
            return Results.Conflict(new { message = "Email is already registered." });
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = normalizedEmail,
            DisplayName = request.DisplayName.Trim(),
            CreatedAtUtc = DateTime.UtcNow
        };
        user.PasswordHash = passwordHasher.HashPassword(user, request.Password);

        db.Users.Add(user);
        await db.SaveChangesAsync();

        return Results.Created("/api/me", new AuthResponse(
            AccessToken: tokenIssuer.CreateAccessToken(user),
            User: new UserProfileResponse(user.Id, user.Email, user.DisplayName, user.CreatedAtUtc)));
    }

    private static async Task<IResult> LoginAsync(
        LoginRequest request,
        JeopareddyDbContext db,
        IPasswordHasher<User> passwordHasher,
        IJwtTokenIssuer tokenIssuer)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["credentials"] = ["Email and password are required."]
            });
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var user = await db.Users.FirstOrDefaultAsync(x => x.Email == normalizedEmail);
        if (user is null)
        {
            return Results.Unauthorized();
        }

        var passwordResult = passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (passwordResult == PasswordVerificationResult.Failed)
        {
            return Results.Unauthorized();
        }

        return Results.Ok(new AuthResponse(
            AccessToken: tokenIssuer.CreateAccessToken(user),
            User: new UserProfileResponse(user.Id, user.Email, user.DisplayName, user.CreatedAtUtc)));
    }

    private static async Task<IResult> GetCurrentUserAsync(HttpContext httpContext, JeopareddyDbContext db)
    {
        var userId = UserContext.TryGetUserId(httpContext.User);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var user = await db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == userId.Value);
        if (user is null)
        {
            return Results.Unauthorized();
        }

        return Results.Ok(new UserProfileResponse(user.Id, user.Email, user.DisplayName, user.CreatedAtUtc));
    }

    private static IResult? ValidateRegisterRequest(RegisterRequest request)
    {
        var errors = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(request.Email))
        {
            errors["email"] = ["Email is required."];
        }

        if (string.IsNullOrWhiteSpace(request.DisplayName))
        {
            errors["displayName"] = ["Display name is required."];
        }

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            errors["password"] = ["Password is required."];
        }
        else if (request.Password.Length < 8)
        {
            errors["password"] = ["Password must be at least 8 characters long."];
        }

        return errors.Count > 0 ? Results.ValidationProblem(errors) : null;
    }
}
