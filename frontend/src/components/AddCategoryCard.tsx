import { useEffect, useState } from 'react'
import InfoHint from './InfoHint'

const MAX_CLUE_IMAGE_BYTES = 1_048_576
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif'] as const

export type QuestionImageDraft = {
  mimeType: string
  base64: string
  previewUrl: string
  fileName: string
  sizeBytes: number
}

export type QuestionDraft = {
  prompt: string
  answer: string
  pointValue: number
  image: QuestionImageDraft | null
}

type CategoryQuestionPayload = {
  prompt: string
  answer: string
  pointValue: number
  rowOrder: number
  imageMimeType?: string | null
  imageBase64?: string | null
}

type AddCategoryCardProps = {
  categoryName: string
  categoryOrder: number
  isBusy: boolean
  canOperateOnGame: boolean
  isLocked: boolean
  onCategoryNameChange: (value: string) => void
  onCategoryOrderChange: (value: number) => void
  onAddCategory: (payload: {
    name: string
    displayOrder: number
    clues: CategoryQuestionPayload[]
  }) => Promise<void>
  editingQuestion?: {
    clueId: string
    question: QuestionDraft
  } | null
  onSaveEditedQuestion?: (
    clueId: string,
    payload: {
      prompt: string
      answer: string
      pointValue: number
      rowOrder: number
      imageMimeType?: string | null
      imageBase64?: string | null
    },
  ) => Promise<void>
  onCancelEditQuestion?: () => void
}

const defaultQuestion: QuestionDraft = {
  prompt: 'This planet is known as the Red Planet.',
  answer: 'Mars',
  pointValue: 100,
  image: null,
}

const allowedValues = [100, 200, 300, 400, 500]

export default function AddCategoryCard(props: AddCategoryCardProps) {
  const {
    categoryName,
    categoryOrder,
    isBusy,
    canOperateOnGame,
    isLocked,
    onCategoryNameChange,
    onCategoryOrderChange,
    onAddCategory,
    editingQuestion = null,
    onSaveEditedQuestion,
    onCancelEditQuestion,
  } = props

  const [currentQuestion, setCurrentQuestion] = useState<QuestionDraft>(defaultQuestion)
  const [questions, setQuestions] = useState<QuestionDraft[]>([])
  const [imageError, setImageError] = useState('')
  const isDisabled = isBusy || !canOperateOnGame || isLocked
  const isEditingQuestion = Boolean(editingQuestion)

  const hasDuplicateValue = questions.some((question) => question.pointValue === currentQuestion.pointValue)

  useEffect(() => {
    if (!editingQuestion) {
      return
    }

    setCurrentQuestion(editingQuestion.question)
    setImageError('')
  }, [editingQuestion])

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
      image: null,
    })
    setImageError('')
  }

  const removeQuestion = (index: number) => {
    setQuestions((previous) => previous.filter((_, i) => i !== index))
  }

  const handleImageChange = async (file: File | null) => {
    if (!file) {
      setCurrentQuestion((previous) => ({ ...previous, image: null }))
      setImageError('')
      return
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
      setCurrentQuestion((previous) => ({ ...previous, image: null }))
      setImageError('Only PNG, JPG/JPEG, and GIF images are allowed.')
      return
    }

    if (file.size > MAX_CLUE_IMAGE_BYTES) {
      setCurrentQuestion((previous) => ({ ...previous, image: null }))
      setImageError(`Image is too large. Max size is ${formatBytes(MAX_CLUE_IMAGE_BYTES)}.`)
      return
    }

    try {
      const previewUrl = await readFileAsDataUrl(file)
      const commaIndex = previewUrl.indexOf(',')
      if (commaIndex < 0) {
        throw new Error('Invalid image data')
      }

      setCurrentQuestion((previous) => ({
        ...previous,
        image: {
          mimeType: file.type,
          base64: previewUrl.slice(commaIndex + 1),
          previewUrl,
          fileName: file.name,
          sizeBytes: file.size,
        },
      }))
      setImageError('')
    } catch {
      setCurrentQuestion((previous) => ({ ...previous, image: null }))
      setImageError('Could not read the selected image.')
    }
  }

  return (
    <section className={`card card-yellow ${isLocked ? 'card-disabled' : ''}`}>
      <h2>Board Builder</h2>
      <p className="muted">Create one category and add several questions, then save once.</p>
      <p className="tiny muted">Typical setup: 5 categories with 5 questions each.</p>
      {isEditingQuestion && <p className="tiny">Editing an existing question. Save changes below or cancel to return to add mode.</p>}
      {isLocked && <p className="tiny section-lock-note">Board builder is disabled while the game is in progress.</p>}

      <div className="grid">
        <div className="field">
          <label htmlFor="category-name">Category Name</label>
          <input id="category-name" value={categoryName} onChange={(event) => onCategoryNameChange(event.target.value)} placeholder="Category name" disabled={isDisabled} />
        </div>
        <div className="field">
          <div className="field-label-row">
            <label htmlFor="category-order">Category Column</label>
            <InfoHint text="Determines left-to-right column position on the board." label="Category column help" />
          </div>
          <input
            id="category-order"
            value={categoryOrder}
            type="number"
            min={1}
            disabled={isDisabled}
            onChange={(event) => onCategoryOrderChange(Number(event.target.value))}
            placeholder="1 = first column"
          />
        </div>
      </div>

      <div className="grid">
        <div className="field">
          <label htmlFor="clue-prompt">Question Text</label>
          <input
            id="clue-prompt"
            value={currentQuestion.prompt}
            disabled={isDisabled}
            onChange={(event) => setCurrentQuestion((prev) => ({ ...prev, prompt: event.target.value }))}
            placeholder="Question text shown to players"
          />
        </div>
        <div className="field">
          <label htmlFor="clue-answer">Expected Answer</label>
          <input
            id="clue-answer"
            value={currentQuestion.answer}
            disabled={isDisabled}
            onChange={(event) => setCurrentQuestion((prev) => ({ ...prev, answer: event.target.value }))}
            placeholder="Expected answer"
          />
        </div>
        <div className="field">
          <label htmlFor="clue-points">Question Value</label>
          <select
            id="clue-points"
            value={currentQuestion.pointValue}
            disabled={isDisabled}
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
        <div className="field">
          <label htmlFor="clue-image">Question Image (Optional)</label>
          <input
            id="clue-image"
            type="file"
            accept=".png,.jpg,.jpeg,.gif,image/png,image/jpeg,image/gif"
            disabled={isDisabled}
            onChange={(event) => {
              void handleImageChange(event.target.files?.[0] ?? null)
              event.currentTarget.value = ''
            }}
          />
          <div className="tiny muted">PNG, JPG/JPEG, or GIF. Max {formatBytes(MAX_CLUE_IMAGE_BYTES)}.</div>
          {imageError && <div className="tiny inline-error">{imageError}</div>}
          {currentQuestion.image && (
            <div className="clue-image-preview">
              <img src={currentQuestion.image.previewUrl} alt={`Preview for ${currentQuestion.image.fileName}`} />
              <div className="tiny muted">
                {currentQuestion.image.fileName} ({formatBytes(currentQuestion.image.sizeBytes)})
              </div>
              <button
                className="btn-secondary"
                type="button"
                disabled={isDisabled}
                onClick={() => {
                  setCurrentQuestion((previous) => ({ ...previous, image: null }))
                  setImageError('')
                }}
              >
                Remove Image
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="row">
        {isEditingQuestion ? (
          <>
            <button
              className="btn-success"
              disabled={isDisabled || !currentQuestion.prompt || !currentQuestion.answer || !editingQuestion || !onSaveEditedQuestion}
              type="button"
              onClick={async () => {
                if (!editingQuestion || !onSaveEditedQuestion) {
                  return
                }

                await onSaveEditedQuestion(editingQuestion.clueId, {
                  prompt: currentQuestion.prompt,
                  answer: currentQuestion.answer,
                  pointValue: currentQuestion.pointValue,
                  rowOrder: rowOrderFromValue(currentQuestion.pointValue),
                  imageMimeType: currentQuestion.image?.mimeType ?? null,
                  imageBase64: currentQuestion.image?.base64 ?? null,
                })
                setCurrentQuestion({
                  prompt: '',
                  answer: '',
                  pointValue: 100,
                  image: null,
                })
                setImageError('')
              }}
            >
              Save Edited Question
            </button>
            <button
              className="btn-secondary"
              disabled={isDisabled}
              type="button"
              onClick={() => {
                setCurrentQuestion(defaultQuestion)
                setImageError('')
                onCancelEditQuestion?.()
              }}
            >
              Cancel Edit
            </button>
          </>
        ) : (
          <>
            <button
              className="btn-secondary"
              disabled={isDisabled || !currentQuestion.prompt || !currentQuestion.answer || hasDuplicateValue}
              type="button"
              onClick={addQuestionToCategory}
            >
              Add Question To Category
            </button>
            {hasDuplicateValue && <span className="tiny inline-error">This value is already used in this category.</span>}
          </>
        )}
      </div>

      {questions.length > 0 && (
        <>
          <p className="muted">Questions queued for this category:</p>
          <ul className="list compact-list">
            {questions.map((question, index) => (
              <li key={`${question.pointValue}-${index}`} className="row">
                <div>
                  {question.pointValue} pts - {question.prompt}
                  {question.image ? ' (image)' : ''}
                </div>
                <button className="btn-secondary" type="button" disabled={isDisabled} onClick={() => removeQuestion(index)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="row">
        <button
          className="btn-success"
          disabled={isDisabled || questions.length === 0}
          onClick={async () => {
            const clues = questions.map((question) => ({
              prompt: question.prompt,
              answer: question.answer,
              pointValue: question.pointValue,
              rowOrder: rowOrderFromValue(question.pointValue),
              imageMimeType: question.image?.mimeType ?? null,
              imageBase64: question.image?.base64 ?? null,
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

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`
  }

  return `${bytes} B`
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }

      reject(new Error('Unexpected file reader result'))
    }
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'))
    reader.readAsDataURL(file)
  })
}

export function createQuestionDraftFromStoredClue(clue: {
  prompt: string
  answer: string
  pointValue: number
  imageMimeType: string | null
  imageBase64: string | null
}): QuestionDraft {
  const image =
    clue.imageMimeType && clue.imageBase64
      ? {
          mimeType: clue.imageMimeType,
          base64: clue.imageBase64,
          previewUrl: `data:${clue.imageMimeType};base64,${clue.imageBase64}`,
          fileName: 'existing-image',
          sizeBytes: estimateBase64ByteLength(clue.imageBase64),
        }
      : null

  return {
    prompt: clue.prompt,
    answer: clue.answer,
    pointValue: clue.pointValue,
    image,
  }
}

function estimateBase64ByteLength(base64: string): number {
  const paddingMatch = base64.match(/=+$/)
  const padding = paddingMatch ? paddingMatch[0].length : 0
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding)
}
