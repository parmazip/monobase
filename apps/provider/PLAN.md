# Provider App Migration Plan

## Overview
Migrate provider app from `~/Projects/pmono/apps/provider` to `~/Projects/pmb/apps/provider`, maximizing use of SDK/UI packages and updating/creating EMR module where needed.

## Phase 1: Initial Setup

### 1.1 Create Provider App Structure
- Create `apps/provider/` directory ✅
- Copy base config files from `apps/account/`
- Update `vite.config.ts` - Port 3002
- Update `tsconfig.json` - `@monobase/*` paths
- Update `tailwind.config.ts` - Extend UI package
- Create `.env.example` - `VITE_ONESIGNAL_APP_TAG=provider`

### 1.2 Minimal Package Dependencies
```json
{
  "dependencies": {
    "@daveyplate/better-auth-tanstack": "^1.3.6",
    "@daveyplate/better-auth-ui": "^3.1.5",
    "@monobase/api-spec": "workspace:*",
    "@monobase/sdk": "workspace:*",
    "@monobase/ui": "workspace:*",
    "@tanstack/react-query": "^5.85.9",
    "@tanstack/react-router": "^1.131.31",
    "better-auth": "^1.3.7",
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "react-onesignal": "^3.4.0",
    "recharts": "^3.1.2",
    "vite": "^7.1.4",
    "zod": "^4.1.12"
  },
  "devDependencies": {
    "@monobase/typescript-config": "workspace:*",
    "@playwright/test": "^1.55.0",
    "@tanstack/react-devtools": "^0.6.2",
    "@tanstack/react-query-devtools": "^5.85.9",
    "@tanstack/react-router-devtools": "^1.131.34",
    "@tanstack/router-plugin": "^1.132.0",
    "@types/react": "^19.1.12",
    "@types/react-dom": "^19.1.9",
    "@vitejs/plugin-react": "^5.0.2",
    "autoprefixer": "^10.4.21",
    "postcss": "^8.5.6",
    "tailwindcss": "^3",
    "typescript": "^5.9.2",
    "vite-tsconfig-paths": "^5.1.4"
  }
}
```
**Note**: No Radix, no utility libraries - all from `@monobase/ui`

## Phase 2: Create/Update SDK & UI Packages

### 2.1 Add EMR Module to SDK (`packages/sdk/`)

**Create `src/services/emr.ts`:**
- API client for EMR operations
- emrPatient management (NOT general patient)
- Medical records access
- Document management
- Consultation history

**Create `src/react/hooks/use-emr.ts`:**
- React Query hooks for EMR operations
- useEmrPatients, useEmrRecords, useEmrDocument
- useConsultations, useConsultation

**Update `packages/sdk/package.json` exports:**
```json
{
  "exports": {
    "./services/emr": "./src/services/emr.ts",
    "./react/hooks/use-emr": "./src/react/hooks/use-emr.ts"
  }
}
```

### 2.2 Add EMR Components to UI (`packages/ui/`)

**Create `src/emr/` directory structure:**
```
src/emr/
├── components/
│   ├── emr-patient-card.tsx
│   ├── emr-record-card.tsx
│   ├── emr-document-viewer.tsx
│   ├── consultation-card.tsx
│   └── consultation-list.tsx
└── types.ts
```

**Update `packages/ui/package.json` exports:**
```json
{
  "exports": {
    "./emr/*": "./src/emr/*"
  }
}
```

### 2.3 Update Booking Module for Availability

**Update `packages/sdk/src/services/booking.ts`:**
- Add availability management functions
- Add schedule configuration functions
- Add booking event configuration

**Update `packages/sdk/src/react/hooks/use-booking.ts`:**
- Add useAvailability hook
- Add useSchedule hook
- Add useBookingEvent hook
- Add availability CRUD operations

**Update `packages/ui/src/booking/`:**
- Add availability components if needed
- Add schedule management components if needed

### 2.4 Update Billing Module for Merchant Accounts

**Verify `packages/sdk/src/services/billing.ts` has:**
- Merchant account operations
- Stripe Connect integration
- Merchant account creation/update
- Already exists based on exports ✅

**Verify `packages/ui/src/billing/components/`:**
- ✅ Already has `merchant-account-setup.tsx`

### 2.5 Add Consultations to EMR

**Add to `packages/sdk/src/services/emr.ts`:**
- Consultation history tracking
- Consultation records management
- Consultation CRUD operations

**Add to `packages/sdk/src/react/hooks/use-emr.ts`:**
- useConsultations hook
- useConsultation hook
- useCreateConsultation hook

**Add to `packages/ui/src/emr/components/`:**
- consultation-card.tsx
- consultation-list.tsx

## Phase 3: Provider App Services Layer

### 3.1 DELETE Entire `src/api/` Directory
All API clients now come from SDK:

| Old File | New Location |
|----------|-------------|
| ❌ `src/api/person.ts` | `@monobase/sdk/services/person` |
| ❌ `src/api/provider.ts` | `@monobase/sdk/services/provider` |
| ❌ `src/api/notifications.ts` | `@monobase/sdk/services/notifications` |
| ❌ `src/api/storage.ts` | `@monobase/sdk/services/storage` |
| ❌ `src/api/comms.ts` | `@monobase/sdk/services/comms` |
| ❌ `src/api/booking.ts` | `@monobase/sdk/services/booking` |
| ❌ `src/api/billing.ts` | `@monobase/sdk/services/billing` |
| ❌ `src/api/availability.ts` | `@monobase/sdk/services/booking` (availability) |
| ❌ `src/api/consultations.ts` | `@monobase/sdk/services/emr` (consultations) |
| ❌ `src/api/emr.ts` | `@monobase/sdk/services/emr` |
| ❌ `src/api/merchant-account.ts` | `@monobase/sdk/services/billing` |
| ❌ `src/api/patient.ts` | `@monobase/sdk/services/emr` (emrPatients) |
| ❌ `src/api/client.ts` | `@monobase/sdk/api` |
| ❌ `src/api/query.ts` | Use SDK patterns directly |

### 3.2 Create Minimal Services
**Only create `src/services/` if needed for:**
- `src/services/guards.ts` - Route guards (requireProviderProfile, etc.)
- `src/services/onesignal.ts` - Copy from account app

## Phase 4: Provider App Hooks Layer

### 4.1 DELETE All Hooks Now in SDK

| Old Hook | New Location |
|----------|-------------|
| ❌ `src/hooks/use-auth.ts` | `@monobase/sdk/react/hooks/use-auth` |
| ❌ `src/hooks/use-person.ts` | `@monobase/sdk/react/hooks/use-person` |
| ❌ `src/hooks/use-provider.ts` | `@monobase/sdk/react/hooks/use-provider` |
| ❌ `src/hooks/use-notifications.ts` | `@monobase/sdk/react/hooks/use-notifications` |
| ❌ `src/hooks/use-storage.ts` | `@monobase/sdk/react/hooks/use-storage` |
| ❌ `src/hooks/use-booking.ts` | `@monobase/sdk/react/hooks/use-booking` |
| ❌ `src/hooks/use-billing.ts` | `@monobase/sdk/react/hooks/use-billing` |
| ❌ `src/hooks/use-availability.ts` | `@monobase/sdk/react/hooks/use-booking` |
| ❌ `src/hooks/use-consultations.ts` | `@monobase/sdk/react/hooks/use-emr` |
| ❌ `src/hooks/use-emr.ts` | `@monobase/sdk/react/hooks/use-emr` |
| ❌ `src/hooks/use-merchant-account.ts` | `@monobase/sdk/react/hooks/use-billing` |
| ❌ `src/hooks/use-patient.ts` | `@monobase/sdk/react/hooks/use-emr` |
| ❌ `src/hooks/use-signaling.ts` | `@monobase/sdk/lib/signaling-client` |

### 4.2 KEEP Provider-Specific Hooks
Only if there's custom business logic NOT in SDK:
- ✅ `src/hooks/use-earnings.ts` - Earnings analytics/charts (provider-specific calculations)
- ✅ `src/hooks/use-onesignal.ts` - Copy from account app

## Phase 5: Provider App Components

### 5.1 DELETE Components Now in UI Package
- ❌ Any person forms → `@monobase/ui/person/components/`
- ❌ Provider cards → `@monobase/ui/provider/components/`
- ❌ Booking widgets → `@monobase/ui/booking/components/`
- ❌ Merchant setup → `@monobase/ui/billing/components/`
- ❌ Video call UI → `@monobase/ui/comms/components/`
- ❌ EMR components → `@monobase/ui/emr/components/` (will be created)
- ❌ Consultation cards → `@monobase/ui/emr/components/` (will be created)

### 5.2 KEEP Provider-Specific Components
Update imports to use `@monobase/ui`:
- ✅ `src/components/app-sidebar.tsx` - Provider navigation
- ✅ `src/components/logo.tsx` - Custom branding
- ✅ `src/components/not-found.tsx` - 404 page
- ✅ `src/components/onesignal-sync.tsx` - OneSignal integration

### 5.3 Provider-Specific Business Components
Only if custom logic needed:
- ✅ Earnings dashboard chart components (use recharts)
- ✅ Custom analytics visualizations

## Phase 6: Routes Migration

### 6.1 Core App Files
Copy from account app and update:
- `src/app.tsx` - Use `@monobase/sdk/react/provider`
- `src/router.tsx` - RouterContext types
- `src/utils/guards.ts` - Auth guards + provider-specific guards
- `src/utils/config.ts` - Copy from account
- `index.html` - Update title

### 6.2 Route Files - Update All Imports

**Root & Auth:**
- `src/routes/__root.tsx`
- `src/routes/index.tsx`
- `src/routes/auth/$authView.tsx`
- `src/routes/onboarding.tsx`

**Dashboard:**
- `src/routes/_dashboard.tsx` - Visibility banner + navigation
- `src/routes/_dashboard/dashboard.tsx`
- `src/routes/_dashboard/patients.tsx` - Use `useEmr` from SDK
- `src/routes/_dashboard/appointments/*.tsx` - Use `useBooking` from SDK
  - `upcoming.tsx`
  - `past.tsx`
  - `requests.tsx`
  - `$id.video.tsx`
- `src/routes/_dashboard/consultations/*.tsx` - Use `useEmr` from SDK
  - `index.tsx`
  - `$id.tsx`
- `src/routes/_dashboard/medical-records/*.tsx` - Use `useEmr` from SDK
  - `index.tsx`
  - `$id.tsx`
- `src/routes/_dashboard/billing.tsx` - Use `useBilling` from SDK
- `src/routes/_dashboard/earnings.tsx` - Use custom analytics
- `src/routes/_dashboard/notifications.tsx` - Use `useNotifications` from SDK

**Settings:**
- `src/routes/_dashboard/settings/account.tsx` - Use person forms from UI
- `src/routes/_dashboard/settings/professional.tsx` - Use `useProvider` from SDK
- `src/routes/_dashboard/settings/schedule.tsx` - Use `useBooking` (availability) from SDK
- `src/routes/_dashboard/settings/billing.tsx` - Use `useBilling` + merchant setup from UI
- `src/routes/_dashboard/settings/security.tsx` - Use `useAuth` from SDK

### 6.3 Import Pattern Updates
```typescript
// OLD
import { useProvider } from "@/hooks/use-provider"
import { usePatient } from "@/hooks/use-patient"
import { useAvailability } from "@/hooks/use-availability"
import { useConsultations } from "@/hooks/use-consultations"
import { Button } from "@parmazip/ui/components/button"
import { MerchantAccountForm } from "@/components/merchant/merchant-account-form"
import { ConsultationCard } from "@/components/consultations/ConsultationCard"

// NEW
import { useProvider } from "@monobase/sdk/react/hooks/use-provider"
import { useEmr } from "@monobase/sdk/react/hooks/use-emr"
import { useBooking } from "@monobase/sdk/react/hooks/use-booking"
import { Button } from "@monobase/ui/components/button"
import { MerchantAccountSetup } from "@monobase/ui/billing/components/merchant-account-setup"
import { ConsultationCard } from "@monobase/ui/emr/components/consultation-card"

// For EMR patients (not general patients)
const { data: patients } = useEmr.patients() // emrPatients
const { data: consultations } = useEmr.consultations()

// For availability (part of booking)
const { data: availability } = useBooking.availability()
```

## Phase 7: Backend API Requirements

### 7.1 Verify/Create Backend Modules
Ensure these exist in `services/api/src/handlers/`:
- ✅ provider (already exists per CLAUDE.md notes)
- ❓ booking (need to verify)
- ❓ billing (need to verify)
- ❓ **emr** - Create if doesn't exist:
  - emrPatient endpoints
  - Medical records endpoints
  - Consultation history endpoints
  - Document management endpoints

### 7.2 Create EMR Module in Backend (if needed)
1. Define in TypeSpec: `specs/api/src/modules/emr.tsp`
   ```typespec
   namespace Emr {
     // EMR Patient operations
     @route("/emr/patients")
     op listPatients(): Patient[];
     
     @route("/emr/patients/{id}")
     op getPatient(@path id: string): Patient;
     
     // Medical records
     @route("/emr/records")
     op listRecords(@query patientId: string): MedicalRecord[];
     
     // Consultations
     @route("/emr/consultations")
     op listConsultations(): Consultation[];
     
     @route("/emr/consultations/{id}")
     op getConsultation(@path id: string): Consultation;
   }
   ```

2. Generate: `cd specs/api && bun run build:all`
3. Generate handlers: `cd services/api && bun run generate`
4. Implement: `services/api/src/handlers/emr/`

## Phase 8: Testing & Verification

### 8.1 Development Workflow
```bash
# Install dependencies
bun install

# Start provider app
cd apps/provider
bun dev  # Should run on port 3002
```

### 8.2 Verification Checklist
- ✅ TypeScript compiles: `bun run typecheck`
- ✅ All routes accessible
- ✅ Authentication flow works
- ✅ Provider profile management
- ✅ Appointment booking/management (availability)
- ✅ EMR patient access
- ✅ Consultation history
- ✅ Medical records viewing
- ✅ Merchant account setup
- ✅ Billing/invoices
- ✅ Earnings analytics
- ✅ Video calls (via SDK comms)
- ✅ Notifications (via SDK)

### 8.3 E2E Tests
- Migrate Playwright tests from old provider app
- Update test configurations
- Update for new SDK/UI imports

## Summary of Changes

### Packages to Update:
1. **`packages/sdk/`** - Add EMR module (services + hooks)
2. **`packages/ui/`** - Add EMR components + update booking/billing

### Provider App Final Architecture:
```
apps/provider/
├── public/
│   └── OneSignalSDKWorker.js
├── src/
│   ├── app.tsx                    # ApiProvider from SDK
│   ├── router.tsx                 # Router config
│   ├── components/                # Minimal provider-specific components
│   │   ├── app-sidebar.tsx        # Navigation
│   │   ├── logo.tsx               # Branding
│   │   ├── not-found.tsx          # 404
│   │   └── onesignal-sync.tsx     # OneSignal
│   ├── hooks/                     # Only custom hooks
│   │   ├── use-earnings.ts        # Analytics calculations
│   │   └── use-onesignal.ts       # OneSignal sync
│   ├── routes/                    # All route files (~30)
│   │   ├── __root.tsx
│   │   ├── index.tsx
│   │   ├── auth/
│   │   ├── onboarding.tsx
│   │   └── _dashboard/
│   │       ├── dashboard.tsx
│   │       ├── patients.tsx
│   │       ├── appointments/
│   │       ├── consultations/
│   │       ├── medical-records/
│   │       ├── billing.tsx
│   │       ├── earnings.tsx
│   │       ├── notifications.tsx
│   │       └── settings/
│   ├── services/                  # Minimal services
│   │   ├── guards.ts              # Route guards
│   │   └── onesignal.ts           # OneSignal init
│   ├── styles/
│   │   └── globals.css
│   └── utils/
│       ├── guards.ts              # Auth guards
│       └── config.ts              # Environment config
├── .env.example
├── index.html
├── package.json
├── playwright.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

**NO src/api/ directory** - All API clients from SDK

### Key Concepts:
- **emrPatient** = Patients in medical records context (NOT general Patient module)
- **Availability** = Part of booking module (provider schedule)
- **Consultations** = Part of EMR module (consultation history)
- **Merchant Account** = Part of billing module (Stripe Connect)

### Code Reduction:
- **~14 API client files** → 0 files (all in SDK)
- **~13 hook files** → 2 files (all in SDK except earnings + onesignal)
- **~10+ component files** → 4 files (all in UI package)
- **Net result**: ~70% less code in provider app

## Success Criteria
- ✅ Provider app runs on port 3002
- ✅ Zero duplicate code - all common features from packages
- ✅ EMR module functional (patients, records, consultations)
- ✅ Booking with availability management
- ✅ Billing with merchant account setup
- ✅ Clean imports from `@monobase/sdk` and `@monobase/ui`
- ✅ TypeScript compiles without errors
- ✅ All provider features working
- ✅ Proper monorepo architecture maintained
- ✅ No Radix UI or utility library dependencies in app
- ✅ Minimal custom code - maximum reuse from packages

## Migration Order

### Step 1: Package Updates
1. Create EMR module in SDK
2. Create EMR components in UI
3. Update booking module in SDK for availability
4. Verify billing module has merchant account support

### Step 2: Backend API
1. Verify/create EMR module in backend
2. Verify booking module has availability endpoints
3. Verify billing module has merchant account endpoints

### Step 3: Provider App Setup
1. Create directory structure
2. Copy config files from account app
3. Update package.json
4. Create minimal services/utils

### Step 4: Core App Files
1. Copy app.tsx, router.tsx from account
2. Create guards with provider-specific logic
3. Copy/create minimal components (sidebar, logo, not-found, onesignal-sync)

### Step 5: Routes Migration
1. Migrate all route files
2. Update all imports from `@parmazip` to `@monobase`
3. Replace custom hooks with SDK hooks
4. Replace custom components with UI package components

### Step 6: Testing
1. Run typecheck
2. Start dev server
3. Test all routes
4. Migrate E2E tests

## Notes
- This migration should result in a much smaller, cleaner codebase
- All business logic moves to packages where it can be reused
- Provider app becomes a thin orchestration layer
- Proper separation of concerns following monorepo best practices
