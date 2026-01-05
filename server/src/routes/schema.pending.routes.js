import { Router } from "express";
import { clickhouse } from "../services/clickhouseClient.js";

const r = Router();

r.get("/", async (_, res) => {
  const q = await clickhouse.query({
    query: `
      SELECT event, property, detected_type, first_seen_at, last_seen_at
      FROM ude.event_schema_pending
      ORDER BY last_seen_at DESC LIMIT 200
    `,
    format: "JSONEachRow"
  });

  res.json({ success: true, pending: await q.json() });
});

export default r;

