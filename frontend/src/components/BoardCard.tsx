import { Category } from '../api'

type BoardCardProps = {
  categories: Category[]
  isDraft: boolean
  isBusy: boolean
  onEditCategory: (categoryId: string, payload: { name: string; displayOrder: number }) => void
  onDeleteCategory: (categoryId: string) => void
  onEditClue: (
    clueId: string,
    payload: {
      prompt: string
      answer: string
      pointValue: number
      rowOrder: number
      imageMimeType?: string | null
      imageBase64?: string | null
    },
  ) => void
  onDeleteClue: (clueId: string) => void
  onToggleReveal: (clueId: string, currentValue: boolean) => void
  onToggleAnswered: (clueId: string, currentValue: boolean) => void
}

export default function BoardCard(props: BoardCardProps) {
  const { categories, isDraft, isBusy, onEditCategory, onDeleteCategory, onEditClue, onDeleteClue, onToggleReveal, onToggleAnswered } = props

  return (
    <section className="card card-board">
      <h2>Play Board</h2>
      <p className="muted">Reveal each question and mark it answered as teams play.</p>
      {!isDraft && <p className="tiny section-lock-note">Category and question edit/delete is only available while the game is in Draft.</p>}
      {categories.length === 0 ? (
        <p className="muted">No categories yet</p>
      ) : (
        categories.map((category) => (
          <details key={category.id} className="category accordion-category">
            <summary className="category-summary">
              <span className="category-summary-title">
                {category.displayOrder}. {category.name}
              </span>
              <span className="tiny muted">{category.clues.length} question(s)</span>
            </summary>
            {isDraft && (
              <div className="row" style={{ marginTop: '0.6rem' }}>
                <button
                  className="btn-secondary"
                  disabled={isBusy}
                  type="button"
                  onClick={() => {
                    const nextName = window.prompt('Category name', category.name)
                    if (nextName === null) {
                      return
                    }

                    const nextOrderRaw = window.prompt('Category column/order', String(category.displayOrder))
                    if (nextOrderRaw === null) {
                      return
                    }

                    const nextOrder = Number(nextOrderRaw)
                    if (!Number.isInteger(nextOrder) || nextOrder <= 0) {
                      window.alert('Category column/order must be a positive whole number.')
                      return
                    }

                    onEditCategory(category.id, { name: nextName, displayOrder: nextOrder })
                  }}
                >
                  Edit Category
                </button>
                <button
                  className="btn-danger"
                  disabled={isBusy}
                  type="button"
                  onClick={() => {
                    const confirmed = window.confirm(`Delete category "${category.name}" and all its questions?`)
                    if (!confirmed) {
                      return
                    }

                    onDeleteCategory(category.id)
                  }}
                >
                  Remove Category
                </button>
              </div>
            )}
            <ul className="list">
              {category.clues.map((clue) => (
                <li key={clue.id} className="clue-admin-item">
                  <div className="clue-admin-text">
                    <strong>{clue.pointValue}</strong> - {clue.prompt}
                    {clue.imageBase64 ? ' (image)' : ''}
                  </div>
                  <div className="row clue-admin-controls">
                    <span className="clue-admin-status">
                      <span className={`state-pill ${clue.isRevealed ? 'is-on' : ''}`}>Revealed: {clue.isRevealed ? 'Yes' : 'No'}</span>
                      <span className={`state-pill ${clue.isAnswered ? 'is-on' : ''}`}>Answered: {clue.isAnswered ? 'Yes' : 'No'}</span>
                    </span>
                    {isDraft && (
                      <>
                        <button
                          className="btn-secondary"
                          disabled={isBusy}
                          type="button"
                          onClick={() => {
                            const nextPrompt = window.prompt('Question text', clue.prompt)
                            if (nextPrompt === null) {
                              return
                            }

                            const nextAnswer = window.prompt('Expected answer', clue.answer)
                            if (nextAnswer === null) {
                              return
                            }

                            const nextValueRaw = window.prompt('Point value', String(clue.pointValue))
                            if (nextValueRaw === null) {
                              return
                            }

                            const nextValue = Number(nextValueRaw)
                            if (!Number.isInteger(nextValue) || nextValue <= 0) {
                              window.alert('Point value must be a positive whole number.')
                              return
                            }

                            onEditClue(clue.id, {
                              prompt: nextPrompt,
                              answer: nextAnswer,
                              pointValue: nextValue,
                              rowOrder: rowOrderFromValue(nextValue),
                              imageMimeType: clue.imageMimeType,
                              imageBase64: clue.imageBase64,
                            })
                          }}
                        >
                          Edit Question
                        </button>
                        <button
                          className="btn-danger"
                          disabled={isBusy}
                          type="button"
                          onClick={() => {
                            const confirmed = window.confirm(`Delete question "${clue.prompt}"?`)
                            if (!confirmed) {
                              return
                            }

                            onDeleteClue(clue.id)
                          }}
                        >
                          Remove Question
                        </button>
                      </>
                    )}
                    <button className="btn-secondary" disabled={isBusy} onClick={() => onToggleReveal(clue.id, clue.isRevealed)}>
                      Reveal/Hide
                    </button>
                    <button className="btn-secondary" disabled={isBusy} onClick={() => onToggleAnswered(clue.id, clue.isAnswered)}>
                      Mark Answered
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </details>
        ))
      )}
    </section>
  )
}

function rowOrderFromValue(pointValue: number): number {
  return Math.floor(pointValue / 100)
}
