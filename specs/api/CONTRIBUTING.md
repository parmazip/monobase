# TypeSpec API Specification Development Guide

This guide covers TypeSpec-specific development patterns for the Monobase API specification. **For shared backend patterns**, see [Root CONTRIBUTING.md](../../CONTRIBUTING.md).

> ⚠️ **IMPORTANT FOR AI AGENTS AND DEVELOPERS**
> This is a **Bun monorepo**. Always use `bun` commands, **never** `npm` commands.
> All package scripts must be run with `bun run {script}`, not `npm run {script}`.

## Table of Contents

1. [TypeSpec Overview](#typespec-overview)
2. [Module Definition Workflow](#module-definition-workflow)
3. [Schema Design Patterns](#schema-design-patterns)
4. [API Endpoint Patterns](#api-endpoint-patterns)
5. [Validation and Constraints](#validation-and-constraints)
6. [Documentation Standards](#documentation-standards)
7. [Quick Reference](#quick-reference)

---

## TypeSpec Overview

**What is TypeSpec?**
Microsoft TypeSpec is a language for defining APIs and generating OpenAPI specifications + TypeScript types. It ensures frontend and backend share exact type definitions.

**Key Benefits:**
- Single source of truth for API contracts
- Automatic OpenAPI 3.0 generation
- TypeScript type generation for frontend/backend
- Compile-time API validation
- Better documentation

**For complete API-First workflow**, see [Root CONTRIBUTING.md > API-First Development](../../CONTRIBUTING.md#api-first-development).

---

## Module Definition Workflow

### 1. Create Module File

Modules are defined in `src/modules/{domain}.tsp`:

```typescript
// src/modules/patient.tsp
import "@typespec/http";
import "@typespec/openapi3";

using TypeSpec.Http;
using TypeSpec.OpenAPI;

@service({
  title: "Patient Management API"
})
@tag("Patient")
namespace Patients {
  // Operations and models defined here
}
```

### 2. Define Models

**Base Model Pattern:**
```typescript
@doc("Patient record in the healthcare system")
model Patient {
  @doc("Unique patient identifier")
  id: string;

  @doc("Associated person ID")
  person_id: string;

  @doc("Medical history summary")
  medical_history?: string;

  @doc("Primary care provider ID")
  primary_provider_id?: string;

  @doc("Record creation timestamp")
  created_at: utcDateTime;

  @doc("Last update timestamp")
  updated_at: utcDateTime;
}
```

**Request Model Pattern:**
```typescript
@doc("Request body for creating a patient")
model CreatePatientRequest {
  @doc("Person ID to associate with patient")
  person_id: string;

  @doc("Initial medical history")
  medical_history?: string;

  @doc("Primary care provider ID")
  primary_provider_id?: string;
}

@doc("Request body for updating a patient")
model UpdatePatientRequest {
  @doc("Updated medical history")
  medical_history?: string;

  @doc("Updated primary care provider")
  primary_provider_id?: string;
}
```

### 3. Define Operations

**CRUD Operations Pattern:**
```typescript
namespace Patients {
  @route("/patients")
  interface PatientOperations {
    @get
    @summary("List all patients")
    @doc("Retrieves a paginated list of all patients")
    listPatients(
      @query limit?: int32,
      @query offset?: int32
    ): {
      @statusCode statusCode: 200;
      @body patients: Patient[];
    };

    @post
    @summary("Create a new patient")
    @doc("Creates a new patient record")
    createPatient(
      @body request: CreatePatientRequest
    ): {
      @statusCode statusCode: 201;
      @body patient: Patient;
    };

    @get
    @summary("Get patient by ID")
    getPatient(
      @path id: string
    ): {
      @statusCode statusCode: 200;
      @body patient: Patient;
    } | {
      @statusCode statusCode: 404;
      @body error: NotFoundError;
    };

    @patch
    @summary("Update patient")
    updatePatient(
      @path id: string,
      @body request: UpdatePatientRequest
    ): {
      @statusCode statusCode: 200;
      @body patient: Patient;
    };

    @delete
    @summary("Delete patient")
    deletePatient(
      @path id: string
    ): {
      @statusCode statusCode: 204;
    };
  }
}
```

---

## Schema Design Patterns

### Nullable vs Optional Fields

**Optional (`?`)**: Field can be omitted from request/response
**Nullable (`| null`)**: Field must be present but can be `null`

```typescript
model Example {
  // Optional - can be omitted
  optional_field?: string;

  // Nullable - must be present, can be null
  nullable_field: string | null;

  // Both - can be omitted OR present as null
  both?: string | null;
}
```

### Shared Models

Define common models in `src/common/models.tsp`:

```typescript
// src/common/models.tsp
@doc("Pagination parameters")
model PaginationParams {
  @doc("Maximum number of items to return")
  @minValue(1)
  @maxValue(100)
  limit?: int32 = 20;

  @doc("Number of items to skip")
  @minValue(0)
  offset?: int32 = 0;
}

@doc("Timestamp fields for all models")
model Timestamps {
  @doc("Creation timestamp")
  created_at: utcDateTime;

  @doc("Last update timestamp")
  updated_at: utcDateTime;
}
```

### Error Models

Define standard errors in `src/common/errors.tsp`:

```typescript
// src/common/errors.tsp
@doc("Standard error response")
@error
model ApiError {
  @doc("Error code")
  code: string;

  @doc("Human-readable error message")
  message: string;

  @doc("Additional error details")
  details?: Record<unknown>;
}

@doc("Resource not found error")
model NotFoundError extends ApiError {
  code: "NOT_FOUND";
}

@doc("Validation error")
model ValidationError extends ApiError {
  code: "VALIDATION_ERROR";
  @doc("Field-specific validation errors")
  field_errors?: Record<string[]>;
}
```

---

## API Endpoint Patterns

### RESTful Conventions

Follow RESTful conventions for endpoint design:

| Method | Pattern | Purpose | Status |
|--------|---------|---------|--------|
| `GET` | `/resources` | List all | 200 |
| `GET` | `/resources/{id}` | Get one | 200, 404 |
| `POST` | `/resources` | Create | 201 |
| `PATCH` | `/resources/{id}` | Update | 200, 404 |
| `PUT` | `/resources/{id}` | Replace | 200, 404 |
| `DELETE` | `/resources/{id}` | Delete | 204, 404 |

### Query Parameters

```typescript
@get
@summary("Search patients")
searchPatients(
  @query name?: string,
  @query dob?: plainDate,
  @query provider_id?: string,
  ...PaginationParams
): {
  @statusCode statusCode: 200;
  @body results: Patient[];
};
```

### Path Parameters

```typescript
@get
@route("/patients/{patient_id}/appointments")
getPatientAppointments(
  @path patient_id: string,
  @query status?: "scheduled" | "completed" | "cancelled"
): Appointment[];
```

---

## Validation and Constraints

### String Constraints

```typescript
model Patient {
  @doc("Patient email")
  @format("email")
  email: string;

  @doc("Phone number")
  @pattern("^\\+?[1-9]\\d{1,14}$")
  phone?: string;

  @doc("Medical record number")
  @minLength(5)
  @maxLength(20)
  mrn: string;
}
```

### Numeric Constraints

```typescript
model Appointment {
  @doc("Duration in minutes")
  @minValue(15)
  @maxValue(480)
  duration_minutes: int32;

  @doc("Patient age")
  @minValue(0)
  @maxValue(150)
  age?: int32;
}
```

### Enum Patterns

```typescript
@doc("Appointment status")
enum AppointmentStatus {
  @doc("Appointment is scheduled")
  Scheduled: "scheduled",

  @doc("Appointment is completed")
  Completed: "completed",

  @doc("Appointment is cancelled")
  Cancelled: "cancelled",

  @doc("Appointment is no-show")
  NoShow: "no_show"
}

model Appointment {
  status: AppointmentStatus;
}
```

---

## Documentation Standards

### Model Documentation

**Always include:**
1. `@doc` for model description
2. `@doc` for each field
3. Examples for complex fields

```typescript
@doc("Healthcare provider in the system")
model Provider {
  @doc("Unique provider identifier")
  id: string;

  @doc("Associated person ID for demographic info")
  person_id: string;

  @doc("National Provider Identifier (NPI)")
  @pattern("^\\d{10}$")
  npi: string;

  @doc("Primary medical specialty")
  @example("Family Medicine")
  specialty: string;
}
```

### Operation Documentation

```typescript
@post
@summary("Create a new provider")
@doc("""
  Creates a new healthcare provider in the system.

  Requires:
  - Valid person_id reference
  - Unique NPI number
  - Valid medical specialty

  Returns the created provider with generated ID.
""")
createProvider(
  @body request: CreateProviderRequest
): {
  @statusCode statusCode: 201;
  @body provider: Provider;
};
```

### Tags for Organization

```typescript
@tag("Patient Management")
namespace Patients {
  // Patient operations
}

@tag("Provider Management")
namespace Providers {
  // Provider operations
}
```

---

## Quick Reference

### Development Commands

```bash
cd specs/api

# Development
bun run build          # Compile TypeSpec
bun run watch         # Watch mode

# Generation
bun run build              # Generate both OpenAPI and types
bun run build:openapi      # OpenAPI only
bun run build:types        # Types only

# Quality
bun run lint          # Validate syntax
bun run format        # Format files
bun run clean         # Clean dist/
```

### Common Decorators

| Decorator | Purpose | Example |
|-----------|---------|---------|
| `@doc` | Documentation | `@doc("User ID")` |
| `@summary` | Short description | `@summary("Create user")` |
| `@tag` | Group operations | `@tag("Users")` |
| `@route` | Endpoint path | `@route("/users")` |
| `@get/@post/@patch/@delete` | HTTP method | `@get` |
| `@path` | Path parameter | `@path id: string` |
| `@query` | Query parameter | `@query name?: string` |
| `@body` | Request body | `@body user: User` |
| `@statusCode` | HTTP status | `@statusCode statusCode: 201` |
| `@minLength/@maxLength` | String length | `@minLength(5)` |
| `@minValue/@maxValue` | Numeric range | `@minValue(0)` |
| `@pattern` | Regex validation | `@pattern("^\\d+$")` |
| `@format` | String format | `@format("email")` |

### Before Implementing

1. **Define models** in TypeSpec
2. **Run build** to generate OpenAPI + types
3. **Implement handlers** in services/api
4. **Use types** in frontend apps

### File Organization

```
src/modules/
├── identity.tsp      # Auth & users
├── person.tsp        # Demographics
├── patient.tsp       # Patient records
├── provider.tsp      # Provider records
├── booking.tsp       # Appointments
├── emr.tsp          # Medical records
└── billing.tsp       # Payments
```

---

## Complete Backend Patterns

For complete details on:
- API-First Development workflow
- Code generation rules (CRITICAL!)
- Coding standards
- Module structure patterns
- Testing requirements

**See**: [Root CONTRIBUTING.md](../../CONTRIBUTING.md)

---

**For TypeSpec syntax reference**: https://typespec.io/docs

**Last Updated**: 2025-10-02
