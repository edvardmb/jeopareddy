import { GameListItem } from "../api";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { translateGameStatus } from "../i18nHelpers";

type LoadGameCardProps = {
  gameIdInput: string;
  isBusy: boolean;
  games: GameListItem[];
  onGameIdChange: (value: string) => void;
  onLoad: () => void;
  onRefresh: () => void;
  onLoadFromList: (gameId: string) => void;
};

export default function LoadGameCard(props: LoadGameCardProps) {
  const { t } = useTranslation();
  const {
    gameIdInput,
    isBusy,
    games,
    onGameIdChange,
    onLoad,
    onRefresh,
    onLoadFromList,
  } = props;
  const [selectedGameId, setSelectedGameId] = useState("");

  useEffect(() => {
    if (!selectedGameId && games.length > 0) {
      setSelectedGameId(games[0].id);
    }
  }, [games, selectedGameId]);

  return (
    <section className="card card-sky">
      <h2>{t("components.loadGameCard.title")}</h2>
      <p className="muted">{t("components.loadGameCard.subtitle")}</p>
      <div className="row">
        <div className="field">
          <label htmlFor="load-game-id">
            {t("components.loadGameCard.gameIdLabel")}
          </label>
          <input
            id="load-game-id"
            value={gameIdInput}
            onChange={(event) => onGameIdChange(event.target.value)}
            placeholder={t("components.loadGameCard.gameIdPlaceholder")}
          />
        </div>
        <button
          className="btn-primary"
          disabled={isBusy || !gameIdInput}
          onClick={onLoad}
        >
          {t("components.loadGameCard.loadGame")}
        </button>
        <button className="btn-secondary" disabled={isBusy} onClick={onRefresh}>
          {t("components.loadGameCard.refreshList")}
        </button>
      </div>

      <div className="inline-note">{t("components.loadGameCard.orChoose")}</div>
      {games.length === 0 ? (
        <p className="muted">{t("components.loadGameCard.noGames")}</p>
      ) : (
        <div className="row">
          <div className="field">
            <label htmlFor="game-dropdown">
              {t("components.loadGameCard.availableGames")}
            </label>
            <select
              id="game-dropdown"
              value={selectedGameId}
              onChange={(event) => setSelectedGameId(event.target.value)}
            >
              {games.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.title} ({translateGameStatus(game.status, t)})
                </option>
              ))}
            </select>
            <div className="tiny muted">
              {t("components.loadGameCard.chooseAndLoad")}
            </div>
          </div>
          <button
            className="btn-primary"
            disabled={isBusy || !selectedGameId}
            onClick={() => onLoadFromList(selectedGameId)}
          >
            {t("components.loadGameCard.loadSelected")}
          </button>
        </div>
      )}
    </section>
  );
}
