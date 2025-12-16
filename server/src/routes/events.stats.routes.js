import { Router } from "express"
import { clickhouse } from "../services/clickhouseClient.js"

const router = Router();

/**
 * GET /events/count?event=signup
 * Returns total number of occurrences of an event
 */


router.get("/count", async (req, res) => {
    try {
        const event = req.query.event;

        if (!event) {
            return res.status(400).json({ success: false, error: "event is required" });
        }

        const result = await clickhouse.query({
            query: `
        SELECT count() AS count
        FROM ude.events
        WHERE event = {event:String}
      `,
            query_params: { event },
            format: "JSONEachRow"
        });

        const rows = await result.json();

        res.json({ success: true, event, count: rows[0].count });
    }
    catch (err) {
        console.error("❌ /events/count error:", err);
        res.status(500).json({ success: false });
    }
})

/**
 * GET /events/by-day?event=signup
 */
router.get("/by-day", async (req, res) => {
  try {
    const event = req.query.event;

    if (!event) {
      return res.status(400).json({ success: false, error: "event is required" });
    }

    const result = await clickhouse.query({
      query: `
        SELECT 
          toDate(timestamp) AS day,
          count() AS count
        FROM ude.events
        WHERE event = {event:String}
        GROUP BY day
        ORDER BY day ASC
      `,
      query_params: { event },
      format: "JSONEachRow"
    });

    const rows = await result.json();

    res.json({ success: true, event, data: rows });
  } catch (err) {
    console.error("❌ /events/by-day error:", err);
    res.status(500).json({ success: false });
  }
});

/**
 * GET /events/stats/unique?event=signup
 * Returns unique users for an event
 */
router.get("/unique", async (req, res) => {
  try {
    const { event } = req.query;

    if (!event) {
      return res.status(400).json({
        success: false,
        error: "event is required"
      });
    }

    const result = await clickhouse.query({
      query: `
        SELECT countDistinct(profile_id) AS unique_users
        FROM ude.events
        WHERE event = {event:String}
      `,
      query_params: { event },
      format: "JSONEachRow"
    });

    const rows = await result.json();

    res.json({
      success: true,
      event,
      uniqueUsers: rows[0].unique_users
    });
  } catch (err) {
    console.error("❌ /events/stats/unique error:", err);
    res.status(500).json({ success: false });
  }
});

export default router;