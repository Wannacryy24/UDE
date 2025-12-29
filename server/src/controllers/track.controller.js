import { upsertProfile } from "../services/identity.service.js";
import { clickhouse } from "../services/clickhouseClient.js";
import { registerEvent } from "../services/eventRegistry.service.js";
import { validateAndNormalizeEvent } from "../services/eventContract.service.js";

export async function handleTrack(req, res) {
  try {
    const { valid, errors, event } = validateAndNormalizeEvent(req.body);

    if (!valid) return res.status(400).json({ success: false, errors });

    const { event: name, identifiers, properties, context, timestamp } = event;
    const { profileId } = await upsertProfile(identifiers, {});

    const ts = timestamp.toISOString().slice(0, 19).replace("T", " ");

    await clickhouse.insert({
      table: "ude.events",
      format: "JSONEachRow",
      values: [{
        event: name,
        profile_id: profileId,
        identifiers: JSON.stringify(identifiers),
        properties: JSON.stringify(properties),
        context: JSON.stringify(context),
        timestamp: ts
      }]
    });

    await registerEvent(name, properties);

    console.log(`📩 event ingested "${name}" → profile ${profileId}`);
    res.json({ success: true, profileId });
  } catch (err) {
    console.error("❌ /track error", err);
    res.status(500).json({ success: false });
  }
}