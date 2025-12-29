function toCHDateTime(ts) {
  return new Date(ts).toISOString().slice(0, 19).replace("T", " ");
}


import { randomUUID } from "crypto";
import redis from "./redisClient.js";
import { clickhouse } from "./clickhouseClient.js";

const PROFILE_KEY = "profile:";
const ID_INDEX = "id:";

const pk = (id) => `${PROFILE_KEY}${id}`;
const idx = (t, v) => `${ID_INDEX}${t}:${v}`;

export async function upsertProfile(identifiers = {}, traits = {}) {
  const entries = Object.entries(identifiers).filter(([_, v]) => v);
  if (entries.length === 0) throw new Error("Missing identifier");

  let profileId = null;

  // find existing profile
  for (const [type, value] of entries) {
    const ex = await redis.get(idx(type, value));
    if (ex) profileId = ex;
  }

  if (!profileId) profileId = randomUUID();

  const raw = await redis.get(pk(profileId));
  let profile = raw ? JSON.parse(raw) : {
    profileId,
    identifiers: {},
    traits: {},
    createdAt: new Date().toISOString()
  };

  // merge identifiers
  for (const [type, value] of entries) {
    await redis.set(idx(type, value), profileId);
    if (!profile.identifiers[type]) profile.identifiers[type] = [];
    if (!profile.identifiers[type].includes(value))
      profile.identifiers[type].push(value);
  }

  // merge traits
  if (traits && Object.keys(traits).length)
    profile.traits = { ...profile.traits, ...traits };

  profile.updatedAt = new Date().toISOString();

  // save back
  await redis.set(pk(profileId), JSON.stringify(profile));

  // store version to ClickHouse (history)
  try {
  await clickhouse.insert({
    table: "ude.profiles",
    format: "JSONEachRow",
    values: [
      {
        profile_id: profileId,
        identifiers: JSON.stringify(profile.identifiers),
        traits: JSON.stringify(profile.traits),
        created_at: toCHDateTime(profile.createdAt),
        updated_at: toCHDateTime(profile.updatedAt)
      }
    ]
  });

  console.log("📝 Profile upserted into ClickHouse:", profileId);

} catch (err) {
  console.error("❌ Failed to insert profile into ClickHouse:", err);
}

  console.log(`🧠 Profile saved ${profileId}`);
  return { profileId, profile };
}