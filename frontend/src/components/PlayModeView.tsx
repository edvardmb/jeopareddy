import { useEffect, useMemo, useState } from 'react'
import { Clue, Game } from '../api'

type PlayModeViewProps = {
  game: Game
  isBusy: boolean
  onResolveQuestion: (params: { clue: Clue; teamId: string; isCorrect: boolean }) => Promise<void>
}

export default function PlayModeView(props: PlayModeViewProps) {
  const { game, isBusy, onResolveQuestion } = props
  const [activeClue, setActiveClue] = useState<Clue | null>(null)
  const [currentTeamId, setCurrentTeamId] = useState('')
  const [answerInput, setAnswerInput] = useState('')
  const [feedback, setFeedback] = useState('')
  const [hasSubmitted, setHasSubmitted] = useState(false)

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

  if (game.categories.length === 0) {
    return (
      <section className="card">
        <h2>Play Mode</h2>
        <p className="muted">Add categories and questions first.</p>
      </section>
    )
  }

  return (
    <section className="card">
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
                    setActiveClue(clue)
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

      {activeClue && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>Question for {activeClue.pointValue} points</h3>
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
                disabled={isBusy || !currentTeamId || !answerInput.trim() || hasSubmitted}
                onClick={async () => {
                  const isCorrect = normalize(answerInput) === normalize(activeClue.answer)
                  setFeedback(isCorrect ? 'Correct answer!' : `Wrong. Correct answer: ${activeClue.answer}`)
                  setHasSubmitted(true)
                  await onResolveQuestion({ clue: activeClue, teamId: currentTeamId, isCorrect })

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
                type="button"
                onClick={() => {
                  setActiveClue(null)
                  setAnswerInput('')
                  setFeedback('')
                  setHasSubmitted(false)
                }}
              >
                Close
              </button>
            </div>

            {feedback && <p className={`message ${feedback.startsWith('Correct') ? 'success' : 'error'}`}>{feedback}</p>}
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
                <span>{team.score} pts{team.id === currentTeamId ? ' (turn)' : ''}</span>
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
