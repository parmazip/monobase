# Monobase Application Platform

A comprehensive full-stack monorepo platform providing video sessions, service management, and user management. Built with Bun runtime for 3x faster performance than Node.js.

## Overview

Monobase is a modern application platform designed to streamline user management, administrative operations, and business workflows. The platform provides:

- **User Portal** - Self-service account management and video sessions
- **Admin Portal** - Administrative tools and user management
- **Marketing Website** - Public-facing platform information
- **API Service** - Enterprise-grade backend with comprehensive business modules

## Key Features

- **Advanced Booking** - Search, filtering, and session scheduling
- **Video Sessions** - Real-time video calls and secure messaging
- **User Management** - Comprehensive user profiles and role management
- **Service Management** - Service coordination and delivery workflows
- **Billing & Payments** - Stripe integration with flexible payment options
- **Enterprise Compliance** - Audit trails, consent management, and secure data handling
- **Multi-Role Support** - Users can have multiple roles within the system
- **Real-time Notifications** - Multi-channel delivery (email, SMS, push)

## Monorepo Structure

```
monobase/
├── apps/                      # Frontend applications
│   ├── account/              # User portal (Vite + TanStack Router)
│   ├── admin/                # Admin portal (Vite + TanStack Router)
│   └── website/              # Marketing website (Next.js 15)
├── packages/                  # Shared libraries
│   └── typescript-config/    # Shared TypeScript configurations
├── services/                  # Backend services
│   └── api/                  # Main API service (Hono + Bun)
├── specs/                     # API specifications
│   └── api/                  # TypeSpec source definitions
├── CLAUDE.md                 # AI assistant project guide
└── package.json              # Monorepo workspace configuration
```

## Prerequisites

- **Bun** >= 1.2.21 ([installation guide](https://bun.sh))
- **PostgreSQL** >= 14
- **Node.js** >= 18 (for some tooling compatibility)
- **Git** for version control

### Optional Services
- **AWS S3** or **MinIO** for file storage
- **Stripe** account for payment processing
- **SMTP** server or **Postmark** for email delivery
- **OneSignal** for push notifications (single app ID shared across all frontends)

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd monobase
bun install
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb monobase

# Generate database schema
cd services/api
bun run db:generate
```

### 3. Configure Environment

Create `.env` files in each service/app directory (see individual READMEs for required variables):

```bash
# services/api/.env
DATABASE_URL=postgresql://user:password@localhost:5432/monobase
PORT=7213
```

### 4. Start Development Servers

```bash
# Terminal 1 - API Service
cd services/api
bun dev

# Terminal 2 - User App
cd apps/account
bun dev

# Terminal 3 - Admin App  
cd apps/admin
bun dev

# Terminal 4 - Website
cd apps/website
bun dev
```

## Development Workflow

### API-First Development

1. **Define API** - Create/modify TypeSpec definitions in `specs/api/src/modules/`
2. **Generate** - Run `cd specs/api && bun run build:all`
3. **Implement** - Build Hono handlers in `services/api/src/handlers/`
4. **Test** - Write tests and run `cd services/api && bun test`
5. **Integrate** - Use generated TypeScript types in frontend apps

### Working with the Monorepo

```bash
# Install dependencies across all workspaces
bun install

# Build all packages
bun run --filter '*' build

# Clean build artifacts
bun run clean

# Run specific workspace command
cd apps/account && bun dev
```

## Available Commands

### Root Level

```bash
bun install                    # Install all workspace dependencies
bun run --filter '*' build    # Build all packages
bun run clean                  # Clean build artifacts
```

### API Service (`services/api/`)

```bash
bun dev                        # Start development server (port 7213)
bun run build                  # Build production bundle
bun run generate               # Generate routes, validators, handlers from OpenAPI
bun test                       # Run test suite
bun run typecheck              # TypeScript type checking
bun run db:generate            # Generate Drizzle migrations
bun run db:studio              # Open Drizzle Studio
```

**⚠️ Code Generation**: The API service auto-generates routes, validators, and handler stubs from TypeSpec. See [CONTRIBUTING.md#code-generation](./CONTRIBUTING.md#code-generation---do-not-edit) for what files to never edit manually.

### API Specifications (`specs/api/`)

```bash
bun run build                  # Generate OpenAPI specs
bun run build:types            # Generate TypeScript types
bun run build:all              # Generate both OpenAPI and types
```

### User App (`apps/account/`)

```bash
bun dev                        # Start dev server (port 3001)
bun run build                  # Build production bundle
bun run typecheck              # TypeScript type checking
bun run test:e2e               # Run Playwright E2E tests
```

### Admin App (`apps/admin/`)

```bash
bun dev                        # Start dev server (port 3001)
bun run build                  # Build production bundle
bun run typecheck              # TypeScript type checking
bun run test:e2e               # Run Playwright E2E tests
```

### Website (`apps/website/`)

```bash
bun dev                        # Start Next.js dev server (port 3000)
bun run build                  # Build production bundle
bun run start                  # Start production server
```

## Applications

### User Portal

**Technology**: Vite + TanStack Router + React 19

User-facing application for:
- Account management and profile
- Service search and booking
- Video sessions
- Document access
- Service management
- Booking history

**Development**: `cd apps/account && bun dev`  
**Port**: 3001

### Admin Portal

**Technology**: Vite + TanStack Router + React 19

Admin-facing application for:
- Professional profile management
- Schedule and availability management
- Client booking management
- Document management
- Communication with clients
- Performance analytics

**Development**: `cd apps/admin && bun dev`  
**Port**: 3001 (configure different port if running simultaneously)

### Marketing Website

**Technology**: Next.js 15 + React 19

Public-facing website for:
- Platform information
- Service provider directory
- Resources
- Contact and support
- Public booking interface

**Development**: `cd apps/website && bun dev`  
**Port**: 3000

## API Service

### Business Modules

The API service is organized into domain-specific modules:

1. **Identity** - Authentication & authorization (Better-Auth)
2. **Person** - Central PII safeguard (base for User/Admin)
3. **User** - User-specific features and history
4. **Admin** - Service provider profiles and credentials
5. **Booking** - Session scheduling with search/filter capabilities
6. **EMR** - Document and records management
7. **Billing** - Invoicing, payments (Stripe), and transaction management
8. **Audit** - Compliance logging and activity tracking
9. **Notification** - Multi-channel notifications (email, SMS, push)
10. **Communication** - Video/chat sessions (WebRTC)
11. **Reviews** - Rating and feedback system
12. **Email** - Transactional email delivery

### Key Architectural Patterns

**Person-Centric Design**: The Person module serves as the central PII safeguard. User and Admin modules extend Person, allowing individuals to have both roles while maintaining data integrity and privacy.

**Consent Management**: Consent is managed via JSONB fields on domain models rather than a standalone module:
- Person: marketing, data sharing, SMS, email consent
- Booking: video session, booking consent
- EMR: document access, provider notes consent
- Billing: payment processing, transaction consent

**Module Analytics**: Each module provides `/stats` endpoints for admin dashboards rather than centralized analytics.

### API Documentation

- **OpenAPI Spec**: `specs/api/dist/openapi/openapi.json`
- **TypeScript Types**: Generated to `@monobase/api-spec` package
- **Interactive Docs**: Scalar UI available at `/docs` endpoint

## Technology Stack

### Runtime & Build
- **Bun** 1.2.21+ - Fast JavaScript runtime and package manager
- **TypeScript** 5.9.2 - Type-safe development
- **ESM** - Modern module system

### Frontend
- **TanStack Router** - Type-safe routing library (account/admin apps)
- **Next.js** 15.4.5 - React framework (website)
- **React** 19 - UI library
- **TanStack Router** - Type-safe routing
- **Radix UI** - Accessible component primitives
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Component library
- **Framer Motion** - Animations
- **React Hook Form** + **Zod** - Form validation

### Backend
- **Hono** - Fast web framework
- **Drizzle ORM** - Type-safe database queries
- **PostgreSQL** - Primary database
- **Better-Auth** - Authentication (no external service)
- **Pino** - Structured JSON logging
- **Zod** - Runtime validation

### API & Types
- **TypeSpec** - API-first specification language
- **OpenAPI** - REST API documentation
- **Type Generation** - Automatic TypeScript types from specs

### Infrastructure
- **AWS S3** / **MinIO** - Object storage
- **Stripe** - Payment processing
- **Postmark** / **SMTP** - Email delivery
- **OneSignal** - Push notifications (app-agnostic, targets users by ID)

## Testing

### Unit & Integration Tests
```bash
cd services/api
bun test
```

### End-to-End Tests
```bash
# User app E2E tests
cd apps/account
bun run test:e2e

# Admin app E2E tests
cd apps/admin
bun run test:e2e
```

### Type Checking
```bash
# Check all TypeScript types
cd services/api && bun run typecheck
cd apps/account && bun run typecheck
cd apps/admin && bun run typecheck
```

## Documentation

- **CLAUDE.md** - Comprehensive project guide for AI assistants and developers
- **CONTRIBUTING.md** - Developer contribution guidelines
- **Module Docs** - Individual module documentation in `docs/` (planned)

## Enterprise Compliance

- **Audit Trails** - All data access includes comprehensive audit logging
- **Consent** - Granular consent management for all data operations
- **Security** - TLS 1.3, field-level encryption, role-based access
- **Audit** - Structured logging with correlation IDs
- **Data Integrity** - ACID-compliant PostgreSQL transactions

## Performance

- **3x Faster Startup** - Bun vs Node.js
- **Native TypeScript** - No transpilation overhead
- **Connection Pooling** - Optimized database queries
- **JSONB Indexing** - Fast consent and config queries
- **Read Replicas** - Scalable read-heavy workloads (planned)

## License

[Add your license here - e.g., MIT, Apache 2.0, Proprietary]

---

For detailed development guidelines, see [CONTRIBUTING.md](./CONTRIBUTING.md).  
For AI assistant integration, see [CLAUDE.md](./CLAUDE.md).
