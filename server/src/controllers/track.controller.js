// // server/src/controllers/track.controller.js
// import { upsertProfile } from "../services/identity.service.js";

// // TEMP in-memory events store (we'll move this to ClickHouse later)
// const events = [];

// export async function handleTrack(req, res) {
//   try {
//     const { event, identifiers, properties = {}, context = {}, timestamp } = req.body || {};

//     if (!event || !identifiers || Object.keys(identifiers).length === 0) {
//       return res.status(400).json({
//         success: false,
//         error: "event and at least one identifier are required"
//       });
//     }

//     // Resolve or create a profile for this event
//     const { profileId } = await upsertProfile(identifiers, {});

//     const eventTimestamp = timestamp
//       ? new Date(timestamp).toISOString()
//       : new Date().toISOString();

//     const eventRecord = {
//       id: events.length + 1,
//       event,
//       profileId,
//       identifiers,
//       properties,
//       context,
//       timestamp: eventTimestamp
//     };

//     events.push(eventRecord);

//     console.log("📩 /track event:", eventRecord);

//     return res.json({
//       success: true,
//       profileId,
//       eventId: eventRecord.id
//     });
//   } catch (err) {
//     console.error("❌ Error in /track:", err);
//     return res.status(500).json({ success: false, error: "Internal server error" });
//   }
// }




// server/src/controllers/track.controller.js
import { upsertProfile } from "../services/identity.service.js";
import { clickhouse } from "../services/clickhouseClient.js";

// TEMP in-memory events store (still keeping this for quick debugging)
const events = [];

export async function handleTrack(req, res) {
  try {
    const {
      event,
      identifiers,
      properties = {},
      context = {},
      timestamp,
    } = req.body || {};

    if (!event || !identifiers || Object.keys(identifiers).length === 0) {
      return res.status(400).json({
        success: false,
        error: "event and at least one identifier are required",
      });
    }

    // 1️⃣ Resolve or create a profile for this event (Redis)
    const { profileId } = await upsertProfile(identifiers, {});

    // 2️⃣ Build a clean timestamp
    const eventTimestamp = timestamp
      ? new Date(timestamp)
      : new Date();

    // ClickHouse wants "YYYY-MM-DD HH:MM:SS" format for DateTime
    const chTimestamp = eventTimestamp.toISOString().slice(0, 19).replace("T", " ");

    // 3️⃣ Build event record (for logging + in-memory array)
    const eventRecord = {
      id: events.length + 1,
      event,
      profileId,
      identifiers,
      properties,
      context,
      timestamp: eventTimestamp.toISOString(),
    };

    events.push(eventRecord);

    console.log("📩 /track event (in-memory):", eventRecord);

    // 4️⃣ Insert into ClickHouse
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

    console.log("📝 /track event inserted into ClickHouse");

    // 5️⃣ Respond to SDK
    return res.json({
      success: true,
      profileId,
      eventId: eventRecord.id,
    });
  } catch (err) {
    console.error("❌ Error in /track:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}