# Frontend architecture decision

## Decision

Bitterroot uses a dedicated world-centered Vinext/React frontend in the same repository as the shared backend boundary. The UI owns presentation and authored navigation; it does not duplicate context compilation, relationship logic, provider handling, or generation.

The primary information architecture is:

1. **World** — atmospheric entry, current story, and region gateways.
2. **Places** — region and landmark discovery with contextual presence.
3. **People** — characters associated with the current place or story.
4. **Stories** — curated starting scenarios and ongoing saves.
5. **Lore** — relevant or discovered setting knowledge.

The initial prototype keeps authored display data colocated with the page while the interaction and visual language settle. Backend records remain canonical. The next integration step is to replace colocated display records with reads from `/v1/world`, `/v1/places/:id`, and `/v1/places/:id/people`, without changing the navigation model.

## Boundaries

- The frontend may format and filter world records, but does not compile AI context.
- Character availability is contextual metadata, not an NPC simulation.
- Relationships remain keyed by `(characterId, personaId)` in backend persistence.
- Age-safety metadata is enforced by the backend, never inferred from visual presentation.
- Generated landscape and cast artwork is decorative presentation, not canon-bearing data.

## Deployment

The Vinext build is compatible with the configured Sites project. Production deployment remains explicitly disabled until the dev experience and API integration are approved.
