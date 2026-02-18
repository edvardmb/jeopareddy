import { Team } from '../api'

type ScoreEventCardProps = {
  teams: Team[]
  scoreTeamId: string
  scoreDelta: number
  scoreReason: string
  isBusy: boolean
  canOperateOnGame: boolean
  onScoreTeamIdChange: (value: string) => void
  onScoreDeltaChange: (value: number) => void
  onScoreReasonChange: (value: string) => void
  onApplyScore: () => void
}

export default function ScoreEventCard(props: ScoreEventCardProps) {
  const {
    teams,
    scoreTeamId,
    scoreDelta,
    scoreReason,
    isBusy,
    canOperateOnGame,
    onScoreTeamIdChange,
    onScoreDeltaChange,
    onScoreReasonChange,
    onApplyScore,
  } = props

  return (
    <section className="card">
      <h2>Manual Scoring</h2>
      <p className="muted">Apply positive or negative point adjustments.</p>
      <div className="grid">
        <div className="field">
          <label htmlFor="score-team">Team</label>
          <select id="score-team" value={scoreTeamId} onChange={(event) => onScoreTeamIdChange(event.target.value)}>
            <option value="">Select team</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="score-delta">Points Change</label>
          <input
            id="score-delta"
            value={scoreDelta}
            type="number"
            onChange={(event) => onScoreDeltaChange(Number(event.target.value))}
            placeholder="+100 or -100"
          />
          <div className="tiny muted">Use negative values to subtract points.</div>
        </div>
        <div className="field">
          <label htmlFor="score-reason">Reason</label>
          <input id="score-reason" value={scoreReason} onChange={(event) => onScoreReasonChange(event.target.value)} placeholder="Reason" />
        </div>
        <button disabled={isBusy || !canOperateOnGame || !scoreTeamId} onClick={onApplyScore}>
          Apply Points
        </button>
      </div>
    </section>
  )
}
