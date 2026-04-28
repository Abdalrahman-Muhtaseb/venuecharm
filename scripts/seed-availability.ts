/**
 * VenueCharm — Availability Seed Script
 * Generates recurring availability patterns for venues
 *
 * Usage:
 *   npx tsx scripts/seed-availability.ts
 *
 * Prerequisites:
 *   npm install @supabase/supabase-js typescript ts-node @types/node dotenv
 *   seed-venues.ts must have been run first
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

// ─── Config ────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Helper: add days to date ────────────────────────────────────────────────
function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

// ─── Availability Template for typical venues ─────────────────────────────
interface AvailabilitySlot {
  venue_id: string;
  date: string;
  is_available: boolean;
  reason?: string;
}

function generateWeeklyAvailability(
  venueId: string,
  startDate: Date,
  weeksAhead: number
): AvailabilitySlot[] {
  const slots: AvailabilitySlot[] = [];
  const baseDate = new Date(startDate);
  baseDate.setHours(0, 0, 0, 0);

  for (let week = 0; week < weeksAhead; week++) {
    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      const currentDate = addDays(baseDate, week * 7 + dayOfWeek);
      const dateStr = toDateString(currentDate);

      // Skip Sundays (day 0) — venues often closed
      if (dayOfWeek === 0) {
        slots.push({
          venue_id: venueId,
          date: dateStr,
          is_available: false,
          reason: "Closed on Sundays",
        });
        continue;
      }

      // All other days are available
      slots.push({
        venue_id: venueId,
        date: dateStr,
        is_available: true,
      });
    }
  }

  return slots;
}

// ─── Seed Function ───────────────────────────────────────────────────────────
async function seed() {
  console.log("🌱  VenueCharm Availability Seeder");
  console.log("════════════════════════════════════════");

  // 1. Find all seed venues
  console.log("🔍  Fetching seed venues...");
  const { data: hostUser } = await supabase
    .from("users")
    .select("id")
    .eq("email", "seed-host@venuecharm.dev")
    .single();

  if (!hostUser) {
    console.error("❌  Seed host user not found. Run seed-venues.ts first.");
    process.exit(1);
  }

  const { data: venues, error: venueErr } = await supabase
    .from("venues")
    .select("id")
    .eq("host_id", hostUser.id);

  if (venueErr || !venues || venues.length === 0) {
    console.error("❌  No seed venues found. Run seed-venues.ts first.");
    process.exit(1);
  }

  console.log(`    ✓  Found ${venues.length} seed venues\n`);

  // 2. Generate and insert availability for the next 12 weeks
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 7); // Start from next week

  let totalSlots = 0;
  let totalFailed = 0;

  for (const venue of venues) {
    const slots = generateWeeklyAvailability(
      venue.id,
      startDate,
      12 // 12 weeks ahead
    );

    console.log(`📅  Inserting ${slots.length} availability dates for venue ${venue.id}...`);

    // Insert in smaller batches to avoid request size limits
    const batchSize = 500;
    for (let i = 0; i < slots.length; i += batchSize) {
      const batch = slots.slice(i, Math.min(i + batchSize, slots.length));
      const { error } = await supabase.from("availability").insert(batch);

      if (error) {
        console.error(`    ❌  Batch insert failed: ${error.message}`);
        totalFailed += batch.length;
      } else {
        totalSlots += batch.length;
      }
    }
  }

  // 3. Summary
  console.log("\n════════════════════════════════════════");
  console.log(`✅  Seeded: ${totalSlots} availability dates`);
  if (totalFailed > 0) console.log(`❌  Failed: ${totalFailed} dates`);
  console.log("\nNext step:");
  console.log("  Run: npx tsx scripts/verify-seed.ts");
  console.log("════════════════════════════════════════\n");
}

seed().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
