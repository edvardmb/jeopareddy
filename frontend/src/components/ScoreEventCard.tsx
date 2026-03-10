import { Team } from "../api";
import { useTranslation } from "react-i18next";
import InfoHint from "./InfoHint";
import { Box, Button, Heading, Input, Text } from "@chakra-ui/react";

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
    <Box as="section" className="card card-orange">
      <Heading as="h2" size="md">
        {t("components.scoreEventCard.title")}
      </Heading>
      <Text className="muted">{t("components.scoreEventCard.subtitle")}</Text>
      <Box className="grid">
        <Box className="field">
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
        </Box>
        <Box className="field">
          <Box className="field-label-row">
            <label htmlFor="score-delta">
              {t("components.scoreEventCard.pointsChangeLabel")}
            </label>
            <InfoHint
              text={t("components.scoreEventCard.pointsChangeHelp")}
              label={t("components.scoreEventCard.pointsChangeHelpLabel")}
            />
          </Box>
          <Input
            id="score-delta"
            value={scoreDelta}
            type="number"
            onChange={(event) => onScoreDeltaChange(Number(event.target.value))}
            placeholder={t("components.scoreEventCard.pointsChangePlaceholder")}
          />
        </Box>
        <Box className="field">
          <label htmlFor="score-reason">
            {t("components.scoreEventCard.reasonLabel")}
          </label>
          <Input
            id="score-reason"
            value={scoreReason}
            onChange={(event) => onScoreReasonChange(event.target.value)}
            placeholder={t("components.scoreEventCard.reasonPlaceholder")}
          />
        </Box>
        <Button
          className="btn-warning"
          disabled={isBusy || !canOperateOnGame || !scoreTeamId}
          onClick={onApplyScore}
        >
          {t("components.scoreEventCard.applyPoints")}
        </Button>
      </Box>
    </Box>
  );
}
