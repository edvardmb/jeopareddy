import { useState } from 'react'

type QuestionDraft = {
  prompt: string
  answer: string
  pointValue: number
}

type CategoryQuestionPayload = {
  prompt: string
  answer: string
  pointValue: number
  rowOrder: number
}

type AddCategoryCardProps = {
  categoryName: string
  categoryOrder: number
  isBusy: boolean
  canOperateOnGame: boolean
  onCategoryNameChange: (value: string) => void
  onCategoryOrderChange: (value: number) => void
  onAddCategory: (payload: {
    name: string
    displayOrder: number
    clues: CategoryQuestionPayload[]
  }) => Promise<void>
}

const defaultQuestion: QuestionDraft = {
  prompt: 'This planet is known as the Red Planet.',
  answer: 'Mars',
  pointValue: 100,
}

const allowedValues = [100, 200, 300, 400, 500]

export default function AddCategoryCard(props: AddCategoryCardProps) {
  const { categoryName, categoryOrder, isBusy, canOperateOnGame, onCategoryNameChange, onCategoryOrderChange, onAddCategory } = props

  const [currentQuestion, setCurrentQuestion] = useState<QuestionDraft>(defaultQuestion)
  const [questions, setQuestions] = useState<QuestionDraft[]>([])

  const hasDuplicateValue = questions.some((question) => question.pointValue === currentQuestion.pointValue)

  const addQuestionToCategory = () => {
    const duplicate = questions.some((question) => question.pointValue === currentQuestion.pointValue)
    if (duplicate) {
      return
    }

    setQuestions((previous) =>
      [...previous, currentQuestion].sort((a, b) => a.pointValue - b.pointValue),
    )
    setCurrentQuestion({
      prompt: '',
      answer: '',
      pointValue: 100,
    })
  }

  const removeQuestion = (index: number) => {
    setQuestions((previous) => previous.filter((_, i) => i !== index))
  }

  return (
    <section className="card">
      <h2>Board Builder</h2>
      <p className="muted">Create one category and add several questions, then save once.</p>
      <p className="tiny muted">Typical setup: 5 categories with 5 questions each.</p>

      <div className="grid">
        <div className="field">
          <label htmlFor="category-name">Category Name</label>
          <input id="category-name" value={categoryName} onChange={(event) => onCategoryNameChange(event.target.value)} placeholder="Category name" />
        </div>
        <div className="field">
          <label htmlFor="category-order">Category Column</label>
          <input
            id="category-order"
            value={categoryOrder}
            type="number"
            min={1}
            onChange={(event) => onCategoryOrderChange(Number(event.target.value))}
            placeholder="1 = first column"
          />
          <div className="tiny muted">Determines left-to-right column position on the board.</div>
        </div>
      </div>

      <div className="grid">
        <div className="field">
          <label htmlFor="clue-prompt">Question Text</label>
          <input
            id="clue-prompt"
            value={currentQuestion.prompt}
            onChange={(event) => setCurrentQuestion((prev) => ({ ...prev, prompt: event.target.value }))}
            placeholder="Question text shown to players"
          />
        </div>
        <div className="field">
          <label htmlFor="clue-answer">Expected Answer</label>
          <input
            id="clue-answer"
            value={currentQuestion.answer}
            onChange={(event) => setCurrentQuestion((prev) => ({ ...prev, answer: event.target.value }))}
            placeholder="Expected answer"
          />
        </div>
        <div className="field">
          <label htmlFor="clue-points">Question Value</label>
          <select
            id="clue-points"
            value={currentQuestion.pointValue}
            onChange={(event) => setCurrentQuestion((prev) => ({ ...prev, pointValue: Number(event.target.value) }))}
          >
            {allowedValues.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <div className="tiny muted">Only one question per value in this category.</div>
        </div>
      </div>

      <div className="row">
        <button
          disabled={isBusy || !canOperateOnGame || !currentQuestion.prompt || !currentQuestion.answer || hasDuplicateValue}
          type="button"
          onClick={addQuestionToCategory}
        >
          Add Question To Category
        </button>
        {hasDuplicateValue && <span className="tiny message error">This value is already used in this category.</span>}
      </div>

      {questions.length > 0 && (
        <>
          <p className="muted">Questions queued for this category:</p>
          <ul className="list compact-list">
            {questions.map((question, index) => (
              <li key={`${question.pointValue}-${index}`} className="row">
                <div>
                  {question.pointValue} pts - {question.prompt}
                </div>
                <button type="button" disabled={isBusy} onClick={() => removeQuestion(index)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="row">
        <button
          disabled={isBusy || !canOperateOnGame || questions.length === 0}
          onClick={async () => {
            const clues = questions.map((question) => ({
              prompt: question.prompt,
              answer: question.answer,
              pointValue: question.pointValue,
              rowOrder: rowOrderFromValue(question.pointValue),
            }))
            await onAddCategory({ name: categoryName, displayOrder: categoryOrder, clues })
            setQuestions([])
          }}
        >
          Save Category With {questions.length} Question{questions.length === 1 ? '' : 's'}
        </button>
      </div>
    </section>
  )
}

function rowOrderFromValue(pointValue: number): number {
  return Math.floor(pointValue / 100)
}
