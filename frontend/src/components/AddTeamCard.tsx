type AddTeamCardProps = {
  teamName: string
  isBusy: boolean
  canOperateOnGame: boolean
  isLocked: boolean
  onTeamNameChange: (value: string) => void
  onAddTeam: () => void
}

export default function AddTeamCard(props: AddTeamCardProps) {
  const { teamName, isBusy, canOperateOnGame, isLocked, onTeamNameChange, onAddTeam } = props
  const isDisabled = isBusy || !canOperateOnGame || isLocked

  return (
    <section className={`card card-green ${isLocked ? 'card-disabled' : ''}`}>
      <h2>Teams Setup</h2>
      <p className="muted">Add each team before starting game play.</p>
      {isLocked && <p className="tiny section-lock-note">Team setup is disabled while the game is in progress.</p>}
      <div className="grid">
        <div className="field">
          <label htmlFor="team-name">Team Name</label>
          <input id="team-name" value={teamName} onChange={(event) => onTeamNameChange(event.target.value)} placeholder="Team name" disabled={isDisabled} />
        </div>
        <button className="btn-success" disabled={isDisabled} onClick={onAddTeam}>
          Save Team
        </button>
      </div>
    </section>
  )
}
