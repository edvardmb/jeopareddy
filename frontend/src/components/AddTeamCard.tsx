import { useTranslation } from "react-i18next";
import { Box, Button, Heading, Input, Text } from "@chakra-ui/react";

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
    <Box as="section" className={`card card-green ${isLocked ? "card-disabled" : ""}`}>
      <Heading as="h2" size="md">
        {t("components.addTeamCard.title")}
      </Heading>
      <Text className="muted">{t("components.addTeamCard.subtitle")}</Text>
      {isLocked && (
        <Text className="tiny section-lock-note">
          {t("components.addTeamCard.locked")}
        </Text>
      )}
      <Box className="grid">
        <Box className="field">
          <label htmlFor="team-name">
            {t("components.addTeamCard.teamNameLabel")}
          </label>
          <Input
            id="team-name"
            value={teamName}
            onChange={(event) => onTeamNameChange(event.target.value)}
            placeholder={t("components.addTeamCard.teamNamePlaceholder")}
            disabled={isDisabled}
          />
        </Box>
        <Button
          className="btn-success"
          disabled={isDisabled}
          onClick={onAddTeam}
        >
          {t("components.addTeamCard.saveTeam")}
        </Button>
      </Box>
    </Box>
  );
}
