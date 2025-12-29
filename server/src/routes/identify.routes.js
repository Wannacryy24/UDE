import { Router } from "express";
import { handleIdentify } from "../controllers/identify.controller.js";

const r = Router();
r.post("/", handleIdentify);
export default r;