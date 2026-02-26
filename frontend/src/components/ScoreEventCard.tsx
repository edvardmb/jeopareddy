import { Team } from "../api";
import { useTranslation } from "react-i18next";
import InfoHint from "./InfoHint";

type ScoreEventCardProps = {
  teams: Team[];
  scoreTeamId: string;
  scoreDelta: number;
  scoreReason: string;
  isBusy: boolean;
  canOperateOnGame: boolean;
  onScoreTeamIdChange: (value: string) => void;
  onScoreDeltaChange: (value: number) => void;
  onScoreReasonChange: (value: string) => void;
  onApplyScore: () => void;
};

export default function ScoreEventCard(props: ScoreEventCardProps) {
  const { t } = useTranslation();
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
  } = props;

  return (
    <section className="card card-orange">
      <h2>{t("components.scoreEventCard.title")}</h2>
      <p className="muted">{t("components.scoreEventCard.subtitle")}</p>
      <div className="grid">
        <div className="field">
          <label htmlFor="score-team">
            {t("components.scoreEventCard.teamLabel")}
          </label>
          <select
            id="score-team"
            value={scoreTeamId}
            onChange={(event) => onScoreTeamIdChange(event.target.value)}
          >
            <option value="">
              {t("components.scoreEventCard.selectTeam")}
            </option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <div className="field-label-row">
            <label htmlFor="score-delta">
              {t("components.scoreEventCard.pointsChangeLabel")}
            </label>
            <InfoHint
              text={t("components.scoreEventCard.pointsChangeHelp")}
              label={t("components.scoreEventCard.pointsChangeHelpLabel")}
            />
          </div>
          <input
            id="score-delta"
            value={scoreDelta}
            type="number"
            onChange={(event) => onScoreDeltaChange(Number(event.target.value))}
            placeholder={t("components.scoreEventCard.pointsChangePlaceholder")}
          />
        </div>
        <div className="field">
          <label htmlFor="score-reason">
            {t("components.scoreEventCard.reasonLabel")}
          </label>
          <input
            id="score-reason"
            value={scoreReason}
            onChange={(event) => onScoreReasonChange(event.target.value)}
            placeholder={t("components.scoreEventCard.reasonPlaceholder")}
          />
        </div>
        <button
          className="btn-warning"
          disabled={isBusy || !canOperateOnGame || !scoreTeamId}
          onClick={onApplyScore}
        >
          {t("components.scoreEventCard.applyPoints")}
        </button>
      </div>
    </section>
  );
}
