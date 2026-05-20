/**
 * Seed script to populate Firestore with demo data.
 * Run with: npx tsx scripts/seed.ts
 *
 * Prerequisites:
 * 1. Create a Firebase service account key and save as scripts/serviceAccount.json
 * 2. npm install firebase-admin tsx --save-dev
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import * as path from "path";

// Load service account
let serviceAccount: object;
try {
  serviceAccount = require(path.join(process.cwd(), "scripts/serviceAccount.json"));
} catch {
  console.error("❌ scripts/serviceAccount.json not found.");
  console.error("   Download it from Firebase Console > Project Settings > Service accounts");
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount as Parameters<typeof cert>[0]) });
}

const db = getFirestore();
const adminAuth = getAuth();

const DEMO_EMAIL = "demo@panelmap.app";
const DEMO_PASSWORD = "demo1234";

async function seed() {
  console.log("🌱 Starting seed...\n");

  // 1. Create or get demo user
  let userId: string;
  try {
    const existing = await adminAuth.getUserByEmail(DEMO_EMAIL);
    userId = existing.uid;
    console.log(`✅ Demo user exists: ${userId}`);
  } catch {
    const user = await adminAuth.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      displayName: "Demo User",
    });
    userId = user.uid;
    console.log(`✅ Created demo user: ${userId}`);
  }

  // 2. Create user profile
  await db.doc(`users/${userId}`).set({
    uid: userId,
    email: DEMO_EMAIL,
    displayName: "Demo User",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  }, { merge: true });

  // 3. Create property
  const propertyRef = db.collection("properties").doc();
  await propertyRef.set({
    userId,
    name: "123 Maple Street",
    address: "123 Maple Street",
    city: "Columbus",
    state: "OH",
    zip: "43215",
    type: "single_family",
    unitCount: 1,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  const propertyId = propertyRef.id;
  console.log(`✅ Created property: ${propertyId}`);

  // 4. Create unit
  const unitRef = db.collection("units").doc();
  await unitRef.set({
    userId,
    propertyId,
    name: "Main House",
    floor: "1",
    type: "house",
    notes: "",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  const unitId = unitRef.id;
  console.log(`✅ Created unit: ${unitId}`);

  // 5. Create panel
  const panelRef = db.collection("panels").doc();
  await panelRef.set({
    userId,
    unitId,
    propertyId,
    name: "Main Panel",
    location: "Basement",
    amperage: 200,
    voltage: "120/240V",
    phases: 1,
    totalSlots: 40,
    brand: "Square D",
    modelNumber: "QO140L200PG",
    installYear: "2005",
    notes: "200A service, 40 space load center. Updated breakers in 2018.",
    photoIds: [],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  const panelId = panelRef.id;
  console.log(`✅ Created panel: ${panelId}`);

  // 6. Create breakers
  const breakersData = [
    {
      slot: 1, slotsUsed: 2, label: "Main Breaker", amperage: 200, type: "main",
      status: "on", roomsServed: [], devicesServed: [],
      isCritical: false, criticalKeywords: [], isVerified: true,
    },
    {
      slot: 3, slotsUsed: 1, label: "Kitchen Outlets", amperage: 20, type: "GFCI",
      status: "on", roomsServed: ["Kitchen"], devicesServed: ["Microwave", "Toaster"],
      isCritical: false, criticalKeywords: [], isVerified: true,
    },
    {
      slot: 4, slotsUsed: 1, label: "Refrigerator", amperage: 20, type: "single",
      status: "on", roomsServed: ["Kitchen"], devicesServed: ["Refrigerator"],
      isCritical: true, criticalKeywords: ["refrigerator", "fridge"], isVerified: true,
    },
    {
      slot: 5, slotsUsed: 1, label: "Dishwasher", amperage: 20, type: "single",
      status: "on", roomsServed: ["Kitchen"], devicesServed: ["Dishwasher"],
      isCritical: false, criticalKeywords: [], isVerified: true,
    },
    {
      slot: 6, slotsUsed: 1, label: "Garbage Disposal", amperage: 20, type: "GFCI",
      status: "on", roomsServed: ["Kitchen"], devicesServed: ["Garbage Disposal"],
      isCritical: false, criticalKeywords: [], isVerified: false,
    },
    {
      slot: 7, slotsUsed: 1, label: "Living Room Outlets", amperage: 15, type: "single",
      status: "on", roomsServed: ["Living Room"], devicesServed: ["TV", "Lamps"],
      isCritical: false, criticalKeywords: [], isVerified: true,
    },
    {
      slot: 8, slotsUsed: 1, label: "Living Room Lights", amperage: 15, type: "single",
      status: "on", roomsServed: ["Living Room"], devicesServed: [],
      isCritical: false, criticalKeywords: [], isVerified: true,
    },
    {
      slot: 9, slotsUsed: 1, label: "Master Bedroom", amperage: 15, type: "single",
      status: "on", roomsServed: ["Master Bedroom"], devicesServed: [],
      isCritical: false, criticalKeywords: [], isVerified: false,
    },
    {
      slot: 10, slotsUsed: 1, label: "Bedroom 2 & 3", amperage: 15, type: "single",
      status: "on", roomsServed: ["Bedroom 2", "Bedroom 3"], devicesServed: [],
      isCritical: false, criticalKeywords: [], isVerified: false,
    },
    {
      slot: 11, slotsUsed: 1, label: "Master Bath", amperage: 20, type: "GFCI",
      status: "on", roomsServed: ["Master Bathroom"], devicesServed: ["Hair dryer"],
      isCritical: false, criticalKeywords: [], isVerified: true,
    },
    {
      slot: 12, slotsUsed: 1, label: "Hall Bath", amperage: 20, type: "GFCI",
      status: "on", roomsServed: ["Hall Bathroom"], devicesServed: [],
      isCritical: false, criticalKeywords: [], isVerified: true,
    },
    {
      slot: 13, slotsUsed: 2, label: "Dryer", amperage: 30, type: "double",
      status: "on", roomsServed: ["Laundry Room"], devicesServed: ["Dryer"],
      isCritical: false, criticalKeywords: [], isVerified: true,
    },
    {
      slot: 15, slotsUsed: 1, label: "Washer", amperage: 20, type: "single",
      status: "on", roomsServed: ["Laundry Room"], devicesServed: ["Washer"],
      isCritical: false, criticalKeywords: [], isVerified: true,
    },
    {
      slot: 16, slotsUsed: 1, label: "Sump Pump", amperage: 20, type: "single",
      status: "on", roomsServed: ["Basement"], devicesServed: ["Sump Pump"],
      isCritical: true, criticalKeywords: ["sump pump", "sump"], isVerified: true,
    },
    {
      slot: 17, slotsUsed: 2, label: "HVAC / Furnace", amperage: 60, type: "double",
      status: "on", roomsServed: ["Basement"], devicesServed: ["Furnace", "HVAC"],
      isCritical: true, criticalKeywords: ["hvac", "furnace", "boiler"], isVerified: true,
    },
    {
      slot: 19, slotsUsed: 2, label: "Water Heater", amperage: 30, type: "double",
      status: "on", roomsServed: ["Basement"], devicesServed: ["Water Heater"],
      isCritical: false, criticalKeywords: [], isVerified: true,
    },
    {
      slot: 21, slotsUsed: 1, label: "Garage Outlets", amperage: 20, type: "GFCI",
      status: "on", roomsServed: ["Garage"], devicesServed: [],
      isCritical: false, criticalKeywords: [], isVerified: false,
    },
    {
      slot: 22, slotsUsed: 1, label: "Garage Door Opener", amperage: 20, type: "single",
      status: "on", roomsServed: ["Garage"], devicesServed: ["Garage Door Opener"],
      isCritical: false, criticalKeywords: [], isVerified: true,
    },
    {
      slot: 23, slotsUsed: 2, label: "Air Conditioner", amperage: 40, type: "double",
      status: "on", roomsServed: [], devicesServed: ["Central AC"],
      isCritical: true, criticalKeywords: ["ac", "air conditioner", "hvac"], isVerified: true,
    },
    {
      slot: 25, slotsUsed: 1, label: "Basement Outlets", amperage: 20, type: "single",
      status: "on", roomsServed: ["Basement"], devicesServed: [],
      isCritical: false, criticalKeywords: [], isVerified: false,
    },
    {
      slot: 26, slotsUsed: 1, label: "Basement Lights", amperage: 15, type: "single",
      status: "on", roomsServed: ["Basement"], devicesServed: [],
      isCritical: false, criticalKeywords: [], isVerified: false,
    },
    {
      slot: 27, slotsUsed: 1, label: "Outdoor Outlets (Front)", amperage: 20, type: "GFCI",
      status: "on", roomsServed: ["Exterior - Front"], devicesServed: [],
      isCritical: false, criticalKeywords: [], isVerified: false,
    },
    {
      slot: 28, slotsUsed: 1, label: "Outdoor Outlets (Back)", amperage: 20, type: "GFCI",
      status: "on", roomsServed: ["Exterior - Back"], devicesServed: [],
      isCritical: false, criticalKeywords: [], isVerified: false,
    },
    {
      slot: 29, slotsUsed: 1, label: "Freezer", amperage: 20, type: "single",
      status: "on", roomsServed: ["Basement"], devicesServed: ["Chest Freezer"],
      isCritical: true, criticalKeywords: ["freezer"], isVerified: true,
    },
    {
      slot: 30, slotsUsed: 1, label: "Spare", amperage: 15, type: "single",
      status: "off", roomsServed: [], devicesServed: [],
      isCritical: false, criticalKeywords: [], isVerified: false,
    },
  ];

  const breakerIds: string[] = [];

  for (const breaker of breakersData) {
    const bRef = db.collection("breakers").doc();
    await bRef.set({
      ...breaker,
      userId,
      panelId,
      unitId,
      propertyId,
      notes: "",
      photoIds: [],
      endpointIds: [],
      verifiedAt: breaker.isVerified ? Timestamp.now() : null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    breakerIds.push(bRef.id);
  }
  console.log(`✅ Created ${breakersData.length} breakers`);

  // 7. Create some circuit endpoints for key breakers
  const kitchenBreakerIdx = breakersData.findIndex((b) => b.label === "Kitchen Outlets");
  const kitchenBreakerId = breakerIds[kitchenBreakerIdx];

  const endpointsData = [
    { breakerIdx: kitchenBreakerIdx, name: "Counter outlet (left of sink)", type: "outlet", room: "Kitchen", location: "North wall" },
    { breakerIdx: kitchenBreakerIdx, name: "Counter outlet (right of stove)", type: "outlet", room: "Kitchen", location: "East wall" },
    { breakerIdx: kitchenBreakerIdx, name: "Microwave outlet", type: "appliance", room: "Kitchen", location: "Above stove" },
  ];

  for (const ep of endpointsData) {
    const epRef = db.collection("circuitEndpoints").doc();
    await epRef.set({
      userId,
      breakerId: breakerIds[ep.breakerIdx],
      panelId,
      unitId,
      propertyId,
      type: ep.type,
      name: ep.name,
      room: ep.room,
      location: ep.location,
      notes: "",
      isVerified: true,
      verifiedAt: Timestamp.now(),
      photoIds: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }
  console.log(`✅ Created ${endpointsData.length} circuit endpoints`);

  console.log("\n🎉 Seed complete!");
  console.log(`\n📧 Demo login:`);
  console.log(`   Email:    ${DEMO_EMAIL}`);
  console.log(`   Password: ${DEMO_PASSWORD}`);
  console.log(`\n🏠 Property: 123 Maple Street, Columbus OH`);
  console.log(`   → Main House → Main Panel (200A, 40 slots, ${breakersData.length} breakers)`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
