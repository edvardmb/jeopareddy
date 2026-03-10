import { useTranslation } from "react-i18next";
import { Box, Text } from "@chakra-ui/react";

type InfoHintProps = {
  text: string;
  label?: string;
};

export default function InfoHint(props: InfoHintProps) {
  const { t } = useTranslation();
  const { text, label = t("common.info") } = props;

  return (
    <Box
      as="span"
      className="info-hint"
      tabIndex={0}
      aria-label={`${label}: ${text}`}
    >
      <Text as="span" className="info-hint-icon" aria-hidden="true">
        i
      </Text>
      <Text as="span" className="info-hint-tooltip" role="tooltip">
        {text}
      </Text>
    </Box>
  );
}
