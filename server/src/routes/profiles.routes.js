import { Router } from "express";
import redis from "../services/redisClient.js";

const r = Router();

r.get("/:id", async (req, res) => {
  const raw = await redis.get(`profile:${req.params.id}`);
  if (!raw) return res.status(404).json({ success: false });
  res.json({ success: true, profile: JSON.parse(raw) });
});

export default r;