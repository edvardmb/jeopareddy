import { useEffect, useMemo, useState } from 'react'
import { Clue, Game } from '../api'
import jokerHatUrl from '../assets/joker-hat.svg'
import MiniGameModal from './MiniGameModal'

type PlayModeViewProps = {
  game: Game
  isBusy: boolean
  jokerConfig: {
    enabled: boolean
    assignedClueIds: string[]
  }
  onResolveQuestion: (params: { clue: Clue; teamId: string; isCorrect: boolean; resolvedPointValue: number }) => Promise<void>
}

type JokerDirection = 'up' | 'down'
type JokerSpot = { kind: 'number'; value: number } | { kind: 'joker' } | { kind: 'thief' }
type JokerOutcome = 'climb' | 'down' | 'stay' | 'joker' | 'thief'

type JokerStep = {
  baseDigit: number
  upSpot: JokerSpot
  downSpot: JokerSpot
  choice: JokerDirection | null
  revealedSpot: JokerSpot | null
  outcome: JokerOutcome | null
}

type JokerRoundState = {
  steps: JokerStep[]
  currentStepIndex: number
  currentRung: number
  status: 'playing' | 'completed'
  finalPoints: number | null
  jokerHit: boolean
  thiefHit: boolean
  lastMessage: string
}

const JOKER_STEP_COUNT = 5
const JOKER_LADDER_STEP_POINTS = 25
const JOKER_THIEF_POINTS = 10
const JOKER_RESULT_HOLD_MS = 1500
const QUESTION_REVEAL_TRANSITION_MS = 1700

export default function PlayModeView(props: PlayModeViewProps) {
  const { game, isBusy, jokerConfig, onResolveQuestion } = props
  const [activeClue, setActiveClue] = useState<Clue | null>(null)
  const [currentTeamId, setCurrentTeamId] = useState('')
  const [answerInput, setAnswerInput] = useState('')
  const [feedback, setFeedback] = useState('')
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [jokerRound, setJokerRound] = useState<JokerRoundState | null>(null)
  const [isJokerResultHolding, setIsJokerResultHolding] = useState(false)
  const [isQuestionRevealTransitioning, setIsQuestionRevealTransitioning] = useState(false)

  const turnOrderTeams = useMemo(
    () => [...game.teams].sort((a, b) => a.displayOrder - b.displayOrder),
    [game.teams],
  )
  const scoreOrderedTeams = useMemo(
    () => [...game.teams].sort((a, b) => b.score - a.score || a.displayOrder - b.displayOrder),
    [game.teams],
  )
  const currentTeam = turnOrderTeams.find((team) => team.id === currentTeamId) ?? null

  useEffect(() => {
    if (!currentTeamId && turnOrderTeams.length > 0) {
      setCurrentTeamId(turnOrderTeams[0].id)
      return
    }

    if (currentTeamId && !turnOrderTeams.some((team) => team.id === currentTeamId) && turnOrderTeams.length > 0) {
      setCurrentTeamId(turnOrderTeams[0].id)
    }
  }, [currentTeamId, turnOrderTeams])

  useEffect(() => {
    if (!activeClue || jokerRound?.status !== 'completed') {
      setIsJokerResultHolding(false)
      setIsQuestionRevealTransitioning(false)
      return
    }

    setIsJokerResultHolding(true)
    setIsQuestionRevealTransitioning(false)

    const holdTimeoutId = window.setTimeout(() => {
      setIsJokerResultHolding(false)
      setIsQuestionRevealTransitioning(true)
    }, JOKER_RESULT_HOLD_MS)

    const revealTimeoutId = window.setTimeout(() => {
      setIsQuestionRevealTransitioning(false)
    }, JOKER_RESULT_HOLD_MS + QUESTION_REVEAL_TRANSITION_MS)

    return () => {
      window.clearTimeout(holdTimeoutId)
      window.clearTimeout(revealTimeoutId)
    }
  }, [activeClue?.id, jokerRound?.status])

  const sortedCategories = useMemo(
    () => [...game.categories].sort((a, b) => a.displayOrder - b.displayOrder),
    [game.categories],
  )

  const rowValues = useMemo(() => {
    const values = new Set<number>()
    sortedCategories.forEach((category) => {
      category.clues.forEach((clue) => values.add(clue.pointValue))
    })
    return Array.from(values).sort((a, b) => a - b)
  }, [sortedCategories])

  const jokerAssignedIdSet = useMemo(() => new Set(jokerConfig.assignedClueIds), [jokerConfig.assignedClueIds])
  const jokerIsActive = jokerRound?.status === 'playing'

  const resolvedPointValue = useMemo(() => {
    if (!activeClue) {
      return 0
    }

    if (!jokerRound || jokerRound.finalPoints === null) {
      return activeClue.pointValue
    }

    return jokerRound.finalPoints
  }, [activeClue, jokerRound])

  if (game.categories.length === 0) {
    return (
      <section className="card card-play">
        <h2>Play Mode</h2>
        <p className="muted">Add categories and questions first.</p>
      </section>
    )
  }

  return (
    <section className="card card-play">
      <h2>Play Mode</h2>
      <p className="muted">Select a card, read the question, submit an answer, and score automatically.</p>
      {currentTeam && (
        <p className="turn-indicator">
          Turn: <strong>{currentTeam.name}</strong>
        </p>
      )}

      <div className="play-grid">
        <div className="play-row headers">
          {sortedCategories.map((category) => (
            <div key={category.id} className="play-cell header">
              {category.name}
            </div>
          ))}
        </div>
        {rowValues.map((value) => (
          <div key={value} className="play-row">
            {sortedCategories.map((category) => {
              const clue = category.clues.find((x) => x.pointValue === value)
              const isUsed = !clue || clue.isAnswered
              return (
                <button
                  key={`${category.id}-${value}`}
                  className={`play-cell card-cell ${isUsed ? 'used' : ''}`}
                  disabled={isUsed || isBusy}
                  onClick={() => {
                    if (!clue) {
                      return
                    }

                    const shouldTriggerJoker = jokerConfig.enabled && jokerAssignedIdSet.has(clue.id)
                    setActiveClue(clue)
                    setJokerRound(shouldTriggerJoker ? createJokerRound(clue.pointValue) : null)
                    setIsJokerResultHolding(false)
                    setIsQuestionRevealTransitioning(false)
                    setAnswerInput('')
                    setFeedback('')
                    setHasSubmitted(false)
                  }}
                >
                  {clue ? clue.pointValue : '-'}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {activeClue && jokerRound && (jokerIsActive || isJokerResultHolding) && (
        <MiniGameModal
          title="Joker Mini-Game"
          subtitle={`Team ${currentTeam?.name ?? ''}: complete Joker before the clue is revealed`}
          headerVisual={<img className="joker-hat-logo" src={jokerHatUrl} alt="Joker hat" />}
          closeLabel="Cancel"
          onClose={() => {
            setActiveClue(null)
            setJokerRound(null)
            setIsJokerResultHolding(false)
            setIsQuestionRevealTransitioning(false)
            setAnswerInput('')
            setFeedback('')
            setHasSubmitted(false)
          }}
        >
          <div className="joker-stage">
            <div className="joker-ladder-panel">
              <div className="joker-ladder" aria-label="Joker prize ladder">
                {getLadderValues(activeClue.pointValue).map((points, index) => {
                  const rung = JOKER_STEP_COUNT - index
                  const isActiveRung = !jokerRound.thiefHit && getCurrentJokerRungForDisplay(jokerRound) === rung
                  return (
                    <div key={points} className={`joker-ladder-rung ${isActiveRung ? 'active' : ''}`}>
                      {points} pts
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="joker-board-panel">
              <div className="joker-column-grid">
                {jokerRound.steps.map((step, index) => {
                  const isCurrent = jokerRound.status === 'playing' && index === jokerRound.currentStepIndex
                  const isDone = step.choice !== null
                  const canClick = isCurrent && jokerRound.status === 'playing' && !isBusy

                  return (
                    <div key={index} className={`joker-column ${isCurrent ? 'current' : ''} ${isDone ? 'done' : ''}`}>
                      <button
                        type="button"
                        className={`joker-orb-button top ${step.choice === 'up' ? `chosen ${getJokerOutcomeClass(step.outcome)}` : ''}`}
                        disabled={!canClick}
                        onClick={() => setJokerRound((current) => applyJokerChoice(current, 'up', activeClue.pointValue))}
                      >
                        <span className="joker-orb-label">UP</span>
                        <span className="joker-orb-value">{step.choice === 'up' && step.revealedSpot ? renderJokerSpot(step.revealedSpot) : ''}</span>
                      </button>

                      <div className="joker-base-orb" aria-label={`Base digit ${step.baseDigit}`}>
                        {step.baseDigit}
                      </div>

                      <button
                        type="button"
                        className={`joker-orb-button bottom ${step.choice === 'down' ? `chosen ${getJokerOutcomeClass(step.outcome)}` : ''}`}
                        disabled={!canClick}
                        onClick={() => setJokerRound((current) => applyJokerChoice(current, 'down', activeClue.pointValue))}
                      >
                        <span className="joker-orb-label">DOWN</span>
                        <span className="joker-orb-value">{step.choice === 'down' && step.revealedSpot ? renderJokerSpot(step.revealedSpot) : ''}</span>
                      </button>

                    </div>
                  )
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
            <div className="question-reveal-burst-text">QUESTION TIME</div>
            <div className="question-reveal-subtext">{resolvedPointValue} points</div>
            <div className="question-reveal-curtain left" />
            <div className="question-reveal-curtain right" />
          </div>
        </div>
      )}

      {activeClue && !jokerIsActive && !isQuestionRevealTransitioning && (
        <div className="modal-backdrop">
          <div
            className={`modal-card ${jokerRound?.status === 'completed' ? 'question-reveal-modal' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="play-modal-title"
          >
            <h3 id="play-modal-title">Question for {resolvedPointValue} points</h3>
            {jokerRound?.status === 'completed' && (
              <p className={`message ${jokerRound.thiefHit ? 'error' : 'success'}`}>
                {jokerRound.thiefHit
                  ? 'Thief hit: this question is now worth 10 points.'
                  : jokerRound.jokerHit
                    ? 'Joker hit: top prize reached!'
                    : `Joker complete: question value set to ${resolvedPointValue} points.`}
              </p>
            )}

            {getClueImageSrc(activeClue) && (
              <div className="play-clue-image-wrap">
                <img className="play-clue-image" src={getClueImageSrc(activeClue)!} alt="Question visual" />
              </div>
            )}
            <p>{activeClue.prompt}</p>

            <p>
              Current team: <strong>{currentTeam?.name ?? 'None'}</strong>
            </p>

            <div className="field">
              <label htmlFor="play-answer">Answer</label>
              <input
                id="play-answer"
                value={answerInput}
                onChange={(event) => setAnswerInput(event.target.value)}
                placeholder="Type answer"
              />
            </div>

            <div className="row">
              <button
                className="btn-success"
                disabled={isBusy || !currentTeamId || !answerInput.trim() || hasSubmitted}
                onClick={async () => {
                  const isCorrect = normalize(answerInput) === normalize(activeClue.answer)
                  setFeedback(isCorrect ? 'Correct answer!' : `Wrong. Correct answer: ${activeClue.answer}`)
                  setHasSubmitted(true)
                  await onResolveQuestion({ clue: activeClue, teamId: currentTeamId, isCorrect, resolvedPointValue })

                  const currentIndex = turnOrderTeams.findIndex((team) => team.id === currentTeamId)
                  if (currentIndex >= 0 && turnOrderTeams.length > 0) {
                    const nextIndex = (currentIndex + 1) % turnOrderTeams.length
                    setCurrentTeamId(turnOrderTeams[nextIndex].id)
                  }
                }}
              >
                Submit Answer
              </button>
              <button
                className="btn-secondary"
                type="button"
                onClick={() => {
                  setActiveClue(null)
                  setJokerRound(null)
                  setIsJokerResultHolding(false)
                  setIsQuestionRevealTransitioning(false)
                  setAnswerInput('')
                  setFeedback('')
                  setHasSubmitted(false)
                }}
              >
                Close
              </button>
            </div>

            {feedback && (
              <p className={`message ${feedback.startsWith('Correct') ? 'success' : 'error'}`} aria-live="polite">
                {feedback}
              </p>
            )}
          </div>
        </div>
      )}

      {scoreOrderedTeams.length > 0 && (
        <>
          <h3>Current Scores</h3>
          <ul className="list compact-list">
            {scoreOrderedTeams.map((team) => (
              <li key={team.id} className={`row ${team.id === currentTeamId ? 'current-turn' : ''}`}>
                <strong>{team.name}</strong>
                <span>
                  {team.score} pts{team.id === currentTeamId ? ' (turn)' : ''}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\b(a|an|the)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getClueImageSrc(clue: Clue): string | null {
  if (!clue.imageMimeType || !clue.imageBase64) {
    return null
  }

  return `data:${clue.imageMimeType};base64,${clue.imageBase64}`
}

function createJokerRound(basePoints: number): JokerRoundState {
  const specialPositions = shuffleNumbers(Array.from({ length: 10 }, (_, i) => i)).slice(0, 2)
  const jokerPosition = specialPositions[0]
  const thiefPosition = specialPositions[1]

  const steps: JokerStep[] = Array.from({ length: JOKER_STEP_COUNT }, (_, index) => ({
    baseDigit: randomDigit(),
    upSpot: createJokerSpot(index * 2, jokerPosition, thiefPosition),
    downSpot: createJokerSpot(index * 2 + 1, jokerPosition, thiefPosition),
    choice: null,
    revealedSpot: null,
    outcome: null,
  }))

  return {
    steps,
    currentStepIndex: 0,
    currentRung: 0,
    status: 'playing',
    finalPoints: null,
    jokerHit: false,
    thiefHit: false,
    lastMessage: `Choose UP or DOWN for step 1. Base clue value: ${basePoints} points.`,
  }
}

function applyJokerChoice(current: JokerRoundState | null, choice: JokerDirection, basePoints: number): JokerRoundState | null {
  if (!current || current.status !== 'playing') {
    return current
  }

  const stepIndex = current.currentStepIndex
  const step = current.steps[stepIndex]
  if (!step || step.choice !== null) {
    return current
  }

  const revealedSpot = choice === 'up' ? step.upSpot : step.downSpot
  const nextSteps = [...current.steps]
  let nextRung = current.currentRung

  if (revealedSpot.kind === 'joker') {
    nextSteps[stepIndex] = { ...step, choice, revealedSpot, outcome: 'joker' }
    return {
      ...current,
      steps: nextSteps,
      status: 'completed',
      currentStepIndex: stepIndex,
      currentRung: JOKER_STEP_COUNT,
      finalPoints: getLadderPointValue(basePoints, JOKER_STEP_COUNT),
      jokerHit: true,
      thiefHit: false,
      lastMessage: 'JOKER! Instant top prize. The question will now be revealed.',
    }
  }

  if (revealedSpot.kind === 'thief') {
    nextSteps[stepIndex] = { ...step, choice, revealedSpot, outcome: 'thief' }
    return {
      ...current,
      steps: nextSteps,
      status: 'completed',
      currentStepIndex: stepIndex,
      currentRung: 0,
      finalPoints: JOKER_THIEF_POINTS,
      jokerHit: false,
      thiefHit: true,
      lastMessage: `THIEF! The clue is reduced to ${JOKER_THIEF_POINTS} points if answered correctly.`,
    }
  }

  const outcome = evaluateNumberOutcome(step.baseDigit, revealedSpot.value, choice)
  if (outcome === 'climb') {
    nextRung = Math.min(JOKER_STEP_COUNT, current.currentRung + 1)
  }
  if (outcome === 'down') {
    nextRung = Math.max(0, current.currentRung - 1)
  }

  nextSteps[stepIndex] = { ...step, choice, revealedSpot, outcome }
  const isFinalStep = stepIndex === current.steps.length - 1
  if (isFinalStep) {
    const finalPoints = getLadderPointValue(basePoints, nextRung)
    return {
      ...current,
      steps: nextSteps,
      status: 'completed',
      currentStepIndex: stepIndex,
      currentRung: nextRung,
      finalPoints,
      lastMessage: `Joker complete. Final clue value: ${finalPoints} points.`,
    }
  }

  return {
    ...current,
    steps: nextSteps,
    currentStepIndex: stepIndex + 1,
    currentRung: nextRung,
    lastMessage: `${describeJokerOutcome(outcome)} Next: step ${stepIndex + 2}. Current value ${getLadderPointValue(basePoints, nextRung)}.`,
  }
}

function evaluateNumberOutcome(baseDigit: number, revealedDigit: number, choice: JokerDirection): JokerOutcome {
  if (revealedDigit === baseDigit) {
    return 'stay'
  }

  if (choice === 'up') {
    return revealedDigit > baseDigit ? 'climb' : 'down'
  }

  return revealedDigit < baseDigit ? 'climb' : 'down'
}

function describeJokerOutcome(outcome: JokerOutcome | null): string {
  switch (outcome) {
    case 'climb':
      return 'Correct - climb'
    case 'down':
      return 'Wrong - down one'
    case 'stay':
      return 'Tie - stay'
    case 'joker':
      return 'Joker'
    case 'thief':
      return 'Thief'
    default:
      return ''
  }
}

function renderJokerSpot(spot: JokerSpot): string {
  if (spot.kind === 'number') {
    return String(spot.value)
  }

  return spot.kind === 'joker' ? 'JOKER' : 'THIEF'
}

function getJokerOutcomeClass(outcome: JokerOutcome | null): string {
  switch (outcome) {
    case 'climb':
      return 'outcome-climb'
    case 'down':
      return 'outcome-down'
    case 'stay':
      return 'outcome-stay'
    case 'joker':
      return 'outcome-joker'
    case 'thief':
      return 'outcome-thief'
    default:
      return ''
  }
}

function getLadderPointValue(basePoints: number, rung: number): number {
  return basePoints + rung * JOKER_LADDER_STEP_POINTS
}

function getLadderValues(basePoints: number): number[] {
  return Array.from({ length: JOKER_STEP_COUNT + 1 }, (_, index) => getLadderPointValue(basePoints, JOKER_STEP_COUNT - index))
}

function getCurrentJokerRungForDisplay(round: JokerRoundState): number {
  if (round.jokerHit) {
    return JOKER_STEP_COUNT
  }

  return round.currentRung
}

function createJokerSpot(position: number, jokerPosition: number, thiefPosition: number): JokerSpot {
  if (position === jokerPosition) {
    return { kind: 'joker' }
  }

  if (position === thiefPosition) {
    return { kind: 'thief' }
  }

  return { kind: 'number', value: randomDigit() }
}

function randomDigit(): number {
  return Math.floor(Math.random() * 10)
}

function shuffleNumbers(values: number[]): number[] {
  const next = [...values]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const current = next[i]
    next[i] = next[j]
    next[j] = current
  }

  return next
}
