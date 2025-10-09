# Admin App Development Guide

This guide covers admin app-specific development details. **For shared frontend patterns**, see [Root CONTRIBUTING.md > Frontend Development Patterns](../../CONTRIBUTING.md#frontend-development-patterns).

## Table of Contents

1. [App Overview](#app-overview)
2. [Tech Stack](#tech-stack)
3. [Directory Structure](#directory-structure)
4. [Domain Modules](#domain-modules)
5. [Routes](#routes)
6. [Quick Reference](#quick-reference)

---

## App Overview

**Purpose**: Admin Portal for Monobase Application Platform

**Features**:
- Admin profile management (Person + Admin credentials)
- Appointment management and scheduling
- User records access
- Billing and invoicing
- Organization management
- Secure authentication with Better-Auth

**Key Principles**:
- **API-First**: OpenAPI spec at `specs/api/dist/openapi/openapi.json` is source of truth
- **Module-Based**: Organize by domain (person, provider, appointments)
- **Type-Safe**: Strict TypeScript with Zod validation
- **Sanitized**: Proper null/omit handling via `sanitizeObject()`

---

## Tech Stack

- **Framework**: TanStack Start (full-stack React framework)
- **Runtime**: Bun 1.2.21+
- **State**: TanStack Query v5, React Hook Form
- **UI**: shadcn/ui + Tailwind CSS
- **Auth**: Better-Auth
- **Port**: 3002 (development)

**For detailed tech stack info and patterns**, see [Root Frontend Patterns](../../CONTRIBUTING.md#frontend-development-patterns).

---

## Directory Structure

```
src/
├── api/                      # API client functions
│   ├── client.ts            # Base HTTP client
│   ├── person.ts            # Person API functions
│   └── query.ts             # Centralized query keys
│
├── components/               # React components (by domain)
│   ├── person/              # Person domain
│   │   ├── schema.ts        # Zod schemas + types
│   │   ├── personal-info-form.tsx
│   │   ├── contact-info-form.tsx
│   │   ├── address-form.tsx
│   │   └── preferences-form.tsx
│   │
│   ├── provider/            # Provider domain
│   │   ├── schema.ts        # Zod schemas + types
│   │   ├── credentials-form.tsx
│   │   ├── specialties-form.tsx
│   │   └── practice-info-form.tsx
│   │
│   └── ui/                  # shadcn/ui (CLI-managed only)
│
├── hooks/                    # TanStack Query hooks
│   ├── use-person.ts        # Person query/mutation hooks
│   ├── use-provider.ts      # Provider hooks
│   └── use-mobile.tsx       # Utility hooks
│
├── routes/                   # File-based routing
│   ├── __root.tsx           # Root layout
│   ├── index.tsx            # Landing page
│   ├── onboarding.tsx       # Onboarding flow
│   ├── auth/                # Auth pages
│   │   └── $authView.tsx    # Dynamic auth view
│   └── _dashboard/          # Protected routes
│       ├── dashboard.tsx    # Dashboard home
│       ├── appointments.tsx
│       ├── patients.tsx
│       └── settings/
│           └── account.tsx
│
├── services/                 # Business logic
│   ├── auth.ts              # Auth client
│   └── guards.ts            # Route guards
│
└── utils/                    # Utilities
    ├── api.ts               # Data sanitization
    └── config.ts            # App configuration
```

---

## Domain Modules

### Person Module

**Purpose**: Central PII safeguard - manages personal information shared across patient and provider roles

**Files**:
- `components/person/schema.ts` - Personal info, contact, address, preferences schemas
- `components/person/*-form.tsx` - Personal info, contact, address, preferences forms
- `api/person.ts` - Person API functions (CRUD operations)
- `hooks/use-person.ts` - Person query/mutation hooks

**Forms**:
- `PersonalInfoForm` - First name, last name, middle name, DOB, gender
- `ContactInfoForm` - Email, phone, preferred language
- `AddressForm` - Primary and shipping address management
- `PreferencesForm` - Communication and notification preferences

**Key Patterns**:
- Check OpenAPI spec for `PersonUpdateRequest` nullable fields
- Use `sanitizeObject()` with nullable: `['lastName', 'middleName', 'dateOfBirth', 'gender']`

### Provider Module

**Purpose**: Healthcare provider-specific credentials and practice information

**Files**:
- `components/provider/schema.ts` - Credentials, specialties, practice info schemas
- `components/provider/*-form.tsx` - Provider-specific forms
- `api/provider.ts` - Provider API functions
- `hooks/use-provider.ts` - Provider query/mutation hooks

**Forms** (Planned):
- `CredentialsForm` - License number, NPI, DEA, board certifications
- `SpecialtiesForm` - Primary and secondary specialties
- `PracticeInfoForm` - Practice name, address, contact information
- `AvailabilityForm` - Practice hours, appointment availability

**Key Patterns**:
- Provider extends Person (has `person_id` reference)
- Credentials require validation and expiration tracking
- Specialties support multi-select

### Appointments Module (Planned)

**Purpose**: Provider-side appointment management

**Features**:
- View upcoming appointments
- Manage availability calendar
- Confirm/cancel appointments
- Access patient information for appointments

---

## Routes

### Public Routes

- `/` - Landing page (requireGuest guard)
- `/auth/$authView` - Dynamic auth views (sign-in, sign-up, etc.)

### Protected Routes (Layout: `_dashboard`)

All dashboard routes use `requireAuthWithProfile()` guard.

**Dashboard**:
- `/dashboard` - Dashboard home (today's appointments, upcoming schedule)

**Appointments**:
- `/dashboard/appointments` - Appointment calendar/list
- `/dashboard/appointments/$appointmentId` - Appointment details (planned)

**Patients**:
- `/dashboard/patients` - Patient list (planned)
- `/dashboard/patients/$patientId` - Patient details (planned)

**Settings**:
- `/dashboard/settings/account` - Account settings (person profile management)
- `/dashboard/settings/practice` - Practice settings (planned)
- `/dashboard/settings/availability` - Availability management (planned)

### Special Routes

- `/onboarding` - Onboarding flow (uses `requireAuthWithoutProfile()` guard)

**Route Guards**:
See [Root Frontend Patterns > Routing](../../CONTRIBUTING.md#routing-tanstack-router) for guard usage and decision tree.

---

## Quick Reference

### Development Commands

```bash
cd apps/provider

# Development
bun install          # Install dependencies
bun dev             # Start dev server (port 3002)
bun run build       # Build for production
bun run typecheck   # TypeScript checking

# Testing
bun run test:e2e        # E2E tests (Playwright)
bun run test:e2e:ui     # Playwright UI
```

### Adding shadcn/ui Components

New shadcn components should be added to the **shared UI package** at `/packages/ui`:

```bash
cd packages/ui
bunx shadcn@latest add [component-name]
```

**Never** edit generated shadcn components manually. All UI components are now shared via `@monobase/ui/components/*`.

### Before Implementing Features

1. Check OpenAPI spec: `specs/api/dist/openapi/openapi.json`
2. Identify nullable fields for the schema
3. Create schema file with Zod validation
4. Create form components
5. Create API functions with `sanitizeObject()`
6. Create query/mutation hooks
7. Create routes with appropriate guards

### Common Patterns

**Loading States**:
```typescript
const { data, isLoading, error } = useProviderProfile()

if (isLoading) return <Skeleton />
if (error) return <ErrorAlert error={error} />
if (!data) return <EmptyState />
return <Content data={data} />
```

**Path Aliases**:
```typescript
// ✅ Good
import { Button } from '@/components/ui/button'

// ❌ Bad
import { Button } from '../../../components/ui/button'
```

---

## Complete Development Patterns

For complete details on:
- ⚠️ Critical rules (OpenAPI spec, shadcn/ui CLI, sanitization)
- Module architecture (4-file pattern)
- API integration and error handling
- Component patterns and form structure
- Query hooks and mutation patterns
- Routing conventions and guards
- Type safety rules
- Development workflow

**See**: [Root CONTRIBUTING.md > Frontend Development Patterns](../../CONTRIBUTING.md#frontend-development-patterns)

---

**For code examples, refer to patient app modules** (same patterns apply):
- Complete module: `apps/patient/src/components/person/`
- Simpler module: `apps/patient/src/components/patient/`
- Query hooks: `apps/patient/src/hooks/use-person.ts`
- API functions: `apps/patient/src/api/person.ts`
- Route guards: `apps/patient/src/services/guards.ts`

**Last Updated**: 2025-10-02
