import { Game } from '../api'

type CurrentGameCardProps = {
  game: Game
  isBusy: boolean
  onStart: () => void
  onReset: () => void
}

export default function CurrentGameCard(props: CurrentGameCardProps) {
  const { game, isBusy, onStart, onReset } = props

  return (
    <section className="card">
      <h2>Current Game Session</h2>
      <p>
        <strong>{game.title}</strong> ({game.id})
      </p>
      <p>Status: {game.status}</p>
      <div className="row">
        <button disabled={isBusy || game.status !== 'Draft'} onClick={onStart}>
          Enter Play Mode
        </button>
        <button disabled={isBusy} onClick={onReset}>
          Reset Game
        </button>
      </div>
    </section>
  )
}
