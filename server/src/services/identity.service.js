// server/src/services/identity.service.js
import { randomUUID } from "crypto";
import redis from "./redisClient.js";

const PROFILE_KEY_PREFIX = "profile:";
const ID_INDEX_PREFIX = "id:"; // e.g. id:user_id:123 -> profileId

function buildProfileKey(profileId) {
  return `${PROFILE_KEY_PREFIX}${profileId}`;
}

function buildIdKey(type, value) {
  return `${ID_INDEX_PREFIX}${type}:${value}`;
}

/**
 * Upsert = "find existing profile if any, otherwise create new"
 * - identifiers: { user_id, email, anonymous_id, ... }
 * - traits: { name, city, plan, ... } (optional)
 */
export async function upsertProfile(identifiers = {}, traits = {}) {
  // 1. Collect all non-empty identifiers
  const idEntries = Object.entries(identifiers).filter(
    ([, value]) => value !== undefined && value !== null && value !== ""
  );

  if (idEntries.length === 0) {
    throw new Error("At least one identifier is required");
  }

  let profileId = null;

  // 2. Try to find an existing profile via any identifier
  for (const [type, value] of idEntries) {
    const key = buildIdKey(type, value);
    const existingProfileId = await redis.get(key);
    if (existingProfileId) {
      profileId = existingProfileId;
      break;
    }
  }

  // 3. If no profile found, create new one
  if (!profileId) {
    profileId = randomUUID();
  }

  const profileKey = buildProfileKey(profileId);

  // 4. Get or init profile object
  let profile = null;
  const raw = await redis.get(profileKey);

  if (raw) {
    try {
      profile = JSON.parse(raw);
    } catch (err) {
      console.warn("⚠️ Failed to parse profile JSON for", profileKey, err);
    }
  }

  if (!profile) {
    profile = {
      profileId,
      identifiers: {}, // e.g. { user_id: ["123"], email: ["a@b.com"] }
      traits: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // 5. Update identifier index + profile.identifiers
  for (const [type, value] of idEntries) {
    const idKey = buildIdKey(type, value);

    // This overwrites old mapping if it pointed to some other profileId → simple merge behavior
    await redis.set(idKey, profileId);

    if (!profile.identifiers[type]) {
      profile.identifiers[type] = [];
    }
    if (!profile.identifiers[type].includes(value)) {
      profile.identifiers[type].push(value);
    }
  }

  // 6. Merge traits (new values overwrite old ones)
  if (traits && Object.keys(traits).length > 0) {
    profile.traits = {
      ...profile.traits,
      ...traits
    };
  }

  profile.updatedAt = new Date().toISOString();

  // 7. Save profile back to Redis
  await redis.set(profileKey, JSON.stringify(profile));

  try {
    await clickhouse.insert({
      table: "profiles",
      format: "JSONEachRow",
      values: [
        {
          profile_id: profileId,
          identifiers: JSON.stringify(profile.identifiers),
          traits: JSON.stringify(profile.traits),
          created_at: profile.createdAt,
          updated_at: profile.updatedAt
        }
      ]
    });

    console.log("📝 Profile upserted into ClickHouse:", profileId);
  } catch (err) {
    console.error("❌ Failed to insert profile into ClickHouse:", err);
  }

  return { profileId, profile };
}

// Fetch single profile by id (for future dashboard / debugging)
export async function getProfileById(profileId) {
  const raw = await redis.get(buildProfileKey(profileId));
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}