/**
 * Resolves a notification / deep-link data payload into a navigation target.
 *
 * The notification server records destinations as (destination_type,
 * destination_id) but the payload naming that reaches the device is not
 * guaranteed, so the type and id are each read from a list of accepted keys.
 * See specs/001-event-push-deeplink/contracts/push-payload.md.
 */

const TYPE_KEYS = ["path", "destination_type", "type"];
const ID_KEYS = ["id", "destination_id", "entity_id"];

const readType = (data) => {
  for (const key of TYPE_KEYS) {
    const value = data[key];

    if (typeof value === "string" && value.trim() !== "") {
      return value;
    }
  }

  return null;
};

const readId = (data) => {
  for (const key of ID_KEYS) {
    if (data[key] !== undefined && data[key] !== null && data[key] !== "") {
      return data[key];
    }
  }

  return null;
};

// "Event", " EVENT ", "events" all denote the same destination.
const normaliseType = (rawType) => {
  const trimmed = rawType.trim().toLowerCase();

  return trimmed.endsWith("s") ? trimmed.slice(0, -1) : trimmed;
};

// The payload may carry the id as a string; the detail endpoints expect a number.
const normaliseId = (rawId) => {
  const numeric = Number(rawId);

  return Number.isNaN(numeric) ? null : numeric;
};

const DESTINATIONS = {
  partner: (id) => ({ screen: "Location View", params: { locId: id } }),
  event: (id) => ({ screen: "Event Detail", params: { id } }),
  post: (id) => ({ screen: "post-detail", params: { id, origin: "push" } }),
};

const unresolved = (data, reason) => {
  if (__DEV__) {
    console.log("[pushDestination] unresolved payload:", reason, data);
  }

  return null;
};

export const resolvePushDestination = (data) => {
  if (!data || typeof data !== "object") {
    return unresolved(data, "no payload");
  }

  const rawType = readType(data);

  if (!rawType) {
    return unresolved(data, "no destination type");
  }

  const type = normaliseType(rawType);
  const build = DESTINATIONS[type];

  if (!build) {
    return unresolved(data, `unknown destination type "${rawType}"`);
  }

  const rawId = readId(data);

  if (rawId === null) {
    return unresolved(data, "no destination id");
  }

  const id = normaliseId(rawId);

  if (id === null) {
    return unresolved(data, `non-numeric destination id "${rawId}"`);
  }

  return build(id);
};
