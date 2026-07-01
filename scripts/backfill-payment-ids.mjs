/**
 * One-time script to backfill stripe_transfer_id and stripe_refund_id
 * on the payments table for all historical charges.
 *
 * Run: node scripts/backfill-payment-ids.mjs
 * Requires STRIPE_SECRET_KEY in .env.local (reads it automatically).
 *
 * Outputs ready-to-run SQL to stdout — review it, then paste into Supabase SQL Editor.
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))

// ── Load .env.local ───────────────────────────────────────────
const envPath = resolve(__dir, '../.env.local')
const envLines = readFileSync(envPath, 'utf-8').split('\n')
for (const line of envLines) {
  const [key, ...rest] = line.split('=')
  if (key && rest.length) process.env[key.trim()] = rest.join('=').trim()
}

const { default: Stripe } = await import('stripe')
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' })

// ── Parse CSV ─────────────────────────────────────────────────
const csvPath = resolve(__dir, '../stripe-payments/unified_payments.csv')
const csv = readFileSync(csvPath, 'utf-8')
const [header, ...rows] = csv.trim().split('\n')
const cols = header.split(',')

const idx = (name) => cols.indexOf(name)
const COL_ID       = idx('id')
const COL_BOOKING  = idx('bookingId (metadata)')
const COL_STATUS   = idx('Status')
const COL_CAPTURED = idx('Captured')

const charges = rows
  .map((row) => row.split(','))
  .filter((r) => r[COL_ID]?.startsWith('ch_') && r[COL_BOOKING])
  .map((r) => ({
    chargeId:  r[COL_ID],
    bookingId: r[COL_BOOKING],
    status:    r[COL_STATUS],
    captured:  r[COL_CAPTURED],
  }))

console.log(`-- Found ${charges.length} charges to process\n`)

// ── Fetch from Stripe + emit SQL ──────────────────────────────
const sqls = []

for (const { chargeId, bookingId, status } of charges) {
  try {
    const charge = await stripe.charges.retrieve(chargeId, {
      expand: ['transfer', 'refunds'],
    })

    const transferId = charge.transfer
      ? (typeof charge.transfer === 'string' ? charge.transfer : charge.transfer.id)
      : null

    const refundId = charge.refunds?.data?.[0]?.id ?? null

    const sets = []
    if (transferId) sets.push(`stripe_transfer_id = '${transferId}'`)
    if (refundId)   sets.push(`stripe_refund_id = '${refundId}'`)

    if (sets.length === 0) {
      console.log(`-- ${chargeId} (${status}): no transfer/refund to set`)
      continue
    }

    const sql = `UPDATE payments SET ${sets.join(', ')} WHERE booking_id = '${bookingId}'; -- ${chargeId}`
    sqls.push(sql)
    console.log(sql)
  } catch (err) {
    console.error(`-- ERROR fetching ${chargeId}: ${err.message}`)
  }
}

console.log(`\n-- Done. ${sqls.length} UPDATE statements generated.`)
