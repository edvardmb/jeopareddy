import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "./api";
import { Box, Button, Heading, Input, Text } from "@chakra-ui/react";
import AddCategoryCard, {
  createQuestionDraftFromStoredClue,
  type QuestionDraft,
} from "./components/AddCategoryCard";
import AddTeamCard from "./components/AddTeamCard";
import BoardCard from "./components/BoardCard";
import CreateGameCard from "./components/CreateGameCard";
import CurrentGameCard from "./components/CurrentGameCard";
import LoadGameCard from "./components/LoadGameCard";
import ScoreEventCard from "./components/ScoreEventCard";
import TeamsCard from "./components/TeamsCard";
import InfoHint from "./components/InfoHint";
import LanguageSelector from "./components/LanguageSelector";
import MiniGameSettingsCard from "./components/MiniGameSettingsCard";
import "./App.css";
import type { SupportedLanguage } from "./i18n";
import { translateGameStatus } from "./i18nHelpers";
import { gameQueryKeys } from "./features/game/queryKeys";
import { useGameMutations } from "./features/game/hooks/useGameMutations";
import {
  fetchGameById,
  useGameQuery,
  useGamesQuery,
} from "./features/game/hooks/useGameQueries";
import { useMiniGameAssignments } from "./features/miniGames/hooks/useMiniGameAssignments";

const PlayModeView = lazy(() => import("./components/PlayModeView"));

function App() {
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();
  const [gameTitle, setGameTitle] = useState("Friday Trivia Night");
  const [gameIdInput, setGameIdInput] = useState("");
  const [selectedGameId, setSelectedGameId] = useState("");
  const [teamName, setTeamName] = useState("Team A");
  const [categoryName, setCategoryName] = useState("Science");
  const [categoryOrder, setCategoryOrder] = useState(1);
  const [scoreTeamId, setScoreTeamId] = useState("");
  const [currentTurnTeamId, setCurrentTurnTeamId] = useState("");
  const [scoreDelta, setScoreDelta] = useState(100);
  const [scoreReason, setScoreReason] = useState("Correct answer");
  const [isActionBusy, setIsActionBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error" | "">("");
  const [activeSection, setActiveSection] = useState<
    "dashboard" | "host" | "play"
  >("dashboard");
  const [editingQuestion, setEditingQuestion] = useState<{
    clueId: string;
    question: QuestionDraft;
  } | null>(null);

  const gamesQuery = useGamesQuery();
  const loadedGameQuery = useGameQuery(selectedGameId);
  const loadedGame = loadedGameQuery.data ?? null;
  const games = gamesQuery.data ?? [];
  const mutations = useGameMutations();
  const miniGames = useMiniGameAssignments(loadedGame);
  const isBusy =
    isActionBusy ||
    mutations.isBusy ||
    gamesQuery.isFetching ||
    loadedGameQuery.isFetching;
  const canOperateOnGame = Boolean(loadedGame?.id);
  const isSetupLocked = loadedGame?.status === "InProgress";
  const scoreTeams = useMemo(() => loadedGame?.teams ?? [], [loadedGame]);
  const loadGameRequestSeqRef = useRef(0);
  const selectedLanguage: SupportedLanguage = i18n.resolvedLanguage?.startsWith(
    "no",
  )
    ? "no"
    : "en";

  const changeLanguage = (language: SupportedLanguage) => {
    void i18n.changeLanguage(language);
    globalThis.localStorage?.setItem("jeopareddy.language", language);
  };

  const loadGame = async (gameId: string) => {
    const requestSeq = ++loadGameRequestSeqRef.current;
    const game = await queryClient.fetchQuery({
      queryKey: gameQueryKeys.detail(gameId),
      queryFn: () => fetchGameById(gameId),
    });
    if (requestSeq !== loadGameRequestSeqRef.current) {
      return;
    }
    setSelectedGameId(game.id);
    setGameIdInput(game.id);
    if (game.teams.length > 0) {
      setScoreTeamId(game.teams[0].id);
    }
  };

  const refreshGames = async () => {
    await queryClient.refetchQueries({ queryKey: gameQueryKeys.list() });
  };

  const withBusy = async (action: () => Promise<void>) => {
    try {
      setIsActionBusy(true);
      setMessage("");
      setMessageTone("");
      await action();
    } catch (error) {
      const text =
        error instanceof Error ? error.message : t("messages.requestFailed");
      setMessage(text);
      setMessageTone("error");
    } finally {
      setIsActionBusy(false);
    }
  };

  useEffect(() => {
    if (!gamesQuery.isError) {
      return;
    }

    setMessage(t("messages.couldNotLoadGamesList"));
    setMessageTone("error");
  }, [gamesQuery.isError, t]);

  useEffect(() => {
    if (!loadedGameQuery.isError) {
      return;
    }

    const text =
      loadedGameQuery.error instanceof Error
        ? loadedGameQuery.error.message
        : t("messages.requestFailed");
    setMessage(text);
    setMessageTone("error");
  }, [loadedGameQuery.error, loadedGameQuery.isError, t]);

  useEffect(() => {
    if (!loadedGame || loadedGame.teams.length === 0) {
      if (scoreTeamId) {
        setScoreTeamId("");
      }
      return;
    }

    if (!scoreTeamId || !loadedGame.teams.some((team) => team.id === scoreTeamId)) {
      setScoreTeamId(loadedGame.teams[0].id);
    }
  }, [loadedGame, scoreTeamId]);

  useEffect(() => {
    setEditingQuestion(null);
  }, [loadedGame?.id]);

  useEffect(() => {
    if (!loadedGame || loadedGame.teams.length === 0) {
      if (currentTurnTeamId) {
        setCurrentTurnTeamId("");
      }
      return;
    }

    if (
      !currentTurnTeamId ||
      !loadedGame.teams.some((team) => team.id === currentTurnTeamId)
    ) {
      const firstTeam = [...loadedGame.teams].sort(
        (a, b) => a.displayOrder - b.displayOrder,
      )[0];
      if (firstTeam) {
        setCurrentTurnTeamId(firstTeam.id);
      }
    }
  }, [currentTurnTeamId, loadedGame]);

  return (
    <Box as="main" className="page">
      <Box as="header" className="app-header">
        <Box className="brand-mark">
          <img className="brand-logo" src="/jeoparEddy.png" alt="JeoparEddy" />
        </Box>
        <Box className="session-chip-wrap">
          <Box className="session-chip">
            {loadedGame ? (
              <>
                <Box as="strong">{loadedGame.title}</Box>
                <Text as="span" className="tiny muted">
                  {translateGameStatus(loadedGame.status, t)}
                </Text>
              </>
            ) : (
              <Text as="span" className="tiny muted">{t("status.noGameLoaded")}</Text>
            )}
          </Box>
          <LanguageSelector
            value={selectedLanguage}
            onChange={changeLanguage}
          />
          <Text className="tiny muted">API: {API_BASE_URL}</Text>
        </Box>
      </Box>

      <Box as="nav" className="tab-bar" aria-label="Primary navigation">
        <Button
          className={
            activeSection === "dashboard" ? "tab-btn active" : "tab-btn"
          }
          onClick={() => setActiveSection("dashboard")}
        >
          {t("nav.dashboard")}
        </Button>
        <Button
          className={activeSection === "host" ? "tab-btn active" : "tab-btn"}
          disabled={!loadedGame}
          onClick={() => setActiveSection("host")}
        >
          {t("nav.hostControl")}
        </Button>
        <Button
          className={activeSection === "play" ? "tab-btn active" : "tab-btn"}
          disabled={!loadedGame}
          onClick={() => setActiveSection("play")}
        >
          {t("nav.play")}
        </Button>
      </Box>
      {message && <Text className={`message ${messageTone}`}>{message}</Text>}

      {activeSection === "dashboard" && (
        <>
          <CreateGameCard
            gameTitle={gameTitle}
            isBusy={isBusy}
            onGameTitleChange={setGameTitle}
            onCreate={() =>
              withBusy(async () => {
                const game = await mutations.createGame(gameTitle);
                setSelectedGameId(game.id);
                setGameIdInput(game.id);
                setMessage(t("messages.createdGame", { id: game.id }));
                setMessageTone("success");
                setActiveSection("host");
              })
            }
          />

          <LoadGameCard
            gameIdInput={gameIdInput}
            isBusy={isBusy}
            games={games}
            onGameIdChange={setGameIdInput}
            onLoad={() =>
              withBusy(async () => {
                await loadGame(gameIdInput);
                setMessage(t("messages.loadedGame", { id: gameIdInput }));
                setMessageTone("success");
                setActiveSection("host");
              })
            }
            onRefresh={() =>
              withBusy(async () => {
                await refreshGames();
                setMessage(t("messages.gamesListRefreshed"));
                setMessageTone("success");
              })
            }
            onLoadFromList={(gameId) =>
              withBusy(async () => {
                await loadGame(gameId);
                setMessage(t("messages.loadedGame", { id: gameId }));
                setMessageTone("success");
                setActiveSection("host");
              })
            }
          />
        </>
      )}

      {!loadedGame && activeSection !== "dashboard" && (
        <Box as="section" className="card">
          <Heading as="h2" size="md">
            {t("app.noActiveGame")}
          </Heading>
          <Text className="muted">{t("app.noActiveGameHelp")}</Text>
          <Button onClick={() => setActiveSection("dashboard")}>
            {t("app.goToDashboard")}
          </Button>
        </Box>
      )}

      {loadedGame && activeSection === "host" && (
        <Box className="layout">
          <Box>
            <CurrentGameCard
              game={loadedGame}
              isBusy={isBusy}
              onStart={() =>
                withBusy(async () => {
                  await mutations.startGame({ gameId: loadedGame.id });
                  setMessage(t("messages.gameMovedInProgress"));
                  setMessageTone("success");
                })
              }
              onReset={() =>
                withBusy(async () => {
                  await mutations.resetGame({ gameId: loadedGame.id });
                  miniGames.resetAssignments();
                  setMessage(t("messages.gameReset"));
                  setMessageTone("success");
                })
              }
            />

            <AddTeamCard
              teamName={teamName}
              isBusy={isBusy}
              canOperateOnGame={canOperateOnGame}
              isLocked={isSetupLocked}
              onTeamNameChange={setTeamName}
              onAddTeam={() =>
                withBusy(async () => {
                  await mutations.addTeam({ gameId: loadedGame.id, name: teamName });
                  setMessage(t("messages.teamAdded", { name: teamName }));
                  setMessageTone("success");
                })
              }
            />

            <AddCategoryCard
              categoryName={categoryName}
              categoryOrder={categoryOrder}
              isBusy={isBusy}
              canOperateOnGame={canOperateOnGame}
              isLocked={isSetupLocked}
              onCategoryNameChange={setCategoryName}
              onCategoryOrderChange={setCategoryOrder}
              editingQuestion={editingQuestion}
              onCancelEditQuestion={() => setEditingQuestion(null)}
              onSaveEditedQuestion={(clueId, payload) =>
                withBusy(async () => {
                  await mutations.updateClueContent({
                    gameId: loadedGame.id,
                    clueId,
                    payload,
                  });
                  setEditingQuestion(null);
                  setMessage(t("messages.questionUpdated"));
                  setMessageTone("success");
                })
              }
              onAddCategory={(payload) =>
                withBusy(async () => {
                  await mutations.addCategory({ gameId: loadedGame.id, payload });
                  setMessage(
                    t("messages.categoryAdded", {
                      name: payload.name,
                      count: payload.clues.length,
                    }),
                  );
                  setMessageTone("success");
                })
              }
            />

            <MiniGameSettingsCard
              title={t("sections.jokerTitle")}
              description={t("sections.jokerHelp")}
              includeToggleLabel={t("sections.includeJoker")}
              enabled={miniGames.joker.enabled}
              onToggleEnabled={() =>
                miniGames.joker.setEnabled((value: boolean) => !value)
              }
              appearancesPerGame={miniGames.joker.appearancesPerGame}
              onAppearancesPerGameChange={miniGames.joker.setAppearancesPerGame}
              isBusy={isBusy}
              isLocked={isSetupLocked}
              canOperateOnGame={canOperateOnGame}
              appearancesInputId="joker-appearances"
              appearancesHelpText={t("sections.jokerAppearancesHelp")}
              appearancesHelpLabel={t("sections.jokerAppearancesHelpLabel")}
              stats={miniGames.joker.stats}
              footnotes={[t("sections.jokerSpotFootnote"), t("sections.localOnly")]}
              extraFields={
                <>
                  <Box className="field">
                    <Box className="field-label-row">
                      <label htmlFor="joker-spot-count">
                        {t("sections.jokerSpots")}
                      </label>
                      <InfoHint
                        text={t("sections.jokerSpotsHelp")}
                        label={t("sections.jokerSpotsHelpLabel")}
                      />
                    </Box>
                    <Input
                      id="joker-spot-count"
                      type="number"
                      min={0}
                      max={10}
                      disabled={isBusy || !loadedGame || isSetupLocked}
                      value={miniGames.joker.spotCount}
                      onChange={(event) =>
                        miniGames.joker.setSpotCount(
                          Math.max(
                            0,
                            Math.min(10, Number(event.target.value) || 0),
                          ),
                        )
                      }
                    />
                  </Box>
                  <Box className="field">
                    <Box className="field-label-row">
                      <label htmlFor="thief-spot-count">
                        {t("sections.thiefSpots")}
                      </label>
                      <InfoHint
                        text={t("sections.thiefSpotsHelp")}
                        label={t("sections.thiefSpotsHelpLabel")}
                      />
                    </Box>
                    <Input
                      id="thief-spot-count"
                      type="number"
                      min={0}
                      max={10}
                      disabled={isBusy || !loadedGame || isSetupLocked}
                      value={miniGames.joker.thiefSpotCount}
                      onChange={(event) =>
                        miniGames.joker.setThiefSpotCount(
                          Math.max(
                            0,
                            Math.min(10, Number(event.target.value) || 0),
                          ),
                        )
                      }
                    />
                  </Box>
                </>
              }
            />

            <MiniGameSettingsCard
              title={t("sections.genderTitle")}
              description={t("sections.genderHelp")}
              includeToggleLabel={t("sections.includeGender")}
              enabled={miniGames.genderReveal.enabled}
              onToggleEnabled={() =>
                miniGames.genderReveal.setEnabled((value: boolean) => !value)
              }
              appearancesPerGame={miniGames.genderReveal.appearancesPerGame}
              onAppearancesPerGameChange={
                miniGames.genderReveal.setAppearancesPerGame
              }
              isBusy={isBusy}
              isLocked={isSetupLocked}
              canOperateOnGame={canOperateOnGame}
              appearancesInputId="gender-reveal-appearances"
              appearancesHelpText={t("sections.genderAppearancesHelp")}
              appearancesHelpLabel={t("sections.genderAppearancesHelpLabel")}
              stats={miniGames.genderReveal.stats}
              footnotes={[t("sections.genderOutcomeNote"), t("sections.localOnly")]}
            />
          </Box>

          <Box>
            <TeamsCard
              teams={loadedGame.teams}
              isDraft={loadedGame.status === "Draft"}
              isBusy={isBusy}
              currentTurnTeamId={currentTurnTeamId}
              onSetTurnTeamId={setCurrentTurnTeamId}
              onDeleteTeam={(teamId) =>
                withBusy(async () => {
                  const team = loadedGame.teams.find((x) => x.id === teamId);
                  await mutations.deleteTeam({ gameId: loadedGame.id, teamId });
                  setScoreTeamId((current) =>
                    current === teamId ? "" : current,
                  );
                  setCurrentTurnTeamId((current) =>
                    current === teamId ? "" : current,
                  );
                  setMessage(
                    team
                      ? t("messages.teamRemoved", { name: team.name })
                      : t("messages.teamRemovedGeneric"),
                  );
                  setMessageTone("success");
                })
              }
            />
            <ScoreEventCard
              teams={scoreTeams}
              scoreTeamId={scoreTeamId}
              scoreDelta={scoreDelta}
              scoreReason={scoreReason}
              isBusy={isBusy}
              canOperateOnGame={canOperateOnGame}
              onScoreTeamIdChange={setScoreTeamId}
              onScoreDeltaChange={setScoreDelta}
              onScoreReasonChange={setScoreReason}
              onApplyScore={() =>
                withBusy(async () => {
                  await mutations.createScoreEvent({
                    gameId: loadedGame.id,
                    payload: {
                      teamId: scoreTeamId,
                      clueId: null,
                      deltaPoints: scoreDelta,
                      reason: scoreReason,
                    },
                  });
                  setMessage(t("messages.scoreUpdated"));
                  setMessageTone("success");
                })
              }
            />
            <BoardCard
              categories={loadedGame.categories}
              isDraft={loadedGame.status === "Draft"}
              isBusy={isBusy}
              onEditCategory={(categoryId, payload) =>
                withBusy(async () => {
                  await mutations.updateCategory({
                    gameId: loadedGame.id,
                    categoryId,
                    payload,
                  });
                  setMessage(t("messages.categoryUpdated"));
                  setMessageTone("success");
                })
              }
              onDeleteCategory={(categoryId) =>
                withBusy(async () => {
                  await mutations.deleteCategory({
                    gameId: loadedGame.id,
                    categoryId,
                  });
                  setMessage(t("messages.categoryRemoved"));
                  setMessageTone("success");
                })
              }
              onStartEditClue={(clue) => {
                setCategoryName(clue.categoryName);
                setCategoryOrder(clue.categoryOrder);
                setEditingQuestion({
                  clueId: clue.clueId,
                  question: createQuestionDraftFromStoredClue(clue),
                });
                setMessage(t("messages.questionLoadedForEdit"));
                setMessageTone("success");
              }}
              onDeleteClue={(clueId) =>
                withBusy(async () => {
                  await mutations.deleteClue({ gameId: loadedGame.id, clueId });
                  setEditingQuestion((current) =>
                    current?.clueId === clueId ? null : current,
                  );
                  setMessage(t("messages.questionRemoved"));
                  setMessageTone("success");
                })
              }
              onToggleReveal={(clueId, currentValue) =>
                withBusy(async () => {
                  await mutations.updateClue({
                    gameId: loadedGame.id,
                    clueId,
                    payload: {
                      isRevealed: !currentValue,
                    },
                  });
                  setMessage(t("messages.clueRevealUpdated"));
                  setMessageTone("success");
                })
              }
              onToggleAnswered={(clueId, currentValue) =>
                withBusy(async () => {
                  await mutations.updateClue({
                    gameId: loadedGame.id,
                    clueId,
                    payload: {
                      isAnswered: !currentValue,
                    },
                  });
                  setMessage(t("messages.clueAnswerUpdated"));
                  setMessageTone("success");
                })
              }
            />
          </Box>
        </Box>
      )}

      {loadedGame && activeSection === "play" && (
        <Suspense
          fallback={
            <Box as="section" className="card card-play">
              <Heading as="h2" size="md">
                {t("components.playModeView.title")}
              </Heading>
              <Text className="muted">Loading...</Text>
            </Box>
          }
        >
          <PlayModeView
            game={loadedGame}
            isBusy={isBusy}
            currentTeamId={currentTurnTeamId}
            onCurrentTeamIdChange={setCurrentTurnTeamId}
            jokerConfig={{
              enabled: miniGames.joker.enabled,
              assignedClueIds: miniGames.joker.assignedClueIds,
              jokerSpotCount: miniGames.joker.spotCount,
              thiefSpotCount: miniGames.joker.thiefSpotCount,
            }}
            genderRevealConfig={{
              enabled: miniGames.genderReveal.enabled,
              assignedClueIds: miniGames.genderReveal.assignedClueIds,
            }}
            onResolveQuestion={({
              clue,
              teamId,
              isCorrect,
              resolvedPointValue,
            }) =>
              withBusy(async () => {
                await mutations.createScoreEvent({
                  gameId: loadedGame.id,
                  payload: {
                    teamId,
                    clueId: clue.id,
                    deltaPoints: isCorrect
                      ? resolvedPointValue
                      : -resolvedPointValue,
                    reason: isCorrect
                      ? t("messages.correctAnswer")
                      : t("messages.incorrectAnswer"),
                  },
                });
                await mutations.updateClue({
                  gameId: loadedGame.id,
                  clueId: clue.id,
                  payload: {
                    isRevealed: true,
                    isAnswered: true,
                  },
                });
                setMessage(
                  isCorrect
                    ? t("messages.pointAwarded", { points: resolvedPointValue })
                    : t("messages.pointsDeducted", {
                        points: resolvedPointValue,
                      }),
                );
                setMessageTone(isCorrect ? "success" : "error");
              })
            }
          />
        </Suspense>
      )}
    </Box>
  );
}

export default App;
