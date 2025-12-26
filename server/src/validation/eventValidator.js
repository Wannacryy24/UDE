// server/src/validation/eventValidator.js

export function validateEventPayload(body) {
  const errors = [];

  // 1️⃣ must be an object
  if (!body || typeof body !== "object") {
    return { valid: false, errors: ["Body must be an object"] };
  }

  const { event, identifiers, properties, context, timestamp } = body;

  // 2️⃣ event must be non-empty string
  if (!event || typeof event !== "string") {
    errors.push("`event` is required and must be a string");
  }

  // 3️⃣ identifiers must exist and contain at least ONE entry
  if (!identifiers || typeof identifiers !== "object" || Object.keys(identifiers).length === 0) {
    errors.push("`identifiers` must contain at least 1 identifier (email/user_id/anonymous_id)");
  }

  // 4️⃣ properties must be an object (optional but type enforced)
  if (properties && typeof properties !== "object") {
    errors.push("`properties` must be an object if provided");
  }

  // 5️⃣ context must be object (optional)
  if (context && typeof context !== "object") {
    errors.push("`context` must be an object if provided");
  }

  // 6️⃣ timestamp validation — allow ISO or ms — convert later
  let parsedTimestamp = null;
  if (timestamp) {
    const t = new Date(timestamp);
    if (isNaN(t.getTime())) {
      errors.push("`timestamp` must be valid ISO string OR unix milliseconds");
    } else {
      parsedTimestamp = t;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    parsedTimestamp
  };
}