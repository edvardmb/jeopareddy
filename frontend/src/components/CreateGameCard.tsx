import { useTranslation } from "react-i18next";
import { Box, Button, Heading, Input, Text } from "@chakra-ui/react";

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
    <Box as="section" className="card card-blue">
      <Heading as="h2" size="md">
        {t("components.createGameCard.title")}
      </Heading>
      <Text className="muted">{t("components.createGameCard.subtitle")}</Text>
      <Box className="row">
        <Box className="field">
          <label htmlFor="create-game-title">
            {t("components.createGameCard.gameTitleLabel")}
          </label>
          <Input
            id="create-game-title"
            value={gameTitle}
            onChange={(event) => onGameTitleChange(event.target.value)}
            placeholder={t("components.createGameCard.gameTitlePlaceholder")}
          />
        </Box>
        <Button className="btn-primary" disabled={isBusy} onClick={onCreate}>
          {t("components.createGameCard.createButton")}
        </Button>
      </Box>
    </Box>
  );
}
