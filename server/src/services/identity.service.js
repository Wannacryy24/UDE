import { randomUUID } from "crypto";

// profileId -> profile object
const profiles = new Map();

// "type:value" -> profileId
// e.g. "user_id:123" -> "profile-uuid-1"
const identifierIndex = new Map();

function buildKey(type, value) {
  return `${type}:${value}`;
}

/**
 * Upsert = "find existing profile if any, otherwise create new"
 * - identifiers: { user_id, email, anonymous_id, ... }
 * - traits: { name, city, plan, ... } (optional)
 */
export function upsertProfile(identifiers = {}, traits = {}) {
  // 1. Collect all non-empty identifiers
  const idEntries = Object.entries(identifiers).filter(
    ([, value]) => value !== undefined && value !== null && value !== ""
  );

  let profileId = null;

  // 2. Try to find an existing profile via any identifier
  for (const [type, value] of idEntries) {
    const key = buildKey(type, value);
    const existingProfileId = identifierIndex.get(key);
    if (existingProfileId) {
      profileId = existingProfileId;
      break;
    }
  }

  // 3. If no profile found, create new one
  if (!profileId) {
    profileId = randomUUID();
  }

  // 4. Get or create the profile object
  let profile = profiles.get(profileId);
  if (!profile) {
    profile = {
      profileId,
      identifiers: {}, // e.g. { user_id: ["123"], email: ["a@b.com"], ... }
      traits: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // 5. Update identifierIndex + profile.identifiers
  for (const [type, value] of idEntries) {
    const key = buildKey(type, value);
    identifierIndex.set(key, profileId); // overwrite old mapping = simple "merge"

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
  profiles.set(profileId, profile);

  return { profileId, profile };
}

// Optional helper: fetch profile for debugging
export function getProfileById(profileId) {
  return profiles.get(profileId) || null;
}

// Optional debug dump (for future debugging or admin APIs)
export function debugIdentityState() {
  return {
    profiles: Array.from(profiles.values()),
    identifierIndex: Array.from(identifierIndex.entries())
  };
}