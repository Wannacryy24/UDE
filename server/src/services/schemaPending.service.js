// server/src/services/schemaPending.service.js
import { clickhouse } from "./clickhouseClient.js";

export async function markPending(event, property, detectedType) {
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");

  await clickhouse.insert({
    table: "ude.event_schema_pending",
    format: "JSONEachRow",
    values: [
      {
        event,
        property,
        detected_type: detectedType,
        first_seen_at: now,
        last_seen_at: now
      }
    ]
  });
}