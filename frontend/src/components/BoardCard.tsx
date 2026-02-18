import { Category } from '../api'

type BoardCardProps = {
  categories: Category[]
  isBusy: boolean
  onToggleReveal: (clueId: string, currentValue: boolean) => void
  onToggleAnswered: (clueId: string, currentValue: boolean) => void
}

export default function BoardCard(props: BoardCardProps) {
  const { categories, isBusy, onToggleReveal, onToggleAnswered } = props

  return (
    <section className="card">
      <h2>Play Board</h2>
      <p className="muted">Reveal each question and mark it answered as teams play.</p>
      {categories.length === 0 ? (
        <p className="muted">No categories yet</p>
      ) : (
        categories.map((category) => (
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
                    <button disabled={isBusy} onClick={() => onToggleReveal(clue.id, clue.isRevealed)}>
                      Reveal/Hide
                    </button>
                    <button disabled={isBusy} onClick={() => onToggleAnswered(clue.id, clue.isAnswered)}>
                      Mark Answered
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </section>
  )
}
