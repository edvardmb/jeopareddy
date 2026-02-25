import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  API_BASE_URL,
  addCategory,
  addTeam,
  createGame,
  createScoreEvent,
  deleteCategory,
  deleteClue,
  deleteTeam,
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
import LanguageSelector from './components/LanguageSelector'
import './App.css'
import type { SupportedLanguage } from './i18n'
import { translateGameStatus } from './i18nHelpers'

function App() {
  const { t, i18n } = useTranslation()
  const [gameTitle, setGameTitle] = useState('Friday Trivia Night')
  const [gameIdInput, setGameIdInput] = useState('')
  const [games, setGames] = useState<GameListItem[]>([])
  const [loadedGame, setLoadedGame] = useState<Game | null>(null)
  const [teamName, setTeamName] = useState('Team A')
  const [categoryName, setCategoryName] = useState('Science')
  const [categoryOrder, setCategoryOrder] = useState(1)
  const [scoreTeamId, setScoreTeamId] = useState('')
  const [currentTurnTeamId, setCurrentTurnTeamId] = useState('')
  const [scoreDelta, setScoreDelta] = useState(100)
  const [scoreReason, setScoreReason] = useState('Correct answer')
  const [isBusy, setIsBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [messageTone, setMessageTone] = useState<'success' | 'error' | ''>('')
  const [activeSection, setActiveSection] = useState<'dashboard' | 'host' | 'play' | 'preview' | 'preview-neon'>('dashboard')
  const [jokerEnabled, setJokerEnabled] = useState(false)
  const [jokerAppearancesPerGame, setJokerAppearancesPerGame] = useState(1)
  const [jokerAssignedClueIds, setJokerAssignedClueIds] = useState<string[]>([])
  const [jokerSpotCount, setJokerSpotCount] = useState(1)
  const [thiefSpotCount, setThiefSpotCount] = useState(1)
  const [genderRevealEnabled, setGenderRevealEnabled] = useState(false)
  const [genderRevealAppearancesPerGame, setGenderRevealAppearancesPerGame] = useState(1)
  const [genderRevealAssignedClueIds, setGenderRevealAssignedClueIds] = useState<string[]>([])
  const [editingQuestion, setEditingQuestion] = useState<{ clueId: string; question: QuestionDraft } | null>(null)

  const canOperateOnGame = Boolean(loadedGame?.id)
  const isSetupLocked = loadedGame?.status === 'InProgress'
  const scoreTeams = useMemo(() => loadedGame?.teams ?? [], [loadedGame])
  const loadGameRequestSeqRef = useRef(0)
  const selectedLanguage: SupportedLanguage = i18n.resolvedLanguage?.startsWith('no') ? 'no' : 'en'

  const changeLanguage = (language: SupportedLanguage) => {
    void i18n.changeLanguage(language)
    globalThis.localStorage?.setItem('jeopareddy.language', language)
  }

  const loadGame = async (gameId: string) => {
    const requestSeq = ++loadGameRequestSeqRef.current
    const game = await getGame(gameId)
    if (requestSeq !== loadGameRequestSeqRef.current) {
      return
    }
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
      const text = error instanceof Error ? error.message : t('messages.requestFailed')
      setMessage(text)
      setMessageTone('error')
    } finally {
      setIsBusy(false)
    }
  }

  useEffect(() => {
    refreshGames().catch(() => {
      setMessage(t('messages.couldNotLoadGamesList'))
      setMessageTone('error')
    })
  }, [t])

  useEffect(() => {
    setJokerAssignedClueIds([])
  }, [loadedGame?.id])

  useEffect(() => {
    setGenderRevealAssignedClueIds([])
  }, [loadedGame?.id])

  useEffect(() => {
    setEditingQuestion(null)
  }, [loadedGame?.id])

  useEffect(() => {
    if (!loadedGame || loadedGame.teams.length === 0) {
      if (currentTurnTeamId) {
        setCurrentTurnTeamId('')
      }
      return
    }

    if (!currentTurnTeamId || !loadedGame.teams.some((team) => team.id === currentTurnTeamId)) {
      const firstTeam = [...loadedGame.teams].sort((a, b) => a.displayOrder - b.displayOrder)[0]
      if (firstTeam) {
        setCurrentTurnTeamId(firstTeam.id)
      }
    }
  }, [currentTurnTeamId, loadedGame])

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

  useEffect(() => {
    if (!loadedGame) {
      if (genderRevealAssignedClueIds.length > 0) {
        setGenderRevealAssignedClueIds([])
      }
      return
    }

    if (!genderRevealEnabled) {
      if (genderRevealAssignedClueIds.length > 0) {
        setGenderRevealAssignedClueIds([])
      }
      return
    }

    const excludedClueIdSet = new Set(jokerAssignedClueIds)
    const allEligibleClues = loadedGame.categories
      .flatMap((category) => category.clues)
      .filter((clue) => !excludedClueIdSet.has(clue.id))
    const targetCount = Math.max(0, Math.min(Math.floor(genderRevealAppearancesPerGame || 0), allEligibleClues.length))
    if (targetCount === 0) {
      if (genderRevealAssignedClueIds.length > 0) {
        setGenderRevealAssignedClueIds([])
      }
      return
    }

    const allClueIdSet = new Set(allEligibleClues.map((clue) => clue.id))
    const answeredClueIdSet = new Set(allEligibleClues.filter((clue) => clue.isAnswered).map((clue) => clue.id))
    const existingValid = genderRevealAssignedClueIds.filter((id) => allClueIdSet.has(id))
    const completedAssignments = existingValid.filter((id) => answeredClueIdSet.has(id))
    const pendingAssignments = existingValid.filter((id) => !answeredClueIdSet.has(id))

    const nextAssignments: string[] = []
    nextAssignments.push(...completedAssignments.slice(0, targetCount))

    if (nextAssignments.length < targetCount) {
      nextAssignments.push(...pendingAssignments.slice(0, targetCount - nextAssignments.length))
    }

    const chosenSet = new Set(nextAssignments)
    if (nextAssignments.length < targetCount) {
      const availableUnanswered = allEligibleClues
        .filter((clue) => !clue.isAnswered && !chosenSet.has(clue.id))
        .map((clue) => clue.id)

      nextAssignments.push(...shuffle(availableUnanswered).slice(0, targetCount - nextAssignments.length))
    }

    if (!sameStringSet(genderRevealAssignedClueIds, nextAssignments)) {
      setGenderRevealAssignedClueIds(nextAssignments)
    }
  }, [genderRevealAssignedClueIds, genderRevealAppearancesPerGame, genderRevealEnabled, jokerAssignedClueIds, loadedGame])

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

  const genderRevealStats = useMemo(() => {
    if (!loadedGame) {
      return { totalAssigned: 0, completed: 0, remaining: 0 }
    }

    const answeredClueIds = new Set(
      loadedGame.categories.flatMap((category) => category.clues.filter((clue) => clue.isAnswered).map((clue) => clue.id)),
    )
    const completed = genderRevealAssignedClueIds.filter((id) => answeredClueIds.has(id)).length
    const totalAssigned = genderRevealAssignedClueIds.length
    return {
      totalAssigned,
      completed,
      remaining: Math.max(0, totalAssigned - completed),
    }
  }, [genderRevealAssignedClueIds, loadedGame])

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
                  {translateGameStatus(loadedGame.status, t)}
                </span>
              </>
            ) : (
              <span className="tiny muted">{t('status.noGameLoaded')}</span>
            )}
          </div>
          <LanguageSelector value={selectedLanguage} onChange={changeLanguage} />
          <div className="tiny muted">API: {API_BASE_URL}</div>
        </div>
      </header>

      <nav className="tab-bar" aria-label="Primary navigation">
        <button className={activeSection === 'dashboard' ? 'tab-btn active' : 'tab-btn'} onClick={() => setActiveSection('dashboard')}>
          {t('nav.dashboard')}
        </button>
        <button className={activeSection === 'preview' ? 'tab-btn active' : 'tab-btn'} onClick={() => setActiveSection('preview')}>
          {t('nav.designPreview')}
        </button>
        <button
          className={activeSection === 'preview-neon' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setActiveSection('preview-neon')}
        >
          {t('nav.neonPreview')}
        </button>
        <button
          className={activeSection === 'host' ? 'tab-btn active' : 'tab-btn'}
          disabled={!loadedGame}
          onClick={() => setActiveSection('host')}
        >
          {t('nav.hostControl')}
        </button>
        <button
          className={activeSection === 'play' ? 'tab-btn active' : 'tab-btn'}
          disabled={!loadedGame}
          onClick={() => setActiveSection('play')}
        >
          {t('nav.play')}
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
                setMessage(t('messages.createdGame', { id: game.id }))
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
                setMessage(t('messages.loadedGame', { id: gameIdInput }))
                setMessageTone('success')
                setActiveSection('host')
              })
            }
            onRefresh={() =>
              withBusy(async () => {
                await refreshGames()
                setMessage(t('messages.gamesListRefreshed'))
                setMessageTone('success')
              })
            }
            onLoadFromList={(gameId) =>
              withBusy(async () => {
                await loadGame(gameId)
                setMessage(t('messages.loadedGame', { id: gameId }))
                setMessageTone('success')
                setActiveSection('host')
              })
            }
          />
        </>
      )}

      {!loadedGame && activeSection !== 'dashboard' && (
        <section className="card">
          <h2>{t('app.noActiveGame')}</h2>
          <p className="muted">{t('app.noActiveGameHelp')}</p>
          <button onClick={() => setActiveSection('dashboard')}>{t('app.goToDashboard')}</button>
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
                  setMessage(t('messages.gameMovedInProgress'))
                  setMessageTone('success')
                })
              }
              onReset={() =>
                withBusy(async () => {
                  await resetGame(loadedGame.id)
                  setJokerAssignedClueIds([])
                  setGenderRevealAssignedClueIds([])
                  await loadGame(loadedGame.id)
                  setMessage(t('messages.gameReset'))
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
                  setMessage(t('messages.teamAdded', { name: teamName }))
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
                  setMessage(t('messages.questionUpdated'))
                  setMessageTone('success')
                })
              }
              onAddCategory={(payload) =>
                withBusy(async () => {
                  await addCategory(loadedGame.id, payload)
                  await loadGame(loadedGame.id)
                  setMessage(t('messages.categoryAdded', { name: payload.name, count: payload.clues.length }))
                  setMessageTone('success')
                })
              }
            />

            <section className={`card card-sky ${isSetupLocked ? 'card-disabled' : ''}`}>
              <h2>{t('sections.jokerTitle')}</h2>
              <p className="muted">{t('sections.jokerHelp')}</p>
              <div className="grid">
                <div className="field">
                  <label>{t('sections.includeJoker')}</label>
                  <button
                    type="button"
                    className={jokerEnabled ? 'btn-success' : 'btn-secondary'}
                    disabled={isBusy || !loadedGame || isSetupLocked}
                    onClick={() => setJokerEnabled((value) => !value)}
                  >
                    {jokerEnabled ? t('common.enabled') : t('common.disabled')}
                  </button>
                </div>
                <div className="field">
                  <div className="field-label-row">
                    <label htmlFor="joker-appearances">{t('sections.appearancesPerGame')}</label>
                    <InfoHint text={t('sections.jokerAppearancesHelp')} label={t('sections.jokerAppearancesHelpLabel')} />
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
                <div className="field">
                  <div className="field-label-row">
                    <label htmlFor="joker-spot-count">{t('sections.jokerSpots')}</label>
                    <InfoHint text={t('sections.jokerSpotsHelp')} label={t('sections.jokerSpotsHelpLabel')} />
                  </div>
                  <input
                    id="joker-spot-count"
                    type="number"
                    min={0}
                    max={10}
                    disabled={isBusy || !loadedGame || isSetupLocked}
                    value={jokerSpotCount}
                    onChange={(event) => setJokerSpotCount(Math.max(0, Math.min(10, Number(event.target.value) || 0)))}
                  />
                </div>
                <div className="field">
                  <div className="field-label-row">
                    <label htmlFor="thief-spot-count">{t('sections.thiefSpots')}</label>
                    <InfoHint text={t('sections.thiefSpotsHelp')} label={t('sections.thiefSpotsHelpLabel')} />
                  </div>
                  <input
                    id="thief-spot-count"
                    type="number"
                    min={0}
                    max={10}
                    disabled={isBusy || !loadedGame || isSetupLocked}
                    value={thiefSpotCount}
                    onChange={(event) => setThiefSpotCount(Math.max(0, Math.min(10, Number(event.target.value) || 0)))}
                  />
                </div>
              </div>
              <p className="tiny muted">{t('sections.jokerSpotFootnote')}</p>
              <p className="tiny muted">
                {t('sections.assignedStats', {
                  total: jokerStats.totalAssigned,
                  completed: jokerStats.completed,
                  remaining: jokerStats.remaining,
                })}
              </p>
              <p className="tiny muted">{t('sections.localOnly')}</p>
            </section>

            <section className={`card card-sky ${isSetupLocked ? 'card-disabled' : ''}`}>
              <h2>{t('sections.genderTitle')}</h2>
              <p className="muted">{t('sections.genderHelp')}</p>
              <div className="grid">
                <div className="field">
                  <label>{t('sections.includeGender')}</label>
                  <button
                    type="button"
                    className={genderRevealEnabled ? 'btn-success' : 'btn-secondary'}
                    disabled={isBusy || !loadedGame || isSetupLocked}
                    onClick={() => setGenderRevealEnabled((value) => !value)}
                  >
                    {genderRevealEnabled ? t('common.enabled') : t('common.disabled')}
                  </button>
                </div>
                <div className="field">
                  <div className="field-label-row">
                    <label htmlFor="gender-reveal-appearances">{t('sections.appearancesPerGame')}</label>
                    <InfoHint
                      text={t('sections.genderAppearancesHelp')}
                      label={t('sections.genderAppearancesHelpLabel')}
                    />
                  </div>
                  <input
                    id="gender-reveal-appearances"
                    type="number"
                    min={0}
                    max={25}
                    disabled={isBusy || !loadedGame || isSetupLocked}
                    value={genderRevealAppearancesPerGame}
                    onChange={(event) => setGenderRevealAppearancesPerGame(Math.max(0, Number(event.target.value) || 0))}
                  />
                </div>
              </div>
              <p className="tiny muted">
                {t('sections.assignedStats', {
                  total: genderRevealStats.totalAssigned,
                  completed: genderRevealStats.completed,
                  remaining: genderRevealStats.remaining,
                })}
              </p>
              <p className="tiny muted">{t('sections.genderOutcomeNote')}</p>
              <p className="tiny muted">{t('sections.localOnly')}</p>
            </section>
          </div>

          <div>
            <TeamsCard
              teams={loadedGame.teams}
              isDraft={loadedGame.status === 'Draft'}
              isBusy={isBusy}
              currentTurnTeamId={currentTurnTeamId}
              onSetTurnTeamId={setCurrentTurnTeamId}
              onDeleteTeam={(teamId) =>
                withBusy(async () => {
                  const team = loadedGame.teams.find((x) => x.id === teamId)
                  await deleteTeam(loadedGame.id, teamId)
                  await loadGame(loadedGame.id)
                  setScoreTeamId((current) => (current === teamId ? '' : current))
                  setCurrentTurnTeamId((current) => (current === teamId ? '' : current))
                  setMessage(team ? t('messages.teamRemoved', { name: team.name }) : t('messages.teamRemovedGeneric'))
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
                  setMessage(t('messages.scoreUpdated'))
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
                  setMessage(t('messages.categoryUpdated'))
                  setMessageTone('success')
                })
              }
              onDeleteCategory={(categoryId) =>
                withBusy(async () => {
                  await deleteCategory(loadedGame.id, categoryId)
                  await loadGame(loadedGame.id)
                  setMessage(t('messages.categoryRemoved'))
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
                setMessage(t('messages.questionLoadedForEdit'))
                setMessageTone('success')
              }}
              onDeleteClue={(clueId) =>
                withBusy(async () => {
                  await deleteClue(loadedGame.id, clueId)
                  await loadGame(loadedGame.id)
                  setEditingQuestion((current) => (current?.clueId === clueId ? null : current))
                  setMessage(t('messages.questionRemoved'))
                  setMessageTone('success')
                })
              }
              onToggleReveal={(clueId, currentValue) =>
                withBusy(async () => {
                  await updateClue(loadedGame.id, clueId, { isRevealed: !currentValue })
                  await loadGame(loadedGame.id)
                  setMessage(t('messages.clueRevealUpdated'))
                  setMessageTone('success')
                })
              }
              onToggleAnswered={(clueId, currentValue) =>
                withBusy(async () => {
                  await updateClue(loadedGame.id, clueId, { isAnswered: !currentValue })
                  await loadGame(loadedGame.id)
                  setMessage(t('messages.clueAnswerUpdated'))
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
          currentTeamId={currentTurnTeamId}
          onCurrentTeamIdChange={setCurrentTurnTeamId}
          jokerConfig={{
            enabled: jokerEnabled,
            assignedClueIds: jokerAssignedClueIds,
            jokerSpotCount,
            thiefSpotCount,
          }}
          genderRevealConfig={{
            enabled: genderRevealEnabled,
            assignedClueIds: genderRevealAssignedClueIds,
          }}
          onResolveQuestion={({ clue, teamId, isCorrect, resolvedPointValue }) =>
            withBusy(async () => {
              await createScoreEvent(loadedGame.id, {
                teamId,
                clueId: clue.id,
                deltaPoints: isCorrect ? resolvedPointValue : -resolvedPointValue,
                reason: isCorrect ? t('messages.correctAnswer') : t('messages.incorrectAnswer'),
              })
              await updateClue(loadedGame.id, clue.id, { isRevealed: true, isAnswered: true })
              await loadGame(loadedGame.id)
              setMessage(
                isCorrect
                  ? t('messages.pointAwarded', { points: resolvedPointValue })
                  : t('messages.pointsDeducted', { points: resolvedPointValue }),
              )
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



