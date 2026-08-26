# Bitterroot RP architecture pass

Date: 2026-08-26  
Status: backend foundation implemented; large frontend work not started

## Outcome

Bitterroot RP is now a clean repository with a Bitterroot-native backend. It is
not a copy of the Howling Whispers application and does not inherit its
character-gallery frontend or monolithic application state.

The supplied world guide is treated as the first editorial source. Its durable
canon has been normalized into server-owned data rather than pasted wholesale
into every prompt.

## Proposed architecture

```text
Bitterroot frontend (future)
  World · Places · People · Stories · Lore
                    │
                    ▼
Bitterroot HTTP API
  world queries · context compilation · generation
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
curated Bitterroot core    provider adapters
places · lore · people     NovelAI · Ollama
stories · availability
```

The backend, not the browser, owns authoritative world canon. The client sends
stable IDs and current state; the backend resolves the actual place, scenario,
characters, lore, and relationship expression before generation.

## Why a new backend is cleaner

The Howling Whispers audit showed that its reusable domains are still coupled
to `app/dreambound-app.tsx`, browser `localStorage`, character-centered session
selection, and origin-local provider settings. Copying that application would
create a second monolith and make Bitterroot feel like a themed character
library.

The new backend keeps only proven integration ideas:

- provider-neutral generation;
- bearer-token NovelAI calls without credential persistence;
- private Ollama support;
- character-plus-persona relationship identity;
- bounded context selection;
- explicit age metadata and mature-content gating;
- active cast kept smaller than the world cast.

It does not copy Howling Whispers source code or serialized browser state.

## Current files and ownership

| Path | Responsibility |
|---|---|
| `src/world/bitterroot.js` | Authored places, lore, characters, placements, and starting stories |
| `src/world/query.js` | Place ancestry and contextual people queries |
| `src/domain/contracts.js` | Stable IDs, hierarchy validation, relationship keys, session shape |
| `src/context/compile.js` | Server-owned canon selection and generation prompt assembly |
| `src/providers/novelai.js` | Stateless NovelAI adapter |
| `src/providers/ollama.js` | Private/local Ollama adapter |
| `src/http/app.js` | JSON API, body limits, CORS, security headers, credential boundary |
| `src/server.js` | Process entry point |
| `tests/` | World, context, safety, provider, and HTTP regression coverage |

## Data model

### World hierarchy

Places form a flat parent-linked catalog. Levels are optional:

```text
Bitterroot
└── Howling Hills
    └── Splitpine Reach
        ├── Brackenjaw Enclave
        │   └── Brackenjaw Ranger Station
        └── East Marker Trail
```

Each place has a stable ID, kind, summary, optional description, tags, parent,
and display order. This is enough for navigation, breadcrumbs, lore activation,
and contextual cast filtering. It is not a general map simulation.

### Character canon

Character records separate:

- identity, age, species, and role;
- core temperament and goals;
- non-negotiable behavioral invariants;
- relationship-tier expression;
- voice.

This makes the Relationship Engine problem explicit: a relationship tier can
change access, trust, delegation, guardedness, and loyalty, but it cannot
replace the character's temperament.

### Placement and availability

World placement is separate from character identity. Each character can have a
home, associated places, and per-place likelihood:

- `likely`
- `possible`
- `unlikely`

A scenario may require cast members. Availability provides candidates; it does
not assert that every candidate is physically present. The prompt tells the
model to introduce side characters only when the scene supports it.

### Lore

Lore entries have stable IDs, priorities, content ratings, tags, triggers, and a
constant-activation flag. The compiler selects only:

- mandatory/constant canon;
- lore matching the current place path and tags;
- lore triggered by the current scenario or recent conversation.

This prevents the entire world bible from being dumped into every request.

### Sessions and relationships

The proposed durable session identity is:

```text
session
  worldId
  personaId
  placeId
  scenarioId?
  primaryCharacterId?
  activeCastIds[]
  createdAt
  updatedAt
```

Relationship records must use:

```text
characterId::personaId
```

World state should be keyed by `worldId::personaId`. Session history remains
session-owned. These scopes prevent one persona's trust or discoveries from
leaking into another persona.

## Curated canon implemented

The first catalog includes:

- Whispering Woods, Shadow Creek, Moonflower Meadow, Hidden Haven Cave;
- Bitterroot Bluffs;
- Bitterroot Orphanage and Warden's Watchtower;
- Bitterroot Peak;
- Howling Hills;
- Splitpine Reach;
- Brackenjaw Enclave;
- Brackenjaw Ranger Station and East Marker Trail.

The original ranger family is:

- **Ragna Holt**, 41, veteran Boundary Warden;
- **Pip Holt**, 12, would-be Boundary Warden.

No Whiteclaw names or lore are present.

## Hard setting invariant: no humans

Humans do not exist in Bitterroot. Every person—including travelers, villains,
guards, background villagers, the player persona, and newly introduced side
characters—must be an anthropomorphic or half-beast animal person.

This rule is present in mandatory lore and the final roleplay rules, and has a
regression test.

## Content and age handling

The world can support dark and mature stories, but mature canon is enabled only
when explicitly requested and the primary character is not a minor. Pip is
stored as age 12, `minor`, and `general`. Her bravery and practical skill do not
make her adult-like, while her age does not flatten her into a generic child.

The backend must never produce sexual or romanticized adult content involving
a minor. This is a hard character invariant, not an optional frontend filter.

## API shape

### Discovery

- `GET /v1/world` returns public world navigation and story summaries.
- `GET /v1/places/:id` returns a place and its ancestry.
- `GET /v1/places/:id/people` returns contextual candidates, not the whole cast.

### Context

`POST /v1/context/compile` accepts stable world IDs, persona identity, current
relationship context, active cast, recent messages, and compact world state. It
returns the prompt plus a manifest showing selected lore, place path, cast,
relationship key, and estimated size.

### Generation

`POST /v1/generate` compiles canon server-side and calls the selected provider.
NovelAI credentials arrive as a bearer token for that request and are never
stored or returned. Ollama defaults to a private loopback endpoint.

## Persistence and migration requirements

No migration from Howling Whispers is required because this is a new authored
experience and a new backend.

Persistence is intentionally not faked in the first foundation. Before the
frontend stores real stories, add a database-backed repository layer for:

- personas;
- world state and discoveries;
- sessions and messages;
- relationships and relationship events;
- compact memories and consequence records.

Recommended persistence keys:

| Record | Scope |
|---|---|
| Persona | user + persona |
| World state | world + persona |
| Relationship | character + persona |
| Session | session + persona |
| Message | session + ordered turn |
| Consequence | world + persona + originating event |

Use additive schema migrations. Never key a character by display name. Never
put provider credentials in the database, logs, backups, or generated context.

## Frontend layout proposal

Primary navigation:

- **World** — atmospheric landscape, Bitterroot summary, current place, and
  continue-story entry;
- **Places** — regions and nested authored places;
- **People** — people associated with the current area, plus known people;
- **Stories** — curated openings and existing sessions;
- **Lore** — discovered and currently relevant canon.

The world entry should lead with one large landscape, a short world statement,
major regions, and the latest session. Character portraits appear inside place
context, not as a global card wall.

Suggested component ownership:

```text
WorldShell
  WorldLanding
  PlaceExplorer
  ContextualPeople
  StoryLibrary
  LoreJournal
  RoleplayWorkspace
```

`RoleplayWorkspace` consumes a selected session. It should not own world
navigation, authored catalogs, or persistence.

## Major risks

| Risk | Severity | Response |
|---|---:|---|
| World state is claimed persistent before storage exists | High | Keep API stateless until a tested repository layer lands |
| Prompt injection attempts to override canon | High | Resolve canon server-side; separate player text from mandatory rules; add adversarial tests |
| Every character enters context | High | Keep authored availability and explicit active cast |
| High relationship softens Ragna into a therapist | High | Preserve invariants after relationship text and test devoted status |
| Minor is written as adult-like or mature content is enabled | Critical | Server-side age metadata, hard gating, and tests |
| Humans appear as generic background defaults | High | Mandatory no-human invariant plus tests |
| Provider credentials leak | Critical | Request-only bearer token, redacted errors, no request logging |
| Consequences become arbitrary punishment | Medium | Store causal event records with witnesses and material effects |
| Backend becomes a generic RPG framework | Medium | Add only authored Bitterroot needs; reject quests/classes/inventory simulation |
| Canon guide contradictions accumulate | Medium | Add source references and revisioned editorial decisions before more writers contribute |

## Recommended implementation order

1. Architecture and curated backend foundation — complete.
2. Add adversarial context tests and output formatting/continuation cleanup.
3. Add a repository interface and database migrations for persona-scoped state.
4. Add relationship event scoring and causal consequence records.
5. Expand the Bitterroot editorial source format with revisions and source refs.
6. Build a read-only World/Places frontend against the discovery API.
7. Add persona selection and continue-story surfaces.
8. Connect roleplay generation and session persistence.
9. Add People, Stories, and Lore views.
10. Add artwork and responsive visual polish.
11. Verify on `dev` with NovelAI and private Ollama.
12. Configure the Bitterroot subdomain only after dev approval; do not deploy
    production during the prototype phase.

## Architecture gate before frontend work

The next large frontend pass should wait until:

- the persistent repository interface and first migration are defined;
- relationship event ownership is defined;
- consequence records have stable causal IDs;
- the provider output contract and RP formatter are tested;
- the user has approved or renamed Brackenjaw, Splitpine, Ragna, and Pip.
