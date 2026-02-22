namespace Jeopareddy.Api.Contracts;

public sealed record CreateGameRequest(string Title);
public sealed record CreateCategoryRequest(string Name, int DisplayOrder, IReadOnlyList<CreateClueRequest> Clues);
public sealed record CreateClueRequest(
    string Prompt,
    string Answer,
    int PointValue,
    int RowOrder,
    string? ImageMimeType,
    string? ImageBase64);
public sealed record CreateTeamRequest(string Name, int? DisplayOrder);
public sealed record CreateScoreEventRequest(Guid TeamId, Guid? ClueId, int DeltaPoints, string? Reason);
public sealed record UpdateClueRequest(bool? IsRevealed, bool? IsAnswered);
public sealed record UpdateCategoryRequest(string Name, int DisplayOrder);
public sealed record UpdateClueContentRequest(
    string Prompt,
    string Answer,
    int PointValue,
    int RowOrder,
    string? ImageMimeType,
    string? ImageBase64);

public sealed record GameListItemResponse(
    Guid Id,
    string Title,
    string Status,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc);

public sealed record GameResponse(
    Guid Id,
    string Title,
    string Status,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc,
    IReadOnlyList<CategoryResponse> Categories,
    IReadOnlyList<TeamResponse> Teams);

public sealed record CategoryResponse(
    Guid Id,
    string Name,
    int DisplayOrder,
    IReadOnlyList<ClueResponse> Clues);

public sealed record ClueResponse(
    Guid Id,
    string Prompt,
    string Answer,
    string? ImageMimeType,
    string? ImageBase64,
    int PointValue,
    int RowOrder,
    bool IsRevealed,
    bool IsAnswered);

public sealed record TeamResponse(
    Guid Id,
    string Name,
    int DisplayOrder,
    int Score);

public sealed record CategoryCreatedResponse(
    Guid Id,
    Guid GameId,
    string Name,
    int DisplayOrder);

public sealed record TeamCreatedResponse(
    Guid Id,
    Guid GameId,
    string Name,
    int DisplayOrder);

public sealed record StartGameResponse(
    Guid Id,
    string Status,
    DateTime UpdatedAtUtc);

public sealed record ResetGameResponse(
    Guid Id,
    string Status,
    DateTime UpdatedAtUtc);

public sealed record ScoreEventCreatedResponse(
    Guid Id,
    Guid GameId,
    Guid TeamId,
    int DeltaPoints,
    DateTime CreatedAtUtc);
