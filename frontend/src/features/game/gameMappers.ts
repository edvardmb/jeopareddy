import type { Game, GameListItem } from "../../api";
import type {
  CategoryResponse,
  ClueResponse,
  GameListItemResponse,
  GameResponse,
  TeamResponse,
} from "../../api/generated/models";

function normalizeStatus(status: string | null | undefined): Game["status"] {
  if (status === "InProgress" || status === "Finished") {
    return status;
  }

  return "Draft";
}

function mapClueResponse(clue: ClueResponse): Game["categories"][number]["clues"][number] {
  return {
    id: clue.id ?? "",
    prompt: clue.prompt ?? "",
    answer: clue.answer ?? "",
    imageMimeType: clue.imageMimeType ?? null,
    imageBase64: clue.imageBase64 ?? null,
    pointValue: clue.pointValue ?? 0,
    rowOrder: clue.rowOrder ?? 0,
    isRevealed: clue.isRevealed ?? false,
    isAnswered: clue.isAnswered ?? false,
  };
}

function mapCategoryResponse(
  category: CategoryResponse,
): Game["categories"][number] {
  return {
    id: category.id ?? "",
    name: category.name ?? "",
    displayOrder: category.displayOrder ?? 0,
    clues: (category.clues ?? []).map(mapClueResponse),
  };
}

function mapTeamResponse(team: TeamResponse): Game["teams"][number] {
  return {
    id: team.id ?? "",
    name: team.name ?? "",
    displayOrder: team.displayOrder ?? 0,
    score: team.score ?? 0,
  };
}

export function mapGameResponse(game: GameResponse): Game {
  return {
    id: game.id ?? "",
    title: game.title ?? "",
    status: normalizeStatus(game.status),
    createdAtUtc: game.createdAtUtc ?? "",
    updatedAtUtc: game.updatedAtUtc ?? "",
    categories: (game.categories ?? []).map(mapCategoryResponse),
    teams: (game.teams ?? []).map(mapTeamResponse),
  };
}

export function mapGameListItemResponse(game: GameListItemResponse): GameListItem {
  return {
    id: game.id ?? "",
    title: game.title ?? "",
    status: normalizeStatus(game.status),
    createdAtUtc: game.createdAtUtc ?? "",
    updatedAtUtc: game.updatedAtUtc ?? "",
  };
}
