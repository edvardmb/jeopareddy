import { Game } from '../api'
import { useTranslation } from 'react-i18next'
import { translateGameStatus } from '../i18nHelpers'

type CurrentGameCardProps = {
  game: Game
  isBusy: boolean
  onStart: () => void
  onReset: () => void
}

export default function CurrentGameCard(props: CurrentGameCardProps) {
  const { t } = useTranslation()
  const { game, isBusy, onStart, onReset } = props

  return (
    <section className="card card-green">
      <h2>{t('components.currentGameCard.title')}</h2>
      <p>
        <strong>{game.title}</strong> ({game.id})
      </p>
      <p>{t('components.currentGameCard.statusLabel')}: {translateGameStatus(game.status, t)}</p>
      <div className="row">
        <button className="btn-success" disabled={isBusy || game.status !== 'Draft'} onClick={onStart}>
          {t('components.currentGameCard.enterPlayMode')}
        </button>
        <button className="btn-danger" disabled={isBusy} onClick={onReset}>
          {t('components.currentGameCard.resetGame')}
        </button>
      </div>
    </section>
  )
}
