// server/src/services/eventRegistry.service.js
import { clickhouse } from "./clickhouseClient.js";

function inferType(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

export async function registerEvent(event, properties = {}) {
  if (!event || typeof properties !== "object") return;

  const now = new Date().toISOString().slice(0, 19).replace("T", " ");

  for (const [prop, value] of Object.entries(properties)) {
    const received = inferType(value);

    try {
      // 👇 fetch previous latest schema row
      const q = await clickhouse.query({
        query: `
          SELECT expected_type, last_seen_type, mismatch_count
          FROM ude.event_registry
          WHERE event = {e:String} AND property = {p:String}
          ORDER BY last_seen_at DESC
          LIMIT 1
        `,
        query_params: { e: event, p: prop },
        format: "JSONEachRow"
      });

      const rows = await q.json();
      const prev = rows.length ? rows[0] : null;
      const expected = prev?.expected_type || received;
      const mismatch = prev && prev.last_seen_type !== received;
      const newCount = mismatch ? (prev?.mismatch_count || 0) + 1 : (prev?.mismatch_count || 0);

      // 👇 write registry entry (correct columns)
      await clickhouse.insert({
        table: "ude.event_registry",
        format: "JSONEachRow",
        values: [
          {
            event,
            property: prop,
            expected_type: expected,
            last_seen_type: received,
            mismatch_count: newCount,
            first_seen_at: prev?.first_seen_at || now,
            last_seen_at: now
          }
        ]
      });

      // 👇 write conflict history table
      if (mismatch) {
        await clickhouse.insert({
          table: "ude.event_property_conflicts",
          format: "JSONEachRow",
          values: [
            {
              event,
              property: prop,
              expected_type: expected,
              received_type: received,
              first_seen_at: prev?.first_seen_at || now,
              last_seen_at: now,
              count: newCount
            }
          ]
        });

        console.warn(`⚠️ Conflict: ${event}.${prop} expected=${expected} got=${received}`);
      }

    } catch (err) {
      console.error("❌ Registry update failed:", err);
    }
  }
}