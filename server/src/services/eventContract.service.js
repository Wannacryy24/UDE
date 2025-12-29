const RESERVED = new Set([
  "profile_id",
  "distinct_id",
  "user_id",
  "created_at",
  "updated_at"
]);

const normalizeEventName = (e) =>
  e.trim().toLowerCase().replace(/\s+/g, "_");

const normalizeTimestamp = (t) => {
  if (!t) return new Date();
  if (typeof t === "number") return new Date(t * 1000);
  return new Date(t);
};

export function validateAndNormalizeEvent(payload = {}) {
  const errors = [];

  if (!payload.event || typeof payload.event !== "string")
    errors.push("event must be non-empty string");

  if (!payload.identifiers || Object.keys(payload.identifiers).length === 0)
    errors.push("identifiers must include at least 1 identifier");

  if (errors.length) return { valid: false, errors };

  const normalized = {
    event: normalizeEventName(payload.event),
    identifiers: payload.identifiers,
    properties: payload.properties ?? {},
    context: payload.context ?? {},
    timestamp: normalizeTimestamp(payload.timestamp)
  };

  // protect reserved keys
  const unsafe = {};
  for (const k of Object.keys(normalized.properties)) {
    if (RESERVED.has(k)) {
      unsafe[k] = normalized.properties[k];
      delete normalized.properties[k];
    }
  }
  if (Object.keys(unsafe).length)
    normalized.context._unsafe_reserved = unsafe;

  return { valid: true, event: normalized };
}