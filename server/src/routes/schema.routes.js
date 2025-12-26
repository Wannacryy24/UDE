// server/src/routes/schema.routes.js
import { Router } from "express";
import { clickhouse } from "../services/clickhouseClient.js";

const router = Router();


/**
 * GET /schema/events
 * → List all known events
 */

router.get("/events", async (req, res) => {
  try {
    const rows = await clickhouse.query({
      query: `
        SELECT DISTINCT event_name
        FROM ude.event_registry
        ORDER BY event_name
      `,
      format: "JSONEachRow"
    });

    const events = await rows.json();
    res.json({
      success: true,
      events: events.map(r => r.event_name)
    });
  } catch (err) {
    console.error("❌ GET /schema/events error:", err);
    res.status(500).json({ success: false });
  }
});

/**
 * GET /schema/events/:event
 * → Show all properties of a given event
 */
router.get("/events/:event", async (req, res) => {
  try {
    const event = req.params.event;

    const rows = await clickhouse.query({
      query: `
        SELECT property_name, property_type, first_seen_at, last_seen_at, status
        FROM ude.event_registry
        WHERE event_name = {event:String}
        ORDER BY property_name
      `,
      query_params: { event },
      format: "JSONEachRow"
    });

    const properties = await rows.json();

    res.json({
      success: true,
      event,
      properties
    });
  } catch (err) {
    console.error("❌ GET /schema/events/:event error:", err);
    res.status(500).json({ success: false });
  }
});

/**
 * GET /schema/conflicts
 * → Return fields that changed type (data problems)
 */
router.get("/conflicts", async (req, res) => {
  try {
    const rows = await clickhouse.query({
      query: `
        SELECT *
        FROM ude.event_property_conflicts
        ORDER BY last_seen_at DESC
        LIMIT 100
      `,
      format: "JSONEachRow"
    });

    const conflicts = await rows.json();

    res.json({
      success: true,
      conflicts
    });
  } catch (err) {
    console.error("❌ GET /schema/conflicts error:", err);
    res.status(500).json({ success: false });
  }
});

export default router;



