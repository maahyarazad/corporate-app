import React, { useContext } from "react";
import { AuthContext } from "../src/services/auth_v2/auth.context";

const useAuth = () => {
  return useContext(AuthContext);
};

export default useAuth;
