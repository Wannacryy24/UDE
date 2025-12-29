import { Router } from "express";
import { clickhouse } from "../services/clickhouseClient.js";

const r = Router();

r.get("/count", async (req, res) => {
  const { event } = req.query;
  const q = await clickhouse.query({
    query: `SELECT count() AS count FROM ude.events WHERE event = {e:String}`,
    query_params: { e: event },
    format: "JSONEachRow"
  });
  res.json({ success: true, count: (await q.json())[0].count });
});

r.get("/unique", async (req, res) => {
  const { event } = req.query;
  const q = await clickhouse.query({
    query: `SELECT countDistinct(profile_id) AS unique_users FROM ude.events WHERE event = {e:String}`,
    query_params: { e: event },
    format: "JSONEachRow"
  });
  res.json({ success: true, uniqueUsers: (await q.json())[0].unique_users });
});

export default r;