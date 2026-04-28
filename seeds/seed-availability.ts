/**
 * VenueCharm — Availability Seed Script
 * Populates the availability table with realistic blocked dates for all venues
 *
 * Run AFTER seed-venues.ts:
 *   npx ts-node scripts/seed-availability.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const BLOCK_REASONS = [
  "Private booking",
  "Owner personal use",
  "Maintenance",
  "Cleaning day",
  "Holiday closure",
  "Private event",
  "Renovation work",
  "Owner vacation",
];

async function seedAvailability() {
  console.log("📅  VenueCharm Availability Seeder");
  console.log("════════════════════════════════════════");

  // Fetch all active venues
  const { data: venues, error } = await supabase
    .from("venues")
    .select("id, title")
    .eq("status", "ACTIVE");

  if (error || !venues?.length) {
    console.error("❌  No active venues found. Run seed-venues.ts first.");
    process.exit(1);
  }

  console.log(`Found ${venues.length} venues to populate availability for\n`);

  const today = new Date();
  let totalRows = 0;

  for (const venue of venues) {
    const blockedDates: { venue_id: string; date: string; is_available: boolean; reason: string }[] = [];

    // Each venue gets 4–10 random blocked date ranges in the next 6 months
    const numBlocks = randomInt(4, 10);

    for (let i = 0; i < numBlocks; i++) {
      const blockStart = addDays(today, randomInt(1, 180));
      const blockLength = randomInt(1, 4); // 1-4 day blocks
      const reason = BLOCK_REASONS[randomInt(0, BLOCK_REASONS.length - 1)];

      for (let d = 0; d < blockLength; d++) {
        const blockDate = formatDate(addDays(blockStart, d));
        // Avoid duplicates
        if (!blockedDates.find((b) => b.date === blockDate)) {
          blockedDates.push({
            venue_id: venue.id,
            date: blockDate,
            is_available: false,
            reason,
          });
        }
      }
    }

    if (blockedDates.length > 0) {
      const { error: insertErr } = await supabase
        .from("availability")
        .upsert(blockedDates, { onConflict: "venue_id,date" });

      if (insertErr) {
        console.error(`  ❌  ${venue.title}: ${insertErr.message}`);
      } else {
        console.log(`  ✅  ${venue.title}: ${blockedDates.length} blocked dates`);
        totalRows += blockedDates.length;
      }
    }
  }

  console.log("\n════════════════════════════════════════");
  console.log(`✅  Total availability rows inserted: ${totalRows}`);
  console.log("════════════════════════════════════════\n");
}

seedAvailability().catch(console.error);
