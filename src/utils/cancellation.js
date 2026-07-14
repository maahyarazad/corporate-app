import axios from "axios";

// Axios rejects an aborted request with `CanceledError` (code `ERR_CANCELED`),
// while `fetch` and some Expo modules reject with a DOM `AbortError`. Both mean
// "we aborted this on purpose", so both count as a cancellation here.
export const isCancel = (error) =>
  axios.isCancel(error) || error?.name === "AbortError";

// For `promise.catch(ignoreCancel)` at an effect's call site. An intentional
// abort is silent; anything else is logged rather than left to surface as an
// unhandled rejection.
export const ignoreCancel = (error) => {
  if (!isCancel(error)) console.log("[unhandled effect error]", error);
};
