import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enTranslation from "./locales/en/translation.json";
import noTranslation from "./locales/no/translation.json";

export const defaultNS = "translation";
export const supportedLanguages = ["en", "no"] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

export const resources = {
  en: { translation: enTranslation },
  no: { translation: noTranslation },
} as const;

function getInitialLanguage(): SupportedLanguage {
  const savedLanguage = globalThis.localStorage?.getItem("jeopareddy.language");
  if (savedLanguage === "en" || savedLanguage === "no") {
    return savedLanguage;
  }

  const browserLanguage = globalThis.navigator?.language?.toLowerCase() ?? "en";
  return browserLanguage.startsWith("no") ? "no" : "en";
}

void i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLanguage(),
  fallbackLng: "en",
  defaultNS,
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
