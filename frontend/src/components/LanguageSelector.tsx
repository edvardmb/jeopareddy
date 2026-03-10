import { useTranslation } from "react-i18next";
import type { SupportedLanguage } from "../i18n";
import { Box, Text } from "@chakra-ui/react";

type LanguageSelectorProps = {
  value: SupportedLanguage;
  onChange: (language: SupportedLanguage) => void;
};

export default function LanguageSelector(props: LanguageSelectorProps) {
  const { value, onChange } = props;
  const { t } = useTranslation();

  return (
    <Box as="label" className="language-picker">
      <Text as="span" className="tiny muted">
        {t("language.label")}
      </Text>
      <select
        aria-label={t("components.languageSelector.ariaLabel")}
        value={value}
        onChange={(event) => onChange(event.target.value as SupportedLanguage)}
      >
        <option value="en">{t("language.english")}</option>
        <option value="no">{t("language.norwegian")}</option>
      </select>
    </Box>
  );
}
