const path = require("path");

require(path.join(__dirname, "../js/services/trip-planner-engine.js"));
const engine = global.NE8_TRIP_PLANNER;

console.log("------------------------------------------------------------");
console.log("TEST 1: User Example - Kerala to Assam (5 Days)");
console.log("------------------------------------------------------------");
const plan1 = engine.planMultiDayTrip("Kerala", "Assam", 5);
console.log(`Origin: ${plan1.origin.name} (${plan1.origin.lat}, ${plan1.origin.lng})`);
console.log(`Destination: ${plan1.destination.name} (${plan1.destination.lat}, ${plan1.destination.lng})`);
console.log(`Total Distance: ${plan1.totalDistanceKm} km`);
console.log(`Days: ${plan1.requestedDays}`);
console.log(`Average Daily km: ${plan1.averageDailyKm} km/day`);
console.log(`Feasibility: ${plan1.feasibility.status}`);
console.log(`Warning/Advice: ${plan1.feasibility.warningMessage}`);

if (plan1.schedule.length !== 5) {
  throw new Error(`Expected 5 days, got ${plan1.schedule.length}`);
}
const finalDay1 = plan1.schedule[plan1.schedule.length - 1];
if (!finalDay1.destinationPoint.includes("Assam") && !finalDay1.destinationPoint.includes("Guwahati")) {
  throw new Error(`Expected final destination to be in Assam, got ${finalDay1.destinationPoint}`);
}
plan1.schedule.forEach((d) => {
  console.log(`  ${d.dayLabel}: ${d.startingPoint} -> ${d.destinationPoint}`);
  console.log(`     Distance: ${d.distanceKm} km | Est Time: ${d.drivingTimeStr}`);
  console.log(`     Midday Break: ${d.middayBreak.name}`);
  console.log(`     Overnight Staging: ${d.overnightStaging.name}`);
  console.log(`     Google Maps Link: ${d.googleMapsUrl}`);
});

console.log("\n------------------------------------------------------------");
console.log("TEST 2: Unrealistic Input - Kerala to Assam (1 Day)");
console.log("------------------------------------------------------------");
const plan2 = engine.planMultiDayTrip("Kerala", "Assam", 1);
console.log(`Feasibility Status: ${plan2.feasibility.status}`);
console.log(`Is Unrealistic: ${plan2.feasibility.isUnrealistic}`);
console.log(`Warning: ${plan2.feasibility.warningMessage}`);
console.log(`Suggested Realistic Days: ${plan2.realisticSuggestedDays} days`);
if (!plan2.feasibility.isUnrealistic) {
  throw new Error("Expected 1 day for 3,700 km to be flagged UNREALISTIC");
}
if (plan2.realisticSuggestedDays < 6) {
  throw new Error(`Expected at least 6-8 suggested realistic days, got ${plan2.realisticSuggestedDays}`);
}

console.log("\n------------------------------------------------------------");
console.log("TEST 3: Mountain Route - Guwahati to Tawang (2 Days)");
console.log("------------------------------------------------------------");
const plan3 = engine.planMultiDayTrip("Guwahati", "Tawang", 2);
console.log(`Total Distance: ${plan3.totalDistanceKm} km`);
console.log(`Feasibility: ${plan3.feasibility.status}`);
plan3.schedule.forEach((d) => {
  console.log(`  ${d.dayLabel}: ${d.startingPoint} -> ${d.destinationPoint} | ${d.distanceKm} km | ${d.drivingTimeStr}`);
});

console.log("\n------------------------------------------------------------");
console.log("TEST 4: State Aliases Resolution");
console.log("------------------------------------------------------------");
const hubKerala = engine.resolveHub("Kerala");
const hubAssam = engine.resolveHub("Assam");
const hubTamilNadu = engine.resolveHub("Tamil Nadu");
const hubDelhi = engine.resolveHub("Delhi");
const hubBengal = engine.resolveHub("West Bengal");
console.log(`Kerala -> ${hubKerala.name}`);
console.log(`Assam -> ${hubAssam.name}`);
console.log(`Tamil Nadu -> ${hubTamilNadu.name}`);
console.log(`Delhi -> ${hubDelhi.name}`);
console.log(`West Bengal -> ${hubBengal.name}`);

if (!hubKerala.name.includes("Kerala")) throw new Error("Kerala mapping failed");
if (!hubAssam.name.includes("Assam")) throw new Error("Assam mapping failed");

console.log("\n============================================================");
console.log("ALL 4 INTEGRATION TESTS PASSED WITH 100% SUCCESS!");
console.log("============================================================");
