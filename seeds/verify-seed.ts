/**
 * VenueCharm — Seed Verification Script
 * Runs sanity checks on the seeded data
 *
 *   npx ts-node scripts/verify-seed.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verify() {
  console.log("🔍  VenueCharm Seed Verification");
  console.log("════════════════════════════════════════\n");
  let allPassed = true;

  // ── Check 1: Total venue count ──────────────────────────────────────────
  const { count: venueCount } = await supabase
    .from("venues")
    .select("*", { count: "exact", head: true })
    .eq("status", "ACTIVE");

  const venuePass = (venueCount ?? 0) >= 50;
  console.log(`[${venuePass ? "✅" : "❌"}] Active venues: ${venueCount} (need ≥ 50)`);
  if (!venuePass) allPassed = false;

  // ── Check 2: Every venue has ≥ 3 photos ────────────────────────────────
  const { data: venues } = await supabase
    .from("venues")
    .select("id, title, photos")
    .eq("status", "ACTIVE");

  const badPhotos = venues?.filter((v) => !v.photos || v.photos.length < 3) ?? [];
  const photosPass = badPhotos.length === 0;
  console.log(`[${photosPass ? "✅" : "❌"}] Venues with ≥ 3 photos: ${(venues?.length ?? 0) - badPhotos.length}/${venues?.length ?? 0}`);
  if (!photosPass) {
    badPhotos.forEach((v) => console.log(`       ⚠️  "${v.title}" only has ${v.photos?.length ?? 0} photos`));
    allPassed = false;
  }

  // ── Check 3: Cities are distributed (not all in one city) ───────────────
  const cityCounts: Record<string, number> = {};
  (venues as unknown as { city?: string }[])?.forEach((v) => {
    if (v.city) cityCounts[v.city] = (cityCounts[v.city] ?? 0) + 1;
  });
  const cityCount = Object.keys(cityCounts).length;
  const cityPass = cityCount >= 4;
  console.log(`[${cityPass ? "✅" : "❌"}] Cities covered: ${cityCount} (need ≥ 4)`);
  Object.entries(cityCounts).forEach(([city, count]) =>
    console.log(`       ${city}: ${count} venues`)
  );
  if (!cityPass) allPassed = false;

  // ── Check 4: Price range is varied ─────────────────────────────────────
  const { data: priceData } = await supabase
    .from("venues")
    .select("price_per_hour")
    .eq("status", "ACTIVE");

  const prices = priceData?.map((v) => Number(v.price_per_hour)).filter(Boolean) ?? [];
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const pricePass = maxPrice / minPrice >= 5;
  console.log(`[${pricePass ? "✅" : "❌"}] Price range: ₪${minPrice}/hr – ₪${maxPrice}/hr (need ≥ 5x spread)`);
  if (!pricePass) allPassed = false;

  // ── Check 5: Capacity range is varied ──────────────────────────────────
  const { data: capData } = await supabase
    .from("venues")
    .select("capacity")
    .eq("status", "ACTIVE");

  const caps = capData?.map((v) => Number(v.capacity)).filter(Boolean) ?? [];
  const minCap = Math.min(...caps);
  const maxCap = Math.max(...caps);
  const capPass = maxCap >= 100 && minCap <= 30;
  console.log(`[${capPass ? "✅" : "❌"}] Capacity range: ${minCap} – ${maxCap} guests`);
  if (!capPass) allPassed = false;

  // ── Check 6: Availability table populated ──────────────────────────────
  const { count: availCount } = await supabase
    .from("availability")
    .select("*", { count: "exact", head: true });

  const availPass = (availCount ?? 0) > 0;
  console.log(`[${availPass ? "✅" : "❌"}] Availability rows: ${availCount} (run seed-availability.ts if 0)`);
  if (!availPass) allPassed = false;

  // ── Check 7: PostGIS — test a geospatial query ──────────────────────────
  const { data: geoResult, error: geoErr } = await supabase.rpc(
    "venues_within_radius",
    { lat: 32.0853, lng: 34.7818, radius_km: 10 }
  );

  // This RPC might not exist yet — that's OK, warn instead of fail
  if (geoErr && geoErr.message.includes("does not exist")) {
    console.log(`[⚠️ ] PostGIS RPC function not yet created (see README §PostGIS RPC)`);
  } else if (geoErr) {
    console.log(`[❌] PostGIS query failed: ${geoErr.message}`);
    allPassed = false;
  } else {
    console.log(`[✅] PostGIS query returned ${(geoResult as unknown[])?.length ?? 0} venues near Tel Aviv`);
  }

  // ── Summary ─────────────────────────────────────────────────────────────
  console.log("\n════════════════════════════════════════");
  if (allPassed) {
    console.log("🎉  All checks passed! Seed data is ready for testing.");
  } else {
    console.log("⚠️   Some checks failed. Review the output above and re-run the seed scripts.");
  }
  console.log("════════════════════════════════════════\n");
}

verify().catch(console.error);
