# Developer documentation

SDK documentation is built from this folder and served at **[/developer/documentation](/developer/documentation)** in the app.

## Contents

- **`storybook/`** – Storybook stories for SDK and core components. Stories live under `docs/storybook/stories/*.stories.tsx`:
  - **States:** LoadingState, NotFoundState, EmptyState, ContentLoader
  - **Views:** MonthCalendar, PluginMonthView (Monthly View), GenericYearView (Yearly View)
  - **UI:** Card, Modal, Tabs, Drawer, NotesField, SummaryCard
  - **Chat:** ChatInterface
  - **Analytics:** LineChart, MetricCard

## Commands

- **`npm run storybook`** – Run Storybook dev server at http://localhost:6006
- **`npm run build-storybook`** – Build Storybook static output (then copied to `public/developer/documentation/storybook/`)
- **`npm run build:typedoc`** – Generate API reference from `src/sdk` into `public/developer/documentation/api/`
- **`npm run build:docs`** – Run both (Storybook + TypeDoc)
- **`npm run build`** – Full app build; runs `build:docs` then Next.js build, so docs are included

## Adding SDK stories

Add `*.stories.tsx` (or `*.stories.ts`) under `docs/storybook/stories/`. Import from `@/sdk` for components exported from the main SDK index, or from `@/sdk/ui` for UI-only exports (e.g. EmptyState, SummaryCard, ActionButton).

## API reference (TypeDoc)

Configured in `typedoc.json`. Entry point: `src/sdk/index.ts`. Output: `public/developer/documentation/api/`.
