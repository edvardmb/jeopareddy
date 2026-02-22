using Jeopareddy.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace Jeopareddy.Api.Data;

public sealed class JeopareddyDbContext(DbContextOptions<JeopareddyDbContext> options) : DbContext(options)
{
    public DbSet<Game> Games => Set<Game>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Clue> Clues => Set<Clue>();
    public DbSet<Team> Teams => Set<Team>();
    public DbSet<ScoreEvent> ScoreEvents => Set<ScoreEvent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Game>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Title).IsRequired();
            entity.Property(x => x.Status).HasConversion<string>().IsRequired();
            entity.Property(x => x.CreatedAtUtc).IsRequired();
            entity.Property(x => x.UpdatedAtUtc).IsRequired();
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).IsRequired();
            entity.Property(x => x.DisplayOrder).IsRequired();
            entity.HasIndex(x => new { x.GameId, x.DisplayOrder }).IsUnique();

            entity.HasOne(x => x.Game)
                .WithMany(x => x.Categories)
                .HasForeignKey(x => x.GameId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Clue>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Prompt).IsRequired();
            entity.Property(x => x.Answer).IsRequired();
            entity.Property(x => x.ImageMimeType);
            entity.Property(x => x.ImageBase64);
            entity.Property(x => x.PointValue).IsRequired();
            entity.Property(x => x.RowOrder).IsRequired();
            entity.Property(x => x.IsRevealed).IsRequired();
            entity.Property(x => x.IsAnswered).IsRequired();
            entity.ToTable(t => t.HasCheckConstraint("CK_Clue_PointValue_Positive", "PointValue > 0"));
            entity.HasIndex(x => new { x.GameId, x.CategoryId, x.RowOrder }).IsUnique();

            entity.HasOne(x => x.Game)
                .WithMany(x => x.Clues)
                .HasForeignKey(x => x.GameId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Category)
                .WithMany(x => x.Clues)
                .HasForeignKey(x => x.CategoryId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Team>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).IsRequired();
            entity.Property(x => x.DisplayOrder).IsRequired();
            entity.HasIndex(x => new { x.GameId, x.DisplayOrder }).IsUnique();

            entity.HasOne(x => x.Game)
                .WithMany(x => x.Teams)
                .HasForeignKey(x => x.GameId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ScoreEvent>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.DeltaPoints).IsRequired();
            entity.Property(x => x.CreatedAtUtc).IsRequired();

            entity.HasOne(x => x.Game)
                .WithMany(x => x.ScoreEvents)
                .HasForeignKey(x => x.GameId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Team)
                .WithMany(x => x.ScoreEvents)
                .HasForeignKey(x => x.TeamId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Clue)
                .WithMany(x => x.ScoreEvents)
                .HasForeignKey(x => x.ClueId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
