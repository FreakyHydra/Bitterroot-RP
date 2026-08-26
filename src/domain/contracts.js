export const PLACE_KINDS = Object.freeze([
  "world",
  "region",
  "area",
  "settlement",
  "community",
  "institution",
  "location",
  "natural-site",
]);

export const AVAILABILITY_LEVELS = Object.freeze(["likely", "possible", "unlikely"]);
export const CONTENT_RATINGS = Object.freeze(["general", "mature"]);
export const AGE_CATEGORIES = Object.freeze(["adult", "minor", "unknown"]);

export function relationshipKey(characterId, personaId) {
  requireId(characterId, "characterId");
  requireId(personaId, "personaId");
  return `${characterId}::${personaId}`;
}

export function createSession(input) {
  const now = Date.now();
  requireId(input.personaId, "personaId");
  requireId(input.placeId, "placeId");
  return {
    id: input.id ?? `session-${now}-${Math.random().toString(36).slice(2, 8)}`,
    worldId: "bitterroot",
    personaId: input.personaId,
    placeId: input.placeId,
    scenarioId: input.scenarioId,
    primaryCharacterId: input.primaryCharacterId,
    activeCastIds: [...new Set(input.activeCastIds ?? [])],
    createdAt: input.createdAt ?? now,
    updatedAt: now,
  };
}

export function assertWorld(world) {
  if (!world || world.id !== "bitterroot") throw new Error("World id must be bitterroot");
  if (!Array.isArray(world.places) || world.places.length === 0) throw new Error("World needs places");
  if (!Array.isArray(world.characters) || world.characters.length === 0) throw new Error("World needs characters");

  const placeIds = uniqueIds(world.places, "place");
  const characterIds = uniqueIds(world.characters, "character");
  uniqueIds(world.scenarios, "scenario");
  uniqueIds(world.lore, "lore entry");

  for (const place of world.places) {
    if (!PLACE_KINDS.includes(place.kind)) throw new Error(`Invalid place kind: ${place.kind}`);
    if (place.parentId && !placeIds.has(place.parentId)) throw new Error(`Missing parent: ${place.parentId}`);
  }

  for (const character of world.characters) {
    if (!AGE_CATEGORIES.includes(character.ageCategory)) throw new Error(`Invalid age category: ${character.id}`);
    if (character.ageCategory === "minor" && character.contentRating !== "general") {
      throw new Error(`Minor character must be general-rated: ${character.id}`);
    }
  }

  for (const placement of world.placements) {
    if (!characterIds.has(placement.characterId)) throw new Error(`Unknown placed character: ${placement.characterId}`);
    for (const availability of placement.availability) {
      if (!placeIds.has(availability.placeId)) throw new Error(`Unknown availability place: ${availability.placeId}`);
      if (!AVAILABILITY_LEVELS.includes(availability.likelihood)) throw new Error("Invalid availability likelihood");
    }
  }

  assertAcyclicPlaces(world.places);
  return world;
}

function uniqueIds(items, label) {
  const ids = new Set();
  for (const item of items ?? []) {
    requireId(item.id, `${label}.id`);
    if (ids.has(item.id)) throw new Error(`Duplicate ${label} id: ${item.id}`);
    ids.add(item.id);
  }
  return ids;
}

function assertAcyclicPlaces(places) {
  const parents = new Map(places.map((place) => [place.id, place.parentId]));
  for (const place of places) {
    const seen = new Set([place.id]);
    let cursor = place.parentId;
    while (cursor) {
      if (seen.has(cursor)) throw new Error(`Place cycle involving ${cursor}`);
      seen.add(cursor);
      cursor = parents.get(cursor);
    }
  }
}

function requireId(value, label) {
  if (typeof value !== "string" || !/^[a-z0-9][a-z0-9-]{0,119}$/.test(value)) {
    throw new Error(`${label} must be a stable lowercase id`);
  }
}
