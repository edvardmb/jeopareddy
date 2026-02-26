import { useTranslation } from "react-i18next";

type AddTeamCardProps = {
  teamName: string;
  isBusy: boolean;
  canOperateOnGame: boolean;
  isLocked: boolean;
  onTeamNameChange: (value: string) => void;
  onAddTeam: () => void;
};

export default function AddTeamCard(props: AddTeamCardProps) {
  const { t } = useTranslation();
  const {
    teamName,
    isBusy,
    canOperateOnGame,
    isLocked,
    onTeamNameChange,
    onAddTeam,
  } = props;
  const isDisabled = isBusy || !canOperateOnGame || isLocked;

  return (
    <section className={`card card-green ${isLocked ? "card-disabled" : ""}`}>
      <h2>{t("components.addTeamCard.title")}</h2>
      <p className="muted">{t("components.addTeamCard.subtitle")}</p>
      {isLocked && (
        <p className="tiny section-lock-note">
          {t("components.addTeamCard.locked")}
        </p>
      )}
      <div className="grid">
        <div className="field">
          <label htmlFor="team-name">
            {t("components.addTeamCard.teamNameLabel")}
          </label>
          <input
            id="team-name"
            value={teamName}
            onChange={(event) => onTeamNameChange(event.target.value)}
            placeholder={t("components.addTeamCard.teamNamePlaceholder")}
            disabled={isDisabled}
          />
        </div>
        <button
          className="btn-success"
          disabled={isDisabled}
          onClick={onAddTeam}
        >
          {t("components.addTeamCard.saveTeam")}
        </button>
      </div>
    </section>
  );
}
