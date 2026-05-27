Create a git commit for all current changes in the VenueCharm repository. Follow these steps in order:

## Step 1 — Type check
Run `npx tsc --noEmit`. If there are errors, fix them all before continuing. Do not commit broken TypeScript.

## Step 2 — Review changes
Run `git status` and `git diff --stat HEAD` to see what has changed. Read the diff of any files you are unsure about.

## Step 3 — Stage
Run `git add -A` to stage all changes (new files, modifications, deletions).

## Step 4 — Write the commit message
Use the Conventional Commits format:
```
<type>(<scope>): <short summary in imperative mood>

<optional body — bullet list of what changed and why, max 72 chars per line>
```

Types: `feat` (new feature), `fix` (bug fix), `chore` (tooling/config), `docs` (documentation only), `refactor` (no behaviour change), `style` (formatting), `test` (tests).

Scope examples for this project: `auth`, `bookings`, `venues`, `stripe`, `admin`, `i18n`, `db`, `ui`.

Rules:
- Summary line ≤ 72 characters, no period at the end.
- If changes span multiple concerns, use the dominant one as the type and list the rest in the body.
- End the commit with: `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`

## Step 5 — Commit
Show the full commit message to the user first, then run `git commit -m "<message>"`.

If $ARGUMENTS is provided, treat it as a hint or draft message to refine — do not ignore it.
