import { useMemo, useState } from 'react'
import './App.css'

type Clue = {
  id: string
  prompt: string
  answer: string
  pointValue: number
  rowOrder: number
  isRevealed: boolean
  isAnswered: boolean
}

type Category = {
  id: string
  name: string
  displayOrder: number
  clues: Clue[]
}

type Team = {
  id: string
  name: string
  displayOrder: number
  score: number
}

type Game = {
  id: string
  title: string
  status: 'Draft' | 'InProgress' | 'Finished'
  createdAtUtc: string
  updatedAtUtc: string
  categories: Category[]
  teams: Team[]
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5079'

function App() {
  const [gameTitle, setGameTitle] = useState('Friday Trivia Night')
  const [gameIdInput, setGameIdInput] = useState('')
  const [loadedGame, setLoadedGame] = useState<Game | null>(null)
  const [teamName, setTeamName] = useState('Team A')
  const [teamOrder, setTeamOrder] = useState(1)
  const [categoryName, setCategoryName] = useState('Science')
  const [categoryOrder, setCategoryOrder] = useState(1)
  const [cluePrompt, setCluePrompt] = useState('This planet is known as the Red Planet.')
  const [clueAnswer, setClueAnswer] = useState('Mars')
  const [cluePoints, setCluePoints] = useState(100)
  const [clueRowOrder, setClueRowOrder] = useState(1)
  const [scoreTeamId, setScoreTeamId] = useState('')
  const [scoreDelta, setScoreDelta] = useState(100)
  const [scoreReason, setScoreReason] = useState('Correct answer')
  const [isBusy, setIsBusy] = useState(false)
  const [message, setMessage] = useState('')

  const canOperateOnGame = Boolean(loadedGame?.id)
  const scoreTeams = useMemo(() => loadedGame?.teams ?? [], [loadedGame])

  const loadGame = async (gameId: string) => {
    const response = await fetch(`${API_BASE_URL}/api/games/${gameId}`)
    if (!response.ok) {
      throw new Error(`Failed to load game (${response.status})`)
    }
    const game = (await response.json()) as Game
    setLoadedGame(game)
    setGameIdInput(game.id)
    if (game.teams.length > 0) {
      setScoreTeamId(game.teams[0].id)
    }
  }

  const withBusy = async (action: () => Promise<void>) => {
    try {
      setIsBusy(true)
      setMessage('')
      await action()
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Request failed'
      setMessage(text)
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <main className="page">
      <h1>Jeopareddy Host Console</h1>
      <p className="muted">API: {API_BASE_URL}</p>
      {message && <p className="message">{message}</p>}

      <section className="card">
        <h2>Create Game</h2>
        <div className="row">
          <input
            value={gameTitle}
            onChange={(event) => setGameTitle(event.target.value)}
            placeholder="Game title"
          />
          <button
            disabled={isBusy}
            onClick={() =>
              withBusy(async () => {
                const response = await fetch(`${API_BASE_URL}/api/games`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ title: gameTitle }),
                })
                if (!response.ok) {
                  throw new Error(`Failed to create game (${response.status})`)
                }
                const game = (await response.json()) as Game
                setLoadedGame(game)
                setGameIdInput(game.id)
                setMessage(`Created game: ${game.id}`)
              })
            }
          >
            Create
          </button>
        </div>
      </section>

      <section className="card">
        <h2>Load Game</h2>
        <div className="row">
          <input
            value={gameIdInput}
            onChange={(event) => setGameIdInput(event.target.value)}
            placeholder="Game ID"
          />
          <button
            disabled={isBusy || !gameIdInput}
            onClick={() =>
              withBusy(async () => {
                await loadGame(gameIdInput)
                setMessage(`Loaded game: ${gameIdInput}`)
              })
            }
          >
            Load
          </button>
        </div>
      </section>

      {loadedGame && (
        <>
          <section className="card">
            <h2>Current Game</h2>
            <p>
              <strong>{loadedGame.title}</strong> ({loadedGame.id})
            </p>
            <p>Status: {loadedGame.status}</p>
            <button
              disabled={isBusy || loadedGame.status !== 'Draft'}
              onClick={() =>
                withBusy(async () => {
                  const response = await fetch(`${API_BASE_URL}/api/games/${loadedGame.id}/start`, {
                    method: 'POST',
                  })
                  if (!response.ok) {
                    throw new Error(`Failed to start game (${response.status})`)
                  }
                  await loadGame(loadedGame.id)
                  setMessage('Game moved to InProgress')
                })
              }
            >
              Start Game
            </button>
          </section>

          <section className="card">
            <h2>Add Team</h2>
            <div className="grid">
              <input value={teamName} onChange={(event) => setTeamName(event.target.value)} placeholder="Team name" />
              <input
                value={teamOrder}
                type="number"
                min={1}
                onChange={(event) => setTeamOrder(Number(event.target.value))}
                placeholder="Display order"
              />
              <button
                disabled={isBusy || !canOperateOnGame}
                onClick={() =>
                  withBusy(async () => {
                    const response = await fetch(`${API_BASE_URL}/api/games/${loadedGame.id}/teams`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ name: teamName, displayOrder: teamOrder }),
                    })
                    if (!response.ok) {
                      throw new Error(`Failed to add team (${response.status})`)
                    }
                    await loadGame(loadedGame.id)
                    setMessage(`Team "${teamName}" added`)
                  })
                }
              >
                Add Team
              </button>
            </div>
          </section>

          <section className="card">
            <h2>Add Category + 1 Clue</h2>
            <div className="grid">
              <input
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
                placeholder="Category name"
              />
              <input
                value={categoryOrder}
                type="number"
                min={1}
                onChange={(event) => setCategoryOrder(Number(event.target.value))}
                placeholder="Category order"
              />
              <input value={cluePrompt} onChange={(event) => setCluePrompt(event.target.value)} placeholder="Clue prompt" />
              <input value={clueAnswer} onChange={(event) => setClueAnswer(event.target.value)} placeholder="Clue answer" />
              <input
                value={cluePoints}
                type="number"
                min={100}
                step={100}
                onChange={(event) => setCluePoints(Number(event.target.value))}
                placeholder="Points"
              />
              <input
                value={clueRowOrder}
                type="number"
                min={1}
                onChange={(event) => setClueRowOrder(Number(event.target.value))}
                placeholder="Row order"
              />
              <button
                disabled={isBusy || !canOperateOnGame}
                onClick={() =>
                  withBusy(async () => {
                    const payload = {
                      name: categoryName,
                      displayOrder: categoryOrder,
                      clues: [
                        {
                          prompt: cluePrompt,
                          answer: clueAnswer,
                          pointValue: cluePoints,
                          rowOrder: clueRowOrder,
                        },
                      ],
                    }

                    const response = await fetch(`${API_BASE_URL}/api/games/${loadedGame.id}/categories`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload),
                    })
                    if (!response.ok) {
                      throw new Error(`Failed to add category (${response.status})`)
                    }
                    await loadGame(loadedGame.id)
                    setMessage(`Category "${categoryName}" added`)
                  })
                }
              >
                Add Category
              </button>
            </div>
          </section>

          <section className="card">
            <h2>Manual Score Event</h2>
            <div className="grid">
              <select value={scoreTeamId} onChange={(event) => setScoreTeamId(event.target.value)}>
                <option value="">Select team</option>
                {scoreTeams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              <input
                value={scoreDelta}
                type="number"
                onChange={(event) => setScoreDelta(Number(event.target.value))}
                placeholder="Delta points"
              />
              <input
                value={scoreReason}
                onChange={(event) => setScoreReason(event.target.value)}
                placeholder="Reason"
              />
              <button
                disabled={isBusy || !canOperateOnGame || !scoreTeamId}
                onClick={() =>
                  withBusy(async () => {
                    const response = await fetch(`${API_BASE_URL}/api/games/${loadedGame.id}/score-events`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        teamId: scoreTeamId,
                        clueId: null,
                        deltaPoints: scoreDelta,
                        reason: scoreReason,
                      }),
                    })
                    if (!response.ok) {
                      throw new Error(`Failed to add score event (${response.status})`)
                    }
                    await loadGame(loadedGame.id)
                    setMessage('Score updated')
                  })
                }
              >
                Apply Score
              </button>
            </div>
          </section>

          <section className="card">
            <h2>Teams</h2>
            {loadedGame.teams.length === 0 ? (
              <p className="muted">No teams yet</p>
            ) : (
              <ul className="list">
                {loadedGame.teams.map((team) => (
                  <li key={team.id}>
                    <strong>{team.name}</strong> - {team.score} pts
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card">
            <h2>Board</h2>
            {loadedGame.categories.length === 0 ? (
              <p className="muted">No categories yet</p>
            ) : (
              loadedGame.categories.map((category) => (
                <div key={category.id} className="category">
                  <h3>
                    {category.displayOrder}. {category.name}
                  </h3>
                  <ul className="list">
                    {category.clues.map((clue) => (
                      <li key={clue.id}>
                        <div>
                          <strong>{clue.pointValue}</strong> - {clue.prompt}
                        </div>
                        <div className="row">
                          <span>
                            Revealed: {String(clue.isRevealed)} | Answered: {String(clue.isAnswered)}
                          </span>
                          <button
                            disabled={isBusy}
                            onClick={() =>
                              withBusy(async () => {
                                const response = await fetch(
                                  `${API_BASE_URL}/api/games/${loadedGame.id}/clues/${clue.id}`,
                                  {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ isRevealed: !clue.isRevealed }),
                                  },
                                )
                                if (!response.ok) {
                                  throw new Error(`Failed to update clue (${response.status})`)
                                }
                                await loadGame(loadedGame.id)
                              })
                            }
                          >
                            Toggle Reveal
                          </button>
                          <button
                            disabled={isBusy}
                            onClick={() =>
                              withBusy(async () => {
                                const response = await fetch(
                                  `${API_BASE_URL}/api/games/${loadedGame.id}/clues/${clue.id}`,
                                  {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ isAnswered: !clue.isAnswered }),
                                  },
                                )
                                if (!response.ok) {
                                  throw new Error(`Failed to update clue (${response.status})`)
                                }
                                await loadGame(loadedGame.id)
                              })
                            }
                          >
                            Toggle Answered
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </section>
        </>
      )}
    </main>
  )
}

export default App
