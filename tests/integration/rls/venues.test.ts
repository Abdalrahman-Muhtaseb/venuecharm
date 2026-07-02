import { describe, it, expect, afterAll } from 'vitest'
import { hasTestDb, createUser, makeVenue, anon, signIn, cleanupAll } from '../../helpers/supabase'

// Phase 3 (P0): the public/anon role sees only ACTIVE venues. PENDING_APPROVAL
// and SUSPENDED venues must be invisible to anon and to other users — only the
// owning host (or the service-role admin client) can see them.
describe.skipIf(!hasTestDb)('RLS: venues', () => {
  afterAll(cleanupAll)

  it('anon sees ACTIVE venues but not PENDING_APPROVAL', async () => {
    const host = await createUser('HOST')
    const active = await makeVenue(host.id, { status: 'ACTIVE' })
    const pending = await makeVenue(host.id, { status: 'PENDING_APPROVAL' })

    const client = anon()
    const activeRes = await client.from('venues').select('id').eq('id', active)
    const pendingRes = await client.from('venues').select('id').eq('id', pending)

    expect(activeRes.data ?? []).toHaveLength(1)
    expect(pendingRes.data ?? []).toHaveLength(0)
  })

  it('anon does not see SUSPENDED venues', async () => {
    const host = await createUser('HOST')
    const suspended = await makeVenue(host.id, { status: 'SUSPENDED' })

    const { data } = await anon().from('venues').select('id').eq('id', suspended)
    expect(data ?? []).toHaveLength(0)
  })

  it('the owning host can see their own non-ACTIVE venue', async () => {
    const host = await createUser('HOST')
    const pending = await makeVenue(host.id, { status: 'PENDING_APPROVAL' })

    const client = await signIn(host)
    const { data } = await client.from('venues').select('id').eq('id', pending)
    expect(data ?? []).toHaveLength(1)
  })
})
