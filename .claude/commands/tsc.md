Run `npx tsc --noEmit` in the project root and capture the full output.

If there are zero errors: confirm with a short "✅ TypeScript clean — no errors." message.

If there are errors:
1. List every error with its file path (as a clickable markdown link), line number, and message.
2. Group errors by file.
3. Fix ALL errors — open each file, make the minimal correct change, and do not introduce new errors or skip strict-mode rules.
4. After fixing, run `npx tsc --noEmit` again to confirm it is clean.
5. Report what you changed and why.

Rules:
- Never use `// @ts-ignore` or `as any` to silence errors — fix the actual type issue.
- Never widen a type to `unknown` and immediately cast it back — resolve the actual mismatch.
- If an error requires a schema change or is genuinely unresolvable without more context, explain clearly and stop rather than suppressing it.
