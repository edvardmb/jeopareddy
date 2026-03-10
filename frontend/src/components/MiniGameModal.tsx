import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Box, Button, Heading, Text } from "@chakra-ui/react";

type MiniGameModalProps = {
  title: string;
  subtitle?: string;
  onClose: () => void;
  closeLabel?: string;
  headerVisual?: ReactNode;
  children: ReactNode;
};

export default function MiniGameModal(props: MiniGameModalProps) {
  const { t } = useTranslation();
  const {
    title,
    subtitle,
    onClose,
    closeLabel = t("components.miniGameModal.closeLabel"),
    headerVisual,
    children,
  } = props;

  return (
    <Box
      className="minigame-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="minigame-modal-title"
    >
      <Box className="minigame-modal-card">
        <Box className="minigame-glow minigame-glow-a" aria-hidden="true" />
        <Box className="minigame-glow minigame-glow-b" aria-hidden="true" />
        <Box className="minigame-glow minigame-glow-c" aria-hidden="true" />

        <Box className="minigame-modal-head">
          <Box>
            <Heading as="h3" size="md" id="minigame-modal-title">
              {title}
            </Heading>
            {subtitle && <Text className="tiny muted">{subtitle}</Text>}
          </Box>
          <Box className="minigame-head-actions">
            {headerVisual}
            <Button className="btn-secondary" type="button" onClick={onClose}>
              {closeLabel}
            </Button>
          </Box>
        </Box>

        {children}
      </Box>
    </Box>
  );
}
