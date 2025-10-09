# Testing Guide

This document describes the testing infrastructure and procedures for the Monobase API service.

## Overview

Monobase uses an externally controlled dependencies model for testing:
- Docker Compose manages PostgreSQL and MinIO containers
- Tests connect to pre-running services using standard ports
- Each test gets an isolated database schema for complete test isolation
- No complex container pooling or programmatic lifecycle management

## Quick Start

```bash
# Start test dependencies
bun run dev:deps:up

# Run tests
bun test:e2e         # Run all E2E tests
bun test:unit        # Run unit tests
bun test             # Run all tests

# Stop dependencies and clean volumes
bun run dev:deps:down
```

## Test Infrastructure

### Docker Compose Setup

The `docker-compose.deps.yml` file provides:

1. **PostgreSQL 16**
   - Port: 5432
   - Database: monobase
   - User: postgres / password

2. **MinIO (S3-compatible storage)**
   - API Port: 9000
   - Console Port: 9001
   - Credentials: minioadmin / minioadmin

### Test Isolation

Each test creates an isolated database schema:
- Schema name pattern: `test_{timestamp}_{nanoid}`
- Complete isolation between tests
- Tests can run in parallel without conflicts
- Automatic cleanup after each test

## Environment Variables

Tests use sensible defaults that work out of the box. You can override them if needed:

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://postgres:password@localhost:5432/monobase` | PostgreSQL connection |
| `STORAGE_ENDPOINT` | `http://localhost:9000` | MinIO endpoint |
| `STORAGE_ACCESS_KEY_ID` | `minioadmin` | MinIO access key |
| `STORAGE_SECRET_ACCESS_KEY` | `minioadmin` | MinIO secret key |
| `API_URL` | `http://localhost:7213` | API endpoint (for E2E tests) |
| `AUTH_ADMIN_EMAILS` | `[]` | Comma-separated list of admin emails for automatic admin role assignment |

## Writing Tests

### E2E Test Structure

```typescript
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { createTestApp, getApiUrl } from '../setup/test-app';
import { createApiClient } from '../helpers/client';

describe('Feature Tests', () => {
  let testApp;
  let client;

  beforeEach(async () => {
    // Create isolated test environment
    testApp = await createTestApp({ storage: true });

    // Create API client
    const apiUrl = getApiUrl();
    client = createApiClient({ apiBaseUrl: apiUrl });
  });

  afterEach(async () => {
    // Cleanup test schema
    await testApp.cleanup();
  });

  test('should do something', async () => {
    // Your test implementation
  });
});
```

### Unit Test Structure

Unit tests don't need the test app setup:

```typescript
import { describe, test, expect } from 'bun:test';
import { functionToTest } from '../src/module';

describe('Module Tests', () => {
  test('should behave correctly', () => {
    const result = functionToTest();
    expect(result).toBe(expected);
  });
});
```

## Running Specific Tests

```bash
# Run specific test file
bun test tests/e2e/patient/patient.test.ts

# Run tests matching pattern
bun test --match "Patient"

# Run tests in watch mode
bun test --watch
```

## Admin Email Configuration

Some tests require admin privileges to access list endpoints and perform administrative operations. You must configure admin emails when starting the API to enable automatic admin role assignment.

### Setting Up Admin Users

When starting the API for testing, include the `AUTH_ADMIN_EMAILS` environment variable:

```bash
# For testing with admin privileges
AUTH_ADMIN_EMAILS=admin1@test.com,admin2@test.com,admin3@test.com PORT=7213 bun dev
```

### How Admin Role Assignment Works

- **Automatic Assignment**: When a user signs up with an email listed in `AUTH_ADMIN_EMAILS`, they automatically receive the `admin` role
- **Better-Auth Integration**: The admin role assignment happens during user creation via Better-Auth database hooks
- **Test Compatibility**: E2E tests can then use these predefined admin emails to create users with admin privileges
- **List Endpoint Access**: Admin users can access list endpoints (e.g., `GET /persons`, `GET /patients`) that require admin authorization

### Admin Email Examples in Tests

```typescript
// Test helper will use one of the configured admin emails
const adminClient = createApiClient({
  apiBaseUrl: apiUrl,
  // Uses admin1@test.com, admin2@test.com, or admin3@test.com
});

await adminClient.signup(); // This user will have admin role automatically
```

## API Development Workflow

When developing the API alongside tests:

```bash
# Terminal 1: Start dependencies
bun run dev:deps:up

# Terminal 2: Start API with admin emails for testing
AUTH_ADMIN_EMAILS=admin1@test.com,admin2@test.com,admin3@test.com bun dev

# Terminal 3: Run tests
bun test:e2e
```

## Troubleshooting

### PostgreSQL Connection Issues

```bash
# Check if PostgreSQL is running
docker ps | grep monobase-test-postgres

# View PostgreSQL logs
docker logs monobase-test-postgres

# Restart PostgreSQL
bun run dev:deps:down
bun run dev:deps:up
```

### MinIO Connection Issues

```bash
# Check if MinIO is running
docker ps | grep monobase-test-minio

# View MinIO logs
docker logs monobase-test-minio

# Access MinIO console
open http://localhost:9001
# Login with minioadmin/minioadmin
```

### Port Conflicts

If default ports are in use:

```bash
# Stop conflicting services or use different ports
DATABASE_URL=postgresql://postgres:password@localhost:5433/monobase bun test:e2e
STORAGE_ENDPOINT=http://localhost:9100 bun test:e2e
```

### Clean State Between Test Runs

The `-v` flag in `dev:deps:down` removes volumes for a clean slate:

```bash
# Complete cleanup and restart
bun run dev:deps:down  # Removes volumes
bun run dev:deps:up    # Fresh start
```

## CI/CD Integration

For GitHub Actions or other CI systems:

```yaml
steps:
  - name: Checkout code
    uses: actions/checkout@v4

  - name: Setup Bun
    uses: oven-sh/setup-bun@v1

  - name: Install dependencies
    run: bun install

  - name: Start test services
    run: bun run dev:deps:up

  - name: Run tests
    run: bun test
    env:
      CLAUDECODE: 1  # Enable AI-friendly test output

  - name: Stop services
    if: always()
    run: bun run dev:deps:down
```

## Performance Tips

1. **Keep containers running** during development for faster test runs
2. **Use specific test files** instead of running all tests during development
3. **Use watch mode** for rapid feedback: `bun test --watch`
4. **Clean volumes periodically** to prevent disk space issues

## Key Differences from Complex Pool-Based Systems

✅ **Simpler**: No container pool management, just Docker Compose
✅ **Faster**: Containers stay warm between test runs
✅ **Clearer**: Direct connection to services on standard ports
✅ **Reliable**: No complex acquisition/release logic
✅ **Debuggable**: Easy to inspect containers and databases directly

## Database Schema Management

Tests automatically create and migrate isolated schemas using **Drizzle migrations**. To inspect test data:

```bash
# Connect to PostgreSQL
docker exec -it monobase-test-postgres psql -U postgres -d monobase

# List test schemas
\dn test_*

# Inspect a specific schema
SET search_path TO test_abc123_xyz;
\dt

# Clean up old test schemas (if needed)
DROP SCHEMA test_abc123_xyz CASCADE;
```

### Migration Integration

Tests use the actual Drizzle migration files from `src/generated/migrations/` rather than hardcoded SQL:

- **Schema Isolation**: Each test creates a unique PostgreSQL schema (`test_{timestamp}_{nanoid}`)
- **Real Migrations**: Runs all production Drizzle migration files in the isolated schema
- **Schema Substitution**: Automatically replaces `"public"` references with test schema names
- **Migration Tracking**: Creates `__drizzle_migrations` table to track applied migrations
- **Automatic Cleanup**: `DROP SCHEMA CASCADE` removes all database objects (tables, enums, etc.)

This ensures tests use the exact same database structure as production, maintaining consistency between environments.