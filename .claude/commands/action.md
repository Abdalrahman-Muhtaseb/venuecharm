Scaffold a new Next.js Server Action file in `src/actions/` for the VenueCharm project.

The action is about: $ARGUMENTS

## Steps

1. Determine the filename from $ARGUMENTS (e.g. "reviews" → `src/actions/reviews.ts`, "availability" → already exists — open it instead).
2. Check whether the file already exists. If it does, add the new function(s) to it rather than overwriting.
3. Create (or update) the file following this exact structure:

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
// add other imports only if needed

export async function <functionName>(<params>) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')      // or: throw new Error('Unauthenticated')

  // TODO: implement
}
```

## Rules
- `'use server'` must be the very first line.
- Always verify auth at the top — no business logic before the user check.
- Use `redirect('/login')` for page-level actions (called from forms). Use `throw new Error('Unauthenticated')` for actions called from client components with `useTransition`.
- Use `createClient()` (RLS-aware) by default. Only import `createAdminClient()` if the action intentionally bypasses RLS (e.g. webhook handlers, admin-only writes).
- Use `revalidatePath()` at the end for any action that mutates data shown on a page.
- No comments unless the WHY is non-obvious.
- Follow the `requireHost()` / `requireAdmin()` pattern if the action is role-gated (see `src/actions/venues.ts` for the pattern).
- After creating the file, run `npx tsc --noEmit` and fix any type errors.
