# API Service Development Guide

This guide covers Hono API service-specific development patterns. **For shared backend patterns**, see [Root CONTRIBUTING.md](../../CONTRIBUTING.md).

## Table of Contents

1. [Service Overview](#service-overview)
2. [Handler Implementation](#handler-implementation)
3. [Database Operations](#database-operations)
4. [File Storage Patterns](#file-storage-patterns)
5. [Authentication & Authorization](#authentication--authorization)
6. [Error Handling](#error-handling)
7. [Middleware Patterns](#middleware-patterns)
8. [Quick Reference](#quick-reference)

---

## Service Overview

**Purpose**: Main Hono API service for Monobase Application Platform

**Key Technologies:**
- **Hono**: Fast web framework
- **Drizzle ORM**: Type-safe database queries
- **Better-Auth**: Authentication
- **Pino**: Structured logging
- **S3/MinIO**: File storage

**For complete backend workflow**, see [Root CONTRIBUTING.md](../../CONTRIBUTING.md).

---

## Handler Implementation

### ⚠️ CRITICAL: Code Generation

**NEVER edit generated files!** See [Root CONTRIBUTING.md > Code Generation](../../CONTRIBUTING.md#code-generation---do-not-edit).

Generated files include:
- `src/generated/openapi/` - Routes, validators, types
- `src/generated/better-auth/` - Auth schema
- `src/generated/migrations/` - Database migrations

### Handler File Structure

Handlers are organized by module and operation:

```
src/handlers/
├── person/
│   ├── createPerson.ts
│   ├── getPerson.ts
│   ├── updatePerson.ts
│   └── listPersons.ts
├── notifs/
│   ├── getNotification.ts
│   ├── listNotifications.ts
│   └── markNotificationAsRead.ts
├── comms/
│   ├── createChatRoom.ts
│   ├── sendChatMessage.ts
│   └── joinVideoCall.ts
├── email/
│   └── ...
└── storage/
    └── ...
```

### Basic Handler Pattern

```typescript
// src/handlers/person/createPerson.ts
import { Context } from 'hono';
import { db } from '@/db';
import { persons } from '@/db/schema';
import type { CreatePersonRequest, Person } from '@monobase/api-spec';

export async function createPerson(ctx: Context) {
  // Request is already validated by generated middleware
  const body = ctx.req.valid('json') as CreatePersonRequest;

  // Business logic
  const [person] = await db
    .insert(persons)
    .values({
      first_name: body.firstName,
      last_name: body.lastName,
      date_of_birth: body.dateOfBirth,
    })
    .returning();

  // Return with correct status code
  return ctx.json(person as Person, 201);
}
```

### Handler with Error Handling

```typescript
import { HTTPException } from 'hono/http-exception';

export async function getPerson(ctx: Context) {
  const { id } = ctx.req.param();

  const person = await db.query.persons.findFirst({
    where: eq(persons.id, id),
  });

  if (!person) {
    throw new HTTPException(404, {
      message: `Person ${id} not found`,
    });
  }

  return ctx.json(person);
}
```

### Handler with Transaction

```typescript
export async function createNotificationWithEmail(ctx: Context) {
  const body = ctx.req.valid('json');

  // Use transaction for atomic operations
  const result = await db.transaction(async (tx) => {
    // Create notification
    const [notification] = await tx
      .insert(notifications)
      .values(body.notification)
      .returning();

    // Create email queue item
    const [emailItem] = await tx
      .insert(emailQueue)
      .values({
        notification_id: notification.id,
        ...body.email,
      })
      .returning();

    return { notification, emailItem };
  });

  return ctx.json(result, 201);
}
```

---

## Database Operations

### Drizzle ORM Patterns

**For complete database workflow**, see [Root CONTRIBUTING.md > Database Workflow](../../CONTRIBUTING.md#database-workflow).

### Query Patterns

**Select:**
```typescript
// Find first
const person = await db.query.persons.findFirst({
  where: eq(persons.id, id),
});

// Find many
const notifications = await db.query.notifications.findMany({
  where: eq(notifications.recipient, userId),
  orderBy: [desc(notifications.created_at)],
  limit: 20,
  offset: 0,
});

// With relations
const chatRoom = await db.query.chatRooms.findFirst({
  where: eq(chatRooms.id, id),
  with: {
    messages: {
      orderBy: [desc(chatMessages.created_at)],
      limit: 50,
    },
  },
});
```

**Insert:**
```typescript
// Single insert
const [person] = await db
  .insert(persons)
  .values({
    first_name: 'John',
    last_name: 'Doe',
  })
  .returning();

// Bulk insert
const newNotifications = await db
  .insert(notifications)
  .values([
    { recipient: 'user1', type: 'info', message: 'Message 1' },
    { recipient: 'user2', type: 'info', message: 'Message 2' },
  ])
  .returning();
```

**Update:**
```typescript
// Update with conditions
const [updated] = await db
  .update(persons)
  .set({
    first_name: newFirstName,
    updated_at: new Date(),
  })
  .where(eq(persons.id, id))
  .returning();

// Partial update (only provided fields)
const updates = {
  ...(firstName && { first_name: firstName }),
  ...(lastName && { last_name: lastName }),
  updated_at: new Date(),
};

const [updated] = await db
  .update(persons)
  .set(updates)
  .where(eq(persons.id, id))
  .returning();
```

**Delete:**
```typescript
// Soft delete (recommended)
const [deleted] = await db
  .update(persons)
  .set({ deleted_at: new Date() })
  .where(eq(persons.id, id))
  .returning();

// Hard delete (use cautiously)
await db
  .delete(persons)
  .where(eq(persons.id, id));
```

### Schema Migrations

```bash
# Generate migration from schema changes
bun run db:generate

# Apply migrations
bun run db:migrate

# Open Drizzle Studio
bun run db:studio
```

**Migration files** in `src/generated/migrations/` are auto-generated. **Never edit manually!**

---

## File Storage Patterns

### S3/MinIO Operations

**Upload File:**
```typescript
import { storage } from '@/lib/storage';

export async function uploadDocument(ctx: Context) {
  const formData = await ctx.req.formData();
  const file = formData.get('file') as File;

  if (!file) {
    throw new HTTPException(400, { message: 'No file provided' });
  }

  // Upload to S3/MinIO
  const fileKey = `documents/${Date.now()}-${file.name}`;
  const buffer = await file.arrayBuffer();

  await storage.putObject({
    Bucket: process.env.STORAGE_BUCKET,
    Key: fileKey,
    Body: Buffer.from(buffer),
    ContentType: file.type,
  });

  // Save metadata to database
  const [document] = await db
    .insert(documents)
    .values({
      file_key: fileKey,
      file_name: file.name,
      content_type: file.type,
      size: file.size,
    })
    .returning();

  return ctx.json(document, 201);
}
```

**Generate Presigned URL:**
```typescript
export async function getDocumentUrl(ctx: Context) {
  const { id } = ctx.req.param();

  const document = await db.query.documents.findFirst({
    where: eq(documents.id, id),
  });

  if (!document) {
    throw new HTTPException(404, { message: 'Document not found' });
  }

  // Generate presigned URL (valid for 1 hour)
  const url = await storage.getSignedUrl('getObject', {
    Bucket: process.env.STORAGE_BUCKET,
    Key: document.file_key,
    Expires: 3600,
  });

  return ctx.json({ url });
}
```

**Delete File:**
```typescript
export async function deleteDocument(ctx: Context) {
  const { id } = ctx.req.param();

  const document = await db.query.documents.findFirst({
    where: eq(documents.id, id),
  });

  if (!document) {
    throw new HTTPException(404, { message: 'Document not found' });
  }

  // Delete from S3/MinIO
  await storage.deleteObject({
    Bucket: process.env.STORAGE_BUCKET,
    Key: document.file_key,
  });

  // Delete from database
  await db.delete(documents).where(eq(documents.id, id));

  return ctx.body(null, 204);
}
```

---

## Authentication & Authorization

### Better-Auth Integration

**Get Current User:**
```typescript
import { auth } from '@/lib/auth';

export async function getCurrentUser(ctx: Context) {
  const session = await auth.api.getSession({
    headers: ctx.req.raw.headers,
  });

  if (!session) {
    throw new HTTPException(401, { message: 'Not authenticated' });
  }

  return ctx.json(session.user);
}
```

**Require Authentication:**
```typescript
export async function protectedHandler(ctx: Context) {
  const session = await auth.api.getSession({
    headers: ctx.req.raw.headers,
  });

  if (!session) {
    throw new HTTPException(401, { message: 'Authentication required' });
  }

  // Handler logic with session.user
  return ctx.json({ message: 'Protected resource' });
}
```

**Role-Based Access:**
```typescript
export async function adminOnlyHandler(ctx: Context) {
  const session = await auth.api.getSession({
    headers: ctx.req.raw.headers,
  });

  if (!session) {
    throw new HTTPException(401, { message: 'Authentication required' });
  }

  if (session.user.role !== 'admin') {
    throw new HTTPException(403, { message: 'Admin access required' });
  }

  // Admin-only logic
  return ctx.json({ message: 'Admin resource' });
}
```

---

## Error Handling

### Standard Error Responses

```typescript
import { HTTPException } from 'hono/http-exception';

// 400 Bad Request
throw new HTTPException(400, {
  message: 'Invalid input',
  cause: validationErrors,
});

// 401 Unauthorized
throw new HTTPException(401, {
  message: 'Authentication required',
});

// 403 Forbidden
throw new HTTPException(403, {
  message: 'Insufficient permissions',
});

// 404 Not Found
throw new HTTPException(404, {
  message: 'Resource not found',
});

// 409 Conflict
throw new HTTPException(409, {
  message: 'Resource already exists',
});

// 500 Internal Server Error
throw new HTTPException(500, {
  message: 'Internal server error',
});
```

### Custom Error Handler

```typescript
// src/middleware/error.ts
import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { logger } from '@/lib/logger';

export async function errorHandler(err: Error, ctx: Context) {
  if (err instanceof HTTPException) {
    // HTTP exceptions - return as-is
    return ctx.json(
      {
        error: {
          message: err.message,
          status: err.status,
        },
      },
      err.status
    );
  }

  // Unknown errors - log and return generic message
  logger.error({ err }, 'Unhandled error');

  return ctx.json(
    {
      error: {
        message: 'Internal server error',
        status: 500,
      },
    },
    500
  );
}
```

---

## Middleware Patterns

### Logging Middleware

```typescript
// src/middleware/logger.ts
import { Context, Next } from 'hono';
import { logger } from '@/lib/logger';

export async function loggerMiddleware(ctx: Context, next: Next) {
  const start = Date.now();

  await next();

  const duration = Date.now() - start;

  logger.info({
    method: ctx.req.method,
    path: ctx.req.path,
    status: ctx.res.status,
    duration,
  });
}
```

### CORS Middleware

```typescript
// Already configured in src/index.ts
import { cors } from 'hono/cors';

app.use('/*', cors({
  origin: (origin) => {
    // CORS logic based on environment variables
    return allowedOrigin;
  },
  credentials: true,
}));
```

### Rate Limiting Middleware

```typescript
// src/middleware/rate-limit.ts
import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';

const requests = new Map<string, number[]>();

export function rateLimit(maxRequests: number, windowMs: number) {
  return async (ctx: Context, next: Next) => {
    const ip = ctx.req.header('x-forwarded-for') || 'unknown';
    const now = Date.now();

    const userRequests = requests.get(ip) || [];
    const recentRequests = userRequests.filter(
      (time) => now - time < windowMs
    );

    if (recentRequests.length >= maxRequests) {
      throw new HTTPException(429, {
        message: 'Too many requests',
      });
    }

    recentRequests.push(now);
    requests.set(ip, recentRequests);

    await next();
  };
}

// Usage
app.use('/api/*', rateLimit(100, 60000)); // 100 requests per minute
```

---

## Quick Reference

### Development Commands

```bash
cd services/api

# Development
bun run dev          # Start with hot reload
bun run build        # Build for production
bun run typecheck    # TypeScript checking
bun run lint         # Code linting

# Database
bun run db:generate  # Generate migrations
bun run db:studio    # Open Drizzle Studio

# Testing
bun test            # All tests
bun run test:unit    # Unit tests
bun run test:int     # Integration tests
bun run test:e2e     # E2E tests
```

### Before Implementing Features

**⚠️ CRITICAL**: Follow API-First workflow!

1. **Define API** in TypeSpec (`specs/api/src/modules/`)
2. **Generate** OpenAPI + types (`cd specs/api && bun run build:all`)
3. **Check generated files** in `src/generated/openapi/`
4. **Implement handler** in `src/handlers/{module}/{operation}.ts`
5. **Use generated types** for type safety
6. **Test** the endpoint

**Never edit generated files!** See [Root CONTRIBUTING.md > Code Generation](../../CONTRIBUTING.md#code-generation---do-not-edit).

### Common Patterns

**Create Resource:**
```typescript
const [created] = await db.insert(table).values(data).returning();
return ctx.json(created, 201);
```

**Get Resource:**
```typescript
const resource = await db.query.table.findFirst({ where: eq(table.id, id) });
if (!resource) throw new HTTPException(404);
return ctx.json(resource);
```

**Update Resource:**
```typescript
const [updated] = await db.update(table).set(data).where(eq(table.id, id)).returning();
return ctx.json(updated);
```

**Delete Resource:**
```typescript
await db.delete(table).where(eq(table.id, id));
return ctx.body(null, 204);
```

---

## Complete Backend Patterns

For complete details on:
- API-First Development workflow
- Code Generation rules (**CRITICAL!**)
- Module Structure Patterns
- Database Workflow
- Testing Requirements
- Coding Standards

**See**: [Root CONTRIBUTING.md](../../CONTRIBUTING.md)

---

**For TypeSpec patterns**, see [specs/api/CONTRIBUTING.md](../../specs/api/CONTRIBUTING.md)
