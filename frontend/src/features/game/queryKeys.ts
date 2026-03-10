export const gameQueryKeys = {
  list: () => ["games"] as const,
  detail: (gameId: string) => ["games", gameId] as const,
};
