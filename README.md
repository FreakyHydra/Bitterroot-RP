# Bitterroot RP

A world-centered interactive-fiction experience set in the authored dark-fantasy region of Bitterroot.

The repository contains two deliberately separated layers:

- a Vinext/React frontend built around discovering places, contextual people, stories, and lore;
- a provider-neutral Bitterroot backend for world queries, context compilation, generation, and relationship-safe persistence boundaries.

Bitterroot has no humans. Every person is an intelligent, speaking feral animal person in a quadrupedal, semi-upright, or upright body form. The setting is pre-industrial.

## Development

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Useful commands:

```bash
npm run build
npm test
npm run backend:start
npm run backend:test
```

The standalone backend listens at `http://127.0.0.1:2030` by default and exposes:

- `GET /health`
- `GET /v1/world`
- `GET /v1/places/:id`
- `GET /v1/places/:id/people`
- `POST /v1/context/compile`
- `POST /v1/generate`

## Status

Frontend prototype and backend foundation are under development on `dev`. No production deployment has been performed.

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) and [docs/architecture/frontend.md](./docs/architecture/frontend.md).
