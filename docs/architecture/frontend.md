# Frontend architecture decision

## Decision

Bitterroot uses a dedicated world-centered Vinext/React frontend in the same repository as the shared backend boundary. The UI owns presentation and authored navigation; it does not duplicate context compilation, relationship logic, provider handling, or generation.

The primary information architecture is:

1. **World** — atmospheric entry, current story, and region gateways.
2. **Places** — region and landmark discovery with contextual presence.
3. **People** — characters associated with the current place or story.
4. **Stories** — curated starting scenarios and ongoing saves.
5. **Lore** — relevant or discovered setting knowledge.

The playable dev product keeps authored discovery copy colocated with the page while backend records remain canonical. Story turns are sent to `POST /api/generate`, which compiles server-owned world, place, scene, character, Living Cast, persona, and recent-history context before calling NovelAI or Ollama.

The current session, persona, and non-secret provider choice autosave in browser local storage. A NovelAI token is held only in browser session storage, transmitted as a bearer token, never added to the story record, and never logged. This makes the dev build fully playable without prematurely committing to an account system. Account authentication and durable server-side saves remain the next persistence milestone.

## Boundaries

- The frontend may format and filter world records, but does not compile AI context.
- Character availability is contextual metadata, not an NPC simulation.
- Relationships remain keyed by `(characterId, personaId)` in backend persistence.
- Age-safety metadata is enforced by the backend, never inferred from visual presentation.
- Generated landscape and cast artwork is decorative presentation, not canon-bearing data.
- Local Ollama is supported during self-hosted/local operation; a hosted Site cannot reach an Ollama process on the visitor’s machine.

## Deployment

The Vinext build is compatible with the configured Sites project. Production deployment remains explicitly disabled until the dev experience and API integration are approved.
