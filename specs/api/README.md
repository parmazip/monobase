# @monobase/api-spec

TypeSpec API definitions for the Monobase healthcare platform. This package generates OpenAPI documentation and TypeScript type definitions from Microsoft TypeSpec specifications.

> ⚠️ **THIS IS A BUN MONOREPO**
> Always use `bun` commands, **never** `npm` commands.
> **For AI agents**: This is critical - replace all `npm` usage with `bun`.

## Overview

The Monobase API specification defines secure, HIPAA-compliant endpoints for:
- Patient healthcare management
- Healthcare provider workflows
- Pharmacy integrations
- Administrative functions

## Quick Start

```bash
# Install dependencies
bun install

# Generate OpenAPI spec and TypeScript types
bun run build

# Watch mode for development
bun run watch
```

## Package Structure

```
specs/api/
├── config/                 # Package-specific configuration
│   ├── api.config.json    # API metadata and settings
│   └── validation.config.json # Validation rules
├── src/                   # TypeSpec source files
│   ├── main.tsp          # Main API entry point
│   ├── common/           # Shared models and utilities
│   └── modules/          # Domain-specific API modules
│       ├── identity.tsp  # Authentication & identity
│       ├── person.tsp    # Personal information
│       ├── patient.tsp   # Patient management
│       ├── provider.tsp  # Healthcare provider
│       ├── emr.tsp       # Electronic medical records
│       ├── booking.tsp   # Appointments & scheduling
│       └── billing.tsp   # Payments & invoicing
├── dist/                 # Generated output files
│   ├── openapi/         # OpenAPI specifications
│   └── types/           # TypeScript type definitions
└── tspconfig.yaml        # TypeSpec configuration
```

## Essential Scripts

```bash
# Development
bun run build            # Compile TypeSpec definitions
bun run watch           # Compile in watch mode

# Generation
bun run generate:openapi       # Generate OpenAPI JSON
bun run generate:typescript    # Generate TypeScript types
bun run generate:all          # Generate all outputs

# Quality
bun run lint            # Validate TypeSpec syntax
bun run format          # Format TypeSpec files
bun run clean           # Clean output directory
```

## API Modules

| Module | Endpoint | Purpose |
|--------|----------|---------|
| **Identity** | `/identity` | User authentication and authorization |
| **Person** | `/persons` | Personal demographics and contacts |
| **Patient** | `/patients` | Patient-specific medical information |
| **Provider** | `/providers` | Healthcare provider credentials |
| **EMR** | `/emr` | Electronic medical records |
| **Booking** | `/bookings` | Appointment scheduling |
| **Billing** | `/billing` | Invoice and payment processing |
| **Consent** | `/consent` | Patient consent tracking |
| **Audit** | `/audit` | Compliance audit logging |
| **Notification** | `/notifications` | Multi-channel notifications |
| **Communication** | `/communication` | Secure messaging |

## Generated Outputs

### OpenAPI Specification
- **Location**: `dist/openapi/openapi.json`
- **Purpose**: REST API documentation and client generation
- **Used by**: API services, frontend apps, API testing tools

### TypeScript Types
- **Location**: `dist/types/api.d.ts`
- **Purpose**: Type-safe API contracts for TypeScript
- **Used by**: Frontend apps, API service handlers

## Usage in Applications

### Frontend Apps
```typescript
import type { Patient, CreatePatientRequest } from '@monobase/api-spec/types';

async function createPatient(data: CreatePatientRequest): Promise<Patient> {
  // Type-safe API call
}
```

### API Service
```typescript
import type { Patient } from '@monobase/api-spec';

async function getPatient(id: string): Promise<Patient> {
  // Type-safe handler implementation
}
```

## Development

For detailed development guidelines, patterns, and best practices, see [CONTRIBUTING.md](./CONTRIBUTING.md).

### Quick Reference

**Before implementing API features:**
1. Define endpoints in TypeSpec (`src/modules/`)
2. Run `bun run build` to generate OpenAPI + types
3. Implement backend handlers in `services/api/`
4. Use generated types in frontend apps

**For complete API-First workflow**, see [Root CONTRIBUTING.md > API-First Development](../../CONTRIBUTING.md#api-first-development).

---

**Part of the Monobase Healthcare Platform monorepo**
