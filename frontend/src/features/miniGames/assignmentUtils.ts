type ClueCandidate = {
  id: string;
  isAnswered: boolean;
};

export type AssignmentStats = {
  totalAssigned: number;
  completed: number;
  remaining: number;
};

export function reconcileAssignments(params: {
  assignedIds: string[];
  eligibleClues: ClueCandidate[];
  targetCount: number;
}): string[] {
  const { assignedIds, eligibleClues, targetCount } = params;
  if (targetCount <= 0 || eligibleClues.length === 0) {
    return [];
  }

  const allClueIdSet = new Set(eligibleClues.map((clue) => clue.id));
  const answeredClueIdSet = new Set(
    eligibleClues.filter((clue) => clue.isAnswered).map((clue) => clue.id),
  );
  const existingValid = assignedIds.filter((id) => allClueIdSet.has(id));
  const completedAssignments = existingValid.filter((id) =>
    answeredClueIdSet.has(id),
  );
  const pendingAssignments = existingValid.filter((id) => !answeredClueIdSet.has(id));

  const nextAssignments: string[] = [];
  nextAssignments.push(...completedAssignments.slice(0, targetCount));

  if (nextAssignments.length < targetCount) {
    nextAssignments.push(
      ...pendingAssignments.slice(0, targetCount - nextAssignments.length),
    );
  }

  const chosenSet = new Set(nextAssignments);
  if (nextAssignments.length < targetCount) {
    const availableUnanswered = eligibleClues
      .filter((clue) => !clue.isAnswered && !chosenSet.has(clue.id))
      .map((clue) => clue.id);

    nextAssignments.push(
      ...shuffle(availableUnanswered).slice(
        0,
        targetCount - nextAssignments.length,
      ),
    );
  }

  return nextAssignments;
}

export function computeAssignmentStats(params: {
  assignedIds: string[];
  allClues: ClueCandidate[];
}): AssignmentStats {
  const answeredClueIds = new Set(
    params.allClues.filter((clue) => clue.isAnswered).map((clue) => clue.id),
  );
  const completed = params.assignedIds.filter((id) => answeredClueIds.has(id)).length;
  const totalAssigned = params.assignedIds.length;
  return {
    totalAssigned,
    completed,
    remaining: Math.max(0, totalAssigned - completed),
  };
}

export function sameStringSet(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  const rightSet = new Set(right);
  return left.every((item) => rightSet.has(item));
}

function shuffle<T>(values: T[]): T[] {
  const next = [...values];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const current = next[i];
    next[i] = next[j];
    next[j] = current;
  }

  return next;
}
