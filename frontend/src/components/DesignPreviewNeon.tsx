import { useTranslation } from "react-i18next";
import "./DesignPreviewNeon.css";

export default function DesignPreviewNeon() {
  const { t } = useTranslation();
  const categories = ["Science", "Movies", "History", "Music", "Sports"];
  const values = [100, 200, 300, 400, 500];

  return (
    <section
      className="neon-shell"
      aria-label={t("components.designPreviewNeon.ariaLabel")}
    >
      <header className="neon-hero">
        <div className="neon-hero-main">
          <p className="neon-kicker">
            {t("components.designPreviewNeon.heroKicker")}
          </p>
          <h2>{t("components.designPreviewNeon.heroTitle")}</h2>
          <p>{t("components.designPreviewNeon.heroSubtitle")}</p>
          <div className="neon-hero-actions">
            <button type="button">
              {t("components.designPreviewNeon.startGameNight")}
            </button>
            <button type="button" className="secondary">
              {t("components.designPreviewNeon.loadExisting")}
            </button>
          </div>
        </div>
        <aside className="neon-hero-side">
          <div className="neon-chip pink">Friday Trivia Night</div>
          <div className="neon-stat-grid">
            <div>
              <span>{t("components.designPreviewNeon.categories")}</span>
              <strong>5</strong>
            </div>
            <div>
              <span>{t("components.designPreviewNeon.teams")}</span>
              <strong>3</strong>
            </div>
            <div>
              <span>{t("components.designPreviewNeon.status")}</span>
              <strong>{t("status.draft")}</strong>
            </div>
            <div>
              <span>{t("components.designPreviewNeon.mode")}</span>
              <strong>{t("components.designPreviewNeon.host")}</strong>
            </div>
          </div>
        </aside>
      </header>

      <section className="neon-panels">
        <div className="neon-panel cyan">
          <h3>{t("components.designPreviewNeon.hostControlTitle")}</h3>
          <p>{t("components.designPreviewNeon.hostControlSubtitle")}</p>
          <ul className="neon-bullets">
            <li>{t("components.designPreviewNeon.hostBullet1")}</li>
            <li>{t("components.designPreviewNeon.hostBullet2")}</li>
            <li>{t("components.designPreviewNeon.hostBullet3")}</li>
          </ul>
        </div>

        <div className="neon-panel lime">
          <h3>{t("components.designPreviewNeon.turnTrackerTitle")}</h3>
          <p>{t("components.designPreviewNeon.turnTrackerSubtitle")}</p>
          <div className="neon-turn-box">
            <span>{t("components.designPreviewNeon.nowAnswering")}</span>
            <strong>Team A</strong>
            <small>{t("components.designPreviewNeon.nextTeam")}</small>
          </div>
        </div>
      </section>

      <section className="neon-board-card">
        <div className="neon-board-top">
          <h3>{t("components.designPreviewNeon.playBoard")}</h3>
          <div className="neon-scoreboard">
            <div className="neon-score-row active">
              <span>Team A</span>
              <strong>1200</strong>
            </div>
            <div className="neon-score-row">
              <span>Team B</span>
              <strong>800</strong>
            </div>
            <div className="neon-score-row">
              <span>Team C</span>
              <strong>600</strong>
            </div>
          </div>
        </div>

        <div className="neon-board">
          <div className="neon-row">
            {categories.map((category) => (
              <div key={category} className="neon-cell header">
                {category}
              </div>
            ))}
          </div>
          {values.map((value) => (
            <div key={value} className="neon-row">
              {categories.map((category, index) => (
                <button
                  key={`${category}-${value}`}
                  type="button"
                  className={`neon-cell clue ${index === 2 && value === 200 ? "pink" : ""} ${index === 4 && value === 500 ? "used" : ""}`}
                >
                  {value}
                </button>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="neon-modal-demo">
        <div className="neon-modal">
          <div className="neon-modal-pills">
            <span className="neon-chip lime">
              {t("components.designPreviewNeon.teamATurn")}
            </span>
            <span className="neon-chip yellow">
              {t("components.designPreviewNeon.pointsPill")}
            </span>
          </div>
          <h3>{t("components.designPreviewNeon.questionCard")}</h3>
          <p className="neon-question">
            This planet is known as the Red Planet.
          </p>
          <label>
            {t("components.designPreviewNeon.answerLabel")}
            <input type="text" value="mars" readOnly />
          </label>
          <div className="neon-hero-actions">
            <button type="button">
              {t("components.designPreviewNeon.submitAnswer")}
            </button>
            <button type="button" className="secondary">
              {t("common.close")}
            </button>
          </div>
          <p className="neon-feedback">
            {t("components.designPreviewNeon.feedbackCorrect")}
          </p>
        </div>
      </section>
    </section>
  );
}
