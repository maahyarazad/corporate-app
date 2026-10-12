import React, { createContext, useCallback, useMemo, useRef } from "react";
import { showToast } from "../../Toast";

export const AlertContext = createContext(null);

const AlertContextProvider = ({ children }) => {
  const isAlertShown = useRef(false);

  // useCallback, not just useMemo on the value: showAlert reads only a ref and
  // a module import, so it can be genuinely stable. Memoizing the value while
  // rebuilding this every render would be a memo that never hits.
  const showAlert = useCallback(({ title = "Alert", message }) => {
    if (!isAlertShown.current) {
      isAlertShown.current = true;
      showToast("info", title, message);
      // The toast auto-dismisses; release the guard so later alerts can show.
      isAlertShown.current = false;
    }
  }, []);

  // Both entries are stable, so this value is allocated once for the app's life.
  const value = useMemo(
    () => ({ showAlert, isAlertShown }),
    [showAlert]
  );

  return (
    <AlertContext.Provider value={value}>{children}</AlertContext.Provider>
  );
};

export default AlertContextProvider;
