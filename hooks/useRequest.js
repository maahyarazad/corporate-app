import axios from "axios";
import { Alert } from "react-native";
import { config } from "../src/utils/constants";
import useAuth from "./useAuth";
import refreshAccessToken from "../helper/refreshAccessToken";

export default function useRequest() {
  const { refreshToken, accessToken, setAccessToken, signOut } = useAuth();

  const httpRequest = async (
    url,
    method,
    body = undefined,
    token = accessToken,
    retry = 0
  ) => {
    try {
      if (retry > 3) {
        return;
      }
      const options = {
        method,
        url,
        data: body,
        baseURL: config.SERVER_HOST,
        timeout: 15000,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      if (!url || !method) {
        return;
      }
      const response = await axios.request(options);

      return Promise.resolve(response.data);
    } catch (error) {
      console.error(error);
      switch (error.response.status) {
        case 0:
          //retry
          return await httpRequest(url, method, body, token, ++retry);

        case 401:
          //refresh token
          console.log("bobooo");
          const response = await refreshAccessToken(refreshToken).catch(
            (signout) => {
              console.log("WHAT ", signout);
              if (signout) {
                Alert.alert(
                  "Notice",
                  "You have already logged in from another device!"
                );
                return signOut();
              }
            }
          );
          if (response) {
            setAccessToken(response);
            //retry
            return await httpRequest(url, method, body, response);
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
  };

  return httpRequest;
}
