import { useEffect, useMemo, useRef, useState } from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { Clue, Game } from "../api";
import { Box, Button, Heading, Input, Text } from "@chakra-ui/react";
import jokerHatUrl from "../assets/joker-hat.svg";
import genderRevealSongUrl from "../assets/reveal.mp3";
import MiniGameModal from "./MiniGameModal";

type PlayModeViewProps = {
  game: Game;
  isBusy: boolean;
  currentTeamId: string;
  onCurrentTeamIdChange: (teamId: string) => void;
  jokerConfig: {
    enabled: boolean;
    assignedClueIds: string[];
    jokerSpotCount: number;
    thiefSpotCount: number;
  };
  genderRevealConfig: {
    enabled: boolean;
    assignedClueIds: string[];
  };
  rockPaperScissorsConfig: {
    enabled: boolean;
    assignedClueIds: string[];
  };
  onResolveQuestion: (params: {
    clue: Clue;
    teamId: string;
    isCorrect: boolean;
    resolvedPointValue: number;
  }) => Promise<void>;
};

type JokerDirection = "up" | "down";
type JokerSpot =
  | { kind: "number"; value: number }
  | { kind: "joker" }
  | { kind: "thief" };
type JokerOutcome = "climb" | "down" | "stay" | "joker" | "thief";
type GenderGuess = "boy" | "girl";
type RockPaperScissorsChoice = "rock" | "paper" | "scissors";

type JokerStep = {
  baseDigit: number;
  upSpot: JokerSpot;
  downSpot: JokerSpot;
  choice: JokerDirection | null;
  revealedSpot: JokerSpot | null;
  outcome: JokerOutcome | null;
};

type JokerRoundState = {
  steps: JokerStep[];
  currentStepIndex: number;
  currentRung: number;
  status: "playing" | "completed";
  finalPoints: number | null;
  jokerHit: boolean;
  thiefHit: boolean;
  lastMessage: string;
};

type GenderRevealRoundState = {
  status: "guessing" | "animating" | "revealed";
  guessedGender: GenderGuess | null;
  actualGender: GenderGuess;
  isCorrect: boolean | null;
  bonusStatus: "idle" | "awarding" | "awarded" | "missed" | "error";
  bonusMessage: string;
};

type RockPaperScissorsRoundState = {
  status: "choosing" | "animating" | "revealed";
  playerChoice: RockPaperScissorsChoice | null;
  computerChoice: RockPaperScissorsChoice | null;
  result: "win" | "lose" | null;
  pointsDelta: number;
  chantStep: number;
};

const JOKER_STEP_COUNT = 5;
const JOKER_LADDER_STEP_POINTS = 25;
const JOKER_THIEF_POINTS = 10;
const JOKER_RESULT_HOLD_MS = 1500;
const QUESTION_REVEAL_TRANSITION_MS = 1700;
const GENDER_REVEAL_RESULT: GenderGuess = "boy";
const GENDER_REVEAL_BONUS_POINTS = 50;
const GENDER_REVEAL_AUDIO_START_SECONDS = 45;
const GENDER_REVEAL_REVEAL_DELAY_MS = 10500;
const GENDER_REVEAL_AUDIO_FADE_MS = 3000;
const ROCK_PAPER_SCISSORS_BONUS_POINTS = 50;
const ROCK_PAPER_SCISSORS_CHANT_STEPS = 3;
const ROCK_PAPER_SCISSORS_CHANT_STEP_MS = 420;

export default function PlayModeView(props: PlayModeViewProps) {
  const { t } = useTranslation();
  const {
    game,
    isBusy,
    currentTeamId,
    onCurrentTeamIdChange,
    jokerConfig,
    genderRevealConfig,
    rockPaperScissorsConfig,
    onResolveQuestion,
  } = props;
  const [activeClue, setActiveClue] = useState<Clue | null>(null);
  const [answerInput, setAnswerInput] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackTone, setFeedbackTone] = useState<"success" | "error" | "">(
    "",
  );
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [jokerRound, setJokerRound] = useState<JokerRoundState | null>(null);
  const [genderRevealRound, setGenderRevealRound] =
    useState<GenderRevealRoundState | null>(null);
  const [genderRevealBonusPointsForClue, setGenderRevealBonusPointsForClue] =
    useState(0);
  const [rockPaperScissorsRound, setRockPaperScissorsRound] =
    useState<RockPaperScissorsRoundState | null>(null);
  const [rockPaperScissorsPointsDeltaForClue, setRockPaperScissorsPointsDeltaForClue] =
    useState(0);
  const [isJokerResultHolding, setIsJokerResultHolding] = useState(false);
  const [isQuestionRevealTransitioning, setIsQuestionRevealTransitioning] =
    useState(false);
  const genderRevealAudioRef = useRef<HTMLAudioElement | null>(null);
  const genderRevealRevealTimeoutRef = useRef<number | null>(null);
  const genderRevealFadeIntervalRef = useRef<number | null>(null);
  const genderRevealSequenceIdRef = useRef(0);
  const rockPaperScissorsTimeoutRef = useRef<number | null>(null);
  const rockPaperScissorsSequenceIdRef = useRef(0);

  const turnOrderTeams = useMemo(
    () => [...game.teams].sort((a, b) => a.displayOrder - b.displayOrder),
    [game.teams],
  );
  const scoreOrderedTeams = useMemo(
    () =>
      [...game.teams].sort(
        (a, b) => b.score - a.score || a.displayOrder - b.displayOrder,
      ),
    [game.teams],
  );
  const currentTeam =
    turnOrderTeams.find((team) => team.id === currentTeamId) ?? null;

  useEffect(() => {
    if (!currentTeamId && turnOrderTeams.length > 0) {
      onCurrentTeamIdChange(turnOrderTeams[0].id);
      return;
    }

    if (
      currentTeamId &&
      !turnOrderTeams.some((team) => team.id === currentTeamId) &&
      turnOrderTeams.length > 0
    ) {
      onCurrentTeamIdChange(turnOrderTeams[0].id);
    }
  }, [currentTeamId, onCurrentTeamIdChange, turnOrderTeams]);

  const activeClueId = activeClue?.id ?? null;

  useEffect(() => {
    if (!activeClueId || jokerRound?.status !== "completed") {
      setIsJokerResultHolding(false);
      setIsQuestionRevealTransitioning(false);
      return;
    }

    setIsJokerResultHolding(true);
    setIsQuestionRevealTransitioning(false);

    const holdTimeoutId = window.setTimeout(() => {
      setIsJokerResultHolding(false);
      setIsQuestionRevealTransitioning(true);
    }, JOKER_RESULT_HOLD_MS);

    const revealTimeoutId = window.setTimeout(() => {
      setIsQuestionRevealTransitioning(false);
    }, JOKER_RESULT_HOLD_MS + QUESTION_REVEAL_TRANSITION_MS);

    return () => {
      window.clearTimeout(holdTimeoutId);
      window.clearTimeout(revealTimeoutId);
    };
  }, [activeClueId, jokerRound?.status]);

  const sortedCategories = useMemo(
    () => [...game.categories].sort((a, b) => a.displayOrder - b.displayOrder),
    [game.categories],
  );

  const rowValues = useMemo(() => {
    const values = new Set<number>();
    sortedCategories.forEach((category) => {
      category.clues.forEach((clue) => values.add(clue.pointValue));
    });
    return Array.from(values).sort((a, b) => a - b);
  }, [sortedCategories]);

  const jokerAssignedIdSet = useMemo(
    () => new Set(jokerConfig.assignedClueIds),
    [jokerConfig.assignedClueIds],
  );
  const genderRevealAssignedIdSet = useMemo(
    () => new Set(genderRevealConfig.assignedClueIds),
    [genderRevealConfig.assignedClueIds],
  );
  const rockPaperScissorsAssignedIdSet = useMemo(
    () => new Set(rockPaperScissorsConfig.assignedClueIds),
    [rockPaperScissorsConfig.assignedClueIds],
  );
  const jokerIsActive = jokerRound?.status === "playing";
  const genderRevealIsActive = genderRevealRound !== null;
  const rockPaperScissorsIsActive = rockPaperScissorsRound !== null;
  const confettiPieces = useMemo(
    () =>
      Array.from({ length: 22 }, (_, index) => ({
        id: index,
        left: `${Math.round((index / 21) * 100)}%`,
        delayMs: Math.round((index % 7) * 90),
        durationMs: 1300 + (index % 5) * 220,
      })),
    [],
  );
  const fireworkBursts = useMemo(
    () => [
      { id: 0, left: "14%", top: "18%", delayMs: 0, size: 68 },
      { id: 1, left: "82%", top: "22%", delayMs: 450, size: 82 },
      { id: 2, left: "28%", top: "58%", delayMs: 900, size: 74 },
      { id: 3, left: "70%", top: "62%", delayMs: 1300, size: 78 },
    ],
    [],
  );

  const clearGenderRevealTimers = () => {
    if (genderRevealRevealTimeoutRef.current !== null) {
      window.clearTimeout(genderRevealRevealTimeoutRef.current);
      genderRevealRevealTimeoutRef.current = null;
    }
    if (genderRevealFadeIntervalRef.current !== null) {
      window.clearInterval(genderRevealFadeIntervalRef.current);
      genderRevealFadeIntervalRef.current = null;
    }
  };

  const stopGenderRevealAudio = () => {
    clearGenderRevealTimers();
    const audio = genderRevealAudioRef.current;
    if (!audio) {
      return;
    }

    audio.pause();
    audio.currentTime = 0;
    audio.volume = 1;
  };

  const clearRockPaperScissorsTimer = () => {
    if (rockPaperScissorsTimeoutRef.current !== null) {
      window.clearTimeout(rockPaperScissorsTimeoutRef.current);
      rockPaperScissorsTimeoutRef.current = null;
    }
  };

  const resetActiveQuestionFlow = () => {
    genderRevealSequenceIdRef.current += 1;
    rockPaperScissorsSequenceIdRef.current += 1;
    stopGenderRevealAudio();
    clearRockPaperScissorsTimer();
    setActiveClue(null);
    setJokerRound(null);
    setGenderRevealRound(null);
    setGenderRevealBonusPointsForClue(0);
    setRockPaperScissorsRound(null);
    setRockPaperScissorsPointsDeltaForClue(0);
    setIsJokerResultHolding(false);
    setIsQuestionRevealTransitioning(false);
    setAnswerInput("");
    setFeedback("");
    setFeedbackTone("");
    setHasSubmitted(false);
  };

  const handleGenderGuess = (guess: GenderGuess) => {
    if (!genderRevealRound || genderRevealRound.status !== "guessing") {
      return;
    }

    const sequenceId = genderRevealSequenceIdRef.current + 1;
    genderRevealSequenceIdRef.current = sequenceId;

    setGenderRevealRound({
      status: "animating",
      guessedGender: guess,
      actualGender: GENDER_REVEAL_RESULT,
      isCorrect: null,
      bonusStatus: "idle",
      bonusMessage: "",
    });

    const audio = genderRevealAudioRef.current;
    if (audio) {
      clearGenderRevealTimers();
      audio.pause();
      audio.volume = 0;
      try {
        audio.currentTime = GENDER_REVEAL_AUDIO_START_SECONDS;
      } catch {
        audio.currentTime = 0;
      }

      void audio.play().catch(() => {
        setGenderRevealRound((current) =>
          current && current.status === "animating"
            ? {
                ...current,
                bonusMessage: t("components.playModeView.audioAutoplayError"),
              }
            : current,
        );
      });

      const fadeTickMs = 120;
      const fadeSteps = Math.max(
        1,
        Math.floor(GENDER_REVEAL_AUDIO_FADE_MS / fadeTickMs),
      );
      let step = 0;
      genderRevealFadeIntervalRef.current = window.setInterval(() => {
        step += 1;
        if (!genderRevealAudioRef.current) {
          clearGenderRevealTimers();
          return;
        }
        genderRevealAudioRef.current.volume = Math.min(1, step / fadeSteps);
        if (step >= fadeSteps && genderRevealFadeIntervalRef.current !== null) {
          window.clearInterval(genderRevealFadeIntervalRef.current);
          genderRevealFadeIntervalRef.current = null;
        }
      }, fadeTickMs);
    }

    genderRevealRevealTimeoutRef.current = window.setTimeout(() => {
      const isCorrect = guess === GENDER_REVEAL_RESULT;
      setGenderRevealRound((current) => {
        if (!current || current.guessedGender !== guess) {
          return current;
        }

        return {
          ...current,
          status: "revealed",
          isCorrect,
          bonusStatus: isCorrect ? "awarded" : "missed",
          bonusMessage: isCorrect
            ? t("components.playModeView.correctGuessBonus", {
                points: GENDER_REVEAL_BONUS_POINTS,
              })
            : t("components.playModeView.wrongGuessNoPenalty"),
        };
      });

      if (!isCorrect) {
        return;
      }

      if (genderRevealSequenceIdRef.current !== sequenceId) {
        return;
      }

      setGenderRevealBonusPointsForClue(GENDER_REVEAL_BONUS_POINTS);
    }, GENDER_REVEAL_REVEAL_DELAY_MS);
  };

  useEffect(() => {
    const audio = new Audio(genderRevealSongUrl);
    audio.preload = "auto";
    genderRevealAudioRef.current = audio;

    return () => {
      genderRevealSequenceIdRef.current += 1;
      if (genderRevealRevealTimeoutRef.current !== null) {
        window.clearTimeout(genderRevealRevealTimeoutRef.current);
        genderRevealRevealTimeoutRef.current = null;
      }
      if (genderRevealFadeIntervalRef.current !== null) {
        window.clearInterval(genderRevealFadeIntervalRef.current);
        genderRevealFadeIntervalRef.current = null;
      }
      clearRockPaperScissorsTimer();
      audio.pause();
      genderRevealAudioRef.current = null;
    };
  }, []);

  const handleRockPaperScissorsChoice = (choice: RockPaperScissorsChoice) => {
    if (!rockPaperScissorsRound || rockPaperScissorsRound.status !== "choosing") {
      return;
    }

    const sequenceId = rockPaperScissorsSequenceIdRef.current + 1;
    rockPaperScissorsSequenceIdRef.current = sequenceId;
    clearRockPaperScissorsTimer();

    const computerChoice = getComputerRockPaperScissorsChoice(choice);
    const result = evaluateRockPaperScissorsResult(choice, computerChoice);
    const pointsDelta =
      result === "win"
        ? ROCK_PAPER_SCISSORS_BONUS_POINTS
        : -ROCK_PAPER_SCISSORS_BONUS_POINTS;

    setRockPaperScissorsRound({
      status: "animating",
      playerChoice: choice,
      computerChoice: null,
      result: null,
      pointsDelta: 0,
      chantStep: 0,
    });

    const runStep = (step: number) => {
      rockPaperScissorsTimeoutRef.current = window.setTimeout(() => {
        if (rockPaperScissorsSequenceIdRef.current !== sequenceId) {
          return;
        }

        if (step < ROCK_PAPER_SCISSORS_CHANT_STEPS) {
          setRockPaperScissorsRound((current) =>
            current
              ? {
                  ...current,
                  chantStep: step + 1,
                }
              : current,
          );
          runStep(step + 1);
          return;
        }

        setRockPaperScissorsRound({
          status: "revealed",
          playerChoice: choice,
          computerChoice,
          result,
          pointsDelta,
          chantStep: ROCK_PAPER_SCISSORS_CHANT_STEPS,
        });
        setRockPaperScissorsPointsDeltaForClue(pointsDelta);
        rockPaperScissorsTimeoutRef.current = null;
      }, ROCK_PAPER_SCISSORS_CHANT_STEP_MS);
    };

    runStep(0);
  };

  const resolvedPointValue = useMemo(() => {
    if (!activeClue) {
      return 0;
    }

    const baseValue =
      !jokerRound || jokerRound.finalPoints === null
        ? activeClue.pointValue
        : jokerRound.finalPoints;
    return Math.max(
      0,
      baseValue +
        genderRevealBonusPointsForClue +
        rockPaperScissorsPointsDeltaForClue,
    );
  }, [
    activeClue,
    genderRevealBonusPointsForClue,
    jokerRound,
    rockPaperScissorsPointsDeltaForClue,
  ]);

  if (game.categories.length === 0) {
    return (
      <Box as="section" className="card card-play">
        <Heading as="h2" size="md">
          {t("components.playModeView.title")}
        </Heading>
        <Text className="muted">{t("components.playModeView.emptyState")}</Text>
      </Box>
    );
  }

  return (
    <Box as="section" className="card card-play">
      <Heading as="h2" size="md">
        {t("components.playModeView.title")}
      </Heading>
      <Text className="muted">{t("components.playModeView.subtitle")}</Text>
      {currentTeam && (
        <Text className="turn-indicator">
          {t("components.playModeView.turnIndicator")}:{" "}
          <Box as="strong">{currentTeam.name}</Box>
        </Text>
      )}

      <Box className="play-grid">
        <Box className="play-row headers">
          {sortedCategories.map((category, colIndex) => (
            <Box
              key={category.id}
              className={`play-cell header col-color-${colIndex % 6}`}
            >
              {category.name}
            </Box>
          ))}
        </Box>
        {rowValues.map((value) => (
          <Box key={value} className="play-row">
            {sortedCategories.map((category, colIndex) => {
              const clue = category.clues.find((x) => x.pointValue === value);
              const isUsed = !clue || clue.isAnswered;
              return (
                <Button
                  key={`${category.id}-${value}`}
                  className={`play-cell card-cell col-color-${colIndex % 6} ${isUsed ? "used" : ""}`}
                  disabled={isUsed || isBusy}
                  onClick={() => {
                    if (!clue) {
                      return;
                    }

                    const shouldTriggerGenderReveal =
                      genderRevealConfig.enabled &&
                      genderRevealAssignedIdSet.has(clue.id);
                    const shouldTriggerJoker =
                      jokerConfig.enabled && jokerAssignedIdSet.has(clue.id);
                    const shouldTriggerRockPaperScissors =
                      rockPaperScissorsConfig.enabled &&
                      rockPaperScissorsAssignedIdSet.has(clue.id);
                    setActiveClue(clue);
                    setJokerRound(
                      shouldTriggerJoker &&
                        !shouldTriggerGenderReveal &&
                        !shouldTriggerRockPaperScissors
                        ? createJokerRound(clue.pointValue, {
                            jokerSpotCount: jokerConfig.jokerSpotCount,
                            thiefSpotCount: jokerConfig.thiefSpotCount,
                          })
                        : null,
                    );
                    setGenderRevealRound(
                      shouldTriggerGenderReveal
                        ? createGenderRevealRound()
                        : null,
                    );
                    setRockPaperScissorsRound(
                      shouldTriggerRockPaperScissors
                        ? createRockPaperScissorsRound()
                        : null,
                    );
                    setGenderRevealBonusPointsForClue(0);
                    setRockPaperScissorsPointsDeltaForClue(0);
                    stopGenderRevealAudio();
                    clearRockPaperScissorsTimer();
                    setIsJokerResultHolding(false);
                    setIsQuestionRevealTransitioning(false);
                    setAnswerInput("");
                    setFeedback("");
                    setFeedbackTone("");
                    setHasSubmitted(false);
                  }}
                >
                  {clue ? clue.pointValue : "-"}
                </Button>
              );
            })}
          </Box>
        ))}
      </Box>

      {activeClue && genderRevealRound && (
        <MiniGameModal
          title={t("components.playModeView.genderRevealTitle")}
          subtitle={t("components.playModeView.genderRevealSubtitle", {
            teamName: currentTeam?.name ?? "",
          })}
          closeLabel={
            genderRevealRound.status === "revealed"
              ? t("components.playModeView.close")
              : t("components.playModeView.cancel")
          }
          onClose={() => {
            resetActiveQuestionFlow();
          }}
        >
          <div
            className={`gender-reveal-stage ${genderRevealRound.status} ${genderRevealRound.status === "revealed" ? `result-${genderRevealRound.actualGender}` : ""}`}
          >
            <div
              className="gender-reveal-halves"
              aria-label={t("components.playModeView.pickBoyOrGirl")}
            >
              <button
                type="button"
                className={`gender-half girl ${genderRevealRound.guessedGender === "girl" ? "selected" : ""}`}
                disabled={genderRevealRound.status !== "guessing" || isBusy}
                onClick={() => handleGenderGuess("girl")}
              >
                <span className="gender-half-label">
                  {t("components.playModeView.girl")}
                </span>
                <span className="gender-half-subtitle">
                  {t("components.playModeView.girlSide")}
                </span>
              </button>

              <button
                type="button"
                className={`gender-half boy ${genderRevealRound.guessedGender === "boy" ? "selected" : ""}`}
                disabled={genderRevealRound.status !== "guessing" || isBusy}
                onClick={() => handleGenderGuess("boy")}
              >
                <span className="gender-half-label">
                  {t("components.playModeView.boy")}
                </span>
                <span className="gender-half-subtitle">
                  {t("components.playModeView.boySide")}
                </span>
              </button>

              <div
                className={`gender-reveal-pointer ${genderRevealRound.status} ${
                  genderRevealRound.status === "guessing" &&
                  genderRevealRound.guessedGender
                    ? `guess-${genderRevealRound.guessedGender}`
                    : ""
                } ${genderRevealRound.status === "revealed" ? `result-${genderRevealRound.actualGender}` : ""}`}
                aria-hidden="true"
              >
                <div className="gender-reveal-pointer-ring" />
                <div className="gender-reveal-pointer-core">?</div>
              </div>
            </div>

            {genderRevealRound.status === "revealed" && (
              <div className="gender-reveal-result-wrap">
                <p
                  className={`gender-reveal-banner ${genderRevealRound.isCorrect ? "correct" : "miss"}`}
                >
                  {t("components.playModeView.itsABoy")}
                </p>
                <p className="gender-reveal-bonus-note">
                  {genderRevealRound.bonusMessage}
                </p>
                <button
                  type="button"
                  className="btn-success"
                  onClick={() => {
                    stopGenderRevealAudio();
                    setGenderRevealRound(null);
                  }}
                >
                  {t("common.continue")}
                </button>
              </div>
            )}

            {genderRevealRound.status === "revealed" &&
              genderRevealRound.actualGender === "boy" && (
                <>
                  <div className="gender-reveal-confetti" aria-hidden="true">
                    {confettiPieces.map((piece) => (
                      <span
                        key={piece.id}
                        className={`confetti-piece confetti-${piece.id % 4}`}
                        style={{
                          left: piece.left,
                          animationDelay: `${piece.delayMs}ms`,
                          animationDuration: `${piece.durationMs}ms`,
                        }}
                      />
                    ))}
                  </div>
                  <div className="gender-reveal-fireworks" aria-hidden="true">
                    {fireworkBursts.map((burst) => (
                      <span
                        key={burst.id}
                        className="firework-burst"
                        style={{
                          left: burst.left,
                          top: burst.top,
                          width: `${burst.size}px`,
                          height: `${burst.size}px`,
                          animationDelay: `${burst.delayMs}ms`,
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
          </div>
        </MiniGameModal>
      )}

      {activeClue && rockPaperScissorsRound && (
        <MiniGameModal
          title={t("components.playModeView.rockPaperScissorsTitle")}
          subtitle={t("components.playModeView.rockPaperScissorsSubtitle", {
            teamName: currentTeam?.name ?? "",
          })}
          closeLabel={
            rockPaperScissorsRound.status === "revealed"
              ? t("components.playModeView.close")
              : t("components.playModeView.cancel")
          }
          onClose={() => {
            resetActiveQuestionFlow();
          }}
        >
          <div className={`rps-stage ${rockPaperScissorsRound.status}`}>
            <div className="rps-choices" aria-label={t("components.playModeView.rpsChoiceAria")}>
              {getRockPaperScissorsChoices(t).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`rps-choice-card ${rockPaperScissorsRound.playerChoice === option.value ? "selected" : ""}`}
                  disabled={rockPaperScissorsRound.status !== "choosing" || isBusy}
                  onClick={() => handleRockPaperScissorsChoice(option.value)}
                >
                  <span className="rps-choice-icon" aria-hidden="true">
                    {option.icon}
                  </span>
                  <span className="rps-choice-label">{option.label}</span>
                </button>
              ))}
            </div>

            {rockPaperScissorsRound.status !== "choosing" && (
              <div className="rps-chant-strip" aria-live="polite">
                {getRockPaperScissorsChantLabel(rockPaperScissorsRound, t)}
              </div>
            )}

            {rockPaperScissorsRound.status === "revealed" &&
              rockPaperScissorsRound.playerChoice &&
              rockPaperScissorsRound.computerChoice &&
              rockPaperScissorsRound.result && (
                <div className="rps-result-panel">
                  <div className="rps-result-grid">
                    <div className="rps-result-card player">
                      <span className="rps-result-caption">
                        {t("components.playModeView.rpsYou")}
                      </span>
                      <span className="rps-result-icon" aria-hidden="true">
                        {
                          getRockPaperScissorsChoiceMeta(
                            rockPaperScissorsRound.playerChoice,
                            t,
                          ).icon
                        }
                      </span>
                      <span className="rps-result-label">
                        {
                          getRockPaperScissorsChoiceMeta(
                            rockPaperScissorsRound.playerChoice,
                            t,
                          ).label
                        }
                      </span>
                    </div>

                    <div className="rps-result-versus" aria-hidden="true">
                      VS
                    </div>

                    <div className="rps-result-card computer">
                      <span className="rps-result-caption">
                        {t("components.playModeView.rpsComputer")}
                      </span>
                      <span className="rps-result-icon" aria-hidden="true">
                        {
                          getRockPaperScissorsChoiceMeta(
                            rockPaperScissorsRound.computerChoice,
                            t,
                          ).icon
                        }
                      </span>
                      <span className="rps-result-label">
                        {
                          getRockPaperScissorsChoiceMeta(
                            rockPaperScissorsRound.computerChoice,
                            t,
                          ).label
                        }
                      </span>
                    </div>
                  </div>

                  <p
                    className={`rps-result-banner ${rockPaperScissorsRound.result}`}
                  >
                    {rockPaperScissorsRound.result === "win"
                      ? t("components.playModeView.rpsWinMessage", {
                          points: ROCK_PAPER_SCISSORS_BONUS_POINTS,
                        })
                      : t("components.playModeView.rpsLoseMessage", {
                          points: ROCK_PAPER_SCISSORS_BONUS_POINTS,
                        })}
                  </p>

                  <button
                    type="button"
                    className={
                      rockPaperScissorsRound.result === "win"
                        ? "btn-success"
                        : "btn-warning"
                    }
                    onClick={() => {
                      clearRockPaperScissorsTimer();
                      setRockPaperScissorsRound(null);
                    }}
                  >
                    {t("common.continue")}
                  </button>
                </div>
              )}
          </div>
        </MiniGameModal>
      )}

      {activeClue && jokerRound && (jokerIsActive || isJokerResultHolding) && (
        <MiniGameModal
          title={t("components.playModeView.jokerTitle")}
          subtitle={t("components.playModeView.jokerSubtitle", {
            teamName: currentTeam?.name ?? "",
          })}
          headerVisual={
            <img
              className="joker-hat-logo"
              src={jokerHatUrl}
              alt={t("components.playModeView.jokerHatAlt")}
            />
          }
          closeLabel={t("components.playModeView.cancel")}
          onClose={() => {
            resetActiveQuestionFlow();
          }}
        >
          <div className="joker-stage">
            <div className="joker-ladder-panel">
              <div
                className="joker-ladder"
                aria-label={t("components.playModeView.jokerPrizeLadderAria")}
              >
                {getLadderValues(activeClue.pointValue).map((points, index) => {
                  const rung = JOKER_STEP_COUNT - index;
                  const isActiveRung =
                    !jokerRound.thiefHit &&
                    getCurrentJokerRungForDisplay(jokerRound) === rung;
                  return (
                    <div
                      key={points}
                      className={`joker-ladder-rung ${isActiveRung ? "active" : ""}`}
                    >
                      {points} {t("common.pointsShort")}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="joker-board-panel">
              <div className="joker-column-grid">
                {jokerRound.steps.map((step, index) => {
                  const isCurrent =
                    jokerRound.status === "playing" &&
                    index === jokerRound.currentStepIndex;
                  const isDone = step.choice !== null;
                  const canClick =
                    isCurrent && jokerRound.status === "playing" && !isBusy;

                  return (
                    <div
                      key={index}
                      className={`joker-column ${isCurrent ? "current" : ""} ${isDone ? "done" : ""}`}
                    >
                      <button
                        type="button"
                        className={`joker-orb-button top ${step.choice === "up" ? `chosen ${getJokerOutcomeClass(step.outcome)}` : ""}`}
                        disabled={!canClick}
                        onClick={() =>
                          setJokerRound((current) =>
                            applyJokerChoice(
                              current,
                              "up",
                              activeClue.pointValue,
                            ),
                          )
                        }
                      >
                        <span className="joker-orb-label">
                          {t("components.playModeView.up")}
                        </span>
                        <span className="joker-orb-value">
                          {step.choice === "up" && step.revealedSpot
                            ? renderJokerSpot(step.revealedSpot, t)
                            : ""}
                        </span>
                      </button>

                      <div
                        className="joker-base-orb"
                        aria-label={t("components.playModeView.baseDigitAria", {
                          digit: step.baseDigit,
                        })}
                      >
                        {step.baseDigit}
                      </div>

                      <button
                        type="button"
                        className={`joker-orb-button bottom ${step.choice === "down" ? `chosen ${getJokerOutcomeClass(step.outcome)}` : ""}`}
                        disabled={!canClick}
                        onClick={() =>
                          setJokerRound((current) =>
                            applyJokerChoice(
                              current,
                              "down",
                              activeClue.pointValue,
                            ),
                          )
                        }
                      >
                        <span className="joker-orb-label">
                          {t("components.playModeView.down")}
                        </span>
                        <span className="joker-orb-value">
                          {step.choice === "down" && step.revealedSpot
                            ? renderJokerSpot(step.revealedSpot, t)
                            : ""}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </MiniGameModal>
      )}

      {activeClue && isQuestionRevealTransitioning && (
        <div className="question-reveal-backdrop" aria-hidden="true">
          <div className="question-reveal-stage">
            <div className="question-reveal-flash" />
            <div className="question-reveal-burst-text">
              {t("components.playModeView.questionTime")}
            </div>
            <div className="question-reveal-subtext">
              {t("components.playModeView.pointsLabel", {
                points: resolvedPointValue,
              })}
            </div>
            <div className="question-reveal-curtain left" />
            <div className="question-reveal-curtain right" />
          </div>
        </div>
      )}

      {activeClue &&
        !genderRevealIsActive &&
        !rockPaperScissorsIsActive &&
        !jokerIsActive &&
        !isQuestionRevealTransitioning && (
          <div className="modal-backdrop">
            <div
              className={`modal-card ${jokerRound?.status === "completed" ? "question-reveal-modal" : ""}`}
              role="dialog"
              aria-modal="true"
              aria-labelledby="play-modal-title"
            >
              <h3 id="play-modal-title">
                {t("components.playModeView.questionForPoints", {
                  points: resolvedPointValue,
                })}
                {genderRevealBonusPointsForClue > 0
                  ? ` ${t("components.playModeView.includesRevealBonus", { points: genderRevealBonusPointsForClue })}`
                  : ""}
              </h3>
              {rockPaperScissorsPointsDeltaForClue !== 0 && (
                <p
                  className={`message ${rockPaperScissorsPointsDeltaForClue > 0 ? "success" : "error"}`}
                >
                  {rockPaperScissorsPointsDeltaForClue > 0
                    ? t("components.playModeView.rpsQuestionWinResult", {
                        points: ROCK_PAPER_SCISSORS_BONUS_POINTS,
                      })
                    : t("components.playModeView.rpsQuestionLoseResult", {
                        points: ROCK_PAPER_SCISSORS_BONUS_POINTS,
                      })}
                </p>
              )}
              {jokerRound?.status === "completed" && (
                <p
                  className={`message ${jokerRound.thiefHit ? "error" : "success"}`}
                >
                  {jokerRound.thiefHit
                    ? t("components.playModeView.thiefHitResult")
                    : jokerRound.jokerHit
                      ? t("components.playModeView.jokerHitResult")
                      : t("components.playModeView.jokerCompleteResult", {
                          points: resolvedPointValue,
                        })}
                </p>
              )}

              {getClueImageSrc(activeClue) && (
                <div className="play-clue-image-wrap">
                  <img
                    className="play-clue-image"
                    src={getClueImageSrc(activeClue)!}
                    alt={t("components.playModeView.questionVisualAlt")}
                  />
                </div>
              )}
              <p>{activeClue.prompt}</p>

              <p>
                {t("components.playModeView.currentTeamLabel")}:{" "}
                <strong>
                  {currentTeam?.name ?? t("components.playModeView.noneTeam")}
                </strong>
              </p>

              <div className="field">
                <label htmlFor="play-answer">
                  {t("components.playModeView.answerLabel")}
                </label>
                <Input
                  id="play-answer"
                  value={answerInput}
                  onChange={(event) => setAnswerInput(event.target.value)}
                  placeholder={t(
                    "components.playModeView.typeAnswerPlaceholder",
                  )}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                />
              </div>

              <div className="row play-answer-actions">
                <Button
                  className="btn-success"
                  disabled={
                    isBusy ||
                    !currentTeamId ||
                    !answerInput.trim() ||
                    hasSubmitted
                  }
                  onClick={async () => {
                    const isCorrect =
                      normalize(answerInput) === normalize(activeClue.answer);
                    setFeedback(
                      isCorrect
                        ? genderRevealBonusPointsForClue > 0
                          ? t(
                              "components.playModeView.correctAnswerWithBonusFeedback",
                              {
                                points: resolvedPointValue,
                                bonus: genderRevealBonusPointsForClue,
                              },
                            )
                          : t("components.playModeView.correctAnswerFeedback")
                        : t("components.playModeView.wrongAnswerFeedback", {
                            answer: activeClue.answer,
                          }),
                    );
                    setFeedbackTone(isCorrect ? "success" : "error");
                    setHasSubmitted(true);
                    await onResolveQuestion({
                      clue: activeClue,
                      teamId: currentTeamId,
                      isCorrect,
                      resolvedPointValue,
                    });

                    const currentIndex = turnOrderTeams.findIndex(
                      (team) => team.id === currentTeamId,
                    );
                    if (currentIndex >= 0 && turnOrderTeams.length > 0) {
                      const nextIndex =
                        (currentIndex + 1) % turnOrderTeams.length;
                      onCurrentTeamIdChange(turnOrderTeams[nextIndex].id);
                    }
                  }}
                >
                  {t("components.playModeView.submitAnswer")}
                </Button>
                <Button
                  className="btn-secondary"
                  type="button"
                  disabled={!hasSubmitted || isBusy}
                  onClick={() => {
                    resetActiveQuestionFlow();
                  }}
                >
                  {t("components.playModeView.close")}
                </Button>
              </div>

              {feedback && (
                <p className={`message ${feedbackTone}`} aria-live="polite">
                  {feedback}
                </p>
              )}
            </div>
          </div>
        )}

      {scoreOrderedTeams.length > 0 && (
        <>
          <h3>{t("components.playModeView.currentScores")}</h3>
          <Box as="ul" className="list compact-list">
            {scoreOrderedTeams.map((team) => (
              <Box
                as="li"
                key={team.id}
                className={`row ${team.id === currentTeamId ? "current-turn" : ""}`}
              >
                <Box as="strong">{team.name}</Box>
                <Text as="span">
                  {team.score} {t("common.pointsShort")}
                  {team.id === currentTeamId
                    ? ` ${t("components.playModeView.turnSuffix")}`
                    : ""}
                </Text>
              </Box>
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}

function createRockPaperScissorsRound(): RockPaperScissorsRoundState {
  return {
    status: "choosing",
    playerChoice: null,
    computerChoice: null,
    result: null,
    pointsDelta: 0,
    chantStep: 0,
  };
}

function getRockPaperScissorsChoices(t: TFunction) {
  return [
    {
      value: "rock" as const,
      icon: "✊",
      label: t("components.playModeView.rpsRock"),
    },
    {
      value: "paper" as const,
      icon: "📄",
      label: t("components.playModeView.rpsPaper"),
    },
    {
      value: "scissors" as const,
      icon: "✂️",
      label: t("components.playModeView.rpsScissors"),
    },
  ];
}

function getRockPaperScissorsChoiceMeta(
  choice: RockPaperScissorsChoice,
  t: TFunction,
) {
  return getRockPaperScissorsChoices(t).find((option) => option.value === choice)!;
}

function getRockPaperScissorsChantLabel(
  round: RockPaperScissorsRoundState,
  t: TFunction,
): string {
  const chant = [
    t("components.playModeView.rpsRock"),
    t("components.playModeView.rpsPaper"),
    t("components.playModeView.rpsScissorsBang"),
  ];

  if (round.status === "revealed") {
    return t("components.playModeView.rpsRevealReady");
  }

  return chant[Math.max(0, round.chantStep - 1)] ?? t("components.playModeView.rpsReady");
}

function getComputerRockPaperScissorsChoice(
  playerChoice: RockPaperScissorsChoice,
): RockPaperScissorsChoice {
  const remainingChoices = ["rock", "paper", "scissors"].filter(
    (choice) => choice !== playerChoice,
  ) as RockPaperScissorsChoice[];
  const randomIndex = Math.floor(Math.random() * remainingChoices.length);
  return remainingChoices[randomIndex];
}

function evaluateRockPaperScissorsResult(
  playerChoice: RockPaperScissorsChoice,
  computerChoice: RockPaperScissorsChoice,
): "win" | "lose" {
  if (
    (playerChoice === "rock" && computerChoice === "scissors") ||
    (playerChoice === "paper" && computerChoice === "rock") ||
    (playerChoice === "scissors" && computerChoice === "paper")
  ) {
    return "win";
  }

  return "lose";
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(a|an|the)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getClueImageSrc(clue: Clue): string | null {
  if (!clue.imageMimeType || !clue.imageBase64) {
    return null;
  }

  return `data:${clue.imageMimeType};base64,${clue.imageBase64}`;
}

function createJokerRound(
  basePoints: number,
  options?: { jokerSpotCount?: number; thiefSpotCount?: number },
): JokerRoundState {
  const totalSpots = JOKER_STEP_COUNT * 2;
  const jokerSpotCount = Math.max(
    0,
    Math.min(totalSpots, Math.floor(options?.jokerSpotCount ?? 1)),
  );
  const thiefSpotCountRequested = Math.max(
    0,
    Math.floor(options?.thiefSpotCount ?? 1),
  );
  const thiefSpotCount = Math.min(
    totalSpots - jokerSpotCount,
    thiefSpotCountRequested,
  );
  const shuffledPositions = shuffleNumbers(
    Array.from({ length: totalSpots }, (_, i) => i),
  );
  const jokerPositionSet = new Set(shuffledPositions.slice(0, jokerSpotCount));
  const thiefPositionSet = new Set(
    shuffledPositions.slice(jokerSpotCount, jokerSpotCount + thiefSpotCount),
  );

  const steps: JokerStep[] = Array.from(
    { length: JOKER_STEP_COUNT },
    (_, index) => ({
      baseDigit: randomDigit(),
      upSpot: createJokerSpot(index * 2, jokerPositionSet, thiefPositionSet),
      downSpot: createJokerSpot(
        index * 2 + 1,
        jokerPositionSet,
        thiefPositionSet,
      ),
      choice: null,
      revealedSpot: null,
      outcome: null,
    }),
  );

  return {
    steps,
    currentStepIndex: 0,
    currentRung: 0,
    status: "playing",
    finalPoints: null,
    jokerHit: false,
    thiefHit: false,
    lastMessage: `Choose UP or DOWN for step 1. Base clue value: ${basePoints} points.`,
  };
}

function createGenderRevealRound(): GenderRevealRoundState {
  return {
    status: "guessing",
    guessedGender: null,
    actualGender: GENDER_REVEAL_RESULT,
    isCorrect: null,
    bonusStatus: "idle",
    bonusMessage: "",
  };
}

function applyJokerChoice(
  current: JokerRoundState | null,
  choice: JokerDirection,
  basePoints: number,
): JokerRoundState | null {
  if (!current || current.status !== "playing") {
    return current;
  }

  const stepIndex = current.currentStepIndex;
  const step = current.steps[stepIndex];
  if (!step || step.choice !== null) {
    return current;
  }

  const revealedSpot = choice === "up" ? step.upSpot : step.downSpot;
  const nextSteps = [...current.steps];
  let nextRung = current.currentRung;

  if (revealedSpot.kind === "joker") {
    nextSteps[stepIndex] = { ...step, choice, revealedSpot, outcome: "joker" };
    return {
      ...current,
      steps: nextSteps,
      status: "completed",
      currentStepIndex: stepIndex,
      currentRung: JOKER_STEP_COUNT,
      finalPoints: getLadderPointValue(basePoints, JOKER_STEP_COUNT),
      jokerHit: true,
      thiefHit: false,
      lastMessage:
        "JOKER! Instant top prize. The question will now be revealed.",
    };
  }

  if (revealedSpot.kind === "thief") {
    nextSteps[stepIndex] = { ...step, choice, revealedSpot, outcome: "thief" };
    return {
      ...current,
      steps: nextSteps,
      status: "completed",
      currentStepIndex: stepIndex,
      currentRung: 0,
      finalPoints: JOKER_THIEF_POINTS,
      jokerHit: false,
      thiefHit: true,
      lastMessage: `THIEF! The clue is reduced to ${JOKER_THIEF_POINTS} points if answered correctly.`,
    };
  }

  const outcome = evaluateNumberOutcome(
    step.baseDigit,
    revealedSpot.value,
    choice,
  );
  if (outcome === "climb") {
    nextRung = Math.min(JOKER_STEP_COUNT, current.currentRung + 1);
  }
  if (outcome === "down") {
    nextRung = Math.max(0, current.currentRung - 1);
  }

  nextSteps[stepIndex] = { ...step, choice, revealedSpot, outcome };
  const isFinalStep = stepIndex === current.steps.length - 1;
  if (isFinalStep) {
    const finalPoints = getLadderPointValue(basePoints, nextRung);
    return {
      ...current,
      steps: nextSteps,
      status: "completed",
      currentStepIndex: stepIndex,
      currentRung: nextRung,
      finalPoints,
      lastMessage: `Joker complete. Final clue value: ${finalPoints} points.`,
    };
  }

  return {
    ...current,
    steps: nextSteps,
    currentStepIndex: stepIndex + 1,
    currentRung: nextRung,
    lastMessage: `${describeJokerOutcome(outcome)} Next: step ${stepIndex + 2}. Current value ${getLadderPointValue(basePoints, nextRung)}.`,
  };
}

function evaluateNumberOutcome(
  baseDigit: number,
  revealedDigit: number,
  choice: JokerDirection,
): JokerOutcome {
  if (revealedDigit === baseDigit) {
    return "stay";
  }

  if (choice === "up") {
    return revealedDigit > baseDigit ? "climb" : "down";
  }

  return revealedDigit < baseDigit ? "climb" : "down";
}

function describeJokerOutcome(outcome: JokerOutcome | null): string {
  switch (outcome) {
    case "climb":
      return "Correct - climb";
    case "down":
      return "Wrong - down one";
    case "stay":
      return "Tie - stay";
    case "joker":
      return "Joker";
    case "thief":
      return "Thief";
    default:
      return "";
  }
}

function renderJokerSpot(spot: JokerSpot, t: TFunction): string {
  if (spot.kind === "number") {
    return String(spot.value);
  }

  return spot.kind === "joker"
    ? t("components.playModeView.jokerWord")
    : t("components.playModeView.thiefWord");
}

function getJokerOutcomeClass(outcome: JokerOutcome | null): string {
  switch (outcome) {
    case "climb":
      return "outcome-climb";
    case "down":
      return "outcome-down";
    case "stay":
      return "outcome-stay";
    case "joker":
      return "outcome-joker";
    case "thief":
      return "outcome-thief";
    default:
      return "";
  }
}

function getLadderPointValue(basePoints: number, rung: number): number {
  return basePoints + rung * JOKER_LADDER_STEP_POINTS;
}

function getLadderValues(basePoints: number): number[] {
  return Array.from({ length: JOKER_STEP_COUNT + 1 }, (_, index) =>
    getLadderPointValue(basePoints, JOKER_STEP_COUNT - index),
  );
}

function getCurrentJokerRungForDisplay(round: JokerRoundState): number {
  if (round.jokerHit) {
    return JOKER_STEP_COUNT;
  }

  return round.currentRung;
}

function createJokerSpot(
  position: number,
  jokerPositions: Set<number>,
  thiefPositions: Set<number>,
): JokerSpot {
  if (jokerPositions.has(position)) {
    return { kind: "joker" };
  }

  if (thiefPositions.has(position)) {
    return { kind: "thief" };
  }

  return { kind: "number", value: randomDigit() };
}

function randomDigit(): number {
  return Math.floor(Math.random() * 10);
}

function shuffleNumbers(values: number[]): number[] {
  const next = [...values];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const current = next[i];
    next[i] = next[j];
    next[j] = current;
  }

  return next;
}
