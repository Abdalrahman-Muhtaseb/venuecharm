import { describe, it, expect, afterAll } from 'vitest'
import { hasTestDb, createUser, signIn, admin, cleanupAll } from '../../helpers/supabase'

// Phase 3 (P0): host_calendar_connections stores Google refresh tokens. It has
// RLS enabled with ZERO policies — it must be completely unreachable via any
// user/anon client, even for the owning host. Only the service-role admin
// client can touch it.
describe.skipIf(!hasTestDb)('RLS: host_calendar_connections (zero-policy secrets table)', () => {
  afterAll(cleanupAll)

  it('owning host cannot read their own calendar connection row', async () => {
    const host = await createUser('HOST')
    const { error: seedErr } = await admin().from('host_calendar_connections').insert({
      host_id: host.id,
      provider: 'google',
      refresh_token: 'super-secret-token',
      calendar_id: 'cal_123',
    })
    expect(seedErr).toBeNull()

    const client = await signIn(host)
    const { data } = await client
      .from('host_calendar_connections')
      .select('*')
      .eq('host_id', host.id)
    expect(data ?? []).toHaveLength(0)
  })

  it('a user cannot insert into the secrets table', async () => {
    const host = await createUser('HOST')
    const client = await signIn(host)
    const { error } = await client.from('host_calendar_connections').insert({
      host_id: host.id,
      provider: 'google',
      refresh_token: 'attacker-token',
      calendar_id: 'cal_x',
    })
    expect(error).not.toBeNull()
  })
})

// Phase 3 (P0): notifications are owner-scoped for SELECT, and have NO INSERT
// policy — cross-user rows are written only by the service role (notify()).
describe.skipIf(!hasTestDb)('RLS: notifications', () => {
  afterAll(cleanupAll)

  it('owner can read their own notifications', async () => {
    const user = await createUser('RENTER')
    await admin().from('notifications').insert({
      user_id: user.id,
      type: 'message',
      data: {},
      link: '/messages',
    })

    const client = await signIn(user)
    const { data } = await client.from('notifications').select('*').eq('user_id', user.id)
    expect((data ?? []).length).toBeGreaterThanOrEqual(1)
  })

  it('a user cannot read another user’s notifications', async () => {
    const owner = await createUser('RENTER')
    const other = await createUser('RENTER')
    await admin().from('notifications').insert({
      user_id: owner.id,
      type: 'message',
      data: {},
      link: '/messages',
    })

    const client = await signIn(other)
    const { data } = await client.from('notifications').select('*').eq('user_id', owner.id)
    expect(data ?? []).toHaveLength(0)
  })

  it('a user cannot insert a notification (no INSERT policy)', async () => {
    const user = await createUser('RENTER')
    const client = await signIn(user)
    const { error } = await client.from('notifications').insert({
      user_id: user.id,
      type: 'message',
      data: {},
      link: '/x',
    })
    expect(error).not.toBeNull()
  })
})
