Close out a VenueCharm development session: update the four project docs, sync GitHub issues, and produce a clean summary.

If $ARGUMENTS is provided, treat it as a brief note about what was worked on this session (use it to guide the summary).

---

## Step 1 — Understand what changed
Run `git status` and `git diff --stat HEAD` to see all modified and untracked files since the last commit. List them clearly — this is the source of truth for what was done.

## Step 2 — Update PROGRESS.md
Read `PROGRESS.md`.
- Move every feature completed this session from ⚠️ or ❌ into the correct ✅ subsection with accurate bullet points.
- Remove or update "Immediate Next Steps" that are now done.
- Add any newly discovered ⚠️ blockers.
- Update the `_Last updated:` date to today's date.

## Step 3 — Update TODO.md
Read `TODO.md`.
- Remove or check off completed items.
- Add new tasks discovered this session under the correct priority tier (🔴 Critical / 🟡 Important / 🟢 Enhancement).
- Reorder priorities if anything has shifted.

## Step 4 — Update MEMORY.md
Read `MEMORY.md`.
- Add any new bugs, gotchas, or non-obvious patterns discovered this session using the existing Problem/Fix format.
- Do NOT add things already documented, or anything derivable from reading the code.
- Only add what future-you would wish you had written down.

## Step 5 — Update CLAUDE.md
Read `CLAUDE.md`. Only edit if this session introduced:
- New files or directories that belong in the architecture map
- New coding rules or conventions
- New migrations, RPC functions, or DB columns
- New environment variables

## Step 6 — GitHub Issues
First, detect the repo: run `gh repo view --json nameWithOwner` to get the owner/repo.
Then run `gh issue list --state open --limit 50 --json number,title,labels` to see all open issues.

**Close completed issues:**
For each feature/fix completed this session that has a matching open GitHub issue:
```
gh issue close <number> --comment "Completed in this session."
```

**Create missing issues:**
For each 🔴 or 🟡 item in TODO.md that has no GitHub issue yet, create one:
```
gh issue create --title "<short title>" --body "<description>" --label "enhancement"
```
For bugs use `--label "bug"`. For DB changes add `--label "backend"`. Note the created issue number.

## Step 7 — GitHub Project Board
Run:
```
gh project list --owner <owner>
```
to find the project number. Then:
```
gh project item-list <number> --owner <owner> --format json --limit 50
```
to see current board state.

Move items to the correct column:
- Closed issues → **Done**
- Newly created issues → **Todo**
- Issues actively being worked on → **In Progress**

Use `gh project item-edit` to update statuses. If the project field/option IDs are needed and not cached, fetch them with:
```
gh project field-list <number> --owner <owner>
```
then edit with:
```
gh project item-edit --project-id <project-id> --id <item-id> --field-id <field-id> --single-select-option-id <option-id>
```

If any board update requires IDs that can't be resolved automatically, output the exact command with a `# TODO: fill in IDs` comment and instruct the user to run it, or tell them exactly which card to drag on the GitHub Projects board.

## Step 8 — Session Summary
Output a clean summary using this exact format:

---
### Session Summary — <today's date>

**Completed**
- bullet list of features / fixes shipped this session

**Files changed**
- key files modified (as clickable markdown links)

**Issues closed**
- #N — title (or "none")

**Issues created**
- #N — title (or "none")

**Still blocked / needs config**
- anything in ⚠️ that couldn't be resolved

**Up next — top 3 priorities**
1. highest priority task + GitHub issue number if it exists
2. second priority
3. third priority
---
