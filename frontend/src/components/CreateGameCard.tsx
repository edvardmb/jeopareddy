type CreateGameCardProps = {
  gameTitle: string
  isBusy: boolean
  onGameTitleChange: (value: string) => void
  onCreate: () => void
}

export default function CreateGameCard(props: CreateGameCardProps) {
  const { gameTitle, isBusy, onGameTitleChange, onCreate } = props

  return (
    <section className="card card-blue">
      <h2>1. Create A New Game</h2>
      <p className="muted">Start from scratch with a fresh game board.</p>
      <div className="row">
        <div className="field">
          <label htmlFor="create-game-title">Game Title</label>
          <input
            id="create-game-title"
            value={gameTitle}
            onChange={(event) => onGameTitleChange(event.target.value)}
            placeholder="Example: Friday Trivia Night"
          />
        </div>
        <button className="btn-primary" disabled={isBusy} onClick={onCreate}>
          Create Game
        </button>
      </div>
    </section>
  )
}
