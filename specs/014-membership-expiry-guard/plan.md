# Implementation Plan: Membership-expiry guard on the camera screen

**Branch**: `014-membership-expiry-guard` | **Date**: 2026-10-30 | **Spec**: [spec.md](./spec.md)

## Summary

In `src/screens/camera.screen.js`, add a second `useEffect` that calls a new
`UserService.getMembershipEndTime()` on mount, parses `data.end_time`, and if it is strictly
before `Date.now()` shows a red, non-dismissable `@gorhom/bottom-sheet` over the screen with the
expiry message and contact details. Every failure path is fail-open. Copy lives in
`translation/en.json` and `translation/de.json` under a new `membership-expired` block.

## Technical Context

**Language/Version**: JavaScript, React 19.1.0, React Native 0.81.5, Expo SDK 54
**Primary Dependencies**: `@gorhom/bottom-sheet@^4.6.4`, `react-native-gesture-handler`,
  `UserService` (`src/services/user/user.service.ts`) over `axiosInstance`
  (`src/services/interceptor/axiosInstance.js`), `i18n-js` via `TranslationContext`,
  `Linking` (RN core)
**Storage**: none
**Testing**: manual on device (spec did not request automated tests)
**Target Platform**: iOS and Android
**Constraints**: JS-only, OTA-shippable (NFR-001)
**Scale/Scope**: one screen modified, two translation files, one small presentational component

## Key decisions

1. **Core `BottomSheet`, not `BottomSheetModal`.** The app mounts `GestureHandlerRootView` at the
   root (`App.js`) but has **no** `BottomSheetModalProvider`. The core `BottomSheet` needs only
   the gesture root, so it works without touching `App.js`. (`bottomSheetSelector.component.js`
   uses the modal variant and relies on being rendered under a provider; do not copy that here.)

2. **Non-dismissable.** `enablePanDownToClose={false}`, no backdrop `pressBehavior="close"`, a
   single high snap point (e.g. `["100%"]`) and `index={0}` so it opens blocking and stays.

3. **Data access mirrors `UserService`.** Add a `getMembershipEndTime()` method to
   `UserService` (`src/services/user/user.service.ts`) following the same shape as `createUser`,
   but `axiosInstance.get("user/membership-end-time")` — `API_URL = "user"`, so the path is
   `user/membership-end-time`. No `userId` param: the server reads `req.user.user_id` from the
   token, which the request interceptor attaches from SecureStore `"token"`. Return
   `response.data` (the `{ success, data }` envelope). Also add its signature to
   `UserServiceType` in `src/@types/user/index.ts`. Note the base URL is `config.BASE_URL` here
   (not `config.SERVER_HOST`, which `useRequest` uses).

4. **Fail-open everywhere.** The call is wrapped so that a 404, `success: false`, missing
   `end_time`, thrown error or timeout all result in "no sheet". Only a parsed date strictly
   `< Date.now()` sets the expired state. The axios response interceptor already toasts network
   errors; the guard adds none.

5. **Date parsing.** `end_time` is a MySQL `DATETIME` string like `"2027-03-08 16:23:20"`. iOS
   `Date.parse` rejects the space form, so normalise: `new Date(String(end_time).replace(" ", "T"))`.
   Guard against `NaN` (treat as not-expired → fail-open).

6. **Cancellation.** Mirror the existing camera-permission effect: a `cancelled` flag so a
   resolved response is dropped if the screen unmounted.

## Component sketch

```jsx
// src/components/membershipExpiredSheet.component.js  (new, presentational)
// Core BottomSheet, red background, i18n copy, tappable tel:/mailto: via Linking.
```

```ts
// user.service.ts — new UserService method (API_URL = "user")
async getMembershipEndTime(): Promise<any> {
  const response = await axiosInstance.get(`${API_URL}/membership-end-time`);
  return responseData(response); // { success, data: { time, duration, end_time } }
},
```

```jsx
// camera.screen.js additions
const { i18n } = useContext(TranslationContext);
const [expired, setExpired] = useState(false);

useEffect(() => {
  let cancelled = false;
  (async () => {
    try {
      const res = await UserService.getMembershipEndTime();
      const end = res?.success ? res?.data?.end_time : null;
      if (!end) return;                       // null / 404 / no field -> ignore
      const endMs = new Date(String(end).replace(" ", "T")).getTime();
      if (!Number.isNaN(endMs) && endMs < Date.now() && !cancelled) {
        setExpired(true);
      }
    } catch {
      /* fail-open: never block on a failed check */
    }
  })();
  return () => { cancelled = true; };
}, []);
```

## Translation keys (new block, both files)

```jsonc
"membership-expired": {
  "title": "...",         // EN: "Membership expired" / DE: "Mitgliedschaft abgelaufen"
  "message": "...",       // the "please contact ..." sentence
  "phone": "+971 56 399 83 00",
  "email": "office2@german-emirates-club.com"
}
```

## Project Structure

```text
specs/014-membership-expiry-guard/{spec.md, plan.md, tasks.md}
src/services/user/user.service.ts                     # add getMembershipEndTime()
src/@types/user/index.ts                              # add its signature to UserServiceType
src/screens/camera.screen.js                          # modified
src/components/membershipExpiredSheet.component.js     # new
translation/en.json, translation/de.json             # new block
```
