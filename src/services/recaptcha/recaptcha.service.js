import { Platform } from "react-native";
import {
  Recaptcha,
  RecaptchaAction,
} from "@google-cloud/recaptcha-enterprise-react-native";
import { config } from "../../utils/constants";

// reCAPTCHA Enterprise keys are platform-specific. Pick the key that matches the
// running platform; fall back to the legacy single key if a per-platform key was
// not configured. Using the wrong platform's key throws "Key type invalid".
const getSiteKey = () => {
  const platformKey =
    Platform.OS === "ios"
      ? config.RECAPTCHA_SITE_KEY_IOS
      : config.RECAPTCHA_SITE_KEY_ANDROID;
  return platformKey || config.RECAPTCHA_SITE_KEY;
};

// The reCAPTCHA Enterprise client must be initialized only ONCE during the
// app's lifetime. We cache the in-flight/resolved promise so repeated callers
// share the same client. On failure we clear the cache so a later call retries.
let clientPromise = null;

export const initRecaptcha = () => {
  if (!clientPromise) {
    const siteKey = getSiteKey();
    console.log(
      "[Recaptcha] fetchClient() platform:",
      Platform.OS,
      "siteKey present:",
      !!siteKey
    );
    clientPromise = Recaptcha.fetchClient(siteKey)
      .then((client) => {
        console.log("[Recaptcha] client ready");
        return client;
      })
      .catch((err) => {
        console.log("[Recaptcha] fetchClient FAILED:", err?.message || err);
        clientPromise = null; // allow a retry on the next call
        throw err;
      });
  }
  return clientPromise;
};

/**
 * Returns a fresh reCAPTCHA Enterprise token for the given action.
 * @param {string} action e.g. "register", "login"
 * @param {number} timeout milliseconds before the native call times out
 */
export const getRecaptchaToken = async (action = "submit", timeout = 10000) => {
  const client = await initRecaptcha();
  console.log("[Recaptcha] execute() action:", action);
  const token = await client.execute(RecaptchaAction.custom(action), timeout);
  console.log("[Recaptcha] token received, length:", token ? token.length : 0);
  return token;
};
