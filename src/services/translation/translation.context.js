import { createContext, useEffect, useState } from "react";
import { I18n } from "i18n-js";
import * as Localization from "expo-localization";
import { en } from "../../../translation/en.json";
import { de } from "../../../translation/de.json";
import * as SecureStorage from "expo-secure-store";
import moment from "moment";
import "moment/locale/de";

export const i18n = new I18n({ en, de });

export const TranslationContext = createContext();

export const TranslationContextProvider = ({ children }) => {
  // const i18n = new I18n(translations);
  const [lang, setLang] = useState("en");

  // async function loadTranslation(i18n, locale) {
  //   console.log(`../../translation/${locale}.json`);
  //   const response = await fetch(`../../../translation/${locale}.json`);
  //   const translations = await response.json();

  //   i18n.store(translations);
  // }

  // loadTranslation(i18n, "en");
  useEffect(() => {
    //retrieve stored language
    let isMounted = true;

    const getLanguage = async () => {
      const response = await SecureStorage.getItemAsync("language");
      if (isMounted) setLang(response);
    };

    getLanguage();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    i18n.locale = lang;
    moment.locale(lang);

    // console.log(moment(new Date("12/27/1994")).format("LLL"));
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
