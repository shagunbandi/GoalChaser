# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Goal Chaser (Nitya) is a plugin-based goal tracking app. Next.js 16 + React 19 + Firebase/Firestore + Tailwind CSS v4. Monorepo with npm workspaces.

## Commands

All root scripts delegate to `apps/web` workspace:

```bash
npm run dev              # Start dev server (loads secrets/.env)
npm run build            # Production build (uses webpack)
npm run lint             # ESLint
npm run emulators        # Firebase emulators (Auth:9099, Firestore:8080, UI:4000)
npm run test:e2e         # Playwright E2E tests
npm run test:e2e:ui      # Playwright interactive UI
npm run test:e2e:headed  # Playwright with visible browser
npm run test:e2e:debug   # Playwright debug mode
npm run deploy:rules     # Deploy Firestore security rules
```

Docker (via justfile): `just up`, `just down`, `just logs`, `just rebuild`

## Architecture

### Monorepo Layout

- `apps/web/` — Next.js app (app router)
- `packages/sdk/` — Shared SDK (`@goal-chaser/sdk`): plugin interfaces, hooks, Firestore utilities, UI components
- `plugins/` — 8 workspace packages: study, productivity, finance, travel, period, executive-goal, language-learning, language-tutor

### Plugin System (central design pattern)

Plugins are self-contained workspace packages registered in `apps/web/src/core/plugin-registry/manifest.ts`. Each implements the `Plugin` interface from the SDK and provides a `PluginDataProvider` for Firestore persistence.

**Strict boundaries:**
- Core never imports from plugins (only manifest imports plugin packages)
- Plugins never import from other plugins
- Plugins interact with core exclusively through the SDK
- Use `PluginContext` for all Firestore access — never import Firestore directly
- Filter `undefined` values before saving to Firestore

**Adding a plugin:** Create a new workspace package in `plugins/`, implement `Plugin<DayData, Config>` with a `PluginDataProvider`, add to manifest. See `.cursorrules` for the full step-by-step guide with code templates.

### Key SDK hooks/utilities

- `usePluginPage<DayData, Config>` — eliminates all page boilerplate (data loading, navigation, updates)
- `loadDocument`, `saveDocument`, `loadDateRange`, `buildPluginDayPath`, `buildPluginConfigPath` — Firestore helpers
- `LoadingState`, `NotFoundState` — standard page state components

### Firestore Data Structure

```
users/{userId}/goals/{goalId}/addons/{pluginId}/days/{date}      # day data
users/{userId}/goals/{goalId}/addons/{pluginId}/settings/config   # plugin config
```

### Deployment

Docker multi-stage build (Node 20 Alpine) → standalone Next.js server on port 3000. Traefik reverse proxy with Cloudflare TLS. Requires `secrets/.env` and `secrets/gcs-key.json`.

## Conventions

- UI theme: dark glassmorphism (`bg-white/[0.02] backdrop-blur-sm rounded-2xl border border-white/[0.08]`)
- Components < 150 lines preferred, split at 200+
- Import order: React/Next → third-party → SDK → local
- Use `type` imports for type-only imports
