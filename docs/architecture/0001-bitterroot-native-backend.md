# ADR 0001: Use a Bitterroot-native backend

- Status: Accepted
- Date: 2026-08-26

## Context

The initial pitch considered copying or extracting Howling Whispers systems.
The supplied Bitterroot guide defines a fixed authored world with its own canon,
locations, species, continuity rules, and consequence themes. The current
Howling Whispers application is still centered on a large browser-side
orchestrator and origin-local storage.

## Decision

Build a clean Bitterroot backend. Reuse proven provider and security principles,
but do not copy the Howling Whispers application or create a reskinned character
gallery.

The backend owns world canon and compiles place-aware prompts. The future
frontend discovers the world through stable IDs.

## Consequences

- Bitterroot can evolve around authored world needs without becoming a generic
  RPG engine.
- Howling Whispers and Bitterroot do not share persistence automatically.
- Provider interoperability remains possible through compatible adapters.
- Any later shared library must be deliberately designed, not produced by copy
  synchronization.
