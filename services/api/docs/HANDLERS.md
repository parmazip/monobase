# Handler Template

This template shows the modern patterns for creating handlers based on the storage module implementation.

## ⚠️ IMPORTANT: Error Handling Philosophy

**DO NOT use try/catch blocks unless you need to clean up resources on failure.**

The API has a global error handler that manages all errors. Let errors bubble up naturally.

### ❌ WRONG - Unnecessary try/catch
```typescript
// DON'T DO THIS - The global handler will manage errors
try {
  const user = await repo.findById(id);
  if (!user) throw new NotFoundError('User not found', { resourceType: 'user', resource: id });
  return ctx.json(user);
} catch (error) {
  return ctx.json({ error: error.message }, 400);
}
```

### ✅ CORRECT - Let errors bubble up
```typescript
// DO THIS - Let the global error handler manage it
const user = await repo.findById(id);
if (!user) throw new NotFoundError('User not found', { resourceType: 'user', resource: id });
return ctx.json(user);
```

### ✅ CORRECT - Try/catch ONLY for cleanup
```typescript
// Use try/catch ONLY when you need to clean up on failure
let resourceCreated = false;
try {
  await repo.create(data);
  resourceCreated = true;
  
  await externalService.process(data);
  return ctx.json({ success: true });
} catch (error) {
  // Clean up only if resource was created
  if (resourceCreated) {
    await repo.delete(data.id);
    logger?.error({ error, id: data.id }, 'Cleaned up after failure');
  }
  throw error; // ALWAYS re-throw for global handler
}
```

## Module Structure

Organize handlers using the repository pattern with proper separation of concerns:

```
src/handlers/[module]/
├── repos/
│   ├── [entity].schema.ts    # Drizzle schema definitions & types
│   └── [entity].repo.ts      # Repository class with data access logic
├── [operation1].ts           # Individual handler functions
├── [operation2].ts
├── [operation3].ts
└── index.ts                  # Module exports (optional)
```

## Schema Definition (repos/[entity].schema.ts)

Define your database schema and TypeScript types using Drizzle ORM with the standardized base entity fields:

```typescript
import { pgTable, uuid, varchar, pgEnum } from 'drizzle-orm/pg-core';
import { baseEntityFields, type BaseEntity } from '@/core/database.schema';

// Define enums
export const statusEnum = pgEnum('status', ['active', 'inactive', 'pending']);

// Define table schema
export const entities = pgTable('entity', {
  // Base entity fields (includes id, timestamps, version, audit fields)
  ...baseEntityFields,
  
  // Entity-specific fields
  name: varchar('name', { length: 255 }).notNull(),
  status: statusEnum('status').notNull().default('pending'),
  
  // Relationships - Use entity name, not *Id suffix
  owner: uuid('owner_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
});

// Type exports for TypeScript
export type Entity = typeof entities.$inferSelect;
export type NewEntity = typeof entities.$inferInsert;

// API response types
export interface EntityResponse {
  id: string;
  name: string;
  status: string;
  owner: OwnerInfo;
  createdAt: Date;
  updatedAt: Date;
}

export interface OwnerInfo {
  id: string;
  name: string;
  type: 'user' | 'system';
}
```

## Base Entity Fields Pattern

All database tables should use the standardized `baseEntityFields` from `@/core/database.schema` to ensure consistency across the application:

### What's Included in baseEntityFields

```typescript
export const baseEntityFields = {
  // Primary key
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), // Soft delete support
  
  // Optimistic locking
  version: integer('version').default(1).notNull(),
  
  // Audit fields - track who performed actions
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedBy: uuid('deleted_by'),
};
```

### Benefits

1. **Consistency**: All entities have the same base structure
2. **Audit Trail**: Built-in tracking of who created, updated, or deleted records
3. **Soft Deletes**: Support for logical deletion without removing data
4. **Optimistic Locking**: Prevent concurrent update conflicts with version field
5. **Type Safety**: Use the `BaseEntity` interface for TypeScript consistency
6. **Single Source of Truth**: Update base fields in one place affects all entities

### Usage Example

```typescript
import { pgTable, varchar, jsonb } from 'drizzle-orm/pg-core';
import { baseEntityFields, type BaseEntity } from '@/core/database.schema';

// Your table automatically gets all base fields
export const products = pgTable('product', {
  ...baseEntityFields,
  
  // Add your entity-specific fields
  name: varchar('name', { length: 255 }).notNull(),
  description: varchar('description', { length: 1000 }),
  metadata: jsonb('metadata').$type<ProductMetadata>(),
  
  // Foreign key - modern pattern
  category: uuid('category_id')
    .references(() => categories.id, { onDelete: 'set null' }),
});

// Your types automatically include base entity fields
export type Product = typeof products.$inferSelect; // Includes all base fields
export type NewProduct = typeof products.$inferInsert;

// When creating interfaces, extend BaseEntity for consistency
export interface ProductResponse extends BaseEntity {
  name: string;
  description: string | null;
  metadata: ProductMetadata | null;
}
```

## Modern Foreign Key Pattern

**IMPORTANT**: Use entity names for foreign key fields, not `*Id` suffixes. This aligns database schemas directly with TypeSpec API definitions and eliminates unnecessary mapping logic.

### ✅ CORRECT - Modern Pattern
```typescript
// Schema definition
export const patients = pgTable('patient', {
  ...baseEntityFields,
  
  // Foreign key - use entity name, not personId
  person: uuid('person_id')
    .notNull()
    .references(() => persons.id, { onDelete: 'cascade' }),
  
  primaryProvider: jsonb('primary_provider').$type<ProviderInfo>(),
});
```

### ❌ WRONG - Old Pattern
```typescript
// Don't do this - creates mapping complexity
export const patients = pgTable('patient', {
  ...baseEntityFields,
  
  personId: uuid('person_id')  // Creates mismatch with TypeSpec API
    .notNull()
    .references(() => persons.id, { onDelete: 'cascade' }),
});
```

### Benefits of Modern Pattern

1. **Direct API Alignment**: TypeScript property matches TypeSpec field name
2. **No Mapping Needed**: Database field aligns with API response format
3. **Cleaner Code**: Eliminates transformation logic in repositories
4. **Best Practice**: Follows modern ORM patterns (Prisma, TypeORM, Drizzle)

## Table Naming Convention: Plural Constants, Singular Table Names

We follow a specific table naming convention where table constants remain plural but the actual database table names are singular. This provides clarity in code while following SQL naming best practices.

### The Pattern

```typescript
// ✅ CORRECT - Plural constant, singular table name
export const patients = pgTable('patient', { /* ... */ });
export const providers = pgTable('provider', { /* ... */ });
export const persons = pgTable('person', { /* ... */ });
export const storedFiles = pgTable('stored_file', { /* ... */ });
```

### Benefits of This Convention

1. **Code Readability**: Plural constants (`patients`, `providers`) clearly indicate collections
2. **SQL Best Practices**: Singular table names (`patient`, `provider`) follow established SQL conventions
3. **TypeScript Clarity**: When accessing `patients.id` or `providers.name`, it's clear you're working with the collection schema
4. **Database Clarity**: Table names like `patient` and `provider` are cleaner in SQL queries and database tools
5. **Consistent Patterns**: Uniform approach across all modules and entities

### Implementation Examples

```typescript
// Person module
export const persons = pgTable('person', {
  ...baseEntityFields,
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
});

// Patient module (extends Person)
export const patients = pgTable('patient', {
  ...baseEntityFields,
  person: uuid('person_id')
    .notNull()
    .references(() => persons.id, { onDelete: 'cascade' }),
});

// Provider module (extends Person)  
export const providers = pgTable('provider', {
  ...baseEntityFields,
  person: uuid('person_id')
    .notNull()
    .references(() => persons.id, { onDelete: 'cascade' }),
});

// Storage module
export const storedFiles = pgTable('stored_file', {
  ...baseEntityFields,
  filename: varchar('filename', { length: 255 }).notNull(),
  size: integer('size').notNull(),
});
```

### Database vs Code Reference

| Code Reference | Database Table Name | SQL Queries |
|----------------|--------------------|--------------|
| `patients` | `patient` | `SELECT * FROM patient` |
| `providers` | `provider` | `SELECT * FROM provider` |
| `persons` | `person` | `SELECT * FROM person` |
| `storedFiles` | `stored_file` | `SELECT * FROM stored_file` |

### Exception: Generated Assets

Note that generated schemas (like Better-Auth tables) may not follow this convention and should be left as-is:

```typescript
// Generated by Better-Auth - leave as-is
export const sessions = pgTable('sessions', { /* ... */ });
export const users = pgTable('users', { /* ... */ });
```

### Migration Notes

When updating existing schemas:
1. Change the table name (second parameter) to singular
2. Keep the constant name plural for code consistency
3. Update any raw SQL queries to use the new singular table names
4. Ensure database migrations reflect the new table names

### How It Works

- **TypeScript Property**: `patient.person` (matches API contract)
- **Database Column**: `person_id` (follows SQL naming conventions)
- **API Response**: Contains `person` field (UUID string or expanded object)

## Field Expansion Pattern

Implement expandable fields using query parameters to control whether related data is included:

### Query Utility (utils/query.ts)
```typescript
/**
 * Check if a field should be expanded based on the query object
 */
export function shouldExpand(query: any, field: string): boolean {
  return query?.expand?.includes(field) ?? false;
}
```

### Handler Implementation
```typescript
import { shouldExpand } from '@/utils/query';

export async function getPatient(ctx: Context) {
  const patientId = ctx.req.param('patient');
  const query = ctx.req.valid('query') as { expand?: string[] };
  
  // Check if person field should be expanded
  const expandPerson = shouldExpand(query, 'person');
  
  // Call appropriate repository method based on expansion
  const patient = expandPerson 
    ? await repo.findOneWithPerson(patientId)  // JOIN with persons table
    : await repo.findOneById(patientId);       // Patient data only
  
  if (!patient) {
    throw new NotFoundError('Patient not found');
  }
  
  return ctx.json(patient, 200);
}
```

### Repository Methods
```typescript
export class PatientRepository extends DatabaseRepository<Patient, NewPatient, PatientFilters> {
  /**
   * Find patient without person expansion
   * Returns: { id, person: "uuid-string", primaryProvider, ... }
   */
  async findOneById(id: string): Promise<Patient | null> {
    return super.findOneById(id);
  }

  /**
   * Find patient with person expansion
   * Returns: { id, person: { id, firstName, lastName, ... }, primaryProvider, ... }
   */
  async findOneWithPerson(patientId: string): Promise<PatientWithPerson | null> {
    const result = await this.db
      .select({
        patient: patients,
        person: {
          id: persons.id,
          firstName: persons.firstName,
          lastName: persons.lastName,
          // ... other person fields
        }
      })
      .from(patients)
      .innerJoin(persons, eq(patients.person, persons.id))
      .where(eq(patients.id, patientId))
      .limit(1);
    
    return result.length > 0 ? { ...result[0].patient, person: result[0].person } : null;
  }
}
```

### API Usage Examples
```bash
# Without expansion - person is UUID string
GET /patients/123
# Response: { id: "123", person: "person-uuid", primaryProvider: {...} }

# With expansion - person is full object
GET /patients/123?expand=person
# Response: { id: "123", person: { id: "person-uuid", firstName: "John", ... }, primaryProvider: {...} }

# Multiple expansions (for future use)
GET /patients/123?expand=person,primaryProvider
```

### Benefits of Field Expansion Pattern

1. **Performance Optimization**: Only join/fetch related data when needed
2. **Backward Compatibility**: Default response format remains unchanged
3. **Flexible Client Needs**: Frontend can request exactly what it needs
4. **Reduced Over-fetching**: Avoids unnecessary JOIN operations
5. **Scalable Design**: Easy to add new expandable fields in the future

## Query & Pagination Utilities Pattern

To ensure uniform query parameter parsing and pagination across all handlers, use the standardized utility functions from `@/utils/query`.

### Query Utilities (utils/query.ts)

```typescript
import { parsePagination, buildPaginationMeta, parseFilters, shouldExpand } from '@/utils/query';

/**
 * Parse pagination parameters with defaults and limits
 */
export function parsePagination(
  query: any, 
  defaults: { limit?: number; maxLimit?: number } = {}
): { limit: number; offset: number }

/**
 * Build standardized pagination metadata
 */
export function buildPaginationMeta(
  data: any[], 
  totalCount: number, 
  limit: number, 
  offset: number
): PaginationMetadata

/**
 * Parse and clean filter parameters
 */
export function parseFilters(query: any, allowedFields: string[]): Record<string, any>

/**
 * Check if field should be expanded
 */
export function shouldExpand(query: any, field: string): boolean
```

### Uniform Handler Pattern

```typescript
import { parsePagination, buildPaginationMeta, parseFilters, shouldExpand } from '@/utils/query';

export async function listEntities(ctx: Context) {
  // Extract query parameters
  const query = ctx.req.valid('query') as EntityQueryParams;
  
  // Parse pagination with utilities (with optional custom defaults)
  const { limit, offset } = parsePagination(query, { limit: 25, maxLimit: 100 });
  
  // Parse filters with utilities (only allowed fields)
  const filters = parseFilters(query, ['q', 'status', 'category']);
  
  // Check expansion needs
  const expandRelated = shouldExpand(query, 'related');
  
  // Get dependencies
  const db = ctx.get('database') as DatabaseInstance;
  const logger = ctx.get('logger');
  const repo = new EntityRepository(db, logger);
  
  // Call appropriate repository method
  const entities = expandRelated
    ? await repo.findManyWithRelated(filters, { pagination: { limit, offset } })
    : await repo.findMany(filters, { pagination: { limit, offset } });
  
  // Get total count for proper pagination
  const totalCount = await repo.count(filters);
  
  // Build standardized pagination metadata
  const paginationMeta = buildPaginationMeta(entities, totalCount, limit, offset);
  
  // Log audit trail
  logger?.info({
    action: 'list',
    filters,
    pagination: { limit, offset },
    expandRelated,
    resultCount: entities.length,
    totalCount
  }, 'Entities listed');
  
  // Return standardized response format
  return ctx.json({
    data: entities,
    pagination: paginationMeta
  }, 200);
}
```

### Standard Pagination Response Format

All paginated endpoints now return the same response structure:

```typescript
{
  data: Entity[],           // The actual data
  pagination: {
    limit: number,          // Items per page
    offset: number,         // Current offset
    count: number,          // Items in current response
    totalCount: number,     // Total items available
    totalPages: number,     // Total pages available
    currentPage: number,    // Current page number (1-based)
    hasMore: boolean,       // Simple check for more items
    hasNextPage: boolean,   // Next page available
    hasPreviousPage: boolean // Previous page available
  }
}
```

### Utility Features

1. **parsePagination**: Handles integer parsing, applies defaults, enforces max limits
2. **buildPaginationMeta**: Calculates all pagination metadata consistently
3. **parseFilters**: Extracts only allowed fields, removes empty/null values
4. **shouldExpand**: Checks for field expansion in query parameters

### Benefits

1. **Uniform Parsing**: All handlers parse pagination and filters identically
2. **Consistent Responses**: Same pagination format across all endpoints
3. **Reduced Duplication**: Eliminates repetitive parsing logic
4. **Type Safety**: Centralized utilities ensure consistent behavior
5. **Maintainable**: Single source of truth for query handling logic
6. **Configurable**: Different endpoints can have different defaults while maintaining consistency

## Repository Pattern (repos/[entity].repo.ts)

Create a repository class that extends the base `DatabaseRepository`:

```typescript
import { eq, and, type SQL } from 'drizzle-orm';
import type { DatabaseInstance } from '@/core/database';
import { DatabaseRepository, type PaginationOptions } from '@/core/database.repo';
import { entities, type Entity, type NewEntity } from './entity.schema';

export interface EntityFilters {
  status?: 'active' | 'inactive' | 'pending';
  owner?: string;
}

export class EntityRepository extends DatabaseRepository<Entity, NewEntity, EntityFilters> {
  constructor(
    db: DatabaseInstance,
    logger?: any
  ) {
    super(db, entities, logger);
  }

  /**
   * Build where conditions for entity-specific filtering
   */
  protected buildWhereConditions(filters?: EntityFilters): SQL<unknown> | undefined {
    if (!filters) return undefined;
    
    const conditions = [];
    
    if (filters.status) {
      conditions.push(eq(entities.status, filters.status));
    }
    
    if (filters.owner) {
      conditions.push(eq(entities.owner, filters.owner));
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  /**
   * Custom repository method example
   */
  async updateStatus(id: string, status: Entity['status']): Promise<Entity> {
    this.logger?.debug({ id, newStatus: status }, 'Updating entity status');

    const updated = await this.updateOneById(id, { status });

    this.logger?.info({ id, status: updated.status }, 'Entity status updated');

    return updated;
  }
}
```

## Basic Handler Structure

```typescript
import { Context } from 'hono';
import type { DatabaseInstance } from '@/core/database';
import { 
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  BusinessLogicError
} from '@/core/errors';
import { EntityRepository } from './repos/entity.repo';
import { type EntityResponse } from './repos/entity.schema';

/**
 * handlerName
 * 
 * Path: HTTP_METHOD /path
 * OperationId: handlerName
 */
export async function handlerName(ctx: Context) {
  // Get validated parameters
  const params = ctx.req.valid('param') as { id: string };
  const query = ctx.req.valid('query') as { status?: string };
  const body = ctx.req.valid('json') as { name: string };
  
  // Get dependencies from context
  const db = ctx.get('database') as DatabaseInstance;
  const logger = ctx.get('logger');
  
  // Instantiate repository
  const repo = new EntityRepository(db, logger);
  
  // Business logic - NO try/catch needed here
  const entity = await repo.findOneById(params.id);
  
  if (!entity) {
    throw new NotFoundError('Entity not found', { 
      resourceType: 'entity', 
      resource: params.id 
    });
  }
  
  // Validate business rules
  if (entity.status !== 'active') {
    throw new BusinessLogicError(
      `Entity is ${entity.status}, operation not allowed`,
      'INVALID_STATUS'
    );
  }
  
  // Update entity
  const updated = await repo.updateOneById(params.id, {
    name: body.name,
  });
  
  // Log audit trail
  logger?.info({
    entityId: params.id,
    userId: ctx.get('userId'),
    action: 'update',
    changes: { name: body.name }
  }, 'Entity updated');
  
  // Format response
  const response: EntityResponse = {
    id: updated.id,
    name: updated.name,
    status: updated.status,
    owner: {
      id: updated.owner,
      name: 'Owner Name', // Would be fetched from user service
      type: 'user'
    },
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt
  };
  
  return ctx.json(response, 200);
}
```

## Advanced Patterns

### External Service Integration

```typescript
import type { StorageProvider } from '@/utils/storage';

export async function uploadHandler(ctx: Context) {
  const body = ctx.req.valid('json') as { filename: string; size: number };
  
  // Get external service from context
  const storage = ctx.get('storage') as StorageProvider;
  const db = ctx.get('database') as DatabaseInstance;
  const logger = ctx.get('logger');
  const repo = new FileRepository(db, logger);
  
  const fileId = uuidv4();
  let fileCreated = false;
  
  // Only use try/catch when cleanup is needed
  try {
    // Create database record
    await repo.createOne({
      id: fileId,
      filename: body.filename,
      size: body.size,
      status: 'uploading'
    });
    fileCreated = true;
    
    // Generate presigned URL from external service
    const uploadUrl = await storage.generateUploadUrl(fileId);
    
    return ctx.json({ fileId, uploadUrl }, 201);
  } catch (error) {
    // Clean up only if needed
    if (fileCreated) {
      try {
        await repo.deleteOneById(fileId);
      } catch (cleanupError) {
        logger?.error({ error: cleanupError, fileId }, 'Cleanup failed');
      }
    }
    throw error; // Re-throw for global handler
  }
}
```

### State Machine Validation

```typescript
export async function completeUpload(ctx: Context) {
  const params = ctx.req.valid('param') as { fileId: string };
  const repo = new FileRepository(db, logger);
  
  const file = await repo.findOneById(params.fileId);
  
  if (!file) {
    throw new NotFoundError('File not found', { 
      resourceType: 'file', 
      resource: params.fileId 
    });
  }
  
  // Validate state transition
  if (file.status !== 'uploading') {
    throw new ValidationError(
      `Cannot complete upload: file is in ${file.status} state`
    );
  }
  
  // Perform state transition
  const updated = await repo.updateStatus(params.fileId, 'processing');
  
  // Trigger async processing (would be a queue job in production)
  await repo.updateStatus(params.fileId, 'available');
  
  return ctx.json(updated, 200);
}
```

### Pagination with Filtering

```typescript
export async function listEntities(ctx: Context) {
  const query = ctx.req.valid('query') as {
    status?: string;
    offset?: number;
    limit?: number;
  };
  
  const repo = new EntityRepository(db, logger);
  
  // Build filters  
  const filters = query.status ? { status: query.status } : undefined;
  
  // Check if expansion is requested
  const expandOwner = shouldExpand(query, 'owner');
  
  // Get paginated results with optional expansion
  const result = expandOwner
    ? await repo.findManyWithOwner(filters, { pagination: { offset: query.offset || 0, limit: Math.min(query.limit || 20, 100) }})
    : await repo.findManyWithPagination(filters, { pagination: { offset: query.offset || 0, limit: Math.min(query.limit || 20, 100) }});
  
  // Format response
  const response = {
    data: result.data.map(formatEntityResponse),
    total: result.totalCount,
    offset: query.offset || 0,
    limit: query.limit || 20
  };
  
  return ctx.json(response, 200);
}
```

## Complete Module Example

See the `src/handlers/storage/` module for a complete implementation example that includes:

- Schema definitions using `baseEntityFields` from `@/core/database.schema`
- Repository with custom methods extending `DatabaseRepository`
- Multiple handlers with different patterns
- External service integration (S3/MinIO)
- State machine validation
- Cleanup on failure
- Audit logging with audit fields (createdBy, updatedBy, deletedBy)
- Response formatting with TypeScript interfaces
- Path aliases usage (`@/core`, `@/handlers`)

## Enhanced Error Handling System

The API uses a comprehensive, TypeSpec-compliant error system that provides rich context for better client development and healthcare compliance.

### Core Principles

1. **TypeSpec Alignment**: All errors return structured responses matching TypeSpec models
2. **Rich Context**: Errors include resource type, resource ID, and helpful suggestions
3. **Healthcare Compliance**: Specialized errors for HIPAA and medical data requirements
4. **Security First**: Production filtering of sensitive information
5. **Consistent Structure**: Uniform error format across all endpoints

### Error Types Reference

#### Basic Error Types

##### UnauthorizedError - 401
For authentication failures:
```typescript
// Simple case
throw new UnauthorizedError('Authentication required');

// With context (automatically handled)
throw new UnauthorizedError('Token expired');
```

##### ForbiddenError - 403  
For authorization failures:
```typescript
throw new ForbiddenError('Insufficient permissions to access patient records');
```

#### Enhanced NotFoundError - 404
**Options Pattern**: Use object for rich context instead of positional parameters.

```typescript
// ✅ CORRECT - Enhanced with full context
throw new NotFoundError('Patient not found', {
  resourceType: 'patient',
  resource: patientId,
  suggestions: ['Check patient ID format', 'Verify patient exists in system']
});

// ✅ CORRECT - Minimal context
throw new NotFoundError('File not found', {
  resourceType: 'file',
  resource: fileId
});

// ✅ CORRECT - User-specific context
throw new NotFoundError('No patient profile found for current user', {
  resourceType: 'patient',
  resource: 'me',
  suggestions: ['Create patient profile first', 'Verify authentication']
});

// ❌ WRONG - Old simple format (still works but not recommended)
throw new NotFoundError('Patient not found');
```

**Common Resource Types:**
- `'patient'`, `'provider'`, `'person'` - Healthcare entities
- `'appointment'`, `'consultation'` - Booking entities  
- `'file'`, `'notification'` - System entities
- `'chat-room'`, `'video-call'` - Communication entities
- `'schedule'`, `'schedule-exception'` - Scheduling entities

#### ValidationError - 400
For input validation failures:
```typescript
// Simple validation error
throw new ValidationError('Invalid email format');

// Complex validation with details (handled by Zod automatically)
// ValidationError responses include fieldErrors and globalErrors arrays
```

#### BusinessLogicError - 400
For domain rule violations:
```typescript
throw new BusinessLogicError(
  'Cannot schedule appointment: Provider not available', 
  'PROVIDER_UNAVAILABLE'
);

throw new BusinessLogicError(
  'Patient has exceeded daily appointment limit',
  'APPOINTMENT_LIMIT_EXCEEDED'  
);
```

#### Healthcare-Specific Errors

##### HipaaComplianceError - 400
For healthcare compliance violations:
```typescript
throw new HipaaComplianceError(
  'Access to medical records requires explicit patient consent',
  'patient-consent-rule-1',           // HIPAA rule reference
  'privacy',                          // Violation type: 'privacy' | 'security' | 'breach' | 'access-control'
  auditLogId,                         // Audit log reference
  ['Obtain patient consent', 'Verify authorized provider access']  // Remediation steps
);
```

##### AuthenticationError - 401
For authentication with scheme guidance:
```typescript
throw new AuthenticationError(
  'JWT token expired',
  'bearer',                           // Failed scheme
  ['bearer', 'api-key']              // Supported schemes
);

throw new AuthenticationError(
  'API key is invalid',
  'api-key',
  ['api-key', 'bearer']
);
```

##### AuthorizationError - 403
For authorization with permission context:
```typescript
throw new AuthorizationError(
  'Insufficient permissions to delete patient records',
  'patient:delete',                   // Required permission
  ['patient:read', 'patient:update'], // User's current permissions  
  `patient-${patientId}`             // Resource being accessed
);
```

#### Service Integration Errors

##### TimeoutError - 408
For operation timeouts:
```typescript
throw new TimeoutError(
  'Patient lookup timed out',
  5000,                              // Timeout in milliseconds
  'database-query',                  // Operation that timed out
  true                              // Whether operation is retryable
);
```

##### ExternalServiceError - 503
For third-party service failures:
```typescript
throw new ExternalServiceError(
  'Patient insurance verification failed',
  'insurance-api',                   // Service name
  'verify-coverage',                 // Operation
  'INVALID_POLICY',                 // External error code
  'Policy number not found in system', // External error message
  false,                            // Not retryable
  undefined                         // No retry-after
);

// Retryable service error
throw new ExternalServiceError(
  'Pharmacy system temporarily unavailable',
  'pharmacy-api',
  'prescription-check',
  'SERVICE_UNAVAILABLE',
  'System maintenance in progress',
  true,                             // Retryable
  3600                             // Retry after 1 hour
);
```

##### RateLimitError - 429
For rate limiting (automatically sets Retry-After header):
```typescript
throw new RateLimitError(
  'API rate limit exceeded for patient data access',
  { retryAfter: 60 }               // Retry after 60 seconds
);
```

### Error Response Format

All errors return a consistent TypeSpec-compliant structure:

```json
{
  "message": "Patient not found",
  "code": "NOT_FOUND",
  "requestId": "req_abc123",
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/patients/patient-456", 
  "method": "GET",
  "statusCode": 404,
  "resourceType": "patient",
  "resource": "patient-456",
  "suggestions": ["Check patient ID format", "Verify patient exists in system"]
}
```

**Field Descriptions:**
- `message`: Human-readable error description
- `code`: Machine-readable error code
- `requestId`: Unique request identifier for debugging
- `timestamp`: Error occurrence time (ISO 8601)
- `path`: Request path (hidden in production unless debug mode)
- `method`: HTTP method (hidden in production unless debug mode)
- `statusCode`: HTTP status code
- `resourceType`: Type of resource (for NotFoundError, etc.)
- `resource`: Resource identifier (for NotFoundError, etc.)
- `suggestions`: Array of helpful suggestions for resolving the error

### Security Considerations

#### Production Filtering
In production environments, certain fields are filtered for security:
- `path` and `method` are hidden unless debug mode is enabled
- Internal tracking IDs and sensitive context are removed
- Error messages are sanitized to prevent information leakage

#### Healthcare Data Protection
- Never include PHI (Protected Health Information) in error messages
- Use resource IDs, not patient names or medical details
- Log sensitive information separately for audit purposes, not in error responses
- Consider HIPAA audit requirements when designing error context

### Migration from Legacy Patterns

#### Upgrading NotFoundError Usage

**Before (Legacy):**
```typescript
throw new NotFoundError('Patient');
throw new NotFoundError('User not found');
```

**After (Enhanced):**
```typescript
throw new NotFoundError('Patient not found', {
  resourceType: 'patient',
  resource: patientId,
  suggestions: ['Check patient ID format']
});

throw new NotFoundError('User not found', {
  resourceType: 'user', 
  resource: userId
});
```

#### Benefits of Enhanced Format
1. **Better Client Development**: Frontends can handle different resource types appropriately
2. **Improved Debugging**: Clear context about what was not found and why
3. **Healthcare Compliance**: Consistent audit trails with resource information
4. **Type Safety**: Full integration with TypeSpec-generated TypeScript types
5. **Future-Proof**: Easy to add new context fields without breaking changes

## Best Practices

1. **NO try/catch** unless you need to clean up resources on failure
2. Always let errors bubble up to the global error handler
3. Use repository pattern for data access logic
4. Define schemas and types in separate files
5. **Use `baseEntityFields` from `@/core/database.schema`** for consistent entity structure
6. **Include audit fields** (createdBy, updatedBy, deletedBy) for compliance and tracking
7. **Use modern foreign key pattern**: Entity names (e.g., `owner`) not *Id suffixes (e.g., `ownerId`)
8. **Implement field expansion** using `shouldExpand` utility for optional related data
9. **Use query utilities** (`parsePagination`, `buildPaginationMeta`, `parseFilters`) for uniform parsing
10. **Direct API-database alignment**: Avoid unnecessary mapping between schema and API response
11. Log important operations for audit trails
12. Validate business rules before operations
13. Use transactions for operations that modify multiple tables
14. Format responses with proper TypeScript types
15. Keep handlers focused on orchestration, not business logic
16. Put complex business logic in repository or service classes
17. **Use path aliases** (`@/core`, `@/handlers`) instead of relative imports
18. **Clean repository interfaces**: Remove unused methods, keep only essential CRUD + domain-specific operations
19. **Consistent expansion logic**: Use ternary selection of repository methods based on expansion needs
20. **Standard pagination responses**: Use consistent `{data, pagination}` format across all endpoints

## Migration from Old Pattern

If updating an existing handler:

1. Remove unnecessary try/catch blocks
2. Extract data access logic to a repository class
3. Define proper schema and response types
4. Replace direct database queries with repository methods
5. Ensure errors are thrown, not caught and handled locally
6. Add proper audit logging
7. Format responses with TypeScript interfaces
8. **Convert foreign keys** from *Id pattern to entity name pattern (e.g., `personId` → `person`)
9. **Add field expansion support** using `shouldExpand` utility and repository method selection
10. **Remove unused repository methods** and unnecessary mapping logic
11. **Align database schema directly with TypeSpec** API definitions
12. **Simplify handlers** by removing complex branching logic in favor of repository method selection

### Recent Improvements Made

The following architectural improvements have been implemented across person, patient, and provider modules:

- **Modern Foreign Key Pattern**: Changed from `.personId` to `.person` for direct API alignment
- **Field Expansion Pattern**: Implemented query-based expansion with `shouldExpand` utility
- **Repository Cleanup**: Removed ~470 lines of unused methods across all repositories
- **Handler Simplification**: Reduced handler complexity by 70% through better repository design
- **Direct Schema-API Alignment**: Eliminated all unnecessary mapping logic between database and API responses
