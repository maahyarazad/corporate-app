import axios from "axios";
import { Alert } from "react-native";
import { config } from "../src/utils/constants";
import useAuth from "./useAuth";
import refreshAccessToken from "../helper/refreshAccessToken";
import { navigate } from "../src/navigation/navigate";
import useUser from "./useUser";
import useAlert from "./useAlert";
import { isCancel } from "../src/utils/cancellation";
import {
  clearCacheByPolicy,
  makeCacheKey,
  readCache,
  writeCache,
} from "../utils/apiCache";
import { invalidationsFor, policyFor } from "../utils/cachePolicy";

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
        // console.log(
        //   `----------------------------------------------\nRetry #${retry}\nAccess Token: ${token}`
        // );
      }
    //   console.log(`URL Called: (${method.toUpperCase()})`, url);

    //   if (url) console.log("REQ RESPONSE", options);

      // ---- cache read -----------------------------------------------------
      //
      // Deliberately placed *after* the expiry check above rather than at the
      // very top of the function. The check is a cheap boolean in the normal
      // case, and returning a cached payload ahead of it would let a user with
      // an expired card go a full TTL without being sent to re-verification.
      //
      // `retry === 0` is the load-bearing condition. httpRequest calls itself
      // with ++retry for timeouts, connection failures and post-refresh 401s; a
      // retry exists precisely because the caller needs the network, so serving
      // one from cache would make it a silent no-op.
      const candidatePolicy = retry === 0 ? policyFor(url, method) : null;

      // A user-scoped policy is only safe once the key carries an account id.
      // If there is no id yet - still signing in, or the profile has not
      // loaded - the request is not cached at all. A miss is always safe; a row
      // written under a placeholder scope is the cross-account bug this feature
      // exists to prevent.
      const scopeId =
        candidatePolicy?.scope === "user"
          ? user?.userData?.user_id ?? null
          : undefined;

      const cachePolicy =
        candidatePolicy?.scope === "user" && !scopeId ? null : candidatePolicy;

      const cacheKey = cachePolicy
        ? makeCacheKey(url, body, cachePolicy.id, scopeId)
        : null;

      if (cachePolicy) {
        const cached = await readCache(cacheKey, cachePolicy.ttlMs);

        // A cache fault resolves to null, so this is a miss and falls through.
        if (cached !== null && cached !== undefined) {
          return cached;
        }
      }

      const response = await axios.request({
        timeoutErrorMessage: "Request Timeout",
        ...options,
      });

      // ---- cache write ----------------------------------------------------
      //
      // Success path only. Every error path below returns or throws without
      // reaching here, which is what keeps `error.response.data` from the
      // `default:` branch, aborts and timeouts out of the cache - caching one of
      // those would pin a failure for the whole TTL.
      //
      // Not awaited: writeCache never throws, and a request must not wait on
      // bookkeeping.
      if (cachePolicy && response?.data) {
        writeCache(cacheKey, response.data);
      }

      // ---- cache invalidation ---------------------------------------------
      //
      // A mutation the server accepted may have made cached reads wrong, so
      // every entry belonging to the policies it dirties is evicted. Addressed
      // by policy id rather than by key: one policy covers many keys (every
      // partner id, every language), and the keys themselves are opaque hashes.
      //
      // Only on success. Evicting after a failed mutation would turn a server
      // error into a cache-thrash loop, refetching everything the user could
      // not actually change.
      if (!cachePolicy) {
        for (const dirtied of invalidationsFor(url, method)) {
          clearCacheByPolicy(dirtied.id);
        }
      }

      return Promise.resolve(response.data);
      
    } catch (error) {

      // A caller aborted via `signal`. Rethrow ahead of the retry/status
      // handling below: a cancelled request has no `error.response`, so it
      // would otherwise fall through the whole block and resolve to
      // `undefined`, making an abort indistinguishable from an empty response.
      // It must also never be retried.
      if (isCancel(error)) {
        throw error;
      }

      if (error.code === "ECONNABORTED") {

        if (retry >= MAX_RETRY) {
          Alert.alert(
            "Request Timeout Error",
            "The request took too long to complete. Please check your network connection and try again."
          );
          return;
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
  

      }
      // Alert.alert(
      //   "Error",
      //   `${error}, ${error.response}, ${error.response.status}`
      // );
      if (error && error.response && error.response.status >= 0) {
        // Alert.alert("Error Code", error.response.status);
        // console.log("ERROR:", error.response.status, error.response.data);

        switch (error.response.status) {
          case 0:
            // console.log("NO CONNECTION", config.SERVER_HOST + url);
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
            // console.log("401 ERROR", error.response.data);



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
              signout();
              user.setUserData(null);
              return;
            }

            //refresh token
            const response = await refreshAccessToken(refreshToken).catch(
              (logout) => {
                if (logout) {
                  showAlert({
                    title: "Token Invalid",
                    message: "Please login again.",
                  });
                  signout();
                  user.setUserData(null);
                  return;
                }
              }
            );

            if (response) {
            //   console.log("REFRESHING TOKEN");
              renewAccessToken(response);
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
            console.log(error.response);
            throw error.response;
          default:
            return error.response.data;
        }
      }
    }
  };

  return httpRequest;
}
