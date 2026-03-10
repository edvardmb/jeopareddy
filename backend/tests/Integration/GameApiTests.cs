using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

namespace Jeopareddy.Api.Tests.Integration;

public sealed class GameApiTests
{
    [Fact]
    public async Task CreateGame_ReturnsCreated()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateClient();
        await RegisterAndAuthenticateAsync(client);

        var response = await client.PostAsJsonAsync("/api/games", new { title = "Integration Test Game" });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task CreateTeam_DuplicateDisplayOrder_ReturnsConflict()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateClient();
        await RegisterAndAuthenticateAsync(client);

        var game = await CreateGameAsync(client, "Duplicate Team Order");
        await client.PostAsJsonAsync($"/api/games/{game.Id}/teams", new { name = "Team A", displayOrder = 1 });
        var duplicateResponse = await client.PostAsJsonAsync($"/api/games/{game.Id}/teams", new { name = "Team B", displayOrder = 1 });

        Assert.Equal(HttpStatusCode.Conflict, duplicateResponse.StatusCode);
    }

    [Fact]
    public async Task CreateScoreEvent_UnknownTeam_ReturnsNotFound()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateClient();
        await RegisterAndAuthenticateAsync(client);

        var game = await CreateGameAsync(client, "Unknown Team Score");
        var response = await client.PostAsJsonAsync($"/api/games/{game.Id}/score-events", new
        {
            teamId = Guid.NewGuid(),
            clueId = (Guid?)null,
            deltaPoints = 100,
            reason = "Test"
        });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task PatchClue_UpdatesFlags_AndPersists()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateClient();
        await RegisterAndAuthenticateAsync(client);

        var game = await CreateGameAsync(client, "Patch Clue");
        var categoryResponse = await client.PostAsJsonAsync($"/api/games/{game.Id}/categories", new
        {
            name = "Science",
            displayOrder = 1,
            clues = new[]
            {
                new
                {
                    prompt = "This planet is known as the Red Planet.",
                    answer = "Mars",
                    pointValue = 100,
                    rowOrder = 1
                }
            }
        });
        categoryResponse.EnsureSuccessStatusCode();

        var loadedBefore = await GetGameAsync(client, game.Id);
        var clueId = loadedBefore.Categories[0].Clues[0].Id;

        var patchResponse = await client.PatchAsJsonAsync($"/api/games/{game.Id}/clues/{clueId}", new
        {
            isRevealed = true,
            isAnswered = true
        });
        patchResponse.EnsureSuccessStatusCode();

        var loadedAfter = await GetGameAsync(client, game.Id);
        var clue = loadedAfter.Categories[0].Clues[0];
        Assert.True(clue.IsRevealed);
        Assert.True(clue.IsAnswered);
    }

    [Fact]
    public async Task GetGame_OtherUserGame_ReturnsNotFound()
    {
        using var factory = new CustomWebApplicationFactory();
        using var ownerClient = factory.CreateClient();
        using var otherClient = factory.CreateClient();

        await RegisterAndAuthenticateAsync(ownerClient, "owner@example.com");
        await RegisterAndAuthenticateAsync(otherClient, "other@example.com");

        var game = await CreateGameAsync(ownerClient, "Private Game");
        var response = await otherClient.GetAsync($"/api/games/{game.Id}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private static async Task<GameEnvelope> CreateGameAsync(HttpClient client, string title)
    {
        var response = await client.PostAsJsonAsync("/api/games", new { title });
        response.EnsureSuccessStatusCode();
        var game = await response.Content.ReadFromJsonAsync<GameEnvelope>();
        return game ?? throw new JsonException("Game response was null.");
    }

    private static async Task<GameEnvelope> GetGameAsync(HttpClient client, Guid gameId)
    {
        var response = await client.GetAsync($"/api/games/{gameId}");
        response.EnsureSuccessStatusCode();
        var game = await response.Content.ReadFromJsonAsync<GameEnvelope>();
        return game ?? throw new JsonException("Game response was null.");
    }

    private static async Task RegisterAndAuthenticateAsync(HttpClient client, string email = "test@example.com")
    {
        var registerResponse = await client.PostAsJsonAsync("/api/auth/register", new
        {
            email,
            displayName = "Integration User",
            password = "TestPassw0rd!"
        });
        registerResponse.EnsureSuccessStatusCode();
        var auth = await registerResponse.Content.ReadFromJsonAsync<AuthEnvelope>();
        if (auth is null)
        {
            throw new JsonException("Auth response was null.");
        }

        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", auth.AccessToken);
    }

    private sealed record GameEnvelope(Guid Id, string Title, List<CategoryEnvelope> Categories);
    private sealed record AuthEnvelope(string AccessToken);

    private sealed record CategoryEnvelope(Guid Id, string Name, int DisplayOrder, List<ClueEnvelope> Clues);

    private sealed record ClueEnvelope(Guid Id, string Prompt, string Answer, int PointValue, int RowOrder, bool IsRevealed, bool IsAnswered);
}
