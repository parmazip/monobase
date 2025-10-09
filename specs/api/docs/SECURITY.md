# Security System Documentation

## Overview

The Monobase Application Platform implements a comprehensive security system based on **Bearer Token Authentication** with **Role-Based Access Control (RBAC)**. This system ensures proper authorization for data access while maintaining security compliance.

## Authentication

### Bearer Token Authentication
- **Type**: JWT (JSON Web Tokens)
- **Header**: `Authorization: Bearer <token>`
- **Implementation**: All authenticated endpoints use the `@useAuth(bearerAuth)` decorator

### Token Format
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Authorization Model

### Role-Based Access Control (RBAC) with Permissions
The system implements a hierarchical role and permission system using role:permission syntax.

#### System Roles
- **user**: Base authenticated user (can create profiles)
- **admin**: System administrator with access to admin dashboards and system-wide operations  
- **support**: Support staff with read access to user data for customer service

#### Context Roles
- **patient**: User onboarded in the patient application
- **provider**: User onboarded in the provider application

#### Permissions
- **owner**: Resource ownership permission (user accessing their own data)

### Role:Permission Syntax
Role requirements are specified using the `x-security-required-roles` OpenAPI extension with the following syntax:

```typescript
// Single role requirement
@extension("x-security-required-roles", ["admin"])

// Role with permission requirement (both must be satisfied)
@extension("x-security-required-roles", ["patient:owner"])

// Multiple options (OR conditions)
@extension("x-security-required-roles", ["admin", "support", "patient:owner"])
```

**Syntax Rules:**
- `["admin"]` - Requires admin role only
- `["patient:owner"]` - Requires patient role AND owner permission
- `["admin", "provider:owner"]` - Requires admin OR (provider AND owner)
- When both role and permission are specified with ":", both conditions must be met
- Multiple array elements represent OR conditions

## Security Configuration by Module

### Person Module (`/persons`)

| Endpoint | Method | Security | Required Roles | Notes |
|----------|--------|----------|----------------|-------|
| `/persons` | POST | Bearer | user | Create own person profile |
| `/persons` | GET | Bearer | admin, support | List all persons for admin/support dashboards |
| `/persons/{person}` | GET | Bearer | admin, support, user:owner | View person details (admin/support = any, user:owner = self) |
| `/persons/{person}` | PATCH | Bearer | admin, user:owner | Update person record (admin = any, user:owner = self) |

### Patient Module (`/patients`)

| Endpoint | Method | Security | Required Roles | Notes |
|----------|--------|----------|----------------|-------|
| `/patients` | GET | Bearer | admin, support | List all patients (admin/support dashboard) |
| `/patients` | POST | Bearer | user | Create patient profile (requires user role) |
| `/patients/{patient}` | GET | Bearer | admin, support, patient:owner | View patient details (admin/support = any, patient:owner = self) |
| `/patients/{patient}` | PATCH | Bearer | admin, patient:owner | Update patient profile (admin = any, patient:owner = self) |
| `/patients/{patient}` | DELETE | Bearer | admin, patient:owner | Archive patient profile (admin = any, patient:owner = self) |

**Special Endpoint**: `/patients/me`
- Allows authenticated users to access their own patient profile
- Only available for GET operations  
- Automatically resolves to the authenticated user's resource (equivalent to owner role)

### Provider Module (`/providers`)

| Endpoint | Method | Security | Required Roles | Notes |
|----------|--------|----------|----------------|-------|
| `/providers` | GET | None | Public | Public provider directory |
| `/providers` | POST | Bearer | user | Create provider profile (requires user role) |
| `/providers/{provider}` | GET | Optional | Public | View provider profile (enhanced data when authenticated) |
| `/providers/{provider}` | PATCH | Bearer | admin, provider:owner | Update provider profile (admin = any, provider:owner = self) |
| `/providers/{provider}` | DELETE | Bearer | admin, provider:owner | Deactivate provider profile (admin = any, provider:owner = self) |

**Special Endpoint**: `/providers/me`
- Allows authenticated users to access their own provider profile
- Only available for GET operations
- Automatically resolves to the authenticated user's resource (equivalent to owner role)

## Security Patterns

### Public Endpoints
No authentication required:
- `GET /providers` - Public provider directory

### Optional Authentication Pattern
Endpoints that support both public and authenticated access:
- **Implementation**: Uses `@useAuth(bearerAuth | NoAuth)` decorator
- **Behavior**: Returns different levels of information based on authentication status
- **Use Cases**: Public profiles that provide additional details for authenticated users

#### Example: Provider Profile Access
- `GET /providers/{provider}` - Optional authentication endpoint
  - **Unauthenticated**: Returns public provider profile information
  - **Authenticated**: Returns enhanced profile with additional details
  - **Special Case**: When using `"me"` as provider ID, authentication is required

#### Key Characteristics
- Gracefully handles both authenticated and unauthenticated requests
- No authentication errors (401) for unauthenticated access
- Middleware determines data visibility based on authentication status
- Enables progressive disclosure of information

### Protected Endpoints
Require bearer token authentication with specific role:permission combinations:
- **Admin/Support-only**: System administration operations (admin dashboards, system-wide listings)  
- **Context:Owner**: Self-access operations (users managing their own resources with appropriate context role)
- **Multiple Roles**: OR conditions allowing admin/support OR context:owner access

### Self-Access Pattern (`/me`)
Special endpoints allowing users to access their own data:
- Available only for GET operations
- Uses the special path parameter value `"me"`  
- Automatically resolves to the authenticated user's resource
- Implements the owner permission pattern (user accessing their own resource)
- Equivalent to having the appropriate context:owner role combination

## Error Responses

### Authentication Errors
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid authorization header"
  }
}
```
**Status Code**: 401

### Authorization Errors
```json
{
  "error": {
    "code": "FORBIDDEN", 
    "message": "Insufficient permissions for this operation"
  }
}
```
**Status Code**: 403

## Implementation Details

### TypeSpec Security Definitions
```typescript
// security.tsp
@doc("Bearer token authentication using JWT")
model bearerAuth is Http.BearerAuth;

/**
 * Bearer authentication is used for all authenticated endpoints
 * Role requirements are specified per operation using x-security-required-roles
 * 
 * Role Syntax:
 * - ["admin"] - Requires admin role only
 * - ["patient:owner"] - Requires patient role AND owner permission
 * - ["admin", "provider:owner"] - Requires admin OR (provider AND owner)
 * 
 * The format is "role:permission" where:
 * - role: The user's role (e.g., admin, patient, provider, user, support)
 * - permission: Additional permission requirement (e.g., owner, read, write)
 * - When both are specified with ":", both conditions must be met
 * - Multiple array elements represent OR conditions
 */
```

### Operation-Level Security
```typescript
// Basic user role requirement
@doc("Create new patient. Requires 'user' role.")
@operationId("createPatient")
@post
@useAuth(bearerAuth)
@extension("x-security-required-roles", ["user"])
createPatient(@body patient: PatientCreateRequest): ...

// Context role with owner permission
@doc("Get patient profile. Requires 'admin', 'support', or 'patient:owner' role.")
@operationId("getPatient")
@get
@useAuth(bearerAuth)
@extension("x-security-required-roles", ["admin", "support", "patient:owner"])
getPatient(@path patient: UUID): ...

// Optional authentication pattern
@doc("Get provider profile. Optional authentication - returns additional details when authenticated.")
@operationId("getProvider")
@get
@useAuth(bearerAuth | NoAuth)
@route("/{provider}")
getProvider(
  @path @doc("Provider ID (UUID) or 'me' for current user's profile") provider: UUID | "me",
  @query expand?: string[]
): ...
```

### Role Assignment Logic

#### System Roles
- **user**: Base authenticated user (assigned to all authenticated users)
- **admin**: System administrator with full system privileges  
- **support**: Customer support staff with read access to user data

#### Context Roles
- **patient**: User is onboarded in the patient application
- **provider**: User is onboarded in the provider application

#### Permissions
- **owner**: User is accessing/modifying their own resource (determined by resource ownership)

### Role Context and Usage

#### Owner Permission
The owner permission is dynamically determined based on resource ownership:
- When a user accesses `/patients/{patient}`, they have owner permission only if the patient record belongs to them
- When a user accesses `/providers/{provider}`, they have owner permission only if the provider record belongs to them  
- The `/me` endpoint automatically implements owner logic by resolving to the user's own resource
- Owner permission must be combined with appropriate context role (e.g., `patient:owner`, `provider:owner`)

#### System Role Usage
- **admin**: Can access any resource and perform system administration operations
- **support**: Can read any user resource for customer service purposes
- **user**: Base role required for creating new profiles and basic operations

#### Context Role Usage
These roles indicate application onboarding status and determine available features:
- **patient**: Required for patient-specific operations (combined with owner permission for self-access)
- **provider**: Required for provider-specific operations (combined with owner permission for self-access)  
- Users may have both patient and provider roles if onboarded in both applications
- Context roles are combined with permissions using the role:permission syntax

### Middleware Implementation
The API service implements authentication middleware to:
1. Validate JWT tokens from Better-Auth
2. Extract user identity and assigned roles from the token
3. Parse and enforce role:permission combinations from `x-security-required-roles`
4. Handle special `/me` endpoint resolution (mapping to owner permission)
5. Determine resource ownership for owner permission validation
6. Support OR conditions across multiple role:permission combinations

## Compliance Considerations

### Data Security Compliance
- All sensitive data access requires authentication
- Administrative operations require admin or support roles
- Resource ownership validation through owner permission ensures data isolation
- Role:permission combinations provide fine-grained access control
- Audit trails maintained for all authenticated operations with role context

### Security Best Practices
- Bearer tokens have configurable expiration through Better-Auth
- Role:permission system follows principle of least privilege
- Owner permission ensures users can only access their own resources
- System roles (admin/support) provide necessary administration capabilities
- Context roles (patient/provider) control feature access
- Public endpoints limited to non-sensitive data only
- Self-access patterns (/me) prevent unauthorized resource access
- Multiple role options provide flexibility while maintaining security

## Better-Auth Integration

### Admin Plugin Integration
The Monobase API integrates with Better-Auth's admin plugin for user and role management:

- **User Management**: Create, update, and manage user accounts
- **Role Assignment**: Assign system roles (admin, support) and context roles 
- **Permission Management**: Configure role-based permissions and access levels
- **Session Management**: Handle user sessions and token lifecycle

### Better-Auth Admin Endpoints
Better-Auth provides dedicated admin endpoints that are merged with the TypeSpec-generated API:

```
POST /api/auth/admin/create-user     # Create user with roles
PATCH /api/auth/admin/update-user    # Update user roles and permissions
GET /api/auth/admin/list-users       # List users with role information
DELETE /api/auth/admin/delete-user   # Remove user and revoke access
```

### Role Synchronization
The API middleware synchronizes roles between Better-Auth and the TypeSpec role:permission system:

1. **JWT Token**: Contains roles assigned through Better-Auth admin
2. **Middleware Parsing**: Extracts roles and validates against endpoint requirements
3. **Dynamic Permission**: Determines owner permission based on resource ownership
4. **Access Decision**: Grants access if any role:permission combination matches

## Future Enhancements

### Planned Security Features
- Multi-factor authentication support through Better-Auth
- Enhanced token refresh mechanisms
- Additional permission types (read, write, modify)
- Resource-level permission inheritance
- Enhanced audit logging with full role context
- Role-based feature toggles for different applications
- Fine-grained admin scopes (user-admin, system-admin, etc.)
