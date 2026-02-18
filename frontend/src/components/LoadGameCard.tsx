import { GameListItem } from '../api'
import { useEffect, useState } from 'react'

type LoadGameCardProps = {
  gameIdInput: string
  isBusy: boolean
  games: GameListItem[]
  onGameIdChange: (value: string) => void
  onLoad: () => void
  onRefresh: () => void
  onLoadFromList: (gameId: string) => void
}

export default function LoadGameCard(props: LoadGameCardProps) {
  const { gameIdInput, isBusy, games, onGameIdChange, onLoad, onRefresh, onLoadFromList } = props
  const [selectedGameId, setSelectedGameId] = useState('')

  useEffect(() => {
    if (!selectedGameId && games.length > 0) {
      setSelectedGameId(games[0].id)
    }
  }, [games, selectedGameId])

  return (
    <section className="card">
      <h2>2. Load Existing Game</h2>
      <p className="muted">Paste a game ID to continue editing or hosting.</p>
      <div className="row">
        <div className="field">
          <label htmlFor="load-game-id">Game ID</label>
          <input id="load-game-id" value={gameIdInput} onChange={(event) => onGameIdChange(event.target.value)} placeholder="Game ID" />
        </div>
        <button disabled={isBusy || !gameIdInput} onClick={onLoad}>
          Load Game
        </button>
        <button disabled={isBusy} onClick={onRefresh}>
          Refresh List
        </button>
      </div>

      <div className="inline-note">Or choose one below:</div>
      {games.length === 0 ? (
        <p className="muted">No games found yet.</p>
      ) : (
        <div className="row">
          <div className="field">
            <label htmlFor="game-dropdown">Available Games</label>
            <select id="game-dropdown" value={selectedGameId} onChange={(event) => setSelectedGameId(event.target.value)}>
              {games.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.title} ({game.status})
                </option>
              ))}
            </select>
            <div className="tiny muted">Choose a game and click load.</div>
          </div>
          <button disabled={isBusy || !selectedGameId} onClick={() => onLoadFromList(selectedGameId)}>
            Load Selected
          </button>
        </div>
      )}
    </section>
  )
}
