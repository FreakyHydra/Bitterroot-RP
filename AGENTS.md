# Bitterroot RP workflow

- Work on `dev`.
- Do not deploy to production without explicit approval.
- Do not turn this into a generic RPG engine.
- Preserve the authored Bitterroot canon in `src/world/bitterroot.js`.
- Bitterroot contains no humans. All people are intelligent, speaking feral
  animal people. Body forms may be quadrupedal, semi-upright, or upright
  half-beast, including incidental/background characters.
- Bitterroot is pre-industrial. Do not introduce modern or industrial
  technology without an explicit authored supernatural exception.
- Relationships are always scoped by `(characterId, personaId)`.
- Trust changes access, delegation, and loyalty; it never erases temperament.
- Minor metadata and mature-content gating are mandatory.
- Never store or log provider credentials.
- Add focused tests for every schema, context, safety, or persistence change.
- Record major decisions in `docs/architecture/`.
