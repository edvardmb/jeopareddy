import { Team } from '../api'

type TeamsCardProps = {
  teams: Team[]
}

export default function TeamsCard(props: TeamsCardProps) {
  const { teams } = props
  const rankedTeams = [...teams].sort((a, b) => b.score - a.score || a.displayOrder - b.displayOrder)

  return (
    <section className="card">
      <h2>Live Scoreboard</h2>
      {rankedTeams.length === 0 ? (
        <p className="muted">No teams yet</p>
      ) : (
        <ul className="list">
          {rankedTeams.map((team) => (
            <li key={team.id}>
              <strong>{team.name}</strong> - {team.score} pts
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
