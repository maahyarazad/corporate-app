import React, { useContext } from "react";
import { UserContext } from "../src/services/user_v2/user.context";

const useUser = () => {
  return useContext(UserContext);
};

export default useUser;
