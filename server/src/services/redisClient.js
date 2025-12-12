// server/src/services/redisClient.js
import { createClient } from "redis";

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = process.env.REDIS_PORT || "6379";

const redisUrl = `redis://${REDIS_HOST}:${REDIS_PORT}`;

console.log(`🔌 Connecting to Redis at ${redisUrl} ...`);

const redis = createClient({
  url: redisUrl
});

redis.on("error", (err) => {
  console.error("❌ Redis Client Error:", err);
});

await redis.connect();

console.log("✅ Redis connected");

export default redis;