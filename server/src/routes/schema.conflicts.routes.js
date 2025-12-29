// server/src/routes/schema.conflicts.routes.js
import { Router } from "express";
import { clickhouse } from "../services/clickhouseClient.js";

const router = Router();

/**
 * GET /schema/conflicts
 */
router.get("/", async (req, res) => {
  try {
    const q = await clickhouse.query({
      query: `
        SELECT
          event_name,
          property_name,
          expected_type,
          last_seen_type,
          mismatch_count,
          first_seen_at,
          last_seen_at
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

export default router;