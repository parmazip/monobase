import "@typespec/http";
import "@typespec/versioning";
import "@typespec/openapi";

import "./common/models.tsp";
import "./common/errors.tsp";
import "./common/pagination.tsp";
import "./common/security.tsp";

// Import all module definitions
// Note: identity/auth is handled by Better-Auth, not TypeSpec
import "./modules/person.tsp";
// Healthcare-specific modules (commented out for generic platform)
// import "./modules/patient.tsp";
// import "./modules/provider.tsp";
// import "./modules/emr.tsp";
// import "./modules/booking.tsp";
// import "./modules/reviews.tsp";
// import "./modules/billing.tsp";
import "./modules/audit.tsp";
import "./modules/notifs.tsp";
import "./modules/comms.tsp";
import "./modules/storage.tsp";
import "./modules/email.tsp";

using TypeSpec.Http;
using TypeSpec.Versioning;
using TypeSpec.OpenAPI;

/**
 * Monobase Application API
 * 
 * Comprehensive API for application platform.
 * Provides secure, enterprise-grade endpoints for clients, service providers,
 * and business partners.
 */
@server("https://api.example.com", "Production server")
@server("https://stg.api.example.com", "Staging server")
@versioned(Versions)
@service(#{
  title: "Monobase Application API"
})
// Tag Metadata Definitions
@tagMetadata("Person", #{
  description: "Central person management module serving as the foundation for all user types in the platform. Handles core PII (Personally Identifiable Information) with strict data protection, supporting both client and service provider roles. Manages identity verification, profile updates, consent preferences (marketing, data sharing, SMS, email), and serves as the single source of truth for user information across the platform ecosystem."
})
@tagMetadata("Audit", #{
  description: "Enterprise-grade audit logging and compliance tracking system. Records all data access, modifications, and system events with immutable audit trails. Provides detailed activity logs with user attribution, IP tracking, timestamp recording, and data change history. Supports compliance reporting, suspicious activity detection, audit log retention policies, and integration with security information and event management (SIEM) systems."
})
@tagMetadata("Notifs", #{
  description: "Multi-channel notification delivery system for user engagement and communications. Manages email, push notifications, and in-app messaging with delivery tracking. Handles booking reminders, billing notifications, security alerts, and system announcements. Provides read-only API for users with internal service-based creation."
})
@tagMetadata("Comms", #{
  description: "Communication module providing focused video call and chat functionality for professional video sessions. Features Facebook Messenger-style chat with embedded video calls, direct booking integration, immutable message history, and action-based video call management. Supports one active video call per chat room with efficient state management and WebRTC integration for secure video sessions."
})
@tagMetadata("Storage", #{
  description: "Secure document and file management system with AWS S3 integration. Handles documents, reports, files, and consent forms with encryption at rest and in transit. Provides presigned URLs for secure uploads/downloads, automatic file type validation, virus scanning, PDF generation, and retention policy enforcement with enterprise-grade access controls."
})
@tagMetadata("System", #{
  description: "System administration and monitoring endpoints for platform health and operations. Provides health checks for all system components, database connectivity monitoring, service dependency status, API version information, performance metrics, and graceful degradation handling. Includes diagnostic endpoints for troubleshooting, system configuration verification, and operational readiness checks."
})
@tagMetadata("Email", #{
  description: "Runtime-configurable email service with dynamic template management. Enables administrators to create and modify email templates without code deployments, with changes taking effect immediately. Features template tag-based referencing, Handlebars variable substitution, JSON Schema validation, multi-provider support (SMTP/Postmark), asynchronous job-based processing, and comprehensive queue management with retry logic and admin controls."
})
namespace MonobaseAPI {

  // Note: Identity/Auth endpoints are handled by Better-Auth
  // and will be merged in the final OpenAPI spec
  
  // Person Management
  @tag("Person")
  @route("/persons")
  interface PersonManagement extends PersonModule.PersonManagement {}
  
  // Audit Management
  @tag("Audit")
  @route("/audit")
  interface AuditManagement extends AuditModule.AuditManagement {}
  
  // Notification Management
  @tag("Notifs")
  @route("/notifs")
  interface NotificationManagement extends Notifs.NotificationManagement {}
  
  // Comms Management
  @tag("Comms")
  @route("/comms")
  interface CommsManagement extends CommsModule.CommsManagement {}

  // Storage Management
  @tag("Storage")
  interface StorageManagement extends StorageModule.StorageManagement {}

  // Email Management - template and queue management
  @tag("Email")
  @route("/email")
  interface EmailTemplateManagement extends EmailModule.EmailTemplateManagement {}

  @tag("Email")
  @route("/email")
  interface EmailQueueManagement extends EmailModule.EmailQueueManagement {}

}

/**
 * API versioning scheme
 */
enum Versions {
  @doc("Initial API version")
  v1: "1.0",
}

/**
 * Global security configuration
 * Uses bearer token authentication from common/security.tsp
 */
