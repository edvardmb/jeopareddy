namespace Jeopareddy.Api.Domain;

public sealed class Game
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public GameStatus Status { get; set; } = GameStatus.Draft;
    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }

    public ICollection<Category> Categories { get; set; } = [];
    public ICollection<Clue> Clues { get; set; } = [];
    public ICollection<Team> Teams { get; set; } = [];
    public ICollection<ScoreEvent> ScoreEvents { get; set; } = [];
}
