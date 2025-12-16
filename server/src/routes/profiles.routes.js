import { Router } from "express";
import redis from "../services/redisClient.js";

const router = Router();

/**
 * GET /profiles/:id
 */
router.get("/:id", async (req, res) => {
  try {
    const profileId = req.params.id;
    const key = `profile:${profileId}`;

    const raw = await redis.get(key);

    if (!raw) {
      return res.status(404).json({
        success: false,
        error: "Profile not found"
      });
    }

    const profile = JSON.parse(raw);

    res.json({
      success: true,
      profile
    });
  } catch (err) {
    console.error("❌ /profiles/:id error:", err);
    res.status(500).json({ success: false });
  }
});

/**
 * GET /profiles/search?type=email&value=test@example.com
 */
router.get("/search", async (req, res) => {
  try {
    const { type, value } = req.query;

    if (!type || !value) {
      return res.status(400).json({
        success: false,
        error: "type and value are required"
      });
    }

    const idKey = `id:${type}:${value}`;
    const profileId = await redis.get(idKey);

    if (!profileId) {
      return res.status(404).json({
        success: false,
        error: "Profile not found"
      });
    }

    const raw = await redis.get(`profile:${profileId}`);
    const profile = raw ? JSON.parse(raw) : null;

    res.json({
      success: true,
      profileId,
      profile
    });
  } catch (err) {
    console.error("❌ /profiles/search error:", err);
    res.status(500).json({ success: false });
  }
});

export default router;