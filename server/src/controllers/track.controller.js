import { upsertProfile } from "../services/identity.service.js";

// In-memory event storage for now (we'll later move to ClickHouse)
const events = [];

export function handleTrack(req, res) {
  const { event, identifiers, properties = {}, context = {}, timestamp } = req.body || {};

  // Basic validation
  if (!event || !identifiers || Object.keys(identifiers).length === 0) {
    return res.status(400).json({
      success: false,
      error: "event and at least one identifier are required"
    });
  }

  // Resolve or create a profile for this event
  const { profileId, profile } = upsertProfile(identifiers, {}); // no traits on track

  const eventTimestamp = timestamp ? new Date(timestamp).toISOString() : new Date().toISOString();

  const eventRecord = {
    id: events.length + 1,
    event,
    profileId,
    identifiers,
    properties,
    context,
    timestamp: eventTimestamp
  };

  events.push(eventRecord);

  console.log("📩 /track event:", eventRecord);

  return res.json({
    success: true,
    profileId,
    eventId: eventRecord.id
  });
}

// (optional debug helper)
export function getAllEvents() {
  return events;
}