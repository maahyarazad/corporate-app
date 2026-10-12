# Phase 0 Research: Event Push Notification Deep Link

**Date**: 2026-08-25
**Scope**: `GEC-Corporate` React Native / Expo client. Server code is not in this repository.

## What the code does today

### Notification tap handler — `src/screens/entertainer.screen.js:55-113`

```js
const notificationData = response?.notification?.request?.content?.data || {};
const path = notificationData?.path;
const id   = notificationData?.id;
if (!path) return;
switch (path) {
  case "partner": navigate("Location View", { locId: id }); break;
  case "event":   navigate("Event Detail",  { id });        break;
  case "post":    navigate("post-detail",   { id, origin: "push" }); break;
}
```

The handler is registered on `EntertainerScreen` mount, via both
`addNotificationResponseReceivedListener` and a one-shot
`getLastNotificationResponseAsync()` for the cold-start case
(`entertainer.screen.js:88-112`).

### Navigation targets — `navigation.js`

Both destinations are siblings in the same `MainStack`:

- `Location View` → `LocationViewScreen` (`navigation.js:475`)
- `Event Detail` → `EventDetailScreen` (`navigation.js:502`)

There is no second screen registered under either name anywhere in the tree
(verified against the full `name="…"` inventory of `navigation.js`), so
`navigate()` resolves unambiguously for both. `navigate()` itself
(`src/navigation/navigate.js`) is a plain `navigationRef.navigate` guarded by
`isReady()` — identical treatment for both destinations.

### Destination screens

- `LocationViewScreen` reads `route.params.locId` and fetches on mount.
- `EventDetailScreen` (`src/screens/events/eventDetail.screen.js:29-83`) reads
  `route.params.id` and POSTs `{ id, lang }` to `/v1/api/event/detail`.

## Findings

### Decision 1 — The defect is client-side, not delivery

**Rationale**: The server log shows `expo_status = ok`, `expo_success = 2`,
`expo_failure = 0`, `total_failure = 0` for the event row — identical to the partner
row. Expo accepted and delivered both. Anything downstream of acceptance is the
client's responsibility.

**Alternatives considered**: FCM-side failure — rejected, `fcm_success` and
`fcm_failure` are both 0 for *both* rows, so the FCM path is not in use for either.

### Decision 2 — Navigation wiring is symmetric, so routing is not the root cause

**Rationale**: Same navigator, same stack, same `navigate` helper, no name
collisions. Whatever breaks events does not break partners, so a difference that
applies equally to both cannot be it.

**Consequence**: The asymmetry must live in either (a) the payload the server emits
for events, or (b) what `EventDetailScreen` does after it mounts.

### Decision 3 — Primary hypothesis: the payload key/value for events does not match `path === "event"`

**Rationale**: The handler branches on `data.path` and reads `data.id`. The server
stores the destination as `destination_type` / `destination_id`. If the server maps
those onto `path`/`id` for partners but not for events — or emits `"events"`
plural, a different case, or a numeric type code — the `switch` falls through to
`default` and nothing happens at all, which matches the reported symptom precisely
(tap does nothing, no screen, no error).

This cannot be confirmed from this repository: the server that builds the Expo
payload is not here. It must be confirmed by logging the raw `data` object from a
real device.

**Mitigation regardless of confirmation**: normalise the payload at the boundary —
accept `destination_type`/`destination_id` alongside `path`/`id`, lowercase and
singularise the type, and coerce the id. This makes the client correct under either
naming and removes the class of bug rather than one instance.

**Alternatives considered**:
- *Server-side fix only* — rejected as the sole approach: the client reading one
  hard-coded key is brittle regardless of what the server does today.
- *Client-side only, no diagnostics* — rejected: without seeing the real payload the
  fix is a guess, and FR-007 exists specifically to end the guessing.

### Decision 4 — Confirmed secondary defect: `EventDetailScreen` renders a blank, inescapable screen on fetch failure

**Rationale**: This one is verifiable in the code, independent of the payload.

- The fetch only commits state when `response?.success` is truthy
  (`eventDetail.screen.js:64-67`). A `success: false` response sets nothing and
  shows nothing — no toast, no error state.
- The entire screen body, **including the back button**, is wrapped in
  `{eventDetails && ( … )}` (`eventDetail.screen.js:333`). With `eventDetails` null
  the member gets an empty white screen with no way back.
- The `catch` branch shows a toast but likewise leaves the screen empty.

So even if navigation succeeds, an event that fails to load for any reason —
wrong id type, unavailable in the current language, auth not yet ready on cold start
— presents as "events don't work". This defect is real, is on the event path only
(`LocationViewScreen` does not gate its chrome the same way), and must be fixed
whether or not it is the root cause.

**Decision**: Fix it as part of this feature. Loading / error / empty states with a
back control always mounted.

### Decision 5 — `destination_id` type coercion

**Rationale**: `destination_id` is an integer column server-side (`1592`, `720`) but
Expo `data` payloads routinely arrive as strings on the device. `LocationViewScreen`
passes `locId` straight into its request; `EventDetailScreen` passes `id` into
`/v1/api/event/detail`. If that endpoint is stricter about type than the partner
endpoint, `"720"` fails where `720` succeeds — producing exactly the blank screen of
Decision 4.

**Decision**: Coerce to a number at the payload boundary, and treat a non-numeric id
as an unhandled destination.

**Alternatives considered**: coercing inside `EventDetailScreen` — rejected, the
boundary is the right place; it fixes every consumer at once.

### Decision 6 — Duplicate navigation on cold start

**Rationale**: `getLastNotificationResponseAsync()` and
`addNotificationResponseReceivedListener` can both fire for the same tap on a cold
start, pushing the destination screen twice. Not the reported bug, but it is in the
code being changed and it violates FR-004.

**Decision**: De-duplicate by notification identifier, handling each response once.

**Alternatives considered**: dropping the cold-start replay — rejected, it is the
only mechanism that handles a tap from a terminated app.

### Decision 7 — Where the fix lives

**Decision**: Extract destination resolution out of `entertainer.screen.js` into a
small pure module, `src/utils/pushDestination.js`, and have both the notification
handler and `src/utils/urlRouter.js` use it.

**Rationale**: `urlRouter.js` already duplicates the same partner/event mapping for
deep links, with its own bug — a `find` callback at `urlRouter.js:28-30` whose body
`{ event.id === params.id; }` has no `return`, so `eventFound` is always
`undefined`. One resolver, one place to be correct, and the logic becomes unit
testable without a device.

**Alternatives considered**: patching `entertainer.screen.js` in place — rejected,
leaves the duplicate mapping and its dead code in `urlRouter.js` diverging further.

## Open question requiring device confirmation

**Q**: What are the literal keys and values of `response.notification.request.content.data`
for an `event` push versus a `partner` push?

This is the single fact that separates "the server maps events wrong" from "the
server maps events fine and the screen fails to load". Task 1 of the implementation
answers it. Every other task is worth doing under either answer.
