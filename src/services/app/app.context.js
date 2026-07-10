import { createContext, useEffect, useState } from "react";
import * as Constants from "expo-constants";
import { AppServices } from "./app.services";
import { config } from "../../utils/constants";
import { Platform } from "react-native";
import { isVersionOutdated } from "../../utils/isVersionOutdated";
import { isCancel } from "../../utils/cancellation";

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const [isOutdated, setIsOutdated] = useState(false);
  const [appState, setAppState] = useState({});

  useEffect(() => {
    const controller = new AbortController();

    checkAppVersion(controller.signal);

    return () => controller.abort();
  }, []);

  const checkAppVersion = async (signal) => {
    try {
      //CheckVersion API
      const data = {
        app_id: config.APP_ID,
        platform: Platform.OS,
      };
      const response = await AppServices.getLatestVersion(data, signal);

      setAppState(response.data);

      if (response.success) {
        if (isVersionOutdated(response.data.version) && response.data.require) {
          setIsOutdated(true);
        }
      }
    } catch (error) {
      if (isCancel(error)) return;
      console.log(error);
    }
  };

  const values = { isOutdated, appState };
 
  return <AppContext.Provider value={values}>{children}</AppContext.Provider>;
};
