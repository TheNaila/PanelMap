import { Timestamp } from "firebase/firestore";

export interface User {
  uid: string;
  email: string;
  displayName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type PropertyType = "single_family" | "multi_family" | "condo" | "commercial" | "other";

export interface Property {
  id: string;
  userId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  type: PropertyType;
  unitCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type UnitType = "apartment" | "condo" | "house" | "basement" | "commercial_suite" | "other";

export interface Unit {
  id: string;
  propertyId: string;
  userId: string;
  name: string;
  floor: string;
  type: UnitType;
  notes: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type PanelVoltage = "120/240V" | "120/208V" | "277/480V";
export type PanelPhases = 1 | 3;

export interface Panel {
  id: string;
  unitId: string;
  propertyId: string;
  userId: string;
  name: string;
  location: string;
  amperage: number;
  voltage: PanelVoltage;
  phases: PanelPhases;
  totalSlots: number;
  brand: string;
  modelNumber: string;
  installYear: string;
  notes: string;
  photoIds: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type BreakerType = "single" | "double" | "tandem" | "GFCI" | "AFCI" | "GFCI/AFCI" | "main";
export type BreakerStatus = "on" | "off" | "tripped" | "unknown";
export type BreakerAmperage = 15 | 20 | 30 | 40 | 50 | 60 | 100 | 150 | 200;

export interface Breaker {
  id: string;
  panelId: string;
  unitId: string;
  propertyId: string;
  userId: string;
  slot: number;
  slotsUsed: number; // 1 for single/tandem, 2 for double
  label: string;
  amperage: number;
  type: BreakerType;
  status: BreakerStatus;
  notes: string;
  roomsServed: string[];
  devicesServed: string[];
  isVerified: boolean;
  verifiedAt: Timestamp | null;
  isCritical: boolean;
  criticalKeywords: string[]; // e.g. ["refrigerator", "sump pump"]
  photoIds: string[];
  endpointIds: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type EndpointType = "outlet" | "light" | "appliance" | "fixture" | "room" | "hvac" | "other";

export interface CircuitEndpoint {
  id: string;
  breakerId: string;
  panelId: string;
  unitId: string;
  propertyId: string;
  userId: string;
  type: EndpointType;
  name: string;
  room: string;
  location: string;
  notes: string;
  isVerified: boolean;
  verifiedAt: Timestamp | null;
  photoIds: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Photo {
  id: string;
  entityType: "panel" | "breaker" | "endpoint";
  entityId: string;
  userId: string;
  url: string;
  thumbnailUrl: string;
  filename: string;
  size: number;
  caption: string;
  createdAt: Timestamp;
}

export type ActivityAction =
  | "property_created" | "property_updated" | "property_deleted"
  | "unit_created" | "unit_updated" | "unit_deleted"
  | "panel_created" | "panel_updated" | "panel_deleted"
  | "breaker_created" | "breaker_updated" | "breaker_deleted"
  | "endpoint_created" | "endpoint_updated" | "endpoint_deleted"
  | "breaker_mapped" | "photo_uploaded";

export interface ActivityLog {
  id: string;
  userId: string;
  propertyId: string;
  action: ActivityAction;
  entityType: string;
  entityId: string;
  details: Record<string, unknown>;
  createdAt: Timestamp;
}

// UI-only types
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export type MappingWizardStep = "select_breaker" | "turn_off" | "record_endpoints" | "confirm";

export interface MappingSession {
  breakerId: string;
  breakerLabel: string;
  endpoints: Partial<CircuitEndpoint>[];
  step: MappingWizardStep;
}
