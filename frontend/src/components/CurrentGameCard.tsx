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
    <section className="card card-green">
      <h2>Current Game Session</h2>
      <p>
        <strong>{game.title}</strong> ({game.id})
      </p>
      <p>Status: {game.status}</p>
      <div className="row">
        <button className="btn-success" disabled={isBusy || game.status !== 'Draft'} onClick={onStart}>
          Enter Play Mode
        </button>
        <button className="btn-danger" disabled={isBusy} onClick={onReset}>
          Reset Game
        </button>
      </div>
    </section>
  )
}
