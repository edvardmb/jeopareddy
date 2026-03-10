import { Game } from "../api";
import { useTranslation } from "react-i18next";
import { translateGameStatus } from "../i18nHelpers";
import { Box, Button, Heading, Text } from "@chakra-ui/react";

type CurrentGameCardProps = {
  game: Game;
  isBusy: boolean;
  onStart: () => void;
  onReset: () => void;
};

export default function CurrentGameCard(props: CurrentGameCardProps) {
  const { t } = useTranslation();
  const { game, isBusy, onStart, onReset } = props;

  return (
    <Box as="section" className="card card-green">
      <Heading as="h2" size="md">
        {t("components.currentGameCard.title")}
      </Heading>
      <Text>
        <Box as="strong">{game.title}</Box> ({game.id})
      </Text>
      <Text>
        {t("components.currentGameCard.statusLabel")}:{" "}
        {translateGameStatus(game.status, t)}
      </Text>
      <Box className="row">
        <Button
          className="btn-success"
          disabled={isBusy || game.status !== "Draft"}
          onClick={onStart}
        >
          {t("components.currentGameCard.enterPlayMode")}
        </Button>
        <Button className="btn-danger" disabled={isBusy} onClick={onReset}>
          {t("components.currentGameCard.resetGame")}
        </Button>
      </Box>
    </Box>
  );
}
