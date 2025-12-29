import { Router } from "express";
import { handleTrack } from "../controllers/track.controller.js";

const r = Router();
r.post("/", handleTrack);
export default r;