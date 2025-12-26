import express from "express";
import cors from "cors";
import trackRoutes from "./routes/track.routes.js";
import identifyRoutes from "./routes/identify.routes.js";
import eventsRoutes from "./routes/events.routes.js";
import { initClickHouse } from "./services/clickhouseInit.js";
import eventsStatsRoutes from "./routes/events.stats.routes.js";
import profilesRoutes from "./routes/profiles.routes.js";
import schemaRoutes from "./routes/schema.routes.js";

const app = express();
const PORT = process.env.PORT || 8080; // you chose 8080 ✅

// ============== MIDDLEWARE ==============
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"], // your frontend(s)
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

// ============== BASIC ROUTES ==============
app.get("/", (req, res) => {
  res.send("UDE Backend is running");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "ude-backend" });
});

// ============== UDE ROUTES ==============
app.use("/track", trackRoutes);      // POST /track
app.use("/identify", identifyRoutes); // POST /identify


app.use("/events", eventsRoutes);
await initClickHouse();

app.use("/events/stats", eventsStatsRoutes);

// search by profile id 
app.use("/profiles", profilesRoutes);

app.use("/schema", schemaRoutes)

// ============== START SERVER ==============
app.listen(PORT, () => {
  console.log(`🚀 UDE backend running on http://localhost:${PORT}`);
});