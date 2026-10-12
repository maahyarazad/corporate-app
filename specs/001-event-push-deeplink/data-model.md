# Phase 1 Data Model: Event Push Notification Deep Link

**Date**: 2026-08-25

This feature introduces no persisted storage. The entities below are in-memory shapes
that cross the notification boundary.

## Entity: PushDestination (server-side record, read-only here)

The triple the notification server records per dispatch, per the supplied log.

| Field | Type | Example | Notes |
|---|---|---|---|
| `destination_type` | string | `partner`, `event` | Determines the target screen |
| `destination_id` | integer | `1592`, `720` | Primary key of the target entity |
| `destination_label` | string | `20Four`, `BusinessBreakfast - AI Forum` | Human label; diagnostic only, not used for routing |

**Validation**: `destination_type` must be one of the supported types; `destination_id`
must be a positive integer. Both are already populated correctly server-side for
events — that is established by the log and is not in question.

## Entity: NotificationData (payload as received on device)

Read from `response.notification.request.content.data`. The literal key names are
**unconfirmed** until Phase A; see [contracts/push-payload.md](./contracts/push-payload.md).

| Field | Type | Required | Notes |
|---|---|---|---|
| type key | string | yes | One of `path` \| `destination_type` \| `type` |
| id key | string \| number | yes | One of `id` \| `destination_id` \| `entity_id` |
| other keys | any | no | Ignored by routing |

**Validation rules**

1. Missing or empty type key → unresolvable, no navigation.
2. Missing id key → unresolvable, no navigation.
3. Type is matched case-insensitively after trimming and stripping a trailing `s`
   (`Event`, `event`, `events` all resolve to `event`).
4. Id is coerced via `Number(...)`; `NaN` → unresolvable.

An unresolvable payload is a no-op plus a dev-only diagnostic. It is never a crash and
never a blank screen.

## Entity: ResolvedDestination (output of the resolver)

Returned by `resolvePushDestination(data)` in `src/utils/pushDestination.js`.

| Field | Type | Notes |
|---|---|---|
| `screen` | string | A screen name registered in `navigation.js` |
| `params` | object | Route params shaped for that specific screen |

**Mapping table** — the param key differs per screen; this asymmetry is real and is
the reason the resolver owns it rather than each call site.

| Normalised type | `screen` | `params` |
|---|---|---|
| `partner` | `Location View` | `{ locId: <number> }` |
| `event` | `Event Detail` | `{ id: <number> }` |
| `post` | `post-detail` | `{ id: <number>, origin: "push" }` |
| anything else | — | resolver returns `null` |

## Entity: EventDetail (existing API response)

Fetched by `EventDetailScreen` from `POST /v1/api/event/detail` with `{ id, lang }`.
Fields consumed by the screen today: `eventName`, `eventTime`, `eventPlace`, `lat`,
`lng`, `file`, `guests`, `registered`, and one of
`eventDescription` / `event_description` / `description`.

**State transitions added by this feature** — `EventDetailScreen` currently has only
an implicit null state, which is what produces the blank screen.

```text
idle ──fetch──▶ loading ──▶ loaded        (response.success && response.data)
                   │
                   ├──▶ empty            (response.success, no data)
                   │
                   └──▶ error            (thrown, or response.success === false)
```

`loading`, `empty`, and `error` must each render a visible state with a working back
control. Only `loaded` renders the event body.
