import { GameListItem } from "../api";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { translateGameStatus } from "../i18nHelpers";
import { Box, Button, Heading, Input, Text } from "@chakra-ui/react";

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
    <Box as="section" className="card card-sky">
      <Heading as="h2" size="md">
        {t("components.loadGameCard.title")}
      </Heading>
      <Text className="muted">{t("components.loadGameCard.subtitle")}</Text>
      <Box className="row">
        <Box className="field">
          <label htmlFor="load-game-id">
            {t("components.loadGameCard.gameIdLabel")}
          </label>
          <Input
            id="load-game-id"
            value={gameIdInput}
            onChange={(event) => onGameIdChange(event.target.value)}
            placeholder={t("components.loadGameCard.gameIdPlaceholder")}
          />
        </Box>
        <Button
          className="btn-primary"
          disabled={isBusy || !gameIdInput}
          onClick={onLoad}
        >
          {t("components.loadGameCard.loadGame")}
        </Button>
        <Button className="btn-secondary" disabled={isBusy} onClick={onRefresh}>
          {t("components.loadGameCard.refreshList")}
        </Button>
      </Box>

      <Box className="inline-note">{t("components.loadGameCard.orChoose")}</Box>
      {games.length === 0 ? (
        <Text className="muted">{t("components.loadGameCard.noGames")}</Text>
      ) : (
        <Box className="row">
          <Box className="field">
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
            <Text className="tiny muted">
              {t("components.loadGameCard.chooseAndLoad")}
            </Text>
          </Box>
          <Button
            className="btn-primary"
            disabled={isBusy || !selectedGameId}
            onClick={() => onLoadFromList(selectedGameId)}
          >
            {t("components.loadGameCard.loadSelected")}
          </Button>
        </Box>
      )}
    </Box>
  );
}
