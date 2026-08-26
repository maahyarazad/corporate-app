# Feature Specification: Event Push Notification Deep Link

**Feature Branch**: `001-event-push-deeplink`
**Created**: 2026-08-25
**Status**: Draft
**Input**: "push notification works perfectly on partner offers - but events doesn't work even though it captures the destination_id and destination_type in the server"

## Summary

Push notifications dispatched with `destination_type = "partner"` open the correct
partner screen in the mobile app. Push notifications dispatched with
`destination_type = "event"` are delivered successfully (Expo reports
`expo_status = ok`, `total_success = 2`, `total_failure = 0`) but tapping them does
not land the user on the event.

Delivery is therefore **not** the problem. The break is on the client side, between
the notification payload arriving and the Event Detail screen becoming visible.

### Evidence supplied

| destination_type | destination_id | destination_label | expo_status | total_success | outcome in app |
|---|---|---|---|---|---|
| partner | 1592 | 20Four | ok | 2 | works |
| event | 720 | BusinessBreakfast - AI Forum | ok | 2 | does not work |

Both rows share the same title, body, `app_id = 2`, and `is_test = 1`. The only
difference is the destination pair.

## User Scenarios & Testing

### US-001 — Tap an event push while the app is backgrounded (Priority: P1)

A member receives "AI Forum 2026 – Register now" while the app is in the background
and taps the notification.

**Acceptance Scenarios**

1. **Given** the app is backgrounded and authenticated, **When** the member taps an
   event push carrying destination id 720, **Then** the app foregrounds and displays
   the Event Detail screen for event 720 with title, date, place, cover image, map,
   and the attend/unattend action.
2. **Given** the same push, **When** the event detail request fails or returns no
   event, **Then** the member sees an explicit error state with a working back
   control — never a blank screen.

### US-002 — Tap an event push from a cold start (Priority: P1)

**Acceptance Scenarios**

1. **Given** the app process is not running, **When** the member taps an event push,
   **Then** after launch and authentication the app lands on Event Detail for that
   event exactly once (no duplicate stacked screens).

### US-003 — Partner pushes keep working (Priority: P1)

**Acceptance Scenarios**

1. **Given** a partner push with destination id 1592, **When** it is tapped,
   **Then** the app opens Location View for 1592 — behaviour unchanged from today.

### US-004 — Unknown or malformed destination (Priority: P2)

**Acceptance Scenarios**

1. **Given** a push whose destination type is unrecognised or whose id is missing,
   **When** it is tapped, **Then** the app opens normally to its default screen and
   records a diagnostic entry; it must not crash or hang.

### Edge Cases

- Push tapped while the member is unauthenticated or mid-login.
- `destination_id` arriving as the string `"720"` rather than the number `720`.
- Event 720 not available in the member's current language.
- Push tapped twice, or both the cold-start replay and the live listener firing for
  the same tap.
- Push tapped while Event Detail for a different event is already open.

## Requirements

### Functional Requirements

- **FR-001**: The app MUST navigate to Event Detail for `destination_id` when a push
  whose destination type denotes an event is tapped, in foreground, background, and
  cold-start states.
- **FR-002**: Push destination resolution MUST be tolerant of the payload key and
  value naming the server actually emits — including `destination_type`/`destination_id`
  in addition to the `path`/`id` keys the client reads today — and MUST match
  destination type case-insensitively and in singular or plural form.
- **FR-003**: `destination_id` MUST be normalised to the type the event detail
  request expects before the request is issued, regardless of whether it arrives as
  a string or a number.
- **FR-004**: A single notification tap MUST produce exactly one navigation.
- **FR-005**: Event Detail MUST render a distinguishable loading state, a failure
  state, and a not-found state. Every one of those states MUST expose a working back
  control.
- **FR-006**: A non-successful event detail response MUST surface an error to the
  member; it MUST NOT be swallowed silently.
- **FR-007**: The raw notification payload MUST be observable in development builds
  so the exact server key/value shape can be confirmed on a real device.
- **FR-008**: Partner and post destinations MUST continue to behave exactly as today.

### Key Entities

- **Push destination**: the `(destination_type, destination_id, destination_label)`
  triple the server records and ships inside the notification data payload.
- **Notification payload**: the `data` object Expo delivers under
  `response.notification.request.content.data`.
- **Event detail**: the event record fetched for a given event id and language.

## Success Criteria

- **SC-001**: Tapping an event push opens the correct Event Detail screen in 100% of
  attempts across foreground, background, and cold-start, on both iOS and Android.
- **SC-002**: Partner and post push behaviour is unchanged — zero regressions.
- **SC-003**: No push tap can result in a blank screen with no back control.
- **SC-004**: The exact server payload key/value shape for `event` is captured in
  writing, so the client contract stops being a guess.

## Assumptions

- The server is out of scope for code changes in this feature; the client is
  expected to adapt to whatever payload the server already sends. If diagnostics
  prove the server omits the destination pair from the Expo `data` object entirely,
  that becomes a separate server-side change and is called out rather than worked
  around.
- Expo delivery, token registration, and the notification permission flow are
  working, as the log evidences.
