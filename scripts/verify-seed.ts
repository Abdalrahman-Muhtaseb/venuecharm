/**
 * VenueCharm — Seed Verification Script
 * Validates the completeness and quality of seeded data
 *
 * Usage:
 *   npx tsx scripts/verify-seed.ts
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

// ─── Verification Tests ────────────────────────────────────────────────────
async function verify() {
  console.log("🔍  VenueCharm Seed Verification");
  console.log("════════════════════════════════════════\n");

  let passed = 0;
  let failed = 0;

  // Test 1: Verify seed host user exists
  console.log("Test 1: Seed Host User");
  const { data: user, error: userErr } = await supabase
    .from("users")
    .select("id, email, role")
    .eq("email", "seed-host@venuecharm.dev")
    .single();

  if (userErr || !user) {
    console.log("  ❌  Failed: seed host user not found");
    failed++;
  } else {
    console.log(`  ✅  Passed: seed host exists (${user.id})`);
    console.log(`       Email: ${user.email}`);
    console.log(`       Role: ${user.role}`);
    passed++;
  }

  if (!user) {
    console.log("\n❌  Cannot continue — seed host not found. Run seed-venues.ts first.\n");
    process.exit(1);
  }

  const hostId = user.id;

  // Test 2: Verify venue count
  console.log("\nTest 2: Venue Count");
  const { data: venues, error: venueErr } = await supabase
    .from("venues")
    .select("id, title, city")
    .eq("host_id", hostId);

  if (venueErr || !venues) {
    console.log("  ❌  Failed: could not fetch venues");
    failed++;
  } else if (venues.length === 0) {
    console.log("  ❌  Failed: no venues found");
    failed++;
  } else {
    console.log(`  ✅  Passed: ${venues.length} venues found`);
    passed++;
  }

  if (!venues || venues.length === 0) {
    console.log("\n❌  No venues to verify further.\n");
    process.exit(1);
  }

  // Test 3: Sample venue data completeness
  console.log("\nTest 3: Venue Data Completeness (sample 3 venues)");
  const sampleVenues = venues.slice(0, 3);
  let completeVenues = 0;

  for (const venue of sampleVenues) {
    const { data: detailed } = await supabase
      .from("venues")
      .select("*")
      .eq("id", venue.id)
      .single();

    if (!detailed) {
      console.log(`  ❌  ${venue.title}: missing`);
      continue;
    }

    const checks = {
      title: !!detailed.title,
      description: !!detailed.description,
      address: !!detailed.address,
      city: !!detailed.city,
      capacity: detailed.capacity > 0,
      price_per_hour: detailed.price_per_hour > 0,
      amenities: Array.isArray(detailed.amenities) && detailed.amenities.length > 0,
      photos: Array.isArray(detailed.photos) && detailed.photos.length > 0,
      location: !!detailed.location,
    };

    const allPassed = Object.values(checks).every((v) => v);

    if (allPassed) {
      console.log(`  ✅  ${venue.title} — all fields present`);
      completeVenues++;
    } else {
      const missing = Object.entries(checks)
        .filter(([_, passed]) => !passed)
        .map(([field]) => field)
        .join(", ");
      console.log(`  ⚠️   ${venue.title} — missing: ${missing}`);
    }
  }

  if (completeVenues === sampleVenues.length) {
    passed++;
  } else {
    failed++;
  }

  // Test 4: Availability data
  console.log("\nTest 4: Availability Slots");
  const { count: slotCount, error: slotErr } = await supabase
    .from("availability")
    .select("id", { count: "exact", head: true })
    .in(
      "venue_id",
      venues.map((v) => v.id)
    );

  if (slotErr || slotCount === 0) {
    console.log("  ⚠️   No availability slots found (may not be seeded yet)");
    failed++;
  } else {
    console.log(`  ✅  Passed: ${slotCount} availability slots`);
    passed++;
  }

  // Test 5: City distribution
  console.log("\nTest 5: Geographic Distribution");
  const cityGroups = venues.reduce(
    (acc, v) => ({
      ...acc,
      [v.city]: (acc[v.city as keyof typeof acc] || 0) + 1,
    }),
    {} as Record<string, number>
  );

  const sortedCities = Object.entries(cityGroups)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  console.log("  Top 5 cities:");
  sortedCities.forEach(([city, count]) => {
    console.log(`    • ${city}: ${count} venues`);
  });
  console.log(`  Total cities: ${Object.keys(cityGroups).length}`);
  passed++;

  // ─── Summary ────────────────────────────────────────────────────────────────
  console.log("\n════════════════════════════════════════");
  console.log(`Tests Passed: ${passed}`);
  console.log(`Tests Failed: ${failed}`);

  if (failed === 0) {
    console.log("\n✅  All verification tests passed!");
    console.log("\nSeed data is ready for development. Next steps:");
    console.log("  1. Start your dev server: npm run dev");
    console.log("  2. Visit http://localhost:3000");
    console.log("  3. Browse venues in the discover page");
    console.log("  4. Log in as a test user to make bookings");
  } else {
    console.log("\n⚠️   Some tests failed. Review the output above.");
  }

  console.log("════════════════════════════════════════\n");
}

verify().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
