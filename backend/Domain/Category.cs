namespace Jeopareddy.Api.Domain;

public sealed class Category
{
    public Guid Id { get; set; }
    public Guid GameId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }

    public Game Game { get; set; } = null!;
    public ICollection<Clue> Clues { get; set; } = [];
}
