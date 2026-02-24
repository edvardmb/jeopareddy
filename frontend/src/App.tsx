import { useEffect, useMemo, useState } from 'react'
import {
  API_BASE_URL,
  addCategory,
  addTeam,
  createGame,
  createScoreEvent,
  deleteCategory,
  deleteClue,
  Game,
  GameListItem,
  getGame,
  listGames,
  resetGame,
  startGame,
  updateCategory,
  updateClue,
  updateClueContent,
} from './api'
import AddCategoryCard, { createQuestionDraftFromStoredClue, type QuestionDraft } from './components/AddCategoryCard'
import AddTeamCard from './components/AddTeamCard'
import BoardCard from './components/BoardCard'
import CreateGameCard from './components/CreateGameCard'
import CurrentGameCard from './components/CurrentGameCard'
import DesignPreview from './components/DesignPreview'
import DesignPreviewNeon from './components/DesignPreviewNeon'
import LoadGameCard from './components/LoadGameCard'
import PlayModeView from './components/PlayModeView'
import ScoreEventCard from './components/ScoreEventCard'
import TeamsCard from './components/TeamsCard'
import InfoHint from './components/InfoHint'
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
  const [activeSection, setActiveSection] = useState<'dashboard' | 'host' | 'play' | 'preview' | 'preview-neon'>('dashboard')
  const [jokerEnabled, setJokerEnabled] = useState(false)
  const [jokerAppearancesPerGame, setJokerAppearancesPerGame] = useState(1)
  const [jokerAssignedClueIds, setJokerAssignedClueIds] = useState<string[]>([])
  const [editingQuestion, setEditingQuestion] = useState<{ clueId: string; question: QuestionDraft } | null>(null)

  const canOperateOnGame = Boolean(loadedGame?.id)
  const isSetupLocked = loadedGame?.status === 'InProgress'
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

  useEffect(() => {
    setJokerAssignedClueIds([])
  }, [loadedGame?.id])

  useEffect(() => {
    setEditingQuestion(null)
  }, [loadedGame?.id])

  useEffect(() => {
    if (!loadedGame)
    {
      if (jokerAssignedClueIds.length > 0) {
        setJokerAssignedClueIds([])
      }
      return
    }

    if (!jokerEnabled) {
      if (jokerAssignedClueIds.length > 0) {
        setJokerAssignedClueIds([])
      }
      return
    }

    const allClues = loadedGame.categories.flatMap((category) => category.clues)
    const targetCount = Math.max(0, Math.min(Math.floor(jokerAppearancesPerGame || 0), allClues.length))
    if (targetCount === 0) {
      if (jokerAssignedClueIds.length > 0) {
        setJokerAssignedClueIds([])
      }
      return
    }

    const allClueIdSet = new Set(allClues.map((clue) => clue.id))
    const answeredClueIdSet = new Set(allClues.filter((clue) => clue.isAnswered).map((clue) => clue.id))
    const existingValid = jokerAssignedClueIds.filter((id) => allClueIdSet.has(id))
    const completedAssignments = existingValid.filter((id) => answeredClueIdSet.has(id))
    const pendingAssignments = existingValid.filter((id) => !answeredClueIdSet.has(id))

    const nextAssignments: string[] = []
    nextAssignments.push(...completedAssignments.slice(0, targetCount))

    if (nextAssignments.length < targetCount) {
      nextAssignments.push(...pendingAssignments.slice(0, targetCount - nextAssignments.length))
    }

    const chosenSet = new Set(nextAssignments)
    if (nextAssignments.length < targetCount) {
      const availableUnanswered = allClues
        .filter((clue) => !clue.isAnswered && !chosenSet.has(clue.id))
        .map((clue) => clue.id)

      nextAssignments.push(...shuffle(availableUnanswered).slice(0, targetCount - nextAssignments.length))
    }

    if (!sameStringSet(jokerAssignedClueIds, nextAssignments)) {
      setJokerAssignedClueIds(nextAssignments)
    }
  }, [jokerAssignedClueIds, jokerAppearancesPerGame, jokerEnabled, loadedGame])

  const jokerStats = useMemo(() => {
    if (!loadedGame) {
      return { totalAssigned: 0, completed: 0, remaining: 0 }
    }

    const answeredClueIds = new Set(
      loadedGame.categories.flatMap((category) => category.clues.filter((clue) => clue.isAnswered).map((clue) => clue.id)),
    )
    const completed = jokerAssignedClueIds.filter((id) => answeredClueIds.has(id)).length
    const totalAssigned = jokerAssignedClueIds.length
    return {
      totalAssigned,
      completed,
      remaining: Math.max(0, totalAssigned - completed),
    }
  }, [jokerAssignedClueIds, loadedGame])

  return (
    <main className="page">
      <header className="app-header">
        <div className="brand-mark">
          <img className="brand-logo" src="/jeoparEddy.png" alt="JeoparEddy" />
        </div>
        <div className="session-chip-wrap">
          <div className="session-chip">
            {loadedGame ? (
              <>
                <strong>{loadedGame.title}</strong>
                <span className="tiny muted">
                  {loadedGame.status}
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
        <button className={activeSection === 'preview' ? 'tab-btn active' : 'tab-btn'} onClick={() => setActiveSection('preview')}>
          Design Preview
        </button>
        <button
          className={activeSection === 'preview-neon' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setActiveSection('preview-neon')}
        >
          Neon Preview
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

      {activeSection === 'preview' && <DesignPreview />}
      {activeSection === 'preview-neon' && <DesignPreviewNeon />}

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
                  setJokerAssignedClueIds([])
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
              isLocked={isSetupLocked}
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
              isLocked={isSetupLocked}
              onCategoryNameChange={setCategoryName}
              onCategoryOrderChange={setCategoryOrder}
              editingQuestion={editingQuestion}
              onCancelEditQuestion={() => setEditingQuestion(null)}
              onSaveEditedQuestion={(clueId, payload) =>
                withBusy(async () => {
                  await updateClueContent(loadedGame.id, clueId, payload)
                  await loadGame(loadedGame.id)
                  setEditingQuestion(null)
                  setMessage('Question updated')
                  setMessageTone('success')
                })
              }
              onAddCategory={(payload) =>
                withBusy(async () => {
                  await addCategory(loadedGame.id, payload)
                  await loadGame(loadedGame.id)
                  setMessage(`Category "${payload.name}" added with ${payload.clues.length} question(s)`)
                  setMessageTone('success')
                })
              }
            />

            <section className={`card card-sky ${isSetupLocked ? 'card-disabled' : ''}`}>
              <h2>Joker Mini-Game</h2>
              <p className="muted">Randomly replace some clue reveals with the Joker ladder mini-game.</p>
              <div className="grid">
                <div className="field">
                  <label>Include Joker In Game</label>
                  <button
                    type="button"
                    className={jokerEnabled ? 'btn-success' : 'btn-secondary'}
                    disabled={isBusy || !loadedGame || isSetupLocked}
                    onClick={() => setJokerEnabled((value) => !value)}
                  >
                    {jokerEnabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
                <div className="field">
                  <div className="field-label-row">
                    <label htmlFor="joker-appearances">Appearances Per Game</label>
                    <InfoHint text="How many clues will trigger Joker before the question appears." label="Joker appearances help" />
                  </div>
                  <input
                    id="joker-appearances"
                    type="number"
                    min={0}
                    max={25}
                    disabled={isBusy || !loadedGame || isSetupLocked}
                    value={jokerAppearancesPerGame}
                    onChange={(event) => setJokerAppearancesPerGame(Math.max(0, Number(event.target.value) || 0))}
                  />
                </div>
              </div>
              <p className="tiny muted">
                Assigned this game: {jokerStats.totalAssigned} • Triggered: {jokerStats.completed} • Remaining: {jokerStats.remaining}
              </p>
              <p className="tiny muted">These settings are local to the current host session (not saved in the backend yet).</p>
            </section>
          </div>

          <div>
            <TeamsCard teams={loadedGame.teams} />
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
            <BoardCard
              categories={loadedGame.categories}
              isDraft={loadedGame.status === 'Draft'}
              isBusy={isBusy}
              onEditCategory={(categoryId, payload) =>
                withBusy(async () => {
                  await updateCategory(loadedGame.id, categoryId, payload)
                  await loadGame(loadedGame.id)
                  setMessage('Category updated')
                  setMessageTone('success')
                })
              }
              onDeleteCategory={(categoryId) =>
                withBusy(async () => {
                  await deleteCategory(loadedGame.id, categoryId)
                  await loadGame(loadedGame.id)
                  setMessage('Category removed')
                  setMessageTone('success')
                })
              }
              onStartEditClue={(clue) => {
                setCategoryName(clue.categoryName)
                setCategoryOrder(clue.categoryOrder)
                setEditingQuestion({
                  clueId: clue.clueId,
                  question: createQuestionDraftFromStoredClue(clue),
                })
                setMessage('Question loaded into Board Builder for editing')
                setMessageTone('success')
              }}
              onDeleteClue={(clueId) =>
                withBusy(async () => {
                  await deleteClue(loadedGame.id, clueId)
                  await loadGame(loadedGame.id)
                  setEditingQuestion((current) => (current?.clueId === clueId ? null : current))
                  setMessage('Question removed')
                  setMessageTone('success')
                })
              }
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
          jokerConfig={{
            enabled: jokerEnabled,
            assignedClueIds: jokerAssignedClueIds,
          }}
          onResolveQuestion={({ clue, teamId, isCorrect, resolvedPointValue }) =>
            withBusy(async () => {
              await createScoreEvent(loadedGame.id, {
                teamId,
                clueId: clue.id,
                deltaPoints: isCorrect ? resolvedPointValue : -resolvedPointValue,
                reason: isCorrect ? 'Correct answer' : 'Incorrect answer',
              })
              await updateClue(loadedGame.id, clue.id, { isRevealed: true, isAnswered: true })
              await loadGame(loadedGame.id)
              setMessage(isCorrect ? `Point awarded: ${resolvedPointValue}` : `Points deducted: ${resolvedPointValue}`)
              setMessageTone(isCorrect ? 'success' : 'error')
            })
          }
        />
      )}
    </main>
  )
}

export default App

function shuffle<T>(values: T[]): T[] {
  const next = [...values]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const current = next[i]
    next[i] = next[j]
    next[j] = current
  }

  return next
}

function sameStringSet(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false
  }

  const rightSet = new Set(right)
  return left.every((item) => rightSet.has(item))
}


