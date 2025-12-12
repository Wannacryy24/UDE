import { Router } from "express";
import { clickhouse } from "../services/clickhouseClient.js";

const router = Router();

router.get("/recent", async (req, res) => {
  try {
    const rows = await clickhouse.query({
      query: "SELECT * FROM ude.events ORDER BY timestamp DESC LIMIT 50",
      format: "JSONEachRow"
    });

    const result = await rows.json();

    res.json({ success: true, events: result });
  } catch (err) {
    console.error("❌ Error fetching events:", err);
    res.status(500).json({ success: false });
  }
});

export default router;