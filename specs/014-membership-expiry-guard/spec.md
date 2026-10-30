# Feature Specification: Membership-expiry guard on the camera screen

**Feature Branch**: `014-membership-expiry-guard`

**Created**: 2026-10-30

**Status**: Draft

**Input**: User description: "on CameraScreen send a request to /membership-end-time in the useEffect; if the response is null ignore it; if it has a value and the value is smaller than now, use @gorhom/bottom-sheet to roll up a red screen saying the membership has expired with contact details, in English and German."

## Problem

A member whose membership has lapsed can still open the camera screen. There is no check on
that screen that compares their membership end date against the current date, so an expired
member sees the normal camera UI.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Expired member is blocked with a contact notice (Priority: P1)

When the camera screen loads, the app asks the server for the member's membership end time. If
that end time is in the past, a red bottom sheet rises and covers the screen telling the member
their membership has expired and how to get in touch.

**Why this priority**: it is the whole feature.

**Independent Test**: sign in as a member whose latest `usr_membership` row resolves to an
`end_time` before today, open the camera screen, and confirm the red expired sheet rises and
cannot be swiped away. Sign in as a current member and confirm the camera screen is untouched.

**Acceptance Scenarios**:

1. **Given** the endpoint returns `end_time` earlier than now, **When** the camera screen
   finishes loading, **Then** a red bottom sheet rises over the screen with the expiry message
   and the contact details, and it cannot be dismissed by swiping down or tapping outside.
2. **Given** the endpoint returns `end_time` later than now, **When** the camera screen loads,
   **Then** no sheet appears and the camera works as before.
3. **Given** the endpoint returns 404 / `success: false` / no `end_time` (null), **When** the
   camera screen loads, **Then** nothing happens — the member is not blocked.
4. **Given** the request errors or times out, **When** the camera screen loads, **Then** nothing
   happens — a failed check never blocks a member.
5. **Given** the device language is German, **When** the sheet is shown, **Then** its text is in
   German; in English otherwise.

### Edge Cases

- `end_time` exactly equal to now: treated as **not** expired (strictly `<` now blocks).
- The screen unmounts while the request is in flight: the response is discarded, no state set.
- The contact phone and email should be tappable where the platform allows (`tel:`, `mailto:`).

## Requirements *(mandatory)*

- **FR-001**: On mount, the camera screen MUST GET `user/membership-end-time` through
  `UserService` (`axiosInstance`), which attaches the `Bearer` token from SecureStore
  automatically, so the server reads `req.user.user_id`.
- **FR-002**: The guard MUST read `data.end_time` from the success payload and compare it, parsed
  as a date, against the current time.
- **FR-003**: A missing/null `end_time`, a non-success response, or any request failure MUST
  leave the screen unblocked (fail-open).
- **FR-004**: When `end_time` is strictly before now, the app MUST present a red, non-dismissable
  `@gorhom/bottom-sheet` covering the screen, stating the membership has expired and showing
  `+971 56 399 83 00` (Phone/WhatsApp) and `office2@german-emirates-club.com`.
- **FR-005**: All copy on the sheet MUST come from the translation files in both `en` and `de`.
- **NFR-001**: JS-only; `@gorhom/bottom-sheet` (4.6.4) is already a dependency. No native change.

## Success Criteria *(mandatory)*

- **SC-001**: An expired member cannot reach the camera controls from the camera screen.
- **SC-002**: A current member sees no change and no extra latency beyond one background request.
- **SC-003**: Server errors never block a member.
