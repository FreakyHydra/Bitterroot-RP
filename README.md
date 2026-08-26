# Bitterroot RP

A clean, Bitterroot-native roleplay backend and future world-centered frontend.

This repository is not a copy of The Howling Whispers. It uses a new curated
world model, place-aware context compiler, character temperament rules, and
provider-neutral generation boundary tailored to Bitterroot.

The first architecture/backend phase includes:

- authored Bitterroot regions, places, lore, characters, and starting stories;
- a hard setting invariant that every person is anthro/half-beast and no humans
  exist;
- optional world hierarchy without a general RPG engine;
- contextual character availability for Living Cast seeding;
- relationship context scoped by character and persona;
- explicit temperament invariants so trust does not rewrite personality;
- minor metadata and mature-canon gating;
- stateless NovelAI and Ollama provider adapters;
- a small HTTP API for world discovery, context compilation, and generation.

## Run

Requires Node.js 22.13 or newer. There are no runtime dependencies.

```bash
npm test
npm start
```

Default local URL: `http://127.0.0.1:2030`.

## API

- `GET /health`
- `GET /v1/world`
- `GET /v1/places/:id`
- `GET /v1/places/:id/people`
- `POST /v1/context/compile`
- `POST /v1/generate`

See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for the architecture pass,
risks, migrations, and implementation order.

## Status

Architecture and backend foundation only. No production deployment is
configured. The target subdomain remains
`bitterroot.thehowlingwhispers.com` after dev verification.
