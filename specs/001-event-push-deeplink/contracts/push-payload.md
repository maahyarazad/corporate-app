# Contract: Push Notification Data Payload

**Status**: Type/id key names PENDING device confirmation (Phase A of [../plan.md](../plan.md)).
**Consumer**: `resolvePushDestination(data)` in `src/utils/pushDestination.js`
**Producer**: notification server (outside this repository)

## Boundary

The client reads the payload from:

```text
response.notification.request.content.data
```

where `response` is delivered by `expo-notifications` via either
`addNotificationResponseReceivedListener` or `getLastNotificationResponseAsync()`.

## Accepted shapes

The resolver accepts any of the following, and treats them as equivalent. This
tolerance is deliberate: the client must route correctly whichever naming the server
emits, and must not silently fall through when the server changes it.

**Type — first non-empty of:** `path`, `destination_type`, `type`
**Id — first present of:** `id`, `destination_id`, `entity_id`

### Example — partner (works today)

```json
{ "path": "partner", "id": 1592 }
```

### Example — event (target shape)

```json
{ "path": "event", "id": 720 }
```

### Equivalent forms that MUST also resolve

```json
{ "destination_type": "event", "destination_id": 720 }
{ "destination_type": "event", "destination_id": "720" }
{ "path": "Events", "id": "720" }
```

## Normalisation rules

| Input | Rule | Result |
|---|---|---|
| `"Event"`, `"event"`, `"events"`, `" EVENT "` | trim, lowercase, strip one trailing `s` | `event` |
| `"720"` | `Number(...)` | `720` |
| `720` | `Number(...)` | `720` |
| `"abc"`, `null`, missing | unresolvable | `null` |
| unknown type e.g. `"magazine"` | unresolvable | `null` |

## Output contract

Returns `{ screen, params }` per the mapping table in
[../data-model.md](../data-model.md), or `null`.

`null` means: do not navigate, do not crash, emit a dev-only diagnostic naming the
unresolved payload.

## Confirmation record

Fill this in during Phase A from a dev build on a physical device. Until then the
key names above are tolerated possibilities, not established fact.

| destination_type | Raw `data` object observed on device | Resolved? |
|---|---|---|
| partner | _pending_ | _pending_ |
| event | _pending_ | _pending_ |
