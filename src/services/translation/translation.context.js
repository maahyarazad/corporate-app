import { createContext, useEffect, useState } from "react";
import { I18n } from "i18n-js";
import * as Localization from "expo-localization";
import { en } from "../../../translation/en.json";
import { de } from "../../../translation/de.json";
import * as SecureStorage from "expo-secure-store";
import moment from "moment";
import "moment/locale/de";

// Initialize I18n with the language files
export const i18n = new I18n({ en, de });

// Create a context for providing translation capabilities throughout your app
export const TranslationContext = createContext();

// Provider component for the TranslationContext
export const TranslationContextProvider = ({ children }) => {
  const [lang, setLang] = useState("en"); // Default language is set to 'en'

  useEffect(() => {
    // SecureStorage reads can't be aborted; this only discards a resolved-but-
    // stale read.
    let cancelled = false;

    // Function to retrieve the stored language and set it
    const getLanguage = async () => {
      const storedLang = await SecureStorage.getItemAsync("language");
      // Use stored language or fallback to 'en' if null
      if (!cancelled) setLang(storedLang || "en");
    };

    getLanguage();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // Set the language for i18n and moment
    i18n.locale = lang;
    moment.locale(lang);

    // Persist the selected language setting
    const setLanguage = async () => {
      await SecureStorage.setItemAsync("language", lang);
    };

    setLanguage();
  }, [lang]);

  i18n.onChange(() => {
    console.log("I18n has changed!");
  });

  // i18n.defaultLocale = "de";

  return (
    <TranslationContext.Provider value={{ i18n, lang, setLang }}>
      {children}
    </TranslationContext.Provider>
  );
};
