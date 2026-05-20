import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  Property,
  Unit,
  Panel,
  Breaker,
  CircuitEndpoint,
  ActivityLog,
  ActivityAction,
} from "@/types";

// ─── Collections ──────────────────────────────────────────────────────────────

export const Collections = {
  USERS: "users",
  PROPERTIES: "properties",
  UNITS: "units",
  PANELS: "panels",
  BREAKERS: "breakers",
  CIRCUIT_ENDPOINTS: "circuitEndpoints",
  PHOTOS: "photos",
  ACTIVITY_LOG: "activityLog",
} as const;

// ─── Activity Logging ─────────────────────────────────────────────────────────

export async function logActivity(
  userId: string,
  propertyId: string,
  action: ActivityAction,
  entityType: string,
  entityId: string,
  details: Record<string, unknown> = {}
) {
  try {
    await addDoc(collection(db, Collections.ACTIVITY_LOG), {
      userId,
      propertyId,
      action,
      entityType,
      entityId,
      details,
      createdAt: serverTimestamp(),
    });
  } catch {
    // Non-critical, swallow errors
  }
}

// ─── Properties ───────────────────────────────────────────────────────────────

export async function createProperty(
  userId: string,
  data: Omit<Property, "id" | "userId" | "createdAt" | "updatedAt">
): Promise<string> {
  const ref = await addDoc(collection(db, Collections.PROPERTIES), {
    ...data,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await logActivity(userId, ref.id, "property_created", "property", ref.id, { name: data.name });
  return ref.id;
}

export async function updateProperty(
  propertyId: string,
  userId: string,
  data: Partial<Omit<Property, "id" | "userId" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(db, Collections.PROPERTIES, propertyId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
  await logActivity(userId, propertyId, "property_updated", "property", propertyId);
}

export async function deleteProperty(propertyId: string, userId: string): Promise<void> {
  await deleteDoc(doc(db, Collections.PROPERTIES, propertyId));
  await logActivity(userId, propertyId, "property_deleted", "property", propertyId);
}

export async function getUserProperties(userId: string): Promise<Property[]> {
  const q = query(
    collection(db, Collections.PROPERTIES),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Property));
}

// ─── Units ────────────────────────────────────────────────────────────────────

export async function createUnit(
  userId: string,
  propertyId: string,
  data: Omit<Unit, "id" | "userId" | "propertyId" | "createdAt" | "updatedAt">
): Promise<string> {
  const ref = await addDoc(collection(db, Collections.UNITS), {
    ...data,
    userId,
    propertyId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await logActivity(userId, propertyId, "unit_created", "unit", ref.id, { name: data.name });
  return ref.id;
}

export async function updateUnit(
  unitId: string,
  userId: string,
  propertyId: string,
  data: Partial<Omit<Unit, "id" | "userId" | "propertyId" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(db, Collections.UNITS, unitId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
  await logActivity(userId, propertyId, "unit_updated", "unit", unitId);
}

export async function deleteUnit(unitId: string, userId: string, propertyId: string): Promise<void> {
  await deleteDoc(doc(db, Collections.UNITS, unitId));
  await logActivity(userId, propertyId, "unit_deleted", "unit", unitId);
}

export async function getPropertyUnits(propertyId: string): Promise<Unit[]> {
  const q = query(
    collection(db, Collections.UNITS),
    where("propertyId", "==", propertyId),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Unit));
}

// ─── Panels ───────────────────────────────────────────────────────────────────

export async function createPanel(
  userId: string,
  unitId: string,
  propertyId: string,
  data: Omit<Panel, "id" | "userId" | "unitId" | "propertyId" | "createdAt" | "updatedAt">
): Promise<string> {
  const ref = await addDoc(collection(db, Collections.PANELS), {
    ...data,
    userId,
    unitId,
    propertyId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await logActivity(userId, propertyId, "panel_created", "panel", ref.id, { name: data.name });
  return ref.id;
}

export async function updatePanel(
  panelId: string,
  userId: string,
  propertyId: string,
  data: Partial<Omit<Panel, "id" | "userId" | "unitId" | "propertyId" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(db, Collections.PANELS, panelId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
  await logActivity(userId, propertyId, "panel_updated", "panel", panelId);
}

export async function deletePanel(panelId: string, userId: string, propertyId: string): Promise<void> {
  await deleteDoc(doc(db, Collections.PANELS, panelId));
  await logActivity(userId, propertyId, "panel_deleted", "panel", panelId);
}

export async function getUnitPanels(unitId: string): Promise<Panel[]> {
  const q = query(
    collection(db, Collections.PANELS),
    where("unitId", "==", unitId),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Panel));
}

export async function getPanel(panelId: string): Promise<Panel | null> {
  const snap = await getDoc(doc(db, Collections.PANELS, panelId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Panel;
}

// ─── Breakers ─────────────────────────────────────────────────────────────────

export async function createBreaker(
  userId: string,
  panelId: string,
  unitId: string,
  propertyId: string,
  data: Omit<Breaker, "id" | "userId" | "panelId" | "unitId" | "propertyId" | "createdAt" | "updatedAt">
): Promise<string> {
  const ref = await addDoc(collection(db, Collections.BREAKERS), {
    ...data,
    userId,
    panelId,
    unitId,
    propertyId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await logActivity(userId, propertyId, "breaker_created", "breaker", ref.id, { label: data.label, slot: data.slot });
  return ref.id;
}

export async function updateBreaker(
  breakerId: string,
  userId: string,
  propertyId: string,
  data: Partial<Omit<Breaker, "id" | "userId" | "panelId" | "unitId" | "propertyId" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(db, Collections.BREAKERS, breakerId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
  await logActivity(userId, propertyId, "breaker_updated", "breaker", breakerId);
}

export async function deleteBreaker(breakerId: string, userId: string, propertyId: string): Promise<void> {
  await deleteDoc(doc(db, Collections.BREAKERS, breakerId));
  await logActivity(userId, propertyId, "breaker_deleted", "breaker", breakerId);
}

export async function getPanelBreakers(panelId: string): Promise<Breaker[]> {
  const q = query(
    collection(db, Collections.BREAKERS),
    where("panelId", "==", panelId),
    orderBy("slot", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Breaker));
}

export async function getBreaker(breakerId: string): Promise<Breaker | null> {
  const snap = await getDoc(doc(db, Collections.BREAKERS, breakerId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Breaker;
}

// ─── Circuit Endpoints ────────────────────────────────────────────────────────

export async function createCircuitEndpoint(
  userId: string,
  breakerId: string,
  panelId: string,
  unitId: string,
  propertyId: string,
  data: Omit<CircuitEndpoint, "id" | "userId" | "breakerId" | "panelId" | "unitId" | "propertyId" | "createdAt" | "updatedAt">
): Promise<string> {
  const batch = writeBatch(db);
  const endpointRef = doc(collection(db, Collections.CIRCUIT_ENDPOINTS));
  batch.set(endpointRef, {
    ...data,
    userId,
    breakerId,
    panelId,
    unitId,
    propertyId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  // Update breaker's endpointIds array
  const breakerRef = doc(db, Collections.BREAKERS, breakerId);
  const breakerSnap = await getDoc(breakerRef);
  if (breakerSnap.exists()) {
    const existing = breakerSnap.data().endpointIds || [];
    batch.update(breakerRef, { endpointIds: [...existing, endpointRef.id], updatedAt: serverTimestamp() });
  }
  await batch.commit();
  await logActivity(userId, propertyId, "endpoint_created", "endpoint", endpointRef.id, { name: data.name });
  return endpointRef.id;
}

export async function updateCircuitEndpoint(
  endpointId: string,
  userId: string,
  propertyId: string,
  data: Partial<Omit<CircuitEndpoint, "id" | "userId" | "breakerId" | "panelId" | "unitId" | "propertyId" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(db, Collections.CIRCUIT_ENDPOINTS, endpointId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
  await logActivity(userId, propertyId, "endpoint_updated", "endpoint", endpointId);
}

export async function deleteCircuitEndpoint(
  endpointId: string,
  breakerId: string,
  userId: string,
  propertyId: string
): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, Collections.CIRCUIT_ENDPOINTS, endpointId));
  const breakerRef = doc(db, Collections.BREAKERS, breakerId);
  const breakerSnap = await getDoc(breakerRef);
  if (breakerSnap.exists()) {
    const existing: string[] = breakerSnap.data().endpointIds || [];
    batch.update(breakerRef, {
      endpointIds: existing.filter((id) => id !== endpointId),
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
  await logActivity(userId, propertyId, "endpoint_deleted", "endpoint", endpointId);
}

export async function getBreakerEndpoints(breakerId: string): Promise<CircuitEndpoint[]> {
  const q = query(
    collection(db, Collections.CIRCUIT_ENDPOINTS),
    where("breakerId", "==", breakerId),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CircuitEndpoint));
}

// ─── Search ───────────────────────────────────────────────────────────────────

export async function searchBreakers(userId: string, term: string): Promise<Breaker[]> {
  const q = query(collection(db, Collections.BREAKERS), where("userId", "==", userId));
  const snap = await getDocs(q);
  const lower = term.toLowerCase();
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Breaker))
    .filter(
      (b) =>
        b.label.toLowerCase().includes(lower) ||
        b.notes.toLowerCase().includes(lower) ||
        b.roomsServed.some((r) => r.toLowerCase().includes(lower)) ||
        b.devicesServed.some((d) => d.toLowerCase().includes(lower))
    );
}

export async function searchEndpoints(userId: string, term: string): Promise<CircuitEndpoint[]> {
  const q = query(collection(db, Collections.CIRCUIT_ENDPOINTS), where("userId", "==", userId));
  const snap = await getDocs(q);
  const lower = term.toLowerCase();
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as CircuitEndpoint))
    .filter(
      (e) =>
        e.name.toLowerCase().includes(lower) ||
        e.room.toLowerCase().includes(lower) ||
        e.notes.toLowerCase().includes(lower)
    );
}

// ─── Emergency Circuits ───────────────────────────────────────────────────────

export const CRITICAL_KEYWORDS = [
  "refrigerator",
  "fridge",
  "sump pump",
  "boiler",
  "hvac",
  "furnace",
  "freezer",
  "medical",
  "oxygen",
  "well pump",
  "security",
];

export async function getCriticalBreakers(userId: string): Promise<Breaker[]> {
  const q = query(
    collection(db, Collections.BREAKERS),
    where("userId", "==", userId),
    where("isCritical", "==", true)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Breaker));
}

// ─── Activity Log ─────────────────────────────────────────────────────────────

export async function getActivityLog(userId: string, propertyId?: string): Promise<ActivityLog[]> {
  let q = query(
    collection(db, Collections.ACTIVITY_LOG),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  if (propertyId) {
    q = query(
      collection(db, Collections.ACTIVITY_LOG),
      where("userId", "==", userId),
      where("propertyId", "==", propertyId),
      orderBy("createdAt", "desc")
    );
  }
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ActivityLog));
}
