import axios from "axios";

// Axios rejects aborted requests with `CanceledError` (code `ERR_CANCELED`),
// not the DOM's `AbortError`. Native `fetch` and some Expo modules do reject
// with `AbortError`, so both are treated as a cancellation here.
export const isCancel = (error) =>
  axios.isCancel(error) || error?.name === "AbortError";

// Swallows the rejection an intentional abort produces, so it doesn't surface
// as an unhandled error. Anything else is re-thrown for the caller to handle.
export const ignoreCancel = (error) => {
  if (!isCancel(error)) throw error;
};
