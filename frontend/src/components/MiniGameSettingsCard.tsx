import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import InfoHint from "./InfoHint";
import { Box, Button, Heading, Input, Text } from "@chakra-ui/react";

type MiniGameSettingsCardProps = {
  title: string;
  description: string;
  includeToggleLabel: string;
  enabled: boolean;
  onToggleEnabled: () => void;
  appearancesPerGame: number;
  onAppearancesPerGameChange: (nextValue: number) => void;
  isBusy: boolean;
  isLocked: boolean;
  canOperateOnGame: boolean;
  appearancesInputId: string;
  appearancesHelpText: string;
  appearancesHelpLabel: string;
  stats: {
    totalAssigned: number;
    completed: number;
    remaining: number;
  };
  extraFields?: ReactNode;
  footnotes?: string[];
};

export default function MiniGameSettingsCard(props: MiniGameSettingsCardProps) {
  const { t } = useTranslation();
  const {
    title,
    description,
    includeToggleLabel,
    enabled,
    onToggleEnabled,
    appearancesPerGame,
    onAppearancesPerGameChange,
    isBusy,
    isLocked,
    canOperateOnGame,
    appearancesInputId,
    appearancesHelpText,
    appearancesHelpLabel,
    stats,
    extraFields,
    footnotes = [],
  } = props;

  return (
    <Box as="section" className={`card card-sky ${isLocked ? "card-disabled" : ""}`}>
      <Heading as="h2" size="md">
        {title}
      </Heading>
      <Text className="muted">{description}</Text>
      <Box className="grid">
        <Box className="field">
          <label>{includeToggleLabel}</label>
          <Button
            type="button"
            className={enabled ? "btn-success" : "btn-secondary"}
            disabled={isBusy || !canOperateOnGame || isLocked}
            onClick={onToggleEnabled}
          >
            {enabled ? t("common.enabled") : t("common.disabled")}
          </Button>
        </Box>
        <Box className="field">
          <Box className="field-label-row">
            <label htmlFor={appearancesInputId}>
              {t("sections.appearancesPerGame")}
            </label>
            <InfoHint text={appearancesHelpText} label={appearancesHelpLabel} />
          </Box>
          <Input
            id={appearancesInputId}
            type="number"
            min={0}
            max={25}
            disabled={isBusy || !canOperateOnGame || isLocked}
            value={appearancesPerGame}
            onChange={(event) =>
              onAppearancesPerGameChange(
                Math.max(0, Number(event.target.value) || 0),
              )
            }
          />
        </Box>
        {extraFields}
      </Box>
      <Text className="tiny muted">
        {t("sections.assignedStats", {
          total: stats.totalAssigned,
          completed: stats.completed,
          remaining: stats.remaining,
        })}
      </Text>
      {footnotes.map((note) => (
        <Text key={note} className="tiny muted">
          {note}
        </Text>
      ))}
    </Box>
  );
}
