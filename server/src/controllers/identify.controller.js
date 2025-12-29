import { upsertProfile } from "../services/identity.service.js";

export async function handleIdentify(req, res) {
  try {
    const { identifiers, traits = {} } = req.body;
    const { profileId, profile } = await upsertProfile(identifiers, traits);
    res.json({ success: true, profileId, profile });
  } catch (err) {
    console.error("❌ identify error", err);
    res.status(500).json({ success: false });
  }
}