import React, { useContext, useEffect } from "react";
import { LoadingOverlay } from "../components/loading/loading.component";
import { AuthContext } from "../services/auth/auth.context";

export const LogoutScreen = () => {
  const { logout } = useContext(AuthContext);

  useEffect(() => {
    logout();
  }, []);

  return <LoadingOverlay display={true} />;
};
