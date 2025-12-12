// server/src/controllers/identify.controller.js
import { upsertProfile } from "../services/identity.service.js";

export async function handleIdentify(req, res) {
  try {
    const { identifiers, traits = {}, context = {}, timestamp } = req.body || {};

    if (!identifiers || Object.keys(identifiers).length === 0) {
      return res.status(400).json({
        success: false,
        error: "At least one identifier is required"
      });
    }

    const { profileId, profile } = await upsertProfile(identifiers, traits);

    console.log("🪪 /identify:", {
      profileId,
      identifiers,
      traits
    });

    return res.json({
      success: true,
      profileId,
      profile
    });
  } catch (err) {
    console.error("❌ Error in /identify:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}