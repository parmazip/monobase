# Admin Portal

Admin-facing web application for the Monobase Application Platform. Built with modern React patterns for appointment management, user consultations, records documentation, and business administration.

## Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) - Full-stack React framework with file-based routing
- **Runtime**: [Bun](https://bun.sh) - 3× faster than Node.js with native TypeScript
- **UI**: [shadcn/ui](https://ui.shadcn.com) + [Tailwind CSS](https://tailwindcss.com) - Accessible components built on Radix UI
- **State Management**: [TanStack Query v5](https://tanstack.com/query) - Server state and data fetching
- **Forms**: [React Hook Form](https://react-hook-form.com) + [Zod 4.x](https://zod.dev) - Type-safe validation
- **Auth**: [Better-Auth](https://better-auth.com) - Embedded authentication with cookie-based sessions

## Quick Start

```bash
# Install dependencies (from monorepo root)
bun install

# Start development server
cd apps/account
bun dev
```

The app runs on **http://localhost:3002** by default.

## Development

For detailed development guidelines, architecture patterns, and contribution standards, see [CONTRIBUTING.md](./CONTRIBUTING.md).

### Essential Commands

```bash
# Development
bun dev              # Start dev server (port 3002)
bun run build        # Build for production
bun run typecheck    # Run TypeScript checks

# Testing
bun run test:e2e     # Run E2E tests with Playwright
bun run test:e2e:ui  # Open Playwright UI
```

### API Integration

This app consumes the API service at `services/api`. Before implementing API features:

1. Check the OpenAPI spec: `specs/api/dist/openapi/openapi.json`
2. Use generated types from `@monobase/api-spec`
3. Follow the module pattern (schema → form → API → hooks)

See [CONTRIBUTING.md](./CONTRIBUTING.md) for comprehensive API integration workflow.

## Project Structure

```
src/
├── api/              # API client functions
├── components/       # React components (organized by domain)
│   ├── person/      # Person domain (profiles, contact info)
│   ├── provider/    # Provider domain (credentials, roles)
│   └── ui/          # shadcn/ui base components (CLI-managed)
├── hooks/           # TanStack Query hooks
├── routes/          # File-based routing
└── utils/           # Utilities (API sanitization, config)
```

## Features

- **Provider Profiles**: Manage admin credentials, roles, and organization information
- **Appointments**: View and manage user appointments and scheduling
- **Patient Consultations**: Access user records and conduct video consultation visits
- **Practice Management**: Configure availability, organization settings, and billing
- **Medical Documentation**: Document user sessions, notes, and action plans
- **Secure Auth**: Cookie-based sessions with Better-Auth
- **Responsive Design**: Mobile-first UI with Tailwind CSS

## Documentation

- **[CONTRIBUTING.md](./CONTRIBUTING.md)**: Comprehensive development guide (architecture, patterns, conventions)
- **[Monorepo Root CLAUDE.md](../../CLAUDE.md)**: Workspace commands and monorepo structure
- **[API Spec](../../specs/api/dist/openapi/openapi.json)**: OpenAPI schema (single source of truth)

## Contributing

**Development Patterns**: See [Root CONTRIBUTING.md > Frontend Development Patterns](../../CONTRIBUTING.md#frontend-development-patterns) for:
- Module architecture (4-file pattern)
- API integration and sanitization
- Component patterns (shadcn/ui, forms)
- Query hooks with TanStack Query
- Routing and route guards
- Type safety rules

**Provider App Specifics**: See [CONTRIBUTING.md](./CONTRIBUTING.md) for:
- Domain modules (Person, Provider)
- Routes structure
- Development commands

---

**Part of the Monobase Application Platform monorepo**
