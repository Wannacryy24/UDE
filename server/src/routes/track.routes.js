import { Router } from "express";
import { handleTrack } from "../controllers/track.controller.js";

const router = Router();

// POST /track
router.post("/", handleTrack);

export default router;