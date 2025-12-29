// server/src/routes/schema.routes.js
import { Router } from "express";
import { clickhouse } from "../services/clickhouseClient.js";

const r = Router();

// list all event names
r.get("/events", async (_, res) => {
  try {
    const q = await clickhouse.query({
      query: `
        SELECT DISTINCT event AS event_name
        FROM ude.event_registry
        ORDER BY event ASC
      `,
      format: "JSONEachRow"
    });

    res.json({ success: true, events: await q.json() });
  } catch (err) {
    console.error("❌ /schema/events error", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// list schema for one event
r.get("/conflicts", async (_, res) => {
  try {
    const q = await clickhouse.query({
      query: `
        SELECT event, property, expected_type, received_type, count, last_seen_at
        FROM ude.event_property_conflicts
        ORDER BY last_seen_at DESC
        LIMIT 200
      `,
      format: "JSONEachRow"
    });

    res.json({ success: true, conflicts: await q.json() });
  } catch (err) {
    console.error("❌ /schema/conflicts error:", err);
    res.status(500).json({ success: false });
  }
});

export default r;