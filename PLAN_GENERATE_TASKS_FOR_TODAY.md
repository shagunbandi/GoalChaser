# Generate Tasks for Today — Design & Brainstorming (1000-ft view)

## What We're Building

- **Where:** Day view — when the user is looking at a specific date (e.g. executive goal month view for one day, or calendar detail for that day).
- **For each executive goal** that spans that date: show a button **"Generate tasks for today"** (or "for this day" if the date isn’t today).
- **On click:** Nitya AI suggests the **next logical tasks** for that day based on:
  1. The goal’s **plan** (the phased plan we store).
  2. **Progress so far:** completed tasks + their **completion notes** (“how did it go”).
- **Result:** User sees suggested tasks, can add them as real tasks under that goal for that day (or tweak/regenerate).

---

## Data We Already Have

- **Executive goal:** `title`, `plan` (phase plan text), `startDate`, `endDate`.
- **Tasks:** Same shape as goals but with `parentExecutiveGoalId`; they have `completed` and `completionNote` (the “how did it go” note).

**New: progressSoFar (stored on the goal)**  
- A list of **20-day-period summaries**. Each entry covers one 20-day chunk of completed tasks (title, date, completionNote) summarized by AI into a short paragraph.
- Example shape: `progressSoFar: [{ periodLabel: "Days 1-20", periodStart: "2026-01-01", periodEnd: "2026-01-20", summary: "..." }, { periodLabel: "Days 21-40", ... }]`.
- We **never** send 20+ days of raw tasks to “generate tasks.” We send at most **last 20 days** in full; everything older is represented only via these stored summaries.

---

## Flow (User Journey)

1. User opens **day view** for date **D** (e.g. Jan 30).
2. Day view shows **executive goals** that cover D (goal.startDate ≤ D ≤ goal.endDate).
3. For each such goal we show:
   - The goal (title, plan snippet, etc.).
   - Existing **tasks for that day** (if any).
   - Button: **"Generate tasks for today"** (or “for this day”).
4. User clicks the button.
5. We call the AI with:
   - Goal’s **plan**.
   - **Date D** (the day we’re generating for).
   - **Progress so far:** (a) **progressSoFar** — all stored 20-day summaries for this goal, (b) **last 20 days** of completed tasks in full (title, date, completionNote). So we never send more than 20 days of raw tasks; older history is only in summaries.
6. AI returns a **list of suggested tasks** (e.g. titles, optionally a phase label).
7. UI shows suggestions; user can **Add all**, **Add selected**, or **Regenerate**. Adding creates task records (same as “add task” today: `parentExecutiveGoalId`, `startDate`/`endDate` = D, `completed: false`).

---

## Linking “Next Tasks” to Progress

- **Prompt idea:**  
  “Given this goal’s plan and the progress below (completed tasks and how each went), suggest 3–5 concrete tasks for [date D] that are the logical next steps. If the user struggled somewhere (see completion notes), suggest follow-up or adjustment; if they’re on track, suggest the next phase items.”
- **Input we send:**
  - Goal **plan** (full text).
  - **Progress:** for each completed task: title, date, and **completionNote** (so the model sees “how did it go”).
- **Output:** Structured list, e.g. `[{ title: string, phase?: string }]`. No need for a second round of chat; single request/response.

So: **next day’s tasks are linked to progress** because the model explicitly sees completed tasks + completion notes and is instructed to suggest the *next* steps and to adapt if the user noted struggles or blockers.

---

## Progress: Last 20 Days + progressSoFar (20-day summaries)

We **never** send “last 25 days” or arbitrary windows of raw tasks—that can be misleading (e.g. skipping important context). Instead:

- **Last 20 days:** Always send the **most recent 20 days** of completed tasks in full (title, date, completionNote). So the model always sees recent, detailed context.
- **Older than 20 days:** Represent only via **progressSoFar** — a list of 20-day-period summaries stored on the goal.

**Rolling logic (by “day” we mean days since goal start or days with completed tasks):**

| When generating for | What we send |
|---------------------|--------------|
| **Days 1–20**       | No summaries yet. Send **last 20 days** of completed tasks in full (or fewer if not enough history). |
| **Day 21**          | **progressSoFar:** one entry — summary for **days 1–20**. Plus **last 20 days** of raw tasks (which will be days 2–21). |
| **Day 41**          | **progressSoFar:** two entries — summary for **days 1–20**, summary for **days 21–40**. Plus **last 20 days** of raw tasks (days 22–41). |
| **Day 61**          | **progressSoFar:** three entries (1–20, 21–40, 41–60). Plus last 20 days (42–61). |

So: “last 20 days” = sliding window of raw tasks; everything before that is in **progressSoFar** as 20-day chunks. No “last 25” or mixed windows—just last 20 + prior chunks as summaries.

**When do we create a new 20-day summary?**  
When we have completed tasks that fall in a 20-day period that we haven’t summarized yet (e.g. we’re on day 21 and we have no summary for days 1–20). We run a **summarization** step: input = tasks in that period (title, date, completionNote), output = one short paragraph. We append that to **progressSoFar** and persist it on the goal. That summarization can be:
- A **separate API** (e.g. `POST /api/ai/summarize-executive-progress`) called when we detect “we need a new chunk.” Then we call “generate tasks” with progressSoFar + last 20 days. So **at most 2 AI calls** when we cross a 20-day boundary (first time); after that, 1 call (we already have the summary).
- Or a **combined** call that both summarizes the oldest unsummarized block and suggests tasks (one call, more complex prompt/response). Prefer separate for clarity; optimize later if needed.

**Where is progressSoFar stored?**  
On the executive goal (same document or a small sub-doc). Not in the `plan` field—keep `plan` as the original phased plan. Add a dedicated field, e.g. **progressSoFar: Array<{ periodLabel, periodStart, periodEnd, summary }>**, so we can append new 20-day summaries without touching the plan.

---

## Edge Cases & Decisions

| Scenario | Approach |
|----------|----------|
| **First time (no completed tasks)** | AI suggests tasks from the start of the plan (Phase 1 / earliest steps). |
| **Lots of completed tasks** | Send **last 20 days** in full; everything older is in **progressSoFar** (20-day summaries). Optionally truncate very long completionNotes (e.g. first 200 chars) in the last-20-days payload. |
| **Date is in the past** | Still show “Generate tasks for this day”; useful for backfilling or planning. |
| **Existing tasks for that day** | Include them in the prompt so AI doesn’t duplicate and can say “You already have X; here are 2 more.” |
| **Same day, user just completed a task + note** | “Last 20 days” includes up to the selected date D, so if they completed a task today and wrote a note, it’s in the last-20-days window when generating again. |
| **Need a new 20-day summary** | When we have tasks in a 20-day period that we haven’t summarized yet (e.g. first time we’re on day 21), run summarization, append to progressSoFar, then run “generate tasks” with progressSoFar + last 20 days. At most 2 AI calls when crossing a boundary. |

---

## What We Need (High Level)

1. **Storage:** Add **progressSoFar** on the executive goal: list of 20-day-period summaries (`periodLabel`, `periodStart`, `periodEnd`, `summary`). Keep **plan** unchanged (original phased plan).
2. **Summarization (when needed):** When we detect an unsummarized 20-day block (e.g. we’re past day 20 and have no summary for days 1–20), call an API that takes that block’s tasks (title, date, completionNote), returns one short summary, and we append to progressSoFar and save. E.g. `POST /api/ai/summarize-executive-progress` with goalId, periodStart, periodEnd, tasks → returns `{ summary }`; server appends to goal.progressSoFar.
3. **Generate-tasks API:** e.g. `POST /api/ai/generate-executive-tasks`.  
   Input: `goalId`, `date` (YYYY-MM-DD). Server: load goal (plan + progressSoFar), load completed tasks for that goal with endDate ≤ date, compute “last 20 days” of those tasks, and if any 20-day period is missing from progressSoFar, run summarization first and update goal; then build prompt from plan + progressSoFar + last 20 days of raw tasks, call OpenAI, return `{ tasks: [{ title, phase? }] }`.
4. **UI:**  
   - In day view, per executive goal: button “Generate tasks for today”.  
   - On click → call generate API (which may do summarize-then-generate internally) → show suggestions in a small modal/drawer.  
   - “Add all” / “Add selected” creates task records for that day under that goal; “Regenerate” calls API again.

---

## Summary

- **Button:** “Generate tasks for today” (or “for this day”) on day view, per executive goal.
- **Progress input:** (a) **progressSoFar** — stored list of 20-day-period summaries on the goal; (b) **last 20 days** of completed tasks in full (title, date, completionNote). No “last 25” or mixed windows; older history only as summaries.
- **New field:** **progressSoFar** on the goal (not inside `plan`): list of `{ periodLabel, periodStart, periodEnd, summary }`. On day 21 we have one summary (1–20); on day 41 we have two (1–20, 21–40); etc. Last 20 days always sent as raw tasks.
- **When we need a new summary:** When we have completed tasks in a 20-day block that isn’t summarized yet, we run a summarization step, append to progressSoFar, then run “generate tasks.” At most 2 AI calls when crossing a 20-day boundary; thereafter 1 call.
- **AI output:** List of suggested task titles (and optional phase).
- **Linking to progress:** Model sees plan + progressSoFar + last 20 days (with completion notes); prompt tells it to suggest next steps and adapt to struggles.

No architecture-level detail—this is the 1000-ft view to align on before implementation.
