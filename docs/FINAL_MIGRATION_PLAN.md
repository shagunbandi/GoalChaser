# Final migration plan: Monorepo (host + SDK + plugins)

This document is the single source of truth for the restructure. It shows the target structure and explicitly addresses the design concerns raised during planning.

---

## 1. Concerns addressed

### 1.1 Core as orchestrator only

- **Concern:** Core should be the backbone and orchestrator, not own plugin-specific behavior.
- **Decision:**
  - **Core owns:** App shell, routing, auth, Firebase, plugin registry, shared UI used by the app (Navbar, AppFooter, StatusBar), goal CRUD (CreateGoalForm, EditGoalModal, Dashboard), calendar/analytics/insights pages, and a single thin API route that delegates to plugins.
  - **Plugins own:** All plugin-specific logic, forms, API calls (OpenAI, etc.), and UI. No plugin-specific API route files in core; plugin logic is invoked via the thin wrapper or server actions.

### 1.2 Plugin API: no plugin routes in core, thin wrapper only

- **Concern:** Why should any part of e.g. `generate-executive-tasks` live in core?
- **Decision:** It doesn’t. Core exposes **one generic route** (e.g. `POST /api/plugin-action`) that receives `pluginId`, `action`, and `payload`, looks up the plugin, and calls the plugin’s handler. All logic (OpenAI, parsing, etc.) lives in the plugin package. Plugins can also use **Server Actions** (`'use server'`) for form submissions and other server work; those are defined in the plugin and called from plugin UI. No executive-goal–specific (or other plugin–specific) route files in core.

### 1.3 SDK: ui vs components

- **Concern:** What is the difference between `ui` and `components` in `packages/sdk`?
- **Decision:**
  - **`packages/sdk/src/ui/`** — **Presentational** building blocks. No plugin/SDK semantics, no data loading. Props in, render only (e.g. Card, Modal, Input, Tabs, NotesField, chart primitives, year-view renderers).
  - **`packages/sdk/src/components/`** — **Container/composite.** Use SDK hooks or context, compose multiple `ui` pieces, or implement a small feature (LoadingState, NotFoundState, PluginMonthView, AIChatInterface). Industry terms: presentational (ui) vs container/composite (components).

### 1.4 Development workflow

- **Concern:** Do I need to run multiple projects?
- **Decision:** No. One dev server: run the host app (e.g. `pnpm dev` from root or `apps/web`). The host pulls in the SDK and plugins from the workspace; editing SDK or plugin source is reflected via the bundler (and optionally `transpilePackages` so no separate build step is required).

### 1.5 Backend

- **Decision:** Stay on Next.js as the backend. No move to FastAPI or a separate backend service.

---

## 2. Target directory structure

```
goal-chaser/
├── package.json
├── pnpm-workspace.yaml
├── .gitignore
├── .env.local.example
├── README.md
│
├── apps/
│   └── web/
│       ├── package.json
│       ├── next.config.ts
│       ├── tsconfig.json
│       ├── postcss.config.mjs
│       ├── playwright.config.ts
│       ├── firebase.json
│       ├── .firebaserc
│       ├── firestore.rules
│       ├── Dockerfile
│       ├── docker-compose.yml
│       ├── justfile
│       ├── public/
│       │   └── (existing public assets)
│       └── src/
│           ├── app/
│           │   ├── api/
│           │   │   ├── plugin-action/
│           │   │   │   └── route.ts          # Thin wrapper: delegates to plugin handlers
│           │   │   ├── storage/
│           │   │   │   ├── upload/route.ts
│           │   │   │   └── delete/route.ts
│           │   │   └── places/
│           │   │       ├── autocomplete/route.ts
│           │   │       └── details/route.ts
│           │   ├── debug/
│           │   ├── developer/
│           │   ├── goal/
│           │   │   └── [id]/
│           │   │       ├── [[...plugin]]/page.tsx
│           │   │       ├── layout.tsx
│           │   │       ├── analytics/page.tsx
│           │   │       └── insights/page.tsx
│           │   ├── layout.tsx
│           │   ├── page.tsx
│           │   ├── signin/page.tsx
│           │   ├── favicon.ico
│           │   └── globals.css
│           ├── components/
│           │   ├── Providers.tsx
│           │   ├── ui/
│           │   │   ├── AppFooter.tsx
│           │   │   ├── Navbar.tsx
│           │   │   ├── StatusBar.tsx
│           │   │   └── index.ts
│           │   └── features/
│           │       ├── AddonsManagerModal.tsx
│           │       ├── FirebaseHealthCheck.tsx
│           │       ├── GroupedTabBar.tsx
│           │       ├── analytics/
│           │       ├── calendar/
│           │       ├── home/
│           │       ├── insights/
│           │       ├── landing/
│           │       ├── unified-view/
│           │       └── index.ts
│           ├── constants/
│           │   └── index.ts
│           ├── core/
│           │   └── plugin-registry/
│           │       ├── index.ts
│           │       ├── hooks.ts
│           │       └── manifest.ts
│           ├── hooks/
│           ├── lib/
│           ├── services/
│           ├── types/
│           ├── utils/
│           └── stories/
│
├── packages/
│   └── sdk/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts
│           ├── interfaces/
│           │   └── plugin.interface.ts
│           ├── types/
│           │   ├── (existing SDK types)
│           │   └── year-view-config.ts
│           ├── services/
│           ├── hooks/
│           ├── components/           # Container/composite (LoadingState, AIChatInterface, etc.)
│           ├── ui/                   # Presentational (Card, Modal, Input, charts, etc.)
│           ├── analytics/
│           ├── utils/
│           │   └── plugin-url-utils.ts
│           ├── constants/
│           │   └── calendar.ts
│           └── year-view/
│               ├── GenericYearView.tsx
│               └── renderers/
│
└── plugins/
    ├── study/
    │   ├── package.json
    │   ├── tsconfig.json
    │   └── src/
    │       ├── plugin.ts
    │       ├── types.ts
    │       ├── data-provider.ts
    │       ├── detail-provider.tsx
    │       ├── insights-utils.ts
    │       ├── components/
    │       └── pages/
    │
    ├── productivity/
    │   └── src/ (same pattern)
    │
    ├── finance/
    │   └── src/ (same pattern)
    │
    ├── travel/
    │   └── src/ (same pattern)
    │
    ├── period/
    │   └── src/ (same pattern)
    │
    └── executive-goal/
        ├── package.json
        ├── tsconfig.json
        └── src/
            ├── plugin.ts
            ├── types.ts
            ├── api.ts
            ├── calendar-utils.ts
            ├── data-provider.ts
            ├── detail-provider.tsx
            ├── insights-utils.ts
            ├── actions/                    # Server actions and/or handlers for thin wrapper
            │   ├── generateTasks.ts
            │   ├── executiveGoalChat.ts
            │   └── summarizeProgress.ts
            ├── components/
            └── pages/
```

---

## 3. What moves where (concise)

| From (current) | To |
|----------------|-----|
| Root app config (next, firebase, docker, etc.) | `apps/web/` |
| `src/app`, `src/components` (except moved UI/year-view), `src/core`, `src/hooks`, `src/lib`, `src/services`, `src/types`, `src/utils`, `src/constants`, `src/stories` | `apps/web/src/` |
| `src/sdk/*` | `packages/sdk/src/` |
| `src/components/ui/Card.tsx`, `CardHeader`, `Modal`, `Tabs`, `MultiSelectDropdown`, `forms/*` | `packages/sdk/src/ui/` |
| `src/components/features/year-view/*` | `packages/sdk/src/year-view/` |
| `src/types/year-view-config.ts` | `packages/sdk/src/types/year-view-config.ts` |
| `src/lib/plugin-url-utils.ts` | `packages/sdk/src/utils/plugin-url-utils.ts` |
| `MONTH_NAMES`, `WEEKDAY_LABELS` from constants | `packages/sdk/src/constants/calendar.ts` |
| `src/plugins/study/*` | `plugins/study/src/` |
| `src/plugins/productivity/*` | `plugins/productivity/src/` |
| (same for finance, travel, period, executive-goal) | `plugins/<name>/src/` |
| **No** `src/app/api/ai/executive-goal-chat`, `ai/extract`, `ai/generate-executive-tasks`, `ai/summarize-executive-progress` | Removed from core; logic in `plugins/executive-goal/src/actions/` |

---

## 4. Thin wrapper: plugin-action route

- **Path:** `apps/web/src/app/api/plugin-action/route.ts`
- **Behavior:**
  - Parse body: `{ pluginId: string, action: string, payload?: unknown }`.
  - Get plugin from registry (or from a small map of action handlers).
  - Call `plugin.handlers[action](payload)` (or equivalent contract). Plugins export a `handlers` (or `actions`) object that the registry or route can use.
  - Return the handler’s result as JSON.
- **Plugin contract:** Each plugin that needs server-side API exposes handlers (or server actions). The wrapper is the only plugin-calling route in core; all real logic lives in the plugin package.

---

## 5. Core vs plugin ownership (summary)

| Owned by core | Owned by plugin |
|---------------|-----------------|
| Routing, layout, auth, Firebase | Plugin routes, plugin data, plugin API logic |
| Goal CRUD (CreateGoalForm, list, edit) | Plugin forms (e.g. task form, subject form) |
| Calendar, Analytics, Insights pages | Plugin pages and detail providers |
| Plugin registry, manifest | Plugin definition, data provider, actions |
| Single `plugin-action` route (dispatcher) | All handlers called by that route |
| Shared app UI (Navbar, AppFooter, StatusBar) | Plugin-specific UI and server actions |

---

## 6. Migration order

1. **Workspace root** — Add root `package.json` and `pnpm-workspace.yaml`; define workspaces.
2. **packages/sdk** — Move `src/sdk` into `packages/sdk/src`. Move shared UI (Card, Modal, Tabs, etc.), year-view, year-view-config, plugin-url-utils, and calendar constants from host into SDK. Fix SDK exports and internal imports.
3. **apps/web** — Move app code and config into `apps/web/`. Remove from host anything that now lives in SDK. Point host to `@goal-chaser/sdk`. Add `api/plugin-action/route.ts` (thin wrapper). Remove plugin-specific API routes under `api/ai/`; rely on plugin actions + wrapper.
4. **plugins/** — Move each `src/plugins/<name>` to `plugins/<name>/src`. Add `package.json` and `tsconfig.json` per plugin. For executive-goal, add `actions/` and move API logic there; register handlers for the thin wrapper. Update host manifest to import plugins from workspace packages.
5. **Cleanup** — Delete empty `src/plugins` and `src/sdk` from host. Set root script (e.g. `dev`) to run the host app.

---

## 7. Imports after migration

- **Host:** `@/...` for app paths; `@goal-chaser/sdk` for SDK; `@goal-chaser/plugin-study` (or workspace name) in manifest only.
- **SDK:** No imports from host or plugins; only React, Firebase (if needed), and its own modules.
- **Plugins:** Only `@goal-chaser/sdk`; no host paths.

This is the final migration plan with structure and concerns reflected as above.
