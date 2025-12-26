// server/src/services/eventRegistry.service.js
import { clickhouse } from "./clickhouseClient.js";

function inferType(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

export async function registerEvent(eventName, properties = {}) {
  if (!eventName || typeof properties !== "object") return;

  const now = new Date().toISOString().slice(0, 19).replace("T", " ");

  for (const [propertyName, value] of Object.entries(properties)) {
    const type = inferType(value);

    const existing = await clickhouse.query({
      query: `
        SELECT property_type
        FROM ude.event_registry
        WHERE event_name = {event:String}
        AND property_name = {property:String}
        LIMIT 1
      `,
      query_params: { event: eventName, property: propertyName },
      format: "JSONEachRow"
    });

    const rows = await existing.json();
    const prevType = rows.length ? rows[0].property_type : null;

    await clickhouse.insert({
      table: "ude.event_registry",
      format: "JSONEachRow",
      values: [{
        event_name: eventName,
        property_name: propertyName,
        property_type: prevType || type,
        first_seen_at: prevType ? undefined : now,
        last_seen_at: now,
        status: prevType && prevType !== type ? "type_changed" : "active"
      }]
    });

    if (prevType && prevType !== type) {
      await clickhouse.insert({
        table: "ude.event_property_conflicts",
        format: "JSONEachRow",
        values: [{
          event_name: eventName,
          property_name: propertyName,
          expected_type: prevType,
          received_type: type,
          first_seen_at: now,
          last_seen_at: now,
          count: 1
        }]
      });
    }
  }
}