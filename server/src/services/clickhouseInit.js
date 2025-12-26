// server/src/services/clickhouseInit.js
import { clickhouse } from "./clickhouseClient.js";

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

export async function initClickHouse(retries = 10) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🗃️ Connecting to ClickHouse (attempt ${attempt})`);

      // 1️⃣ Database
      await clickhouse.command({ query: `CREATE DATABASE IF NOT EXISTS ude` });

      // 2️⃣ Events Table
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

      // 3️⃣ Profiles Table
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

      // 4️⃣ Event Registry Table
      await clickhouse.command({
        query: `
          CREATE TABLE IF NOT EXISTS ude.event_registry (
            event_name String,
            property_name String,
            property_type String,
            first_seen_at DateTime,
            last_seen_at DateTime,
            status String
          )
          ENGINE = ReplacingMergeTree(last_seen_at)
          ORDER BY (event_name, property_name);
        `
      });

      // 5️⃣ Schema Conflict Table
      await clickhouse.command({
        query: `
          CREATE TABLE IF NOT EXISTS ude.event_property_conflicts (
            event_name String,
            property_name String,
            expected_type String,
            received_type String,
            first_seen_at DateTime,
            last_seen_at DateTime,
            count UInt32
          )
          ENGINE = ReplacingMergeTree(last_seen_at)
          ORDER BY (event_name, property_name);
        `
      });

      console.log("✅ ClickHouse initialized!");
      return;
    } catch (err) {
      console.warn("⏳ ClickHouse not ready yet… retrying");
      await sleep(2000);
    }
  }

  console.error("❌ ERROR — failed to init ClickHouse after retries");
}