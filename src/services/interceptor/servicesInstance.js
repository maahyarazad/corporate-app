import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { config } from "../../utils/constants";
import { showToast } from "../../Toast"; 



// 0 (Axios default) → no timeout (not recommended for production)
// 5,000 – 10,000 ms (5–10s) → common for APIs (fast services)
// 10,000 – 30,000 ms (10–30s) → typical for production apps
// >30,000 ms → only for long-running operations (uploads, reports, etc.)
export const axiosInstance = axios.create({
  baseURL: config.SERVICES_BASE_URL,
  timeout: 60000,
  timeoutErrorMessage: "Server Error, Please contact the developer!",
});

/* ================= REQUEST ================= */

axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ================= RESPONSE ================= */

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // An aborted request has no `error.response`, so it would otherwise fall
    // into the network-error branch below and toast. It also has to keep its
    // identity: reshaping it into a plain object strips `name`/`code` and
    // defeats `axios.isCancel` downstream.
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    if (!error.response) {

      showToast(
        "error",
        "Network Error",
        "Unable to reach server"
      );

      return Promise.reject({
        status: 0,
        title: "Network Error",
        message: "Unable to reach server",
      });
    }

    const { status, data } = error.response;

    const title = data?.title ?? "Alert";
    const message = data?.message ?? "Error Occurred";

    if (status === 403) {

      showToast(
        "error",
        "Unauthorized",
        message
      );

      return Promise.reject({ status, title: "Unauthorized", message });
    }

    if (status === 503) {
      // Reject with the same {status, title, message} shape as every other
      // branch: handing back the raw axios response leaked an object into
      // callers that pass the rejection straight to a toast.
      const unavailableTitle = data?.title ?? "Service Unavailable";
      const unavailableMessage = data?.message ?? "Could not reach the server";

      showToast("error", unavailableTitle, unavailableMessage);

      return Promise.reject({
        status,
        title: unavailableTitle,
        message: unavailableMessage,
      });
    }

    return Promise.reject({
      status,
      title,
      message,
    });
  }
);