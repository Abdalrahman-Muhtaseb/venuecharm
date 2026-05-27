Start a new VenueCharm development session: load all project context, check GitHub state, and produce a prioritized plan.

If $ARGUMENTS is provided (e.g. `/plan reviews system`), focus the plan on that specific area rather than doing a general sweep.

---

## Step 1 — Load project context
Read all four files in parallel:
- `CLAUDE.md` — architecture, conventions, coding rules, environment variables
- `PROGRESS.md` — what is fully working, what is blocked, what is not yet built
- `TODO.md` — prioritized remaining work (🔴🟡🟢)
- `MEMORY.md` — known bugs, gotchas, and patterns to apply or avoid

## Step 2 — Check GitHub state
Run `gh repo view --json nameWithOwner` to confirm the repo.
Then run:
```
gh issue list --state open --limit 50 --json number,title,labels,assignees
```
Cross-reference open issues with TODO.md:
- Which TODO items have a GitHub issue tracking them?
- Which open issues aren't reflected in TODO.md yet (add them mentally to the plan)?
- Are there any issues marked "In Progress" that should be prioritized?

Also check the project board:
```
gh project list --owner <owner>
```
then:
```
gh project item-list <number> --owner <owner> --format json --limit 50
```
Note anything in the "In Progress" column — that's what was actively being worked on last session.

## Step 3 — Synthesize and present the plan

Output the plan in this exact format:

---
### Session Plan — <today's date>

**Where things stand** *(2–3 sentences)*
Brief honest status: what is working end-to-end, what is the biggest blocker right now.

**Recommended tasks for this session**

| # | Task | Issue | Priority | Size |
|---|------|-------|----------|------|
| 1 | description | #N or — | 🔴/🟡/🟢 | S/M/L |
| 2 | ... | | | |
| 3 | ... | | | |

Sizes: **S** = under 1h, **M** = 1–3h, **L** = half day+

**Must resolve first (blockers)**
- List any ⚠️ configuration or migration steps that must happen before the above tasks can proceed.
  Example: "Apply migration 005 before testing any Stripe Connect flow."

**Gotchas to keep in mind today**
- 2–3 entries from MEMORY.md most relevant to the planned work.
  Example: "SQL Editor runs as one transaction — if any statement fails, the whole thing rolls back."

**Available skills**
- `/tsc` — type-check and fix errors
- `/commit` — type-check + conventional commit
- `/i18n <description>` — add translation keys to both locales
- `/action <name>` — scaffold a server action
- `/migration <description>` — create next-numbered SQL migration
- `/wrap` — end-of-session: update docs + sync GitHub issues
---

## Step 4 — Ask before starting
After presenting the plan, ask exactly this:

> "Does this match what you want to work on today, or do you want to focus on something specific?"

Wait for the user's answer. Do not write any code or make any changes until they confirm or redirect.

**Exception:** If $ARGUMENTS was provided, skip the question and start working on that specific focus immediately after presenting a targeted version of the plan.
