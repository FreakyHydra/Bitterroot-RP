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

## Playing

1. Open **Stories** and choose a curated beginning.
2. Create a feral Bitterroot persona.
3. Open provider settings and choose NovelAI or local Ollama.
4. For NovelAI, enter an access token. It remains in session storage for the current browser tab and is sent only in the authorization header.
5. Play. The current persona and story autosave in local browser storage after every turn.

The Vinext application handles playable generation at `POST /api/generate`. It compiles server-owned Bitterroot canon before contacting the selected provider. The standalone backend API remains available for integrations and future account-backed persistence.

The standalone backend listens at `http://127.0.0.1:2030` by default and exposes:

- `GET /health`
- `GET /v1/world`
- `GET /v1/places/:id`
- `GET /v1/places/:id/people`
- `POST /v1/context/compile`
- `POST /v1/generate`

## Status

The first playable product is under development on `dev`. It includes world discovery, personas, provider configuration, AI roleplay, error recovery, autosaves, and session continuation. Saves are device-local until account authentication and server persistence are added. No production deployment has been performed.

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) and [docs/architecture/frontend.md](./docs/architecture/frontend.md).
