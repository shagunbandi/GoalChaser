# AI-Powered Executive Goal Adding (Nitya AI Chat) — Updated

## Clarification: No Goal Form

**Add executive goal uses only the chat.** There is no goal form (no manual title/description/date fields). All values are filled by the AI from the interview:

- **Title** — extracted/summarized by Nitya AI from the conversation
- **Description** — written by Nitya AI, including the phase plan (how to achieve the goal)
- **Start date** — always today (set by the app)
- **End date** — user says if they have a deadline; otherwise Nitya AI suggests one

**AI must know the current date.** The client sends today’s date (e.g. `todayISO` in `YYYY-MM-DD`) on every chat request. The API injects it into the system prompt so Nitya AI can reference “today” correctly and suggest accurate deadlines (e.g. “3 months from today”).

When the interview is complete, the user sees a **read-only summary** (title, description snippet, deadline) and a single **"Create goal"** button. No editable form. Clicking "Create goal" creates the executive goal with the AI-provided payload.

**Edit flow** (existing goals) can still use the current `ExecutiveGoalForm` if you want to keep editing in place. The "no form" rule applies only to **adding** a new executive goal.

---

## Current State

- **Add executive goal** is triggered from:
  1. **YearView**: Modal with ExecutiveGoalForm
  2. **ExecutiveGoalManager** (drawer): "Add New Goal" shows ExecutiveGoalForm inline
  3. **detail-provider** (EmptyExecutiveGoalState and ExecutiveGoalPlansView): "+ Add ExecutiveGoal" shows ExecutiveGoalForm inline

- Saving: `handleAddExecutiveGoal(ExecutiveGoalPlanInput)` in ExecutiveGoalPage builds the plan and calls `saveExecutiveGoalPlan`. Plan ID is generated client-side.

- No chat UI exists; existing AI is one-shot extraction in `api/ai/extract`.

## Architecture

- User clicks "Add executive goal" → **chat only** (Nitya AI).
- Multi-turn interview: Nitya asks what they want to build, refines title/description, asks about deadline (or suggests one).
- When done, AI returns structured payload: `{ title, description, endDate }`. Description includes phase plan.
- Client shows read-only summary + "Create goal" → `onAddExecutiveGoal({ title, description, startDate: today, endDate, color: default })` → close chat.

## Implementation Plan

### 1. New API route: `src/app/api/ai/executive-goal-chat/route.ts`

- **POST** body: `{ messages: Array<{ role, content }>, todayISO: string }` — **required**: `todayISO` is today’s date in `YYYY-MM-DD` (e.g. `2026-01-29`). Client computes it at request time (e.g. `new Date().toISOString().split('T')[0]`).
- **Response**: `{ message: string, done?: boolean, goal?: { title, description, endDate } }`
- **System prompt** must include: “Today’s date is {todayISO}. Use this when the user says ‘today’ or when you suggest a deadline (e.g. ‘3 months from today’).” Then: Nitya AI persona; interview to get goal intent; ask deadline or suggest one (using today’s date for relative suggestions); when complete, write description with phase plan and output JSON block `{"done":true,"goal":{...}}` with `endDate` in `YYYY-MM-DD`.
- Use OpenAI (same pattern as `api/ai/extract`), parse assistant reply for JSON block.

### 2. New component: `src/plugins/executive-goal/components/AddExecutiveGoalChat.tsx`

- Chat UI only: message list (user + Nitya), input + send.
- **Today’s date**: Compute once (e.g. on mount or when opening) as `todayISO = new Date().toISOString().split('T')[0]`. Pass `todayISO` with every API request so the AI always has the correct “today” for deadlines and phrasing.
- On mount: one Nitya message (welcome + first question).
- On API response with `done: true` and `goal`: show **read-only summary** (title, description, end date) and **"Create goal"** button — **no form, no editable fields**.
- On "Create goal": call `onSubmit(ExecutiveGoalPlanInput)` with `title`, `description`, `startDate` = `prefilledStartDate ?? todayISO`, `endDate`, default `color`; then `onCancel` or success callback.
- Props: `onSubmit`, `onCancel`, optional `prefilledStartDate` (e.g. when adding from a specific day).

### 3. Wire chat (no form) into all add entry points

- **YearView**: When adding (no `editingExecutiveGoal`), Modal content = `AddExecutiveGoalChat` only. On submit, call existing `handleSaveExecutiveGoal` with chat result; do not show ExecutiveGoalForm for add.
- **ExecutiveGoalManager**: "Add New Goal" shows only `AddExecutiveGoalChat`. On submit call `onAddExecutiveGoal` and close. No form for add.
- **detail-provider** (EmptyExecutiveGoalState and ExecutiveGoalPlansView): "+ Add ExecutiveGoal" / "+ Add" shows only `AddExecutiveGoalChat`. On submit call `onAddExecutiveGoal`. No form for add.

### 4. Edit flow

- **Editing an existing goal** continues to use `ExecutiveGoalForm` (YearView edit modal, ExecutiveGoalManager edit, detail-provider edit). No change to edit UX unless you decide otherwise.

### 5. Data

- **Today’s date**: Client sends `todayISO` (YYYY-MM-DD) on every chat request; API puts it in the system prompt so the AI knows “today” and can suggest correct deadlines. When creating the goal, use that same `todayISO` (or `prefilledStartDate` when adding from a specific day) as `startDate`.
- All other add values come from AI; use default color (e.g. `#8B5CF6`), no note/parent unless you later add AI-driven optional fields.

## File Summary

| Action | File |
|--------|------|
| Create | `src/app/api/ai/executive-goal-chat/route.ts` |
| Create | `src/plugins/executive-goal/components/AddExecutiveGoalChat.tsx` |
| Edit | `src/plugins/executive-goal/components/YearView.tsx` — add flow: chat only in modal |
| Edit | `src/plugins/executive-goal/components/ExecutiveGoalManager.tsx` — add flow: chat only |
| Edit | `src/plugins/executive-goal/detail-provider.tsx` — add flow: chat only in empty state and plans view |
| Edit | `src/plugins/executive-goal/components/index.ts` — export AddExecutiveGoalChat if index exists |

No goal form in the add path; all add values are filled by AI and confirmed via read-only summary + "Create goal".
