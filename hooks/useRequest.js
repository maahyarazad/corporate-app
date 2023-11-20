import axios from "axios";
import { Alert } from "react-native";
import { config } from "../src/utils/constants";
import useAuth from "./useAuth";
import refreshAccessToken from "../helper/refreshAccessToken";
import { navigate } from "../src/navigation/navigate";
import useUser from "./useUser";
import useAlert from "./useAlert";

const MAX_RETRY = 3;

export default function useRequest() {
  const {
    refreshToken,
    accessToken,
    renewAccessToken,
    signout,
    setNoConnection,
    setNoConnectionRetry,
    initialize,
    unauthorize,
    goToVerification,
    isAuthorized,
    hasSubmit,
  } = useAuth();

  const user = useUser();
  const { showAlert } = useAlert();

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

      //Check if user is expired
      if (
        user &&
        user?.userData?.member === 0 &&
        user?.userData?.expired === 1 &&
        user?.userData?.isAuthorized === 1 &&
        isAuthorized === 1 &&
        hasSubmit === 1
      ) {
        //Update user status to unauthorized in Server
        const unauth = await httpRequest("/v2/auth/unauthorize", "put");
        if (unauth.success) {
          await SecureStorage.setItemAsync("isAuthorized", "0");
          await SecureStorage.setItemAsync("hasSubmit", "0");
        }
        Alert.alert(
          "Card Expired",
          "Your card has expired. Please contact your HR Department to renew your card."
        );
        return goToVerification();
      }

      if (retry > 0) {
        console.log(
          `----------------------------------------------\nRetry #${retry}\nAccess Token: ${token}`
        );
      }
      console.log(`URL Called: (${method.toUpperCase()})`, url);
      const response = await axios.request({
        timeoutErrorMessage: "Request Timeout",
        ...options,
      });

      return Promise.resolve(response.data);
    } catch (error) {
      if (error.code === "ECONNABORTED") {
        Alert.alert(
          "Request Timeout Error",
          "The request took too long to complete. Please check your network connection and try again."
        );
        return;
      }
      // Alert.alert(
      //   "Error",
      //   `${error}, ${error.response}, ${error.response.status}`
      // );
      if (error && error.response && error.response.status >= 0) {
        // Alert.alert("Error Code", error.response.status);

        switch (error.response.status) {
          case 0:
            if (retry >= MAX_RETRY) {
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
            console.log("401 ERROR", error.response.data);
            if (error.response.data.expired) {
              alert(
                "Your card has expired, please upload a new one and change your card details in the profile page."
              );
              return unauthorize();
            }

            if (error.response.data.signout) {
              Alert.alert(
                "Notice",
                "You have already logged in from another device!"
              );
              return signout();
            }

            //refresh token
            await refreshAccessToken(refreshToken)
              .then(async (newAccessToken) => {
                console.log("New access token", newAccessToken);
                renewAccessToken(newAccessToken);

                return await httpRequest(
                  url,
                  method,
                  body,
                  header,
                  signal,
                  newAccessToken,
                  ++retry
                );
              })
              .catch((logout) => {
                if (logout) {
                  showAlert({
                    title: "Token Invalid",
                    message: "Please login again.",
                  });
                  return signout();
                }
              });

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
          default:
            return error.response.data;
        }
      }
    }
  };

  return httpRequest;
}
