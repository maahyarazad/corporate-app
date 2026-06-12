import { useEffect, useRef } from "react";
import { Platform } from "react-native";

// Android SMS User Consent auto-read.
//
// Loads `@eabdullazyanov/react-native-sms-user-consent` defensively: it's a
// native module, so if a JS bundle ever runs before the native rebuild that
// links it, `require` (which builds a NativeEventEmitter at import time on
// Android) could throw. We catch that and fall back to a no-op hook so the OTP
// screen still works via keyboard autofill / manual entry instead of crashing.
let useSmsUserConsentLib = null;
try {
  // Resolves to index.android.js on Android, and a no-op index.ios.js on iOS.
  useSmsUserConsentLib =
    require("@eabdullazyanov/react-native-sms-user-consent").useSmsUserConsent;
} catch (e) {
  useSmsUserConsentLib = null;
}

// Decided once at module load so the hook is always called in the same order
// (rules of hooks). On iOS the library hook already returns "" and does nothing.
const useSmsUserConsentSafe =
  typeof useSmsUserConsentLib === "function" ? useSmsUserConsentLib : () => "";

/**
 * Detects an incoming OTP SMS on Android via the SMS User Consent API and calls
 * onCode(code) once with the parsed digits. The system shows a one-time consent
 * prompt; no SMS permission and no backend app-hash are required. No-ops on iOS
 * (the keyboard `oneTimeCode` autofill covers that platform). Manual entry and
 * keyboard autofill remain available regardless.
 *
 * @param {object} opts
 * @param {number} opts.length   expected OTP length in digits
 * @param {boolean} opts.enabled pause detection (e.g. while a verify request is in flight)
 * @param {(code: string) => void} opts.onCode invoked once per distinct detected code
 */
export const useOtpAutoRead = ({ length = 4, enabled = true, onCode }) => {
  const detectedCode = useSmsUserConsentSafe(length);

  // Keep the latest callback without re-subscribing the effect to it.
  const onCodeRef = useRef(onCode);
  onCodeRef.current = onCode;

  // Fire once per distinct code so a Resend (new SMS) is still picked up.
  const lastHandledRef = useRef("");

  useEffect(() => {
    if (Platform.OS !== "android") return;
    if (!enabled) return;
    if (!detectedCode || detectedCode.length !== length) return;
    if (detectedCode === lastHandledRef.current) return;

    lastHandledRef.current = detectedCode;
    onCodeRef.current?.(detectedCode);
  }, [detectedCode, enabled, length]);
};

export default useOtpAutoRead;
