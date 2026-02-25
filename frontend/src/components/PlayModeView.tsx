import { useEffect, useMemo, useRef, useState } from 'react'
import { Clue, Game } from '../api'
import jokerHatUrl from '../assets/joker-hat.svg'
import genderRevealSongUrl from '../assets/reveal.mp3'
import MiniGameModal from './MiniGameModal'

type PlayModeViewProps = {
  game: Game
  isBusy: boolean
  currentTeamId: string
  onCurrentTeamIdChange: (teamId: string) => void
  jokerConfig: {
    enabled: boolean
    assignedClueIds: string[]
    jokerSpotCount: number
    thiefSpotCount: number
  }
  genderRevealConfig: {
    enabled: boolean
    assignedClueIds: string[]
  }
  onResolveQuestion: (params: {
    clue: Clue
    teamId: string
    isCorrect: boolean
    resolvedPointValue: number
  }) => Promise<void>
}

type JokerDirection = 'up' | 'down'
type JokerSpot = { kind: 'number'; value: number } | { kind: 'joker' } | { kind: 'thief' }
type JokerOutcome = 'climb' | 'down' | 'stay' | 'joker' | 'thief'
type GenderGuess = 'boy' | 'girl'

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

type GenderRevealRoundState = {
  status: 'guessing' | 'animating' | 'revealed'
  guessedGender: GenderGuess | null
  actualGender: GenderGuess
  isCorrect: boolean | null
  bonusStatus: 'idle' | 'awarding' | 'awarded' | 'missed' | 'error'
  bonusMessage: string
}

const JOKER_STEP_COUNT = 5
const JOKER_LADDER_STEP_POINTS = 25
const JOKER_THIEF_POINTS = 10
const JOKER_RESULT_HOLD_MS = 1500
const QUESTION_REVEAL_TRANSITION_MS = 1700
const GENDER_REVEAL_RESULT: GenderGuess = 'boy'
const GENDER_REVEAL_BONUS_POINTS = 50
const GENDER_REVEAL_AUDIO_START_SECONDS = 45
const GENDER_REVEAL_REVEAL_DELAY_MS = 10500
const GENDER_REVEAL_AUDIO_FADE_MS = 3000

export default function PlayModeView(props: PlayModeViewProps) {
  const { game, isBusy, currentTeamId, onCurrentTeamIdChange, jokerConfig, genderRevealConfig, onResolveQuestion } = props
  const [activeClue, setActiveClue] = useState<Clue | null>(null)
  const [answerInput, setAnswerInput] = useState('')
  const [feedback, setFeedback] = useState('')
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [jokerRound, setJokerRound] = useState<JokerRoundState | null>(null)
  const [genderRevealRound, setGenderRevealRound] = useState<GenderRevealRoundState | null>(null)
  const [genderRevealBonusPointsForClue, setGenderRevealBonusPointsForClue] = useState(0)
  const [isJokerResultHolding, setIsJokerResultHolding] = useState(false)
  const [isQuestionRevealTransitioning, setIsQuestionRevealTransitioning] = useState(false)
  const genderRevealAudioRef = useRef<HTMLAudioElement | null>(null)
  const genderRevealRevealTimeoutRef = useRef<number | null>(null)
  const genderRevealFadeIntervalRef = useRef<number | null>(null)
  const genderRevealSequenceIdRef = useRef(0)

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
      onCurrentTeamIdChange(turnOrderTeams[0].id)
      return
    }

    if (currentTeamId && !turnOrderTeams.some((team) => team.id === currentTeamId) && turnOrderTeams.length > 0) {
      onCurrentTeamIdChange(turnOrderTeams[0].id)
    }
  }, [currentTeamId, onCurrentTeamIdChange, turnOrderTeams])

  const activeClueId = activeClue?.id ?? null

  useEffect(() => {
    if (!activeClueId || jokerRound?.status !== 'completed') {
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
  }, [activeClueId, jokerRound?.status])

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
  const genderRevealAssignedIdSet = useMemo(() => new Set(genderRevealConfig.assignedClueIds), [genderRevealConfig.assignedClueIds])
  const jokerIsActive = jokerRound?.status === 'playing'
  const genderRevealIsActive = genderRevealRound !== null
  const confettiPieces = useMemo(
    () =>
      Array.from({ length: 22 }, (_, index) => ({
        id: index,
        left: `${Math.round((index / 21) * 100)}%`,
        delayMs: Math.round((index % 7) * 90),
        durationMs: 1300 + (index % 5) * 220,
      })),
    [],
  )
  const fireworkBursts = useMemo(
    () => [
      { id: 0, left: '14%', top: '18%', delayMs: 0, size: 68 },
      { id: 1, left: '82%', top: '22%', delayMs: 450, size: 82 },
      { id: 2, left: '28%', top: '58%', delayMs: 900, size: 74 },
      { id: 3, left: '70%', top: '62%', delayMs: 1300, size: 78 },
    ],
    [],
  )

  const clearGenderRevealTimers = () => {
    if (genderRevealRevealTimeoutRef.current !== null) {
      window.clearTimeout(genderRevealRevealTimeoutRef.current)
      genderRevealRevealTimeoutRef.current = null
    }
    if (genderRevealFadeIntervalRef.current !== null) {
      window.clearInterval(genderRevealFadeIntervalRef.current)
      genderRevealFadeIntervalRef.current = null
    }
  }

  const stopGenderRevealAudio = () => {
    clearGenderRevealTimers()
    const audio = genderRevealAudioRef.current
    if (!audio) {
      return
    }

    audio.pause()
    audio.currentTime = 0
    audio.volume = 1
  }

  const resetActiveQuestionFlow = () => {
    genderRevealSequenceIdRef.current += 1
    stopGenderRevealAudio()
    setActiveClue(null)
    setJokerRound(null)
    setGenderRevealRound(null)
    setGenderRevealBonusPointsForClue(0)
    setIsJokerResultHolding(false)
    setIsQuestionRevealTransitioning(false)
    setAnswerInput('')
    setFeedback('')
    setHasSubmitted(false)
  }

  const handleGenderGuess = (guess: GenderGuess) => {
    if (!genderRevealRound || genderRevealRound.status !== 'guessing') {
      return
    }

    const sequenceId = genderRevealSequenceIdRef.current + 1
    genderRevealSequenceIdRef.current = sequenceId

    setGenderRevealRound({
      status: 'animating',
      guessedGender: guess,
      actualGender: GENDER_REVEAL_RESULT,
      isCorrect: null,
      bonusStatus: 'idle',
      bonusMessage: '',
    })

    const audio = genderRevealAudioRef.current
    if (audio) {
      clearGenderRevealTimers()
      audio.pause()
      audio.volume = 0
      try {
        audio.currentTime = GENDER_REVEAL_AUDIO_START_SECONDS
      } catch {
        audio.currentTime = 0
      }

      void audio.play().catch(() => {
        setGenderRevealRound((current) =>
          current && current.status === 'animating'
            ? { ...current, bonusMessage: 'Audio could not autoplay. Continue with the reveal.' }
            : current,
        )
      })

      const fadeTickMs = 120
      const fadeSteps = Math.max(1, Math.floor(GENDER_REVEAL_AUDIO_FADE_MS / fadeTickMs))
      let step = 0
      genderRevealFadeIntervalRef.current = window.setInterval(() => {
        step += 1
        if (!genderRevealAudioRef.current) {
          clearGenderRevealTimers()
          return
        }
        genderRevealAudioRef.current.volume = Math.min(1, step / fadeSteps)
        if (step >= fadeSteps && genderRevealFadeIntervalRef.current !== null) {
          window.clearInterval(genderRevealFadeIntervalRef.current)
          genderRevealFadeIntervalRef.current = null
        }
      }, fadeTickMs)
    }

    genderRevealRevealTimeoutRef.current = window.setTimeout(() => {
      const isCorrect = guess === GENDER_REVEAL_RESULT
      setGenderRevealRound((current) => {
        if (!current || current.guessedGender !== guess) {
          return current
        }

        return {
          ...current,
          status: 'revealed',
          isCorrect,
          bonusStatus: isCorrect ? 'awarded' : 'missed',
          bonusMessage: isCorrect
            ? `Correct guess! +${GENDER_REVEAL_BONUS_POINTS} points added to this clue's value.`
            : 'No points lost for a wrong guess.',
        }
      })

      if (!isCorrect) {
        return
      }

      if (genderRevealSequenceIdRef.current !== sequenceId) {
        return
      }

      setGenderRevealBonusPointsForClue(GENDER_REVEAL_BONUS_POINTS)
    }, GENDER_REVEAL_REVEAL_DELAY_MS)
  }

  useEffect(() => {
    const audio = new Audio(genderRevealSongUrl)
    audio.preload = 'auto'
    genderRevealAudioRef.current = audio

    return () => {
      genderRevealSequenceIdRef.current += 1
      if (genderRevealRevealTimeoutRef.current !== null) {
        window.clearTimeout(genderRevealRevealTimeoutRef.current)
        genderRevealRevealTimeoutRef.current = null
      }
      if (genderRevealFadeIntervalRef.current !== null) {
        window.clearInterval(genderRevealFadeIntervalRef.current)
        genderRevealFadeIntervalRef.current = null
      }
      audio.pause()
      genderRevealAudioRef.current = null
    }
  }, [])

  const resolvedPointValue = useMemo(() => {
    if (!activeClue) {
      return 0
    }

    const baseValue = !jokerRound || jokerRound.finalPoints === null ? activeClue.pointValue : jokerRound.finalPoints
    return baseValue + genderRevealBonusPointsForClue
  }, [activeClue, genderRevealBonusPointsForClue, jokerRound])

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

                    const shouldTriggerGenderReveal = genderRevealConfig.enabled && genderRevealAssignedIdSet.has(clue.id)
                    const shouldTriggerJoker = jokerConfig.enabled && jokerAssignedIdSet.has(clue.id)
                    setActiveClue(clue)
                    setJokerRound(
                      shouldTriggerJoker && !shouldTriggerGenderReveal
                        ? createJokerRound(clue.pointValue, {
                            jokerSpotCount: jokerConfig.jokerSpotCount,
                            thiefSpotCount: jokerConfig.thiefSpotCount,
                          })
                        : null,
                    )
                    setGenderRevealRound(shouldTriggerGenderReveal ? createGenderRevealRound() : null)
                    setGenderRevealBonusPointsForClue(0)
                    stopGenderRevealAudio()
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

      {activeClue && genderRevealRound && (
        <MiniGameModal
          title="Gender Reveal"
          subtitle={`Team ${currentTeam?.name ?? ''}: make your guess before the reveal drops`}
          closeLabel={genderRevealRound.status === 'revealed' ? 'Close' : 'Cancel'}
          onClose={() => {
            resetActiveQuestionFlow()
          }}
        >
          <div
            className={`gender-reveal-stage ${genderRevealRound.status} ${genderRevealRound.status === 'revealed' ? `result-${genderRevealRound.actualGender}` : ''}`}
          >
            <div className="gender-reveal-halves" aria-label="Pick boy or girl">
              <button
                type="button"
                className={`gender-half girl ${genderRevealRound.guessedGender === 'girl' ? 'selected' : ''}`}
                disabled={genderRevealRound.status !== 'guessing' || isBusy}
                onClick={() => handleGenderGuess('girl')}
              >
                <span className="gender-half-label">Girl</span>
                <span className="gender-half-subtitle">Pink side</span>
              </button>

              <button
                type="button"
                className={`gender-half boy ${genderRevealRound.guessedGender === 'boy' ? 'selected' : ''}`}
                disabled={genderRevealRound.status !== 'guessing' || isBusy}
                onClick={() => handleGenderGuess('boy')}
              >
                <span className="gender-half-label">Boy</span>
                <span className="gender-half-subtitle">Blue side</span>
              </button>

              <div
                className={`gender-reveal-pointer ${genderRevealRound.status} ${
                  genderRevealRound.status === 'guessing' && genderRevealRound.guessedGender ? `guess-${genderRevealRound.guessedGender}` : ''
                } ${genderRevealRound.status === 'revealed' ? `result-${genderRevealRound.actualGender}` : ''}`}
                aria-hidden="true"
              >
                <div className="gender-reveal-pointer-ring" />
                <div className="gender-reveal-pointer-core">?</div>
              </div>
            </div>

            {genderRevealRound.status === 'revealed' && (
              <div className="gender-reveal-result-wrap">
                <p className={`gender-reveal-banner ${genderRevealRound.isCorrect ? 'correct' : 'miss'}`}>It&apos;s a boy!</p>
                  <p className="gender-reveal-bonus-note">{genderRevealRound.bonusMessage}</p>
                <button
                  type="button"
                  className="btn-success"
                  onClick={() => {
                    stopGenderRevealAudio()
                    setGenderRevealRound(null)
                  }}
                >
                  Continue
                </button>
              </div>
            )}

            {genderRevealRound.status === 'revealed' && genderRevealRound.actualGender === 'boy' && (
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

      {activeClue && jokerRound && (jokerIsActive || isJokerResultHolding) && (
        <MiniGameModal
          title="Joker Mini-Game"
          subtitle={`Team ${currentTeam?.name ?? ''}: complete Joker before the clue is revealed`}
          headerVisual={<img className="joker-hat-logo" src={jokerHatUrl} alt="Joker hat" />}
          closeLabel="Cancel"
          onClose={() => {
            resetActiveQuestionFlow()
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

      {activeClue && !genderRevealIsActive && !jokerIsActive && !isQuestionRevealTransitioning && (
        <div className="modal-backdrop">
          <div
            className={`modal-card ${jokerRound?.status === 'completed' ? 'question-reveal-modal' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="play-modal-title"
          >
            <h3 id="play-modal-title">
              Question for {resolvedPointValue} points
              {genderRevealBonusPointsForClue > 0 ? ` (includes +${genderRevealBonusPointsForClue} reveal bonus)` : ''}
            </h3>
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
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />
            </div>

            <div className="row play-answer-actions">
              <button
                className="btn-success"
                disabled={isBusy || !currentTeamId || !answerInput.trim() || hasSubmitted}
                onClick={async () => {
                  const isCorrect = normalize(answerInput) === normalize(activeClue.answer)
                  setFeedback(
                    isCorrect
                      ? genderRevealBonusPointsForClue > 0
                        ? `Correct answer! ${resolvedPointValue} total points (includes +${genderRevealBonusPointsForClue} reveal bonus).`
                        : 'Correct answer!'
                      : `Wrong. Correct answer: ${activeClue.answer}`,
                  )
                  setHasSubmitted(true)
                  await onResolveQuestion({
                    clue: activeClue,
                    teamId: currentTeamId,
                    isCorrect,
                    resolvedPointValue,
                  })

                  const currentIndex = turnOrderTeams.findIndex((team) => team.id === currentTeamId)
                  if (currentIndex >= 0 && turnOrderTeams.length > 0) {
                    const nextIndex = (currentIndex + 1) % turnOrderTeams.length
                    onCurrentTeamIdChange(turnOrderTeams[nextIndex].id)
                  }
                }}
              >
                Submit Answer
              </button>
              <button
                className="btn-secondary"
                type="button"
                disabled={!hasSubmitted || isBusy}
                onClick={() => {
                  resetActiveQuestionFlow()
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

function createJokerRound(basePoints: number, options?: { jokerSpotCount?: number; thiefSpotCount?: number }): JokerRoundState {
  const totalSpots = JOKER_STEP_COUNT * 2
  const jokerSpotCount = Math.max(0, Math.min(totalSpots, Math.floor(options?.jokerSpotCount ?? 1)))
  const thiefSpotCountRequested = Math.max(0, Math.floor(options?.thiefSpotCount ?? 1))
  const thiefSpotCount = Math.min(totalSpots - jokerSpotCount, thiefSpotCountRequested)
  const shuffledPositions = shuffleNumbers(Array.from({ length: totalSpots }, (_, i) => i))
  const jokerPositionSet = new Set(shuffledPositions.slice(0, jokerSpotCount))
  const thiefPositionSet = new Set(shuffledPositions.slice(jokerSpotCount, jokerSpotCount + thiefSpotCount))

  const steps: JokerStep[] = Array.from({ length: JOKER_STEP_COUNT }, (_, index) => ({
    baseDigit: randomDigit(),
    upSpot: createJokerSpot(index * 2, jokerPositionSet, thiefPositionSet),
    downSpot: createJokerSpot(index * 2 + 1, jokerPositionSet, thiefPositionSet),
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

function createGenderRevealRound(): GenderRevealRoundState {
  return {
    status: 'guessing',
    guessedGender: null,
    actualGender: GENDER_REVEAL_RESULT,
    isCorrect: null,
    bonusStatus: 'idle',
    bonusMessage: '',
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

function createJokerSpot(position: number, jokerPositions: Set<number>, thiefPositions: Set<number>): JokerSpot {
  if (jokerPositions.has(position)) {
    return { kind: 'joker' }
  }

  if (thiefPositions.has(position)) {
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
