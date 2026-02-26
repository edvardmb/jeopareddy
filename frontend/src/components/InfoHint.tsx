import { useTranslation } from "react-i18next";

type InfoHintProps = {
  text: string;
  label?: string;
};

export default function InfoHint(props: InfoHintProps) {
  const { t } = useTranslation();
  const { text, label = t("common.info") } = props;

  return (
    <span className="info-hint" tabIndex={0} aria-label={`${label}: ${text}`}>
      <span className="info-hint-icon" aria-hidden="true">
        i
      </span>
      <span className="info-hint-tooltip" role="tooltip">
        {text}
      </span>
    </span>
  );
}
