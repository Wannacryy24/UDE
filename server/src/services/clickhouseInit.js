// server/src/services/clickhouseInit.js
import { clickhouse } from "./clickhouseClient.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function initClickHouse(retries = 10) {
  for (let i = 1; i <= retries; i++) {
    try {
      console.log(`🗃️ Try ClickHouse init (attempt ${i})...`);

      await clickhouse.command({ query: `CREATE DATABASE IF NOT EXISTS ude` });

      await clickhouse.command({
        query: `
          CREATE TABLE IF NOT EXISTS ude.events (
            event String,
            profile_id String,
            identifiers String,
            properties String,
            context String,
            timestamp DateTime
          ) ENGINE = MergeTree()
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
          ) ENGINE = ReplacingMergeTree(updated_at)
          ORDER BY profile_id;
        `
      });

      await clickhouse.command({
        query: `
          CREATE TABLE IF NOT EXISTS ude.event_registry (
            event String,
            property String,
            expected_type String,
            last_seen_type String,
            mismatch_count UInt32,
            first_seen_at DateTime,
            last_seen_at DateTime
          ) ENGINE = ReplacingMergeTree(last_seen_at)
          ORDER BY (event, property);
        `
      });

      await clickhouse.command({
        query: `
          CREATE TABLE IF NOT EXISTS ude.event_property_conflicts (
            event String,
            property String,
            expected_type String,
            received_type String,
            first_seen_at DateTime,
            last_seen_at DateTime,
            count UInt32
          ) ENGINE = ReplacingMergeTree(last_seen_at)
          ORDER BY (event, property, received_type);
        `
      });

      /* 🆕 NEW — Pending approval table */
      await clickhouse.command({
        query: `
          CREATE TABLE IF NOT EXISTS ude.event_schema_pending (
            event String,
            property String,
            detected_type String,
            first_seen_at DateTime DEFAULT now(),
            last_seen_at DateTime DEFAULT now()
          )
          ENGINE = ReplacingMergeTree(last_seen_at)
          ORDER BY (event, property);
        `
      });

      console.log("✅ ClickHouse initialized!");
      return;
    } catch (err) {
      console.warn("⏳ ClickHouse not ready...");
      await sleep(2000);
    }
  }

  console.error("❌ Failed to init ClickHouse");
}