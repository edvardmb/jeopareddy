import './DesignPreview.css'

export default function DesignPreview() {
  const categories = ['Science', 'Movies', 'History', 'Music', 'Sports']
  const values = [100, 200, 300, 400, 500]

  return (
    <section className="preview-shell" aria-label="Design preview">
      <header className="preview-hero">
        <div>
          <p className="preview-kicker">Friendly Learning Mockup</p>
          <h2>Jeopareddy Design Preview</h2>
          <p className="preview-subtitle">
            A colorful, playful UI direction inspired by learning apps. This preview is visual only and does not change game
            behavior.
          </p>
        </div>
        <div className="preview-status-card">
          <div className="preview-pill preview-pill-blue">Draft</div>
          <strong>Friday Trivia Night</strong>
          <span>5 categories • 3 teams • Ready to host</span>
          <button type="button">Continue To Host Control</button>
        </div>
      </header>

      <div className="preview-grid">
        <section className="preview-card preview-card-blue">
          <div className="preview-card-head">
            <h3>Create a New Game</h3>
            <span className="preview-tag">Primary</span>
          </div>
          <p>Start a fresh board with a title and jump directly into setup.</p>
          <label>
            Game title
            <input type="text" value="Friday Trivia Night" readOnly />
          </label>
          <div className="preview-actions">
            <button type="button">Create Game</button>
            <button type="button" className="secondary">
              Duplicate Last
            </button>
          </div>
        </section>

        <section className="preview-card preview-card-green">
          <div className="preview-card-head">
            <h3>Teams & Turn Order</h3>
            <span className="preview-tag">Setup</span>
          </div>
          <p>First team added starts. Turn order rotates automatically while playing.</p>
          <ul className="preview-team-list">
            <li>
              <span className="rank">1</span>
              <span>Team A</span>
              <span className="score">600 pts</span>
              <span className="turn-badge">Your Turn</span>
            </li>
            <li>
              <span className="rank">2</span>
              <span>Team B</span>
              <span className="score">400 pts</span>
            </li>
            <li>
              <span className="rank">3</span>
              <span>Team C</span>
              <span className="score">200 pts</span>
            </li>
          </ul>
          <div className="preview-actions">
            <button type="button">Add Team</button>
            <button type="button" className="secondary">
              Edit Teams
            </button>
          </div>
        </section>
      </div>

      <section className="preview-card preview-card-yellow preview-board-wrap">
        <div className="preview-card-head">
          <h3>Play View Mockup</h3>
          <span className="preview-tag">Live Game</span>
        </div>
        <div className="preview-play-top">
          <div className="preview-turn-banner">
            <span>Now answering</span>
            <strong>Team A</strong>
          </div>
          <div className="preview-scoreboard">
            <div className="preview-score-title">Scoreboard</div>
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

      <section className="preview-modal-demo" aria-label="Clue modal preview">
        <div className="preview-modal-card">
          <div className="preview-modal-top">
            <span className="preview-pill preview-pill-green">Team A&apos;s Turn</span>
            <span className="preview-pill preview-pill-yellow">300 points</span>
          </div>
          <h3>Question</h3>
          <p className="preview-question">This planet is known as the Red Planet.</p>
          <label>
            Team answer
            <input type="text" value="mars" readOnly />
          </label>
          <div className="preview-actions">
            <button type="button">Submit Answer</button>
            <button type="button" className="secondary">
              Close
            </button>
          </div>
          <p className="preview-feedback success">Correct! +300 points</p>
        </div>
      </section>
    </section>
  )
}
