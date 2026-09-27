import { resolveOfficeLocation } from "../src/services/officeLocationService.js";

async function runCustomTest() {
  // Command line se argument read karein (agar user ne nahi diya toh default use hoga)
  const userArgs = process.argv.slice(2);
  const inputQuery = userArgs.length > 0 ? userArgs.join(" ") : "Navrangpura, Ahmedabad";

  console.log("\n========================================================");
  console.log(`📍 DYNAMIC INPUT ENTERED: "${inputQuery}"`);
  console.log("========================================================");

  try {
    const res = await resolveOfficeLocation(inputQuery);

    if (!res.success) {
      console.log("❌ Result:", res.message);
      return;
    }

    console.log("\n✅ RESOLVED USER LOCATION:");
    console.log(`  ├─ Address      : ${res.userLocation.address}`);
    console.log(`  ├─ Suburb/Area  : ${res.userLocation.suburb}`);
    console.log(`  ├─ City         : ${res.userLocation.city}`);
    console.log(`  ├─ State        : ${res.userLocation.state}`);
    console.log(`  ├─ Pincode      : ${res.userLocation.pincode}`);
    console.log(`  └─ Coordinates  : ${res.userLocation.coordinates.lat}, ${res.userLocation.coordinates.lng}`);

    console.log("\n🏛️ NEAREST CIVIC / WARD OFFICE:");
    console.log(`  ├─ Office Name  : ${res.office.name}`);
    console.log(`  ├─ Office Type  : ${res.office.type}`);
    console.log(`  ├─ Full Address : ${res.office.address}`);
    console.log(`  ├─ Public Hours : ${res.office.timings}`);
    console.log(`  └─ Direction Map: ${res.office.navigationUrl}`);
    console.log("========================================================\n");
  } catch (error) {
    console.error("Test execution failed:", error.message);
  }
}

runCustomTest();