import { Router } from "express";
import { clickhouse } from "../services/clickhouseClient.js";

const r = Router();

r.get("/recent", async (_, res) => {
  try {
    const q = await clickhouse.query({
      query: "SELECT * FROM ude.events ORDER BY timestamp DESC LIMIT 50",
      format: "JSONEachRow"
    });
    res.json({ success: true, events: await q.json() });
  } catch {
    res.status(500).json({ success: false });
  }
});

export default r;