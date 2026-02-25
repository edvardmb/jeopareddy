import { Team } from '../api'

type TeamsCardProps = {
  teams: Team[]
  isDraft?: boolean
  isBusy?: boolean
  currentTurnTeamId?: string
  onSetTurnTeamId?: (teamId: string) => void
  onDeleteTeam?: (teamId: string) => void
}

export default function TeamsCard(props: TeamsCardProps) {
  const { teams, isDraft = false, isBusy = false, currentTurnTeamId, onSetTurnTeamId, onDeleteTeam } = props
  const rankedTeams = [...teams].sort((a, b) => b.score - a.score || a.displayOrder - b.displayOrder)

  return (
    <section className="card card-scoreboard">
      <h2>Live Scoreboard</h2>
      {rankedTeams.length === 0 ? (
        <p className="muted">No teams yet</p>
      ) : (
        <ul className="list scoreboard-list">
          {rankedTeams.map((team, index) => (
            <li key={team.id} className={`scoreboard-item ${team.id === currentTurnTeamId ? 'current-turn' : ''}`}>
              <span className="scoreboard-rank">{index + 1}</span>
              <strong>{team.name}</strong>
              <span className="scoreboard-points">{team.score} pts</span>
              {(onSetTurnTeamId || (isDraft && onDeleteTeam)) && (
                <div className="scoreboard-actions">
                  {onSetTurnTeamId && (
                    <button
                      type="button"
                      className={team.id === currentTurnTeamId ? 'btn-success scoreboard-turn-btn' : 'btn-secondary scoreboard-turn-btn'}
                      disabled={isBusy || team.id === currentTurnTeamId}
                      onClick={() => onSetTurnTeamId(team.id)}
                      aria-label={`Set ${team.name} as current turn`}
                    >
                      {team.id === currentTurnTeamId ? 'Turn' : 'Set Turn'}
                    </button>
                  )}
                  {isDraft && onDeleteTeam && (
                    <button
                      type="button"
                      className="btn-danger scoreboard-remove-btn"
                      disabled={isBusy}
                      onClick={() => onDeleteTeam(team.id)}
                      aria-label={`Remove ${team.name}`}
                      title={`Remove ${team.name}`}
                    >
                      Remove
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
