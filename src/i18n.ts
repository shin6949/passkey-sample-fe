import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enTranslations from "./locales/en.json";
// import koTranslations from "./locales/ko.json";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: enTranslations },
    // ko: { translation: koTranslations },
  },
  lng: "en", // 기본 언어 설정
  fallbackLng: "en", // 번역이 없을 경우 사용할 언어
  interpolation: {
    escapeValue: false, // React에서는 이미 XSS를 방지하므로 false로 설정
  },
});

export default i18n;
