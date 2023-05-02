import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "../auth/auth.context";
import { UserService } from "./user.service";
import * as SecureStorage from "expo-secure-store";

export const UserContext = createContext();

export const UserContextProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState();
  const { user } = useContext(AuthContext);
  const [isHomeInit, setIsHomeInit] = useState(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      console.log("test");
      console.log("RETRIEVE AGAIN", user.token);
      const info = await SecureStorage.getItemAsync("user_details");
      console.log("info: ", info);
      if (info != undefined) {
        console.log("test1");
        // // console.log(info);
        console.log("------- retrieve (user_details) -------");
        console.log(user.user_id);

        if (isMounted) setUserInfo(JSON.parse(info));
      } else {
        console.log("test2");

        console.log("------- retrieve (server)-------");
        console.log(user.user_id);
        if (isMounted) getUserInfo(user.user_id);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const getUserInfo = (id) => {
    if (id != undefined) {
      UserService.getUserInfo(id)
        .then(async (user) => {
          setUserInfo(user);
          console.log("SERVER INFO:", user);
          await SecureStorage.setItemAsync(
            "user_details",
            JSON.stringify(user)
          );
        })
        .catch((err) => {
          console.log(err);
          alert("Something went wrong");
        });
    }
  };

  const setUserInfoAsync = async (change) => {
    try {
      await SecureStorage.setItemAsync("user_details", JSON.stringify(change));
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <UserContext.Provider
      value={{
        userInfo,
        getUserInfo,
        setUserInfo,
        isHomeInit,
        setIsHomeInit,
        setUserInfoAsync,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
