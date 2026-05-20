# PanelMap ⚡

**Map your electrical panels, breakers, rooms, and circuit endpoints — from your phone, at the panel.**

PanelMap is a mobile-first Next.js app for homeowners and property managers to document electrical panels, label breakers, map circuits, and quickly locate critical circuits during emergencies.

---

## Features

- **Multi-property, multi-unit support** — manage unlimited properties and units
- **Visual panel grid** — realistic two-column breaker layout (L1/L2 bus)
- **Breaker management** — label, amperage, type, status, rooms/devices served, notes, photos
- **Circuit endpoints** — map each breaker to its outlets, lights, appliances, and fixtures
- **Guided Map Circuit mode** — step-by-step wizard: select breaker → turn off → record what lost power
- **Emergency view** — instantly find refrigerator, sump pump, boiler, HVAC, freezer, and critical circuits
- **Full-text search** — find any circuit by room, appliance, label, or note
- **Photo upload** — attach photos to panels and breakers via Firebase Storage
- **Activity log** — full audit trail of all changes
- **Real-time sync** — Firestore live listeners for multi-device use

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Auth | Firebase Auth |
| Database | Cloud Firestore |
| Storage | Firebase Storage |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |

---

## Firebase Setup

### Step 1: Create a Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → name it `panelmap` → click through setup
3. **Disable Google Analytics** (optional for MVP)

### Step 2: Enable Authentication

1. In the Firebase Console → **Build → Authentication → Get started**
2. Click **Sign-in method** tab
3. Enable **Email/Password** → Save

### Step 3: Create Firestore Database

1. **Build → Firestore Database → Create database**
2. Select **Start in production mode** (you'll add security rules next)
3. Choose a region close to you → Done

### Step 4: Add Firestore Security Rules

In **Firestore → Rules**, paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }

    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }

    match /properties/{docId} {
      allow read, write: if isOwner(resource.data.userId);
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }

    match /units/{docId} {
      allow read, write: if isOwner(resource.data.userId);
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }

    match /panels/{docId} {
      allow read, write: if isOwner(resource.data.userId);
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }

    match /breakers/{docId} {
      allow read, write: if isOwner(resource.data.userId);
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }

    match /circuitEndpoints/{docId} {
      allow read, write: if isOwner(resource.data.userId);
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }

    match /photos/{docId} {
      allow read, write: if isOwner(resource.data.userId);
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }

    match /activityLog/{docId} {
      allow read: if isOwner(resource.data.userId);
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
  }
}
```

### Step 5: Enable Firebase Storage

1. **Build → Storage → Get started**
2. Start in **production mode** → choose region → Done
3. In **Storage → Rules**, paste:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /photos/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Step 6: Register a Web App and Get Config

1. **Project Overview → Add app → Web (</> icon)**
2. App nickname: `panelmap-web` → Register app
3. Copy the `firebaseConfig` object values

### Step 7: Create Firestore Indexes

The app requires these composite indexes. Go to **Firestore → Indexes → Composite** and add:

| Collection | Fields | Query Scope |
|-----------|--------|-------------|
| `properties` | `userId` ASC, `createdAt` DESC | Collection |
| `units` | `propertyId` ASC, `createdAt` ASC | Collection |
| `panels` | `unitId` ASC, `createdAt` ASC | Collection |
| `breakers` | `panelId` ASC, `slot` ASC | Collection |
| `breakers` | `userId` ASC, `isCritical` ASC | Collection |
| `circuitEndpoints` | `breakerId` ASC, `createdAt` ASC | Collection |
| `activityLog` | `userId` ASC, `createdAt` DESC | Collection |

> **Tip:** The first time you run the app in dev mode, Firestore will show an error with a direct link to create the missing index. Click it.

---

## Local Development

### 1. Clone and install

```bash
git clone <your-repo>
cd panelmap
npm install
```

### 2. Configure environment

```bash
cp .env.local.example .env.local
# Edit .env.local with your Firebase config values
```

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Seed Demo Data

To populate the app with a realistic demo house (123 Maple Street, 200A panel, 25 breakers, critical circuits):

### Prerequisites

```bash
npm install firebase-admin tsx --save-dev
```

Download your **service account key**:
1. Firebase Console → **Project Settings → Service accounts**
2. Click **Generate new private key**
3. Save as `scripts/serviceAccount.json` (this file is gitignored)

### Run the seed

```bash
npx tsx scripts/seed.ts
```

This creates:
- Demo user: `demo@panelmap.app` / `demo1234`
- Property: 123 Maple Street, Columbus OH
- 1 unit (Main House), 1 panel (Main Panel, 200A, Square D)
- 25 realistic breakers (kitchen, bedrooms, HVAC, sump pump, freezer, etc.)
- Critical circuits pre-marked for Emergency view
- Sample circuit endpoints

---

## Data Model

All collections are **top-level** in Firestore (not nested subcollections). Each document carries denormalized foreign keys (`userId`, `propertyId`, `unitId`, `panelId`) for flexible querying without multi-hop joins.

```
users/{userId}
properties/{propertyId}       → userId
units/{unitId}                → propertyId, userId
panels/{panelId}              → unitId, propertyId, userId
breakers/{breakerId}          → panelId, unitId, propertyId, userId
circuitEndpoints/{endpointId} → breakerId, panelId, unitId, propertyId, userId
photos/{photoId}              → entityType, entityId, userId
activityLog/{logId}           → userId, propertyId
```

---

## Project Structure

```
app/
├── (auth)/login/          Auth pages
├── (auth)/signup/
└── (dashboard)/
    ├── dashboard/         Properties list
    ├── properties/[id]/   Units list
    │   └── units/[id]/    Panels list
    │       └── panels/[id]/  Panel grid + breaker drawer
    ├── map-circuit/       Guided mapping wizard
    ├── emergency/         Emergency circuits view
    ├── search/            Full-text search
    └── activity/          Activity log

components/
├── PropertySelector.tsx
├── UnitSelector.tsx
├── PanelGrid.tsx
├── BreakerCard.tsx
├── BreakerDetailDrawer.tsx
├── CircuitEndpointList.tsx
├── PhotoUploader.tsx
├── MappingWizard.tsx
├── EmergencyCircuitsView.tsx
├── TopBar.tsx
├── BottomNav.tsx
├── Breadcrumb.tsx
├── Modal.tsx
└── EmptyState.tsx

lib/
├── firebase.ts            Firebase initialization
├── firestore.ts           All Firestore CRUD operations
└── storage.ts             Firebase Storage uploads

hooks/                     Real-time Firestore listeners
types/index.ts             Full TypeScript type definitions
scripts/seed.ts            Demo data seeder
```

---

## Deployment

### Vercel (recommended)

```bash
npm install -g vercel
vercel
```

Add environment variables in the Vercel dashboard:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

---

## License

MIT
