# CLAUDE.md

This file provides AI-specific guidance for Claude Code when working with the Monobase Application Platform.

## Documentation Map

For detailed information, refer to:
- **[README.md](./README.md)** - Project overview, installation, commands, technology stack
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Development workflows, coding standards, testing guidelines

## Repository Overview

**Monobase Application Platform** - A comprehensive full-stack monorepo platform providing video sessions, service marketplace, and user management. Built with Bun runtime for 3x faster performance than Node.js.

**Key Technologies**: Bun, PostgreSQL, Drizzle ORM, Hono API, TypeSpec, TanStack Router, Next.js, Better-Auth, Stripe

**Monorepo Structure**:
- `apps/` - Frontend applications (client, service provider, website)
- `services/api/` - Backend API service with business modules
- `specs/api/` - TypeSpec API definitions
- `packages/` - Shared packages (currently only typescript-config)

## Business Domain Modules

The platform implements business-specific modules:

1. **person** - Central PII safeguard (base for Client/Service Provider)
2. **client** - Client-specific features (extends Person)
3. **service_provider** - Service provider features (extends Person)
4. **booking** - Marketplace-style session scheduling
5. **records** - Document and records management
6. **billing** - Invoicing and payments (Stripe)
7. **audit** - Compliance logging (Pino structured logging)
8. **notifs** - Multi-channel notifications (OneSignal)
9. **comms** - Video/chat sessions
10. **reviews** - Service provider rating system
11. **storage** - File upload/download (S3/MinIO)
12. **email** - Transactional emails (SMTP/Postmark)

**Note**: Authentication is handled by Better-Auth (not a separate module). Consent management is implemented as JSONB fields on domain models (not a standalone module).

## Key Architectural Patterns

### Person-Centric Design
The Person module is the central PII safeguard. Client and Service Provider modules extend Person, allowing users to have both roles while maintaining data integrity and privacy.

### Consent Management
Consent is embedded in domain models as JSONB fields rather than a standalone module:
```typescript
{
  granted: boolean,
  granted_at: timestamp,
  ip_address: string,
  updated_at: timestamp,
  updated_by: string
}
```

Consent types by module:
- **Person**: marketing, data sharing, SMS, email
- **Booking**: remote sessions, booking confirmations
- **Records**: document access, service provider notes
- **Billing**: payment processing, transaction notifications

### API-First Development
Always follow this workflow:
1. Define APIs in TypeSpec (`specs/api/src/modules/`)
2. Generate OpenAPI + TypeScript types (`cd specs/api && bun run build:all`)
3. Generate routes/validators/handlers (`cd services/api && bun run generate`)
4. Implement handler business logic (`services/api/src/handlers/`)
5. Use generated types from `@monobase/api-spec` in frontends

**Why**: Type safety across frontend/backend, single source of truth, auto-generated docs

**⚠️ CRITICAL - Never Edit Generated Files**:
- `services/api/src/generated/openapi/*` - Routes, validators, registry (regenerated every time)
- `services/api/src/generated/better-auth/*` - Auth schema and specs
- `services/api/src/generated/migrations/*` - Database migrations

**✅ Only Edit**:
- TypeSpec files (`specs/api/src/modules/*.tsp`)
- Handler implementations (`services/api/src/handlers/{module}/*.ts`)
- Database schemas (`services/api/src/db/schema/*.ts`)

See [CONTRIBUTING.md#code-generation](./CONTRIBUTING.md#code-generation---do-not-edit) for complete details.

### Configuration Approach
Environment variables are parsed into typed configuration objects (see `services/api/src/core/config.ts`). Not file-based configuration.

### OneSignal Multi-App Architecture
OneSignal follows an **app-agnostic pattern** like other services (Storage, Email, Billing):

**Single App ID Approach**:
- Use the **same** `ONESIGNAL_APP_ID` across all frontends (client, service provider, website)
- Frontend apps: Set `VITE_ONESIGNAL_APP_ID` to the same value
- Backend API: Uses same app ID to send notifications

**Optional App Tagging**:
- Set `VITE_ONESIGNAL_APP_TAG=client` or `service_provider` in frontend .env (optional)
- Apps auto-tag themselves on initialization
- Most notifications ignore tags (app-agnostic)
- Use `targetApp` parameter only for app-specific announcements

**Why This Works**:
- OneSignal uses `external_id` (person ID) to target users across devices/apps
- Users with both client/service provider roles receive notifications in whichever app they're using
- Production deployment should use subdomains: `user.example.com`, `admin.example.com`

**API Pattern**:
```typescript
// Send to user (app-agnostic - default)
notificationRepo.createNotificationForModule({
  recipient: personId,
  type: 'booking-reminder',
  channel: 'push',
  // No targetApp - reaches user in any app
});

// Send only to specific app (rare)
notificationRepo.createNotificationForModule({
  recipient: personId,
  type: 'system',
  channel: 'push',
  targetApp: 'client', // Only if VITE_ONESIGNAL_APP_TAG is configured
});
```

### Module Structure Pattern
Backend handlers follow: **Router → Validators → Service → Handlers**

Each handler directory contains:
- Handler files (CRUD operations)
- `repos/` - Database repositories
- `jobs/` - Background job definitions
- `utils/` - Module-specific utilities

## Enterprise Compliance Requirements

When working with sensitive data:

### Data Privacy Compliance
- **Audit Trails**: All user data access must be logged with Pino
- **Consent Validation**: Check JSONB consent fields before processing
- **Role-Based Access**: Verify user roles via Better-Auth
- **Correlation IDs**: Include in all log entries for traceability

### Data Security
- Use Drizzle ORM for type-safe, SQL-injection-proof queries
- Validate all inputs with Zod schemas
- Never log sensitive personal information (PII) in plain text
- Follow secure patterns in existing handlers

## OpenAPI Specification

The canonical API reference is at: `specs/api/dist/openapi/openapi.json`

**Before implementing frontend features**:
1. Check the OpenAPI spec for endpoint definitions
2. Import TypeScript types from `@monobase/api-spec/types`
3. Validate your implementation matches the schema

**Helpful commands**: See [README.md#api-schema-reference](./README.md#api-schema-reference)

## Database Patterns

### Drizzle ORM Usage
- Use prepared statements for performance
- Leverage type inference from schema definitions
- Use transactions for multi-table operations
- Reference existing patterns in `services/api/src/handlers/*/repos/`

### Migration Workflow
1. Modify schema in `services/api/src/db/schema/`
2. Generate migration: `cd services/api && bun run db:generate`
3. Review generated SQL in `src/generated/migrations/`
4. Migrations run automatically on server start

**Details**: See [CONTRIBUTING.md#database-workflow](./CONTRIBUTING.md#database-workflow)

## Frontend Development

### Client & Service Provider Apps (Vite + TanStack Router)
- **Port**: 3001 (both apps)
- **Routing**: File-based in `src/routes/`
- **Auth**: Better-Auth with TanStack integration
- **Data Fetching**: TanStack Query with React Query
- **UI Components**: Radix UI primitives (shadcn/ui patterns)

### Website App (Next.js 15)
- **Port**: 3000
- **Routing**: Next.js App Router
- **Auth**: Better-Auth
- **Framework**: React 19, Next.js 15.4.5

**Standards**: See [CONTRIBUTING.md#coding-standards](./CONTRIBUTING.md#coding-standards)

## Testing Approach

- **API**: Bun test framework (`cd services/api && bun test`)
- **Frontend**: Playwright E2E tests (`cd apps/client && bun run test:e2e`)
- **Type Safety**: TypeScript checking across all workspaces

**Details**: See [CONTRIBUTING.md#testing-requirements](./CONTRIBUTING.md#testing-requirements)

## Common Commands Quick Reference

**Full command reference**: See [README.md#available-commands](./README.md#available-commands)

Essential commands:
```bash
# Install dependencies
bun install

# API-first workflow
cd specs/api && bun run build:all           # Generate OpenAPI + types
cd ../../services/api && bun run generate  # Generate routes/validators

# Start development
cd services/api && bun dev        # API on port 7213
cd apps/client && bun dev         # Client app on port 3001
cd apps/service_provider && bun dev  # Service Provider app on port 3001
cd apps/website && bun dev        # Website on port 3000

# Database
cd services/api && bun run db:generate  # Generate migration
cd services/api && bun run db:studio    # Open Drizzle Studio

# Testing
cd services/api && bun test             # API tests
cd apps/client && bun run test:e2e      # E2E tests
```

## Important Notes

### What Exists vs. Planned
- ❌ **packages/ui/** does not exist (apps manage their own UI)
- ❌ **identity** and **consent** are not separate modules
- ✅ **Authentication** via Better-Auth
- ✅ **Consent** as JSONB fields on models
- ⚠️ Some features are partial implementations

### Current Limitations
- No shared UI component library
- Module analytics `/stats` endpoints implementation varies
- Some compliance features are aspirational

## When in Doubt

1. Check [README.md](./README.md) for commands and setup
2. Check [CONTRIBUTING.md](./CONTRIBUTING.md) for development patterns
3. Reference existing handlers in `services/api/src/handlers/` for implementation patterns
4. Check OpenAPI spec at `specs/api/dist/openapi/openapi.json` for API contracts
