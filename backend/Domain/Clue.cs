namespace Jeopareddy.Api.Domain;

public sealed class Clue
{
    public Guid Id { get; set; }
    public Guid GameId { get; set; }
    public Guid CategoryId { get; set; }
    public string Prompt { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
    public int PointValue { get; set; }
    public int RowOrder { get; set; }
    public bool IsRevealed { get; set; }
    public bool IsAnswered { get; set; }

    public Game Game { get; set; } = null!;
    public Category Category { get; set; } = null!;
    public ICollection<ScoreEvent> ScoreEvents { get; set; } = [];
}
