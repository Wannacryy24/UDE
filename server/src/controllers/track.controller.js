// server/src/controllers/track.controller.js

import { upsertProfile } from "../services/identity.service.js";
import { clickhouse } from "../services/clickhouseClient.js";
import { registerEvent } from "../services/eventRegistry.service.js";
import { validateAndNormalizeEvent } from "../services/eventContract.service.js";

/**
 * POST /track
 * Ingests an event, resolves identity, writes event to ClickHouse,
 * updates schema registry
 */
export async function handleTrack(req, res) {
  try {
    // 1️⃣ Validate + Normalize request payload
    const result = validateAndNormalizeEvent(req.body);

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        errors: result.errors,
      });
    }

    const { event, identifiers, properties, context, timestamp } = result.event;

    // 2️⃣ Resolve or Create Profile — Redis + Insert latest state into ClickHouse
    const { profileId } = await upsertProfile(identifiers, {});

    // 3️⃣ Normalize timestamp into ClickHouse-required DateTime format
    const eventTime = timestamp ? new Date(timestamp) : new Date();
    const chTimestamp = eventTime.toISOString().slice(0, 19).replace("T", " ");

    // 4️⃣ Insert Event Row → ClickHouse (raw, immutable)
    await clickhouse.insert({
      table: "events",
      format: "JSONEachRow",
      values: [
        {
          event,
          profile_id: profileId,
          identifiers: JSON.stringify(identifiers),
          properties: JSON.stringify(properties),
          context: JSON.stringify(context),
          timestamp: chTimestamp,
        },
      ],
    });

    // 5️⃣ Update Soft Schema Registry (optional, non-blocking)
    await registerEvent(event, properties);

    // 6️⃣ Respond back to SDK
    return res.json({
      success: true,
      profileId,
    });
  } catch (err) {
    console.error("❌ /track error:", err);
    return res.status(500).json({
      success: false,
      error: "internal server error",
    });
  }
}