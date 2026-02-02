# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Goal Chaser is a comprehensive goal and habit tracking application built with Next.js 16, React 19, Firebase (Auth + Firestore), and a plugin-based architecture. The app enables users to create goals with date ranges and track various aspects of their lives through modular, isolated plugins.

## Quick Commands

### Development
```bash
# Start development server
npm run dev
# or
just dev

# Build for production
npm run build

# Lint code
npm run lint
```

### Docker Deployment
```bash
# Full deployment (create network, build, start)
just docker-deploy

# View logs
just docker-logs

# Stop containers
just docker-down

# Rebuild without cache
just docker-rebuild
```

### Testing
```bash
# Run E2E tests (auto-starts emulators and dev server)
npm run test:e2e
# or
just test-e2e

# Run E2E tests in UI mode (interactive)
just test-e2e-ui

# Run specific test suite
just test-auth

# Start Firebase emulators manually
npm run emulators
```

### Data Management
```bash
# Generate dummy test data for all plugins
just generate-dummy-data

# Download database backup
just download-db

# Deploy Firestore security rules
npm run deploy:rules
```

## Architecture

### Plugin-Based System

The codebase uses a **strict plugin architecture** with complete isolation between core and plugins. This is the most important architectural concept to understand.

**Key Principles:**
1. **Complete Isolation**: Core never imports from plugins (except manifest)
2. **SDK Communication**: Plugins ONLY interact with core via `@/sdk`
3. **Self-Contained**: Each plugin has its own components, types, APIs, and utilities
4. **Generic Core**: Core provides reusable infrastructure that plugins consume

**Directory Structure:**
```
src/
├── sdk/                    # Plugin SDK (interfaces, services, UI components)
├── core/                   # Core app infrastructure
│   └── plugin-registry/    # Plugin discovery and management
├── plugins/                # All plugin implementations
│   ├── study/              # Study hours tracking
│   ├── productivity/       # Daily productivity rating
│   ├── finance/            # Budget and expense tracking
│   ├── travel/             # Travel planning
│   ├── period/             # Menstrual cycle tracking
│   └── executive-goal/     # AI-powered goal management
├── app/                    # Next.js App Router
│   └── goal/[id]/[[...plugin]]/ # Dynamic plugin routing
├── components/             # Shared UI components
├── hooks/                  # Core data hooks
└── lib/                    # Firebase and utilities
```

### Plugin Data Model

Each plugin stores data in Firestore under:
```
users/{userId}/goals/{goalId}/addons/{pluginId}/
  ├── days/{date}           # Day-level data (PluginDayData)
  └── settings/config       # Plugin configuration (PluginConfigData)
```

Plugins MUST use `PluginContext` for all database access - never import Firestore directly.

### Dynamic Routing

Single route handler (`app/goal/[id]/[[...plugin]]/page.tsx`) resolves all plugin routes:
- `/goal/{id}` → Calendar (core)
- `/goal/{id}/analytics` → Analytics (core)
- `/goal/{id}/{pluginId}/{year}` → Plugin page
- `/goal/{id}/{pluginId}/...` → Plugin sub-routes

## Adding a New Plugin

**Required Steps:**

1. Create plugin directory structure:
```
src/plugins/my-plugin/
├── types.ts              # Extend PluginDayData, PluginConfigData
├── data-provider.ts      # Implement PluginDataProvider interface
├── plugin.ts             # Define Plugin object
├── components/           # Plugin-specific UI
└── pages/                # Plugin pages (optional)
```

2. Implement required interfaces:
   - `PluginDataProvider<DayData, Config>` for data persistence
   - `Plugin<DayData, Config>` for plugin definition

3. Register in `src/core/plugin-registry/manifest.ts`:
```typescript
import MyPlugin from '@/plugins/my-plugin/plugin'

export const AVAILABLE_PLUGINS: PluginManifestEntry[] = [
  // ... existing plugins
  { plugin: MyPlugin, enabled: true },
]
```

**See `.cursorrules` for detailed plugin development guidelines.**

## SDK Utilities

The SDK provides utilities to eliminate boilerplate:

### Hooks
- `usePluginPage<DayData, Config>`: Complete page setup (data loading, routing, navigation)

### Components
- `LoadingState`: Standard loading indicator
- `NotFoundState`: Standard not found indicator
- UI components: `Card`, `Modal`, `Tabs`, etc.

### Firestore Utilities
- `loadDocument`, `saveDocument`, `deleteDocument`: Type-safe document operations
- `loadCollection`, `loadDateRange`: Collection and range queries
- `buildPluginPath`, `buildPluginDayPath`, `buildPluginConfigPath`: Path builders
- `removeUndefinedFields`: Firestore-compatible data cleaning

## Firebase

### Emulator Configuration
For local development and testing, set in `.env.test`:
```env
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true
NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
NEXT_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_HOST=localhost:8080
```

### Security Rules
All user data requires authentication:
```
match /users/{userId}/{document=**} {
  allow read, write: if request.auth.uid == userId;
}
```

Rules are deployed via: `npm run deploy:rules`

### Data Management
- **Backup**: Navigate to `/debug/backup` in the app
- **Restore**: Navigate to `/debug/restore` and upload JSON
- **Generate Test Data**: `just generate-dummy-data` creates realistic data for all plugins

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **React**: 19.2.1
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication
- **Styling**: Tailwind CSS 4
- **Testing**: Playwright (E2E)
- **Deployment**: Docker + Traefik
- **Maps**: Leaflet + React Leaflet (travel plugin)
- **AI**: OpenAI API (executive goal plugin)

## Import Path Aliases

TypeScript paths configured in `tsconfig.json`:
```typescript
"@/sdk/*"      // Plugin SDK
"@/core/*"     // Core infrastructure
"@/plugins/*"  // Plugin implementations
"@/*"          // src/ root
```

## Critical Rules

### Plugin Development
- ❌ **NEVER** let core import from plugins (except manifest)
- ❌ **NEVER** import from other plugins
- ❌ **NEVER** access Firestore directly (use `PluginContext`)
- ❌ **NEVER** save `undefined` values to Firestore (use `removeUndefinedFields`)
- ✅ **ALWAYS** extend SDK types (`PluginDayData`, `PluginConfigData`)
- ✅ **ALWAYS** use `PluginContext` for database operations
- ✅ **ALWAYS** import types with `import type`

### Code Organization
- Keep files under 200 lines when possible
- Extract repeated JSX into reusable components
- One function per file for substantial utilities (>50 lines)
- Use composition over large monolithic components

### Naming Conventions
- Components: PascalCase (`MyPluginView.tsx`)
- Hooks: camelCase with `use` prefix (`useMyData.ts`)
- Utils: camelCase (`formatters.ts`)
- Types/Interfaces: PascalCase (`MyPluginData`)
- Constants: SCREAMING_SNAKE_CASE (`MAX_ITEMS`)

## Firestore Data Patterns

### Plugin Day Data
Always filter undefined values before saving:
```typescript
const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
  if (value !== undefined) acc[key] = value
  return acc
}, {} as Record<string, any>)

await setDoc(docRef, cleanData, { merge: true })
```

Or use SDK utility:
```typescript
import { saveDocument } from '@/sdk'
await saveDocument(db, path, data) // Auto-filters undefined
```

### Batch Operations
For multiple day updates:
```typescript
const batch = writeBatch(db)
dates.forEach(date => {
  const docRef = doc(db, `users/${userId}/goals/${goalId}/plugin/${date}`)
  batch.set(docRef, data[date], { merge: true })
})
await batch.commit()
```

## Common Patterns

### Plugin Page Setup
Use `usePluginPage` hook to eliminate boilerplate:
```typescript
const {
  goal, isLoading, todayISO, year,
  pluginDayData, pluginConfig,
  updateDayData, updateConfig,
  navigateToPrevYear, navigateToNextYear, jumpToDay
} = usePluginPage<DayData, Config>({
  pluginId: 'my-plugin',
  params,
  year,
})

if (isLoading) return <LoadingState />
if (!goal) return <NotFoundState />
```

### Save/Cancel Pattern
Use local state with explicit save/cancel:
```typescript
const [draftData, setDraftData] = useState(data)

const handleSave = async () => {
  await onUpdate(date, draftData)
}

const handleCancel = () => {
  setDraftData(data) // Reset to original
}
```

## Testing

### E2E Tests with Playwright
- Tests use Firebase emulators (Auth: 9099, Firestore: 8080)
- `npm run test:e2e` automatically starts emulators and dev server
- Use `auth.fixture.ts` for authenticated test scenarios
- Always use unique emails per test to avoid conflicts
- See `README.E2E.md` for detailed testing guide

### Test Fixtures
```typescript
import { test } from '../fixtures/auth.fixture'

test('authenticated test', async ({ authenticatedPage }) => {
  // Already signed in with unique user
  await expect(authenticatedPage.locator('text=Create Goal')).toBeVisible()
})
```

## Docker Deployment

Multi-stage build process:
1. **deps**: Install dependencies
2. **builder**: Build Next.js app with inlined Firebase config
3. **runner**: Minimal production image

Environment variables for build are passed as build args in `docker-compose.yml`.

GCS service account key must be mounted at `./gcs-key.json` for upload API.

Traefik labels configure:
- Domain: `nitya.geekynavigator.com`
- HTTPS with Cloudflare cert resolver
- Network: `nitya_network`

## Available Plugins

1. **Study**: Track study hours per subject/topic with session durations
2. **Productivity**: Daily productivity rating (1-10) across multiple areas
3. **Finance**: Budget management, expenses, income, and SIP tracking
4. **Travel**: Travel planning with destinations, dates, and notes
5. **Period**: Menstrual cycle tracking with flow intensity
6. **Executive Goal**: AI-powered goal management with chat interface

Each plugin can be enabled/disabled per goal via the addons manager modal.

## Code Style

### Import Organization
```typescript
// 1. React/Next
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// 2. Third-party
import { motion } from 'framer-motion'

// 3. SDK
import type { PluginContext } from '@/sdk'
import { Card } from '@/sdk/ui'

// 4. Relative
import type { MyData } from './types'
import { loadMyData } from './api'
```

### Glassmorphism Theme
Follow dark glassmorphism design pattern:
```typescript
className="
  bg-white/[0.02] backdrop-blur-sm
  rounded-2xl p-6
  border border-white/[0.08]
  hover:bg-white/[0.04]
  transition-all duration-200
"
```

## Additional Documentation

- `.cursorrules`: Comprehensive plugin architecture and development guide
- `PLUGIN_ARCHITECTURE.md`: Plugin migration and architecture details
- `README.E2E.md`: E2E testing guide
- `scripts/README.md`: Data management scripts documentation
