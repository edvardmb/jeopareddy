import { useEffect, useMemo, useState } from "react";
import type { Game } from "../../../api";
import {
  computeAssignmentStats,
  reconcileAssignments,
  sameStringSet,
} from "../assignmentUtils";

export function useMiniGameAssignments(game: Game | null) {
  const [jokerEnabled, setJokerEnabled] = useState(false);
  const [jokerAppearancesPerGame, setJokerAppearancesPerGame] = useState(1);
  const [jokerAssignedClueIds, setJokerAssignedClueIds] = useState<string[]>([]);
  const [jokerSpotCount, setJokerSpotCount] = useState(1);
  const [thiefSpotCount, setThiefSpotCount] = useState(1);

  const [genderRevealEnabled, setGenderRevealEnabled] = useState(false);
  const [genderRevealAppearancesPerGame, setGenderRevealAppearancesPerGame] =
    useState(1);
  const [genderRevealAssignedClueIds, setGenderRevealAssignedClueIds] =
    useState<string[]>([]);
  const [rockPaperScissorsEnabled, setRockPaperScissorsEnabled] =
    useState(false);
  const [rockPaperScissorsAppearancesPerGame, setRockPaperScissorsAppearancesPerGame] =
    useState(1);
  const [rockPaperScissorsAssignedClueIds, setRockPaperScissorsAssignedClueIds] =
    useState<string[]>([]);

  useEffect(() => {
    setJokerAssignedClueIds([]);
    setGenderRevealAssignedClueIds([]);
    setRockPaperScissorsAssignedClueIds([]);
  }, [game?.id]);

  useEffect(() => {
    if (!game || !jokerEnabled) {
      if (jokerAssignedClueIds.length > 0) {
        setJokerAssignedClueIds([]);
      }
      return;
    }

    const allClues = game.categories.flatMap((category) => category.clues);
    const targetCount = Math.max(
      0,
      Math.min(Math.floor(jokerAppearancesPerGame || 0), allClues.length),
    );
    const nextAssignments = reconcileAssignments({
      assignedIds: jokerAssignedClueIds,
      eligibleClues: allClues,
      targetCount,
    });

    if (!sameStringSet(jokerAssignedClueIds, nextAssignments)) {
      setJokerAssignedClueIds(nextAssignments);
    }
  }, [game, jokerAppearancesPerGame, jokerAssignedClueIds, jokerEnabled]);

  useEffect(() => {
    if (!game || !genderRevealEnabled) {
      if (genderRevealAssignedClueIds.length > 0) {
        setGenderRevealAssignedClueIds([]);
      }
      return;
    }

    const excludedClueIdSet = new Set(jokerAssignedClueIds);
    const eligibleClues = game.categories
      .flatMap((category) => category.clues)
      .filter((clue) => !excludedClueIdSet.has(clue.id));
    const targetCount = Math.max(
      0,
      Math.min(
        Math.floor(genderRevealAppearancesPerGame || 0),
        eligibleClues.length,
      ),
    );

    const nextAssignments = reconcileAssignments({
      assignedIds: genderRevealAssignedClueIds,
      eligibleClues,
      targetCount,
    });

    if (!sameStringSet(genderRevealAssignedClueIds, nextAssignments)) {
      setGenderRevealAssignedClueIds(nextAssignments);
    }
  }, [
    game,
    genderRevealAppearancesPerGame,
    genderRevealAssignedClueIds,
    genderRevealEnabled,
    jokerAssignedClueIds,
  ]);

  useEffect(() => {
    if (!game || !rockPaperScissorsEnabled) {
      if (rockPaperScissorsAssignedClueIds.length > 0) {
        setRockPaperScissorsAssignedClueIds([]);
      }
      return;
    }

    const excludedClueIdSet = new Set([
      ...jokerAssignedClueIds,
      ...genderRevealAssignedClueIds,
    ]);
    const eligibleClues = game.categories
      .flatMap((category) => category.clues)
      .filter((clue) => !excludedClueIdSet.has(clue.id));
    const targetCount = Math.max(
      0,
      Math.min(
        Math.floor(rockPaperScissorsAppearancesPerGame || 0),
        eligibleClues.length,
      ),
    );

    const nextAssignments = reconcileAssignments({
      assignedIds: rockPaperScissorsAssignedClueIds,
      eligibleClues,
      targetCount,
    });

    if (!sameStringSet(rockPaperScissorsAssignedClueIds, nextAssignments)) {
      setRockPaperScissorsAssignedClueIds(nextAssignments);
    }
  }, [
    game,
    genderRevealAssignedClueIds,
    jokerAssignedClueIds,
    rockPaperScissorsAppearancesPerGame,
    rockPaperScissorsAssignedClueIds,
    rockPaperScissorsEnabled,
  ]);

  const jokerStats = useMemo(
    () =>
      computeAssignmentStats({
        assignedIds: jokerAssignedClueIds,
        allClues: game?.categories.flatMap((category) => category.clues) ?? [],
      }),
    [game, jokerAssignedClueIds],
  );
  const genderRevealStats = useMemo(
    () =>
      computeAssignmentStats({
        assignedIds: genderRevealAssignedClueIds,
        allClues: game?.categories.flatMap((category) => category.clues) ?? [],
      }),
    [game, genderRevealAssignedClueIds],
  );
  const rockPaperScissorsStats = useMemo(
    () =>
      computeAssignmentStats({
        assignedIds: rockPaperScissorsAssignedClueIds,
        allClues: game?.categories.flatMap((category) => category.clues) ?? [],
      }),
    [game, rockPaperScissorsAssignedClueIds],
  );

  const resetAssignments = () => {
    setJokerAssignedClueIds([]);
    setGenderRevealAssignedClueIds([]);
    setRockPaperScissorsAssignedClueIds([]);
  };

  return {
    joker: {
      enabled: jokerEnabled,
      setEnabled: setJokerEnabled,
      appearancesPerGame: jokerAppearancesPerGame,
      setAppearancesPerGame: setJokerAppearancesPerGame,
      assignedClueIds: jokerAssignedClueIds,
      spotCount: jokerSpotCount,
      setSpotCount: setJokerSpotCount,
      thiefSpotCount,
      setThiefSpotCount,
      stats: jokerStats,
    },
    genderReveal: {
      enabled: genderRevealEnabled,
      setEnabled: setGenderRevealEnabled,
      appearancesPerGame: genderRevealAppearancesPerGame,
      setAppearancesPerGame: setGenderRevealAppearancesPerGame,
      assignedClueIds: genderRevealAssignedClueIds,
      stats: genderRevealStats,
    },
    rockPaperScissors: {
      enabled: rockPaperScissorsEnabled,
      setEnabled: setRockPaperScissorsEnabled,
      appearancesPerGame: rockPaperScissorsAppearancesPerGame,
      setAppearancesPerGame: setRockPaperScissorsAppearancesPerGame,
      assignedClueIds: rockPaperScissorsAssignedClueIds,
      stats: rockPaperScissorsStats,
    },
    resetAssignments,
  };
}
