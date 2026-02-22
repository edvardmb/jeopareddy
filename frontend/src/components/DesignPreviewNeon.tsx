import './DesignPreviewNeon.css'

export default function DesignPreviewNeon() {
  const categories = ['Science', 'Movies', 'History', 'Music', 'Sports']
  const values = [100, 200, 300, 400, 500]

  return (
    <section className="neon-shell" aria-label="Game Night Neon design preview">
      <header className="neon-hero">
        <div className="neon-hero-main">
          <p className="neon-kicker">Game Night Neon Mockup</p>
          <h2>Arcade Energy For Living-Room Play</h2>
          <p>
            Bright tiles, bold scoreboards, and high-contrast game states inspired by Kahoot-like party interfaces. Visual
            preview only.
          </p>
          <div className="neon-hero-actions">
            <button type="button">Start Game Night</button>
            <button type="button" className="secondary">
              Load Existing
            </button>
          </div>
        </div>
        <aside className="neon-hero-side">
          <div className="neon-chip pink">Friday Trivia Night</div>
          <div className="neon-stat-grid">
            <div>
              <span>Categories</span>
              <strong>5</strong>
            </div>
            <div>
              <span>Teams</span>
              <strong>3</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>Draft</strong>
            </div>
            <div>
              <span>Mode</span>
              <strong>Host</strong>
            </div>
          </div>
        </aside>
      </header>

      <section className="neon-panels">
        <div className="neon-panel cyan">
          <h3>Host Control</h3>
          <p>Big primary actions and fast setup for teams, categories, and scoring.</p>
          <ul className="neon-bullets">
            <li>Start / Reset controls are visually separated</li>
            <li>Manual scoring is highlighted in orange</li>
            <li>Board state controls show revealed / answered states clearly</li>
          </ul>
        </div>

        <div className="neon-panel lime">
          <h3>Turn Tracker</h3>
          <p>Current team is always visible and glows in the scoreboard and answer modal.</p>
          <div className="neon-turn-box">
            <span>Now answering</span>
            <strong>Team A</strong>
            <small>Next: Team B</small>
          </div>
        </div>
      </section>

      <section className="neon-board-card">
        <div className="neon-board-top">
          <h3>Play Board</h3>
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
                  className={`neon-cell clue ${index === 2 && value === 200 ? 'pink' : ''} ${index === 4 && value === 500 ? 'used' : ''}`}
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
            <span className="neon-chip lime">Team A Turn</span>
            <span className="neon-chip yellow">300 points</span>
          </div>
          <h3>Question Card</h3>
          <p className="neon-question">This planet is known as the Red Planet.</p>
          <label>
            Answer
            <input type="text" value="mars" readOnly />
          </label>
          <div className="neon-hero-actions">
            <button type="button">Submit Answer</button>
            <button type="button" className="secondary">
              Close
            </button>
          </div>
          <p className="neon-feedback">Correct! +300 points</p>
        </div>
      </section>
    </section>
  )
}
