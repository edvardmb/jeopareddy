import { Team } from "../api";
import { useTranslation } from "react-i18next";

type TeamsCardProps = {
  teams: Team[];
  isDraft?: boolean;
  isBusy?: boolean;
  currentTurnTeamId?: string;
  onSetTurnTeamId?: (teamId: string) => void;
  onDeleteTeam?: (teamId: string) => void;
};

export default function TeamsCard(props: TeamsCardProps) {
  const { t } = useTranslation();
  const {
    teams,
    isDraft = false,
    isBusy = false,
    currentTurnTeamId,
    onSetTurnTeamId,
    onDeleteTeam,
  } = props;
  const rankedTeams = [...teams].sort(
    (a, b) => b.score - a.score || a.displayOrder - b.displayOrder,
  );

  return (
    <section className="card card-scoreboard">
      <h2>{t("components.teamsCard.title")}</h2>
      {rankedTeams.length === 0 ? (
        <p className="muted">{t("components.teamsCard.noTeams")}</p>
      ) : (
        <ul className="list scoreboard-list">
          {rankedTeams.map((team, index) => (
            <li
              key={team.id}
              className={`scoreboard-item ${team.id === currentTurnTeamId ? "current-turn" : ""}`}
            >
              <span className="scoreboard-rank">{index + 1}</span>
              <strong>{team.name}</strong>
              <span className="scoreboard-points">
                {team.score} {t("common.pointsShort")}
              </span>
              {(onSetTurnTeamId || (isDraft && onDeleteTeam)) && (
                <div className="scoreboard-actions">
                  {onSetTurnTeamId && (
                    <button
                      type="button"
                      className={
                        team.id === currentTurnTeamId
                          ? "btn-success scoreboard-turn-btn"
                          : "btn-secondary scoreboard-turn-btn"
                      }
                      disabled={isBusy || team.id === currentTurnTeamId}
                      onClick={() => onSetTurnTeamId(team.id)}
                      aria-label={t("components.teamsCard.setTurnAria", {
                        teamName: team.name,
                      })}
                    >
                      {team.id === currentTurnTeamId
                        ? t("components.teamsCard.turn")
                        : t("components.teamsCard.setTurn")}
                    </button>
                  )}
                  {isDraft && onDeleteTeam && (
                    <button
                      type="button"
                      className="btn-danger scoreboard-remove-btn"
                      disabled={isBusy}
                      onClick={() => onDeleteTeam(team.id)}
                      aria-label={t("components.teamsCard.removeAria", {
                        teamName: team.name,
                      })}
                      title={t("components.teamsCard.removeAria", {
                        teamName: team.name,
                      })}
                    >
                      {t("common.remove")}
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
