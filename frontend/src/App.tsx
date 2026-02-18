import { useEffect, useMemo, useState } from 'react'
import { API_BASE_URL, addCategory, addTeam, createGame, createScoreEvent, Game, GameListItem, getGame, listGames, resetGame, startGame, updateClue } from './api'
import AddCategoryCard from './components/AddCategoryCard'
import AddTeamCard from './components/AddTeamCard'
import BoardCard from './components/BoardCard'
import CreateGameCard from './components/CreateGameCard'
import CurrentGameCard from './components/CurrentGameCard'
import LoadGameCard from './components/LoadGameCard'
import PlayModeView from './components/PlayModeView'
import ScoreEventCard from './components/ScoreEventCard'
import TeamsCard from './components/TeamsCard'
import './App.css'

function App() {
  const [gameTitle, setGameTitle] = useState('Friday Trivia Night')
  const [gameIdInput, setGameIdInput] = useState('')
  const [games, setGames] = useState<GameListItem[]>([])
  const [loadedGame, setLoadedGame] = useState<Game | null>(null)
  const [teamName, setTeamName] = useState('Team A')
  const [categoryName, setCategoryName] = useState('Science')
  const [categoryOrder, setCategoryOrder] = useState(1)
  const [scoreTeamId, setScoreTeamId] = useState('')
  const [scoreDelta, setScoreDelta] = useState(100)
  const [scoreReason, setScoreReason] = useState('Correct answer')
  const [isBusy, setIsBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [messageTone, setMessageTone] = useState<'success' | 'error' | ''>('')
  const [activeSection, setActiveSection] = useState<'dashboard' | 'host' | 'play'>('dashboard')

  const canOperateOnGame = Boolean(loadedGame?.id)
  const scoreTeams = useMemo(() => loadedGame?.teams ?? [], [loadedGame])

  const loadGame = async (gameId: string) => {
    const game = await getGame(gameId)
    setLoadedGame(game)
    setGameIdInput(game.id)
    if (game.teams.length > 0) {
      setScoreTeamId(game.teams[0].id)
    }
  }

  const refreshGames = async () => {
    const allGames = await listGames()
    setGames(allGames)
  }

  const withBusy = async (action: () => Promise<void>) => {
    try {
      setIsBusy(true)
      setMessage('')
      setMessageTone('')
      await action()
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Request failed'
      setMessage(text)
      setMessageTone('error')
    } finally {
      setIsBusy(false)
    }
  }

  useEffect(() => {
    refreshGames().catch(() => {
      setMessage('Could not load games list')
      setMessageTone('error')
    })
  }, [])

  return (
    <main className="page">
      <header className="app-header">
        <div>
          <h1>Jeopareddy</h1>
          <p className="muted">Build, host, and play your game in one flow.</p>
        </div>
        <div className="session-chip-wrap">
          <div className="session-chip">
            {loadedGame ? (
              <>
                <strong>{loadedGame.title}</strong>
                <span className="tiny muted">
                  {loadedGame.status} • {loadedGame.id}
                </span>
              </>
            ) : (
              <span className="tiny muted">No game loaded</span>
            )}
          </div>
          <div className="tiny muted">API: {API_BASE_URL}</div>
        </div>
      </header>

      <nav className="tab-bar" aria-label="Primary navigation">
        <button className={activeSection === 'dashboard' ? 'tab-btn active' : 'tab-btn'} onClick={() => setActiveSection('dashboard')}>
          Dashboard
        </button>
        <button
          className={activeSection === 'host' ? 'tab-btn active' : 'tab-btn'}
          disabled={!loadedGame}
          onClick={() => setActiveSection('host')}
        >
          Host Control
        </button>
        <button
          className={activeSection === 'play' ? 'tab-btn active' : 'tab-btn'}
          disabled={!loadedGame}
          onClick={() => setActiveSection('play')}
        >
          Play
        </button>
      </nav>
      {message && <p className={`message ${messageTone}`}>{message}</p>}

      {activeSection === 'dashboard' && (
        <>
          <CreateGameCard
            gameTitle={gameTitle}
            isBusy={isBusy}
            onGameTitleChange={setGameTitle}
            onCreate={() =>
              withBusy(async () => {
                const game = await createGame(gameTitle)
                setLoadedGame(game)
                setGameIdInput(game.id)
                setMessage(`Created game: ${game.id}`)
                setMessageTone('success')
                setActiveSection('host')
                await refreshGames()
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
                await loadGame(gameIdInput)
                setMessage(`Loaded game: ${gameIdInput}`)
                setMessageTone('success')
                setActiveSection('host')
              })
            }
            onRefresh={() =>
              withBusy(async () => {
                await refreshGames()
                setMessage('Games list refreshed')
                setMessageTone('success')
              })
            }
            onLoadFromList={(gameId) =>
              withBusy(async () => {
                await loadGame(gameId)
                setMessage(`Loaded game: ${gameId}`)
                setMessageTone('success')
                setActiveSection('host')
              })
            }
          />
        </>
      )}

      {!loadedGame && activeSection !== 'dashboard' && (
        <section className="card">
          <h2>No Active Game</h2>
          <p className="muted">Create or load a game on Dashboard first.</p>
          <button onClick={() => setActiveSection('dashboard')}>Go To Dashboard</button>
        </section>
      )}

      {loadedGame && activeSection === 'host' && (
        <div className="layout">
          <div>
            <CurrentGameCard
              game={loadedGame}
              isBusy={isBusy}
              onStart={() =>
                withBusy(async () => {
                  await startGame(loadedGame.id)
                  await loadGame(loadedGame.id)
                  setMessage('Game moved to InProgress')
                  setMessageTone('success')
                })
              }
              onReset={() =>
                withBusy(async () => {
                  await resetGame(loadedGame.id)
                  await loadGame(loadedGame.id)
                  setMessage('Game reset to Draft with cleared scores and clues')
                  setMessageTone('success')
                })
              }
            />

            <AddTeamCard
              teamName={teamName}
              isBusy={isBusy}
              canOperateOnGame={canOperateOnGame}
              onTeamNameChange={setTeamName}
              onAddTeam={() =>
                withBusy(async () => {
                  await addTeam(loadedGame.id, teamName)
                  await loadGame(loadedGame.id)
                  setMessage(`Team "${teamName}" added`)
                  setMessageTone('success')
                })
              }
            />

            <AddCategoryCard
              categoryName={categoryName}
              categoryOrder={categoryOrder}
              isBusy={isBusy}
              canOperateOnGame={canOperateOnGame}
              onCategoryNameChange={setCategoryName}
              onCategoryOrderChange={setCategoryOrder}
              onAddCategory={(payload) =>
                withBusy(async () => {
                  await addCategory(loadedGame.id, payload)
                  await loadGame(loadedGame.id)
                  setMessage(`Category "${payload.name}" added with ${payload.clues.length} question(s)`)
                  setMessageTone('success')
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
                  await createScoreEvent(loadedGame.id, {
                    teamId: scoreTeamId,
                    clueId: null,
                    deltaPoints: scoreDelta,
                    reason: scoreReason,
                  })
                  await loadGame(loadedGame.id)
                  setMessage('Score updated')
                  setMessageTone('success')
                })
              }
            />
          </div>

          <div>
            <TeamsCard teams={loadedGame.teams} />

            <BoardCard
              categories={loadedGame.categories}
              isBusy={isBusy}
              onToggleReveal={(clueId, currentValue) =>
                withBusy(async () => {
                  await updateClue(loadedGame.id, clueId, { isRevealed: !currentValue })
                  await loadGame(loadedGame.id)
                  setMessage('Clue reveal state updated')
                  setMessageTone('success')
                })
              }
              onToggleAnswered={(clueId, currentValue) =>
                withBusy(async () => {
                  await updateClue(loadedGame.id, clueId, { isAnswered: !currentValue })
                  await loadGame(loadedGame.id)
                  setMessage('Clue answer state updated')
                  setMessageTone('success')
                })
              }
            />
          </div>
        </div>
      )}

      {loadedGame && activeSection === 'play' && (
        <PlayModeView
          game={loadedGame}
          isBusy={isBusy}
          onResolveQuestion={({ clue, teamId, isCorrect }) =>
            withBusy(async () => {
              await createScoreEvent(loadedGame.id, {
                teamId,
                clueId: clue.id,
                deltaPoints: isCorrect ? clue.pointValue : -clue.pointValue,
                reason: isCorrect ? 'Correct answer' : 'Incorrect answer',
              })
              await updateClue(loadedGame.id, clue.id, { isRevealed: true, isAnswered: true })
              await loadGame(loadedGame.id)
              setMessage(isCorrect ? 'Point awarded.' : 'Points deducted.')
              setMessageTone(isCorrect ? 'success' : 'error')
            })
          }
        />
      )}
    </main>
  )
}

export default App
