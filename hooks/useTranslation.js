import { I18n } from "i18n-js";
import { useContext } from "react";
import { TranslationContext } from "../src/services/translation/translation.context";
import { de } from "../translation/de.json";
import { en } from "../translation/en.json";

export const useTranslation = () => {
  const { lang } = useContext(TranslationContext);
  const i18n = new I18n({ en, de });

  i18n.locale = lang;

  return { i18n };
};
