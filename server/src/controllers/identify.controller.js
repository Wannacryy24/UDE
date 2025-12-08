import { upsertProfile } from "../services/identity.service.js";

export function handleIdentify(req, res) {
  const { identifiers, traits = {}, context = {}, timestamp } = req.body || {};

  if (!identifiers || Object.keys(identifiers).length === 0) {
    return res.status(400).json({
      success: false,
      error: "At least one identifier is required"
    });
  }

  const { profileId, profile } = upsertProfile(identifiers, traits);

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
}