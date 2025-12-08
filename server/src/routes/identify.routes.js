import { Router } from "express";
import { handleIdentify } from "../controllers/identify.controller.js";

const router = Router();

// POST /identify
router.post("/", handleIdentify);

export default router;