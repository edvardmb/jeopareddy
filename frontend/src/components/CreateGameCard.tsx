import { useTranslation } from "react-i18next";

type CreateGameCardProps = {
  gameTitle: string;
  isBusy: boolean;
  onGameTitleChange: (value: string) => void;
  onCreate: () => void;
};

export default function CreateGameCard(props: CreateGameCardProps) {
  const { t } = useTranslation();
  const { gameTitle, isBusy, onGameTitleChange, onCreate } = props;

  return (
    <section className="card card-blue">
      <h2>{t("components.createGameCard.title")}</h2>
      <p className="muted">{t("components.createGameCard.subtitle")}</p>
      <div className="row">
        <div className="field">
          <label htmlFor="create-game-title">
            {t("components.createGameCard.gameTitleLabel")}
          </label>
          <input
            id="create-game-title"
            value={gameTitle}
            onChange={(event) => onGameTitleChange(event.target.value)}
            placeholder={t("components.createGameCard.gameTitlePlaceholder")}
          />
        </div>
        <button className="btn-primary" disabled={isBusy} onClick={onCreate}>
          {t("components.createGameCard.createButton")}
        </button>
      </div>
    </section>
  );
}
