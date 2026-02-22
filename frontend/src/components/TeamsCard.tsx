import { Team } from '../api'

type TeamsCardProps = {
  teams: Team[]
}

export default function TeamsCard(props: TeamsCardProps) {
  const { teams } = props
  const rankedTeams = [...teams].sort((a, b) => b.score - a.score || a.displayOrder - b.displayOrder)

  return (
    <section className="card card-scoreboard">
      <h2>Live Scoreboard</h2>
      {rankedTeams.length === 0 ? (
        <p className="muted">No teams yet</p>
      ) : (
        <ul className="list scoreboard-list">
          {rankedTeams.map((team, index) => (
            <li key={team.id} className="scoreboard-item">
              <span className="scoreboard-rank">{index + 1}</span>
              <strong>{team.name}</strong>
              <span className="scoreboard-points">{team.score} pts</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
