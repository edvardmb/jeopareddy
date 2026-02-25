import { useTranslation } from 'react-i18next'
import './DesignPreview.css'

export default function DesignPreview() {
  const { t } = useTranslation()
  const categories = ['Science', 'Movies', 'History', 'Music', 'Sports']
  const values = [100, 200, 300, 400, 500]

  return (
    <section className="preview-shell" aria-label={t('components.designPreview.ariaLabel')}>
      <header className="preview-hero">
        <div>
          <p className="preview-kicker">{t('components.designPreview.heroKicker')}</p>
          <h2>{t('components.designPreview.heroTitle')}</h2>
          <p className="preview-subtitle">
            {t('components.designPreview.heroSubtitle')}
          </p>
        </div>
        <div className="preview-status-card">
          <div className="preview-pill preview-pill-blue">{t('status.draft')}</div>
          <strong>Friday Trivia Night</strong>
          <span>{t('components.designPreview.readyStatus')}</span>
          <button type="button">{t('components.designPreview.continueHost')}</button>
        </div>
      </header>

      <div className="preview-grid">
        <section className="preview-card preview-card-blue">
          <div className="preview-card-head">
            <h3>{t('components.designPreview.createTitle')}</h3>
            <span className="preview-tag">{t('components.designPreview.primaryTag')}</span>
          </div>
          <p>{t('components.designPreview.createSubtitle')}</p>
          <label>
            {t('components.designPreview.gameTitleLabel')}
            <input type="text" value="Friday Trivia Night" readOnly />
          </label>
          <div className="preview-actions">
            <button type="button">{t('components.designPreview.createGame')}</button>
            <button type="button" className="secondary">
              {t('components.designPreview.duplicateLast')}
            </button>
          </div>
        </section>

        <section className="preview-card preview-card-green">
          <div className="preview-card-head">
            <h3>{t('components.designPreview.teamsTitle')}</h3>
            <span className="preview-tag">{t('components.designPreview.setupTag')}</span>
          </div>
          <p>{t('components.designPreview.teamsSubtitle')}</p>
          <ul className="preview-team-list">
            <li>
              <span className="rank">1</span>
              <span>Team A</span>
              <span className="score">600 {t('common.pointsShort')}</span>
              <span className="turn-badge">{t('components.designPreview.yourTurn')}</span>
            </li>
            <li>
              <span className="rank">2</span>
              <span>Team B</span>
              <span className="score">400 {t('common.pointsShort')}</span>
            </li>
            <li>
              <span className="rank">3</span>
              <span>Team C</span>
              <span className="score">200 {t('common.pointsShort')}</span>
            </li>
          </ul>
          <div className="preview-actions">
            <button type="button">{t('components.designPreview.addTeam')}</button>
            <button type="button" className="secondary">
              {t('components.designPreview.editTeams')}
            </button>
          </div>
        </section>
      </div>

      <section className="preview-card preview-card-yellow preview-board-wrap">
        <div className="preview-card-head">
          <h3>{t('components.designPreview.playViewTitle')}</h3>
          <span className="preview-tag">{t('components.designPreview.liveGameTag')}</span>
        </div>
        <div className="preview-play-top">
          <div className="preview-turn-banner">
            <span>{t('components.designPreview.nowAnswering')}</span>
            <strong>Team A</strong>
          </div>
          <div className="preview-scoreboard">
            <div className="preview-score-title">{t('components.designPreview.scoreboard')}</div>
            <ul>
              <li className="is-current">
                <span>Team A</span>
                <strong>600</strong>
              </li>
              <li>
                <span>Team B</span>
                <strong>400</strong>
              </li>
              <li>
                <span>Team C</span>
                <strong>200</strong>
              </li>
            </ul>
          </div>
        </div>

        <div className="preview-board" role="presentation">
          <div className="preview-board-row preview-board-header">
            {categories.map((category) => (
              <div key={category} className="preview-cell header">
                {category}
              </div>
            ))}
          </div>
          {values.map((value) => (
            <div key={value} className="preview-board-row">
              {categories.map((category, index) => (
                <button
                  key={`${category}-${value}`}
                  type="button"
                  className={`preview-cell clue ${value === 300 && index === 1 ? 'active' : ''} ${value === 500 && index === 4 ? 'used' : ''}`}
                >
                  {value}
                </button>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="preview-modal-demo" aria-label={t('components.designPreview.questionTitle')}>
        <div className="preview-modal-card">
          <div className="preview-modal-top">
            <span className="preview-pill preview-pill-green">{t('components.designPreview.teamTurnPill')}</span>
            <span className="preview-pill preview-pill-yellow">{t('components.designPreview.pointsPill')}</span>
          </div>
          <h3>{t('components.designPreview.questionTitle')}</h3>
          <p className="preview-question">This planet is known as the Red Planet.</p>
          <label>
            {t('components.designPreview.teamAnswerLabel')}
            <input type="text" value="mars" readOnly />
          </label>
          <div className="preview-actions">
            <button type="button">{t('components.designPreview.submitAnswer')}</button>
            <button type="button" className="secondary">
              {t('common.close')}
            </button>
          </div>
          <p className="preview-feedback success">{t('components.designPreview.feedbackCorrect')}</p>
        </div>
      </section>
    </section>
  )
}
