// server/src/services/eventContract.service.js

const RESERVED_PROPERTY_KEYS = new Set([
  "profile_id",
  "distinct_id",
  "user_id",
  "created_at",
  "updated_at"
]);

function normalizeEventName(event) {
  return event
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function normalizeTimestamp(ts) {
  if (!ts) return new Date();
  if (typeof ts === "number") return new Date(ts * 1000);
  return new Date(ts);
}

export function validateAndNormalizeEvent(payload = {}) {
  const errors = [];

  if (!payload.event || typeof payload.event !== "string")
    errors.push("event is required and must be a string");

  if (!payload.identifiers || typeof payload.identifiers !== "object" ||
      Object.keys(payload.identifiers).length === 0)
    errors.push("identifiers must contain at least one value");

  if (payload.properties && typeof payload.properties !== "object")
    errors.push("properties must be an object");

  if (payload.context && typeof payload.context !== "object")
    errors.push("context must be an object");

  let parsedTimestamp = null;
  if (payload.timestamp) {
    const t = new Date(payload.timestamp);
    if (isNaN(t.getTime()))
      errors.push("timestamp must be ISO string or UNIX MS");
    else parsedTimestamp = t;
  }

  if (errors.length) return { valid: false, errors };

  const normalized = {
    event: normalizeEventName(payload.event),
    identifiers: payload.identifiers,
    properties: payload.properties ?? {},
    context: payload.context ?? {},
    timestamp: parsedTimestamp || normalizeTimestamp(payload.timestamp)
  };

  const unsafe = {};
  for (const key of Object.keys(normalized.properties)) {
    if (RESERVED_PROPERTY_KEYS.has(key)) {
      unsafe[key] = normalized.properties[key];
      delete normalized.properties[key];
    }
  }
  if (Object.keys(unsafe).length)
    normalized.context._unsafe = unsafe;

  return { valid: true, event: normalized };
}