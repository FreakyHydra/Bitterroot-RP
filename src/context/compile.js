import { BITTERROOT_WORLD } from "../world/bitterroot.js";
import { getCharacter, getPlace, getScenario, peopleForPlace, placeAncestry } from "../world/query.js";
import { CONTENT_RATINGS, relationshipKey } from "../domain/contracts.js";

const PRIORITY = { mandatory: 0, high: 1, normal: 2, low: 3 };

export function compileBitterrootContext(input) {
  const persona = normalizePersona(input.persona);
  const place = getPlace(input.placeId);
  if (!place) throw new Error(`Unknown place: ${input.placeId}`);

  const scenario = input.scenarioId ? getScenario(input.scenarioId) : null;
  if (input.scenarioId && !scenario) throw new Error(`Unknown scenario: ${input.scenarioId}`);
  if (scenario && scenario.placeId !== place.id) throw new Error("Scenario does not belong to the selected place");

  const primaryCharacterId = input.primaryCharacterId ?? scenario?.primaryCharacterId;
  const primaryCharacter = primaryCharacterId ? getCharacter(primaryCharacterId) : null;
  if (primaryCharacterId && !primaryCharacter) throw new Error(`Unknown character: ${primaryCharacterId}`);

  const matureAllowed = Boolean(input.matureContentRequested) && primaryCharacter?.ageCategory !== "minor";
  const messages = Array.isArray(input.messages) ? input.messages.slice(-24) : [];
  const searchable = [place.name, scenario?.title, scenario?.summary, ...messages.map((message) => message.text)]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const ancestry = placeAncestry(place.id);
  const activeTags = new Set(ancestry.flatMap((entry) => [entry.id, ...(entry.tags ?? [])]));

  const lore = BITTERROOT_WORLD.lore
    .filter((entry) => matureAllowed || entry.contentRating !== "mature")
    .map((entry) => ({
      entry,
      active: entry.constant
        || entry.tags.some((tag) => activeTags.has(tag))
        || entry.triggers.some((trigger) => searchable.includes(trigger.toLowerCase())),
    }))
    .filter(({ active }) => active)
    .sort((left, right) => PRIORITY[left.entry.priority] - PRIORITY[right.entry.priority]);

  const available = peopleForPlace(place.id, { scenarioId: scenario?.id });
  const requestedCast = new Set(input.activeCastIds ?? scenario?.castIds ?? []);
  const cast = available.filter(({ character }) => requestedCast.size === 0 || requestedCast.has(character.id));
  if (primaryCharacter && !cast.some(({ character }) => character.id === primaryCharacter.id)) {
    cast.unshift({ character: primaryCharacter, availability: { placeId: place.id, likelihood: "likely", note: "Primary character." } });
  }

  const sections = [
    "<bitterroot-canon>",
    ...lore.map(({ entry }) => `<lore id="${entry.id}" title="${entry.title}">\n${entry.content}\n</lore>`),
    "</bitterroot-canon>",
    renderPlace(ancestry),
    scenario ? renderScenario(scenario) : "",
    renderPersona(persona),
    primaryCharacter ? renderPrimaryCharacter(primaryCharacter, input.relationship, persona.id) : "",
    renderCast(cast, primaryCharacter?.id),
    renderWorldState(input.worldState),
    renderHistory(messages),
    "<roleplay-rules>\nAdvance the situation through character goals, material conditions, remembered events, and plausible consequences. Every person in Bitterroot is an anthropomorphic or half-beast animal person; humans do not exist and must not be introduced. Never decide the player's private thoughts, feelings, dialogue, consent, or voluntary actions. Keep every established character distinct. Do not invent a crowd merely because the world contains many people.\n</roleplay-rules>",
  ].filter(Boolean);

  const prompt = sections.join("\n\n");
  return {
    prompt,
    manifest: {
      worldRevision: BITTERROOT_WORLD.revision,
      placePath: ancestry.map((entry) => entry.id),
      scenarioId: scenario?.id ?? null,
      primaryCharacterId: primaryCharacter?.id ?? null,
      relationshipKey: primaryCharacter ? relationshipKey(primaryCharacter.id, persona.id) : null,
      castIds: cast.map(({ character }) => character.id),
      loreIds: lore.map(({ entry }) => entry.id),
      matureCanonEnabled: matureAllowed,
      estimatedTokens: Math.ceil(prompt.length / 4),
    },
  };
}

function renderPlace(ancestry) {
  const place = ancestry.at(-1);
  return [
    "<current-place>",
    `Path: ${ancestry.map((entry) => entry.name).join(" > ")}`,
    `Type: ${place.kind}`,
    `Overview: ${place.summary}`,
    place.description ? `Details: ${place.description}` : "",
    `Tags: ${(place.tags ?? []).join(", ")}`,
    "</current-place>",
  ].filter(Boolean).join("\n");
}

function renderScenario(scenario) {
  return `<starting-story id="${scenario.id}">\nTitle: ${scenario.title}\nSituation: ${scenario.summary}\nOpening: ${scenario.opening}\n</starting-story>`;
}

function renderPersona(persona) {
  return `<player-persona id="${persona.id}">\nName: ${persona.name}\n${persona.description ? `Description: ${persona.description}\n` : ""}Never write the persona's choices or inner state for the player.\n</player-persona>`;
}

function renderPrimaryCharacter(character, relationship = {}, personaId) {
  const label = relationship.label ?? "stranger";
  const expression = character.relationshipExpression[label] ?? character.relationshipExpression.stranger;
  return [
    `<primary-character id="${character.id}">`,
    `Name: ${character.name}`,
    `Species: ${character.species}`,
    `Age: ${character.age} (${character.ageCategory})`,
    `Role: ${character.role}`,
    `Core: ${character.summary}`,
    `Temperament: ${character.temperament.join(", ")}`,
    `Voice: ${character.voice}`,
    "Non-negotiable character invariants:",
    ...character.invariants.map((item) => `- ${item}`),
    `Relationship with persona ${personaId}: ${label}${Number.isFinite(relationship.score) ? ` (${relationship.score})` : ""}`,
    `How this relationship is expressed: ${expression}`,
    relationship.note ? `Established relationship note: ${relationship.note}` : "",
    "Relationship context may change trust, access, delegation, loyalty, or guardedness. It cannot overwrite temperament, boundaries, competence, age, or independent goals.",
    "</primary-character>",
  ].filter(Boolean).join("\n");
}

function renderCast(cast, primaryId) {
  const sideCast = cast.filter(({ character }) => character.id !== primaryId);
  if (sideCast.length === 0) return "";
  return [
    "<available-cast>",
    ...sideCast.map(({ character, availability }) => `- ${character.name} (${character.id}): ${availability.likelihood}; ${availability.note ?? character.summary}`),
    "Availability is not automatic presence. Introduce a side character only when the scene gives them a reason to be present.",
    "</available-cast>",
  ].join("\n");
}

function renderWorldState(worldState) {
  if (!worldState || typeof worldState !== "object") return "";
  const lines = [];
  for (const [key, value] of Object.entries(worldState).slice(0, 40)) {
    if (["string", "number", "boolean"].includes(typeof value)) lines.push(`- ${key}: ${String(value).slice(0, 500)}`);
  }
  return lines.length ? `<persistent-world-state>\n${lines.join("\n")}\n</persistent-world-state>` : "";
}

function renderHistory(messages) {
  if (messages.length === 0) return "";
  return `<recent-history>\n${messages.map((message) => `${message.sender ?? "unknown"}: ${String(message.text ?? "").slice(0, 4000)}`).join("\n")}\n</recent-history>`;
}

function normalizePersona(persona) {
  if (!persona || typeof persona !== "object") throw new Error("persona is required");
  const id = String(persona.id ?? "").trim();
  const name = String(persona.name ?? "").trim();
  if (!id || !name) throw new Error("persona.id and persona.name are required");
  return { id, name, description: String(persona.description ?? "").slice(0, 4000) };
}

export function isKnownContentRating(value) {
  return CONTENT_RATINGS.includes(value);
}
