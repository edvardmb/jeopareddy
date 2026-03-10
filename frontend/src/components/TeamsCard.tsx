import { Team } from "../api";
import { useTranslation } from "react-i18next";
import { Box, Button, Heading, Text } from "@chakra-ui/react";

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
    <Box as="section" className="card card-scoreboard">
      <Heading as="h2" size="md">
        {t("components.teamsCard.title")}
      </Heading>
      {rankedTeams.length === 0 ? (
        <Text className="muted">{t("components.teamsCard.noTeams")}</Text>
      ) : (
        <Box as="ul" className="list scoreboard-list">
          {rankedTeams.map((team, index) => (
            <Box
              as="li"
              key={team.id}
              className={`scoreboard-item ${team.id === currentTurnTeamId ? "current-turn" : ""}`}
            >
              <Text as="span" className="scoreboard-rank">
                {index + 1}
              </Text>
              <Box as="strong">{team.name}</Box>
              <Text as="span" className="scoreboard-points">
                {team.score} {t("common.pointsShort")}
              </Text>
              {(onSetTurnTeamId || (isDraft && onDeleteTeam)) && (
                <Box className="scoreboard-actions">
                  {onSetTurnTeamId && (
                    <Button
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
                    </Button>
                  )}
                  {isDraft && onDeleteTeam && (
                    <Button
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
                    </Button>
                  )}
                </Box>
              )}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
