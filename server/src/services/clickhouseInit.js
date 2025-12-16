import { clickhouse } from "./clickhouseClient.js";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function initClickHouse(retries = 10) {
  for (let i = 1; i <= retries; i++) {
    try {
      console.log(`🗃️ Trying to connect to ClickHouse (attempt ${i})...`);

      await clickhouse.command({
        query: `CREATE DATABASE IF NOT EXISTS ude`
      });

      await clickhouse.command({
        query: `
          CREATE TABLE IF NOT EXISTS ude.events (
            event String,
            profile_id String,
            identifiers String,
            properties String,
            context String,
            timestamp DateTime
          )
          ENGINE = MergeTree()
          ORDER BY timestamp;
        `
      });

      await clickhouse.command({
        query: `
          CREATE TABLE IF NOT EXISTS ude.profiles (
            profile_id String,
            identifiers String,
            traits String,
            created_at DateTime,
            updated_at DateTime
          )
          ENGINE = ReplacingMergeTree(updated_at)
          ORDER BY profile_id;
        `
      });

      console.log("✅ ClickHouse is ready!");
      return;
    } catch (err) {
      console.warn("⏳ ClickHouse not ready yet...");
      await sleep(2000);
    }
  }

  console.error("❌ ClickHouse failed to initialize after retries");
}