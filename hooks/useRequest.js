import axios from "axios";
import { Alert } from "react-native";
import { config } from "../src/utils/constants";
import useAuth from "./useAuth";
import refreshAccessToken from "../helper/refreshAccessToken";
import { navigate } from "../src/navigation/navigate";

const MAX_RETRY = 3;

export default function useRequest() {
  const {
    refreshToken,
    accessToken,
    setAccessToken,
    signout,
    setNoConnection,
    setNoConnectionRetry,
    initialize,
  } = useAuth();

  const httpRequest = async (
    url,
    method,
    body = undefined,
    header = undefined,
    signal = undefined,
    token = accessToken,
    retry = 0
  ) => {
    try {
      if (retry > MAX_RETRY) {
        return;
      }
      console.log(`URL Called: (${method.toUpperCase()})`, url);
      const options = {
        method,
        url,
        data: body,
        baseURL: config.SERVER_HOST,
        signal,
        timeout: 15000,
        headers: {
          Authorization: `Bearer ${token}`,
          ...header,
        },
      };
      if (!url || !method) {
        return;
      }
      const response = await axios.request(options);

      return Promise.resolve(response.data);
    } catch (error) {
      // Alert.alert(
      //   "Error",
      //   `${error}, ${error.response}, ${error.response.status}`
      // );
      if (error && error.response && error.response.status >= 0) {
        switch (error.response.status) {
          case 0:
            if (retry >= MAX_RETRY) {
              alert("NO CONNECTION");
              setNoConnection(true);
              setNoConnectionRetry({
                fn: () => {
                  initialize();
                },
              });
            }

            //retry
            return await httpRequest(
              url,
              method,
              body,
              header,
              signal,
              token,
              ++retry
            );

          case 401:
            //refresh token
            const response = await refreshAccessToken(refreshToken).catch(
              (_signout) => {
                console.log("MESSAGE:", _signout);
                if (_signout) {
                  Alert.alert(
                    "Notice",
                    "You have already logged in from another device!"
                  );
                  return signout();
                }
              }
            );
            if (response) {
              setAccessToken(response);
              //retry
              return await httpRequest(
                url,
                method,
                body,
                header,
                signal,
                response
              );
            }

            // signOut();
            throw error;
          case 403:
            const { title = "Alert", message = "Error Occurred" } =
              error.response.data;
            Alert.alert(title, message);
            throw JSON.parse(JSON.stringify(error.response));
          case 500:
            console.error(error.response);
            throw error.response;
        }
      }
    }
  };

  return httpRequest;
}
