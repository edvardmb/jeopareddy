import {
  deleteApiGamesGameIdCategoriesCategoryId,
  deleteApiGamesGameIdCluesClueId,
  deleteApiGamesGameIdTeamsTeamId,
  patchApiGamesGameIdCategoriesCategoryId,
  patchApiGamesGameIdCluesClueId,
  patchApiGamesGameIdCluesClueIdContent,
  postApiGames,
  postApiGamesGameIdCategories,
  postApiGamesGameIdReset,
  postApiGamesGameIdScoreEvents,
  postApiGamesGameIdStart,
  postApiGamesGameIdTeams,
} from "../../../api/generated/jeopareddy";
import {
  useIsMutating,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { Game } from "../../../api";
import type {
  CreateCategoryRequest,
  CreateScoreEventRequest,
  UpdateCategoryRequest,
  UpdateClueContentRequest,
  UpdateClueRequest,
} from "../../../api/generated/models";
import { gameQueryKeys } from "../queryKeys";
import { mapGameResponse } from "../gameMappers";

const mutationKey = ["game-mutation"];

export function useGameMutations() {
  const queryClient = useQueryClient();
  const isMutatingCount = useIsMutating({ mutationKey });

  const invalidateGame = async (gameId: string) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: gameQueryKeys.list() }),
      queryClient.invalidateQueries({ queryKey: gameQueryKeys.detail(gameId) }),
      queryClient.refetchQueries({ queryKey: gameQueryKeys.list(), type: "active" }),
      queryClient.refetchQueries({
        queryKey: gameQueryKeys.detail(gameId),
        type: "active",
      }),
    ]);
  };

  const createGameMutation = useMutation({
    mutationKey,
    mutationFn: async (title: string) =>
      mapGameResponse(await postApiGames({ title })),
    onSuccess: (game: Game) => {
      queryClient.setQueryData(gameQueryKeys.detail(game.id), game);
      return queryClient.invalidateQueries({ queryKey: gameQueryKeys.list() });
    },
  });

  const startGameMutation = useMutation({
    mutationKey,
    mutationFn: ({ gameId }: { gameId: string }) => postApiGamesGameIdStart(gameId),
    onSuccess: (_, variables) => invalidateGame(variables.gameId),
  });

  const resetGameMutation = useMutation({
    mutationKey,
    mutationFn: ({ gameId }: { gameId: string }) => postApiGamesGameIdReset(gameId),
    onSuccess: (_, variables) => invalidateGame(variables.gameId),
  });

  const addTeamMutation = useMutation({
    mutationKey,
    mutationFn: ({ gameId, name }: { gameId: string; name: string }) =>
      postApiGamesGameIdTeams(gameId, { name }),
    onSuccess: (_, variables) => invalidateGame(variables.gameId),
  });

  const deleteTeamMutation = useMutation({
    mutationKey,
    mutationFn: ({ gameId, teamId }: { gameId: string; teamId: string }) =>
      deleteApiGamesGameIdTeamsTeamId(gameId, teamId),
    onSuccess: (_, variables) => invalidateGame(variables.gameId),
  });

  const addCategoryMutation = useMutation({
    mutationKey,
    mutationFn: ({
      gameId,
      payload,
    }: {
      gameId: string;
      payload: CreateCategoryRequest;
    }) => postApiGamesGameIdCategories(gameId, payload),
    onSuccess: (_, variables) => invalidateGame(variables.gameId),
  });

  const updateCategoryMutation = useMutation({
    mutationKey,
    mutationFn: ({
      gameId,
      categoryId,
      payload,
    }: {
      gameId: string;
      categoryId: string;
      payload: UpdateCategoryRequest;
    }) => patchApiGamesGameIdCategoriesCategoryId(gameId, categoryId, payload),
    onSuccess: (_, variables) => invalidateGame(variables.gameId),
  });

  const deleteCategoryMutation = useMutation({
    mutationKey,
    mutationFn: ({ gameId, categoryId }: { gameId: string; categoryId: string }) =>
      deleteApiGamesGameIdCategoriesCategoryId(gameId, categoryId),
    onSuccess: (_, variables) => invalidateGame(variables.gameId),
  });

  const createScoreEventMutation = useMutation({
    mutationKey,
    mutationFn: ({
      gameId,
      payload,
    }: {
      gameId: string;
      payload: CreateScoreEventRequest;
    }) => postApiGamesGameIdScoreEvents(gameId, payload),
    onSuccess: (_, variables) => invalidateGame(variables.gameId),
  });

  const updateClueMutation = useMutation({
    mutationKey,
    mutationFn: ({
      gameId,
      clueId,
      payload,
    }: {
      gameId: string;
      clueId: string;
      payload: UpdateClueRequest;
    }) => patchApiGamesGameIdCluesClueId(gameId, clueId, payload),
    onSuccess: (_, variables) => invalidateGame(variables.gameId),
  });

  const updateClueContentMutation = useMutation({
    mutationKey,
    mutationFn: ({
      gameId,
      clueId,
      payload,
    }: {
      gameId: string;
      clueId: string;
      payload: UpdateClueContentRequest;
    }) => patchApiGamesGameIdCluesClueIdContent(gameId, clueId, payload),
    onSuccess: (_, variables) => invalidateGame(variables.gameId),
  });

  const deleteClueMutation = useMutation({
    mutationKey,
    mutationFn: ({ gameId, clueId }: { gameId: string; clueId: string }) =>
      deleteApiGamesGameIdCluesClueId(gameId, clueId),
    onSuccess: (_, variables) => invalidateGame(variables.gameId),
  });

  return {
    isBusy: isMutatingCount > 0,
    createGame: createGameMutation.mutateAsync,
    startGame: startGameMutation.mutateAsync,
    resetGame: resetGameMutation.mutateAsync,
    addTeam: addTeamMutation.mutateAsync,
    deleteTeam: deleteTeamMutation.mutateAsync,
    addCategory: addCategoryMutation.mutateAsync,
    updateCategory: updateCategoryMutation.mutateAsync,
    deleteCategory: deleteCategoryMutation.mutateAsync,
    createScoreEvent: createScoreEventMutation.mutateAsync,
    updateClue: updateClueMutation.mutateAsync,
    updateClueContent: updateClueContentMutation.mutateAsync,
    deleteClue: deleteClueMutation.mutateAsync,
  };
}
