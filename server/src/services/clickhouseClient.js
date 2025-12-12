// server/src/services/clickhouseClient.js
import { createClient } from "@clickhouse/client";

const host = process.env.CLICKHOUSE_HOST || "localhost";
const port = process.env.CLICKHOUSE_PORT || 8123;
const user = process.env.CLICKHOUSE_USER || "default";
const password = process.env.CLICKHOUSE_PASSWORD || "";
const database = process.env.CLICKHOUSE_DB || "default";

const url = `http://${host}:${port}`;

console.log(`[${new Date().toISOString()}] 🗄️  ClickHouse client configured for ${url}, DB=${database}`);

export const clickhouse = createClient({
  url,
  username: user,
  password,
  database
});