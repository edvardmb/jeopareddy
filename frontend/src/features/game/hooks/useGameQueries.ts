import { useQuery } from "@tanstack/react-query";
import { getApiGames, getApiGamesGameId } from "../../../api/generated/jeopareddy";
import { gameQueryKeys } from "../queryKeys";
import { mapGameListItemResponse, mapGameResponse } from "../gameMappers";

export async function fetchGamesList() {
  const games = await getApiGames();
  return games.map(mapGameListItemResponse);
}

export async function fetchGameById(gameId: string) {
  const game = await getApiGamesGameId(gameId);
  return mapGameResponse(game);
}

export function useGamesQuery(enabled = true) {
  return useQuery({
    queryKey: gameQueryKeys.list(),
    queryFn: fetchGamesList,
    enabled,
  });
}

export function useGameQuery(gameId: string, enabled = true) {
  return useQuery({
    queryKey: gameQueryKeys.detail(gameId),
    queryFn: () => fetchGameById(gameId),
    enabled: enabled && Boolean(gameId),
  });
}
