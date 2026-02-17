namespace Jeopareddy.Api.Domain;

public sealed class ScoreEvent
{
    public Guid Id { get; set; }
    public Guid GameId { get; set; }
    public Guid TeamId { get; set; }
    public Guid? ClueId { get; set; }
    public int DeltaPoints { get; set; }
    public string? Reason { get; set; }
    public DateTime CreatedAtUtc { get; set; }

    public Game Game { get; set; } = null!;
    public Team Team { get; set; } = null!;
    public Clue? Clue { get; set; }
}
