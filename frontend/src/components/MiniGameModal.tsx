import { ReactNode } from 'react'

type MiniGameModalProps = {
  title: string
  subtitle?: string
  onClose: () => void
  closeLabel?: string
  headerVisual?: ReactNode
  children: ReactNode
}

export default function MiniGameModal(props: MiniGameModalProps) {
  const { title, subtitle, onClose, closeLabel = 'Close Mini-Game', headerVisual, children } = props

  return (
    <div className="minigame-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="minigame-modal-title">
      <div className="minigame-modal-card">
        <div className="minigame-glow minigame-glow-a" aria-hidden="true" />
        <div className="minigame-glow minigame-glow-b" aria-hidden="true" />
        <div className="minigame-glow minigame-glow-c" aria-hidden="true" />

        <div className="minigame-modal-head">
          <div>
            <h3 id="minigame-modal-title">{title}</h3>
            {subtitle && <p className="tiny muted">{subtitle}</p>}
          </div>
          <div className="minigame-head-actions">
            {headerVisual}
            <button className="btn-secondary" type="button" onClick={onClose}>
              {closeLabel}
            </button>
          </div>
        </div>

        {children}
      </div>
    </div>
  )
}
