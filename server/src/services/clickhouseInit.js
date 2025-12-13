// server/src/services/clickhouseInit.js
import { clickhouse } from "./clickhouseClient.js";

export async function initClickHouse() {
  try {
    console.log("🗃️ Checking if ClickHouse table exists...");

    // Create database if not exists
    await clickhouse.command({
      query: `
        CREATE DATABASE IF NOT EXISTS ude
      `
    });

    // Create events table if not exists
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

    // 3️⃣ Create PROFILES table
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

    console.log("✅ ClickHouse table is ready!");
  } catch (err) {
    console.error("❌ ClickHouse init error:", err);
  }
}


// Redis = fast identity resolution

// ClickHouse = permanent storage + analytics

