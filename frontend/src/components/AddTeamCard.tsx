type AddTeamCardProps = {
  teamName: string
  isBusy: boolean
  canOperateOnGame: boolean
  onTeamNameChange: (value: string) => void
  onAddTeam: () => void
}

export default function AddTeamCard(props: AddTeamCardProps) {
  const { teamName, isBusy, canOperateOnGame, onTeamNameChange, onAddTeam } = props

  return (
    <section className="card">
      <h2>Teams Setup</h2>
      <p className="muted">Add each team before starting game play.</p>
      <div className="grid">
        <div className="field">
          <label htmlFor="team-name">Team Name</label>
          <input id="team-name" value={teamName} onChange={(event) => onTeamNameChange(event.target.value)} placeholder="Team name" />
        </div>
        <button disabled={isBusy || !canOperateOnGame} onClick={onAddTeam}>
          Save Team
        </button>
      </div>
    </section>
  )
}
