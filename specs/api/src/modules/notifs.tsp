import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi";
import "../common/models.tsp";
import "../common/errors.tsp";
import "../common/pagination.tsp";
import "../common/security.tsp";

using TypeSpec.Http;
using TypeSpec.OpenAPI;

/**
 * Notification type enumeration - exported without namespace
 */
@doc("Type of notification")
enum NotificationType {
  @doc("Booking reminder")
  bookingReminder: "booking-reminder",
  
  @doc("Billing notification")
  billing: "billing",
  
  @doc("Security alert")
  security: "security",
  
  @doc("System notification")
  system: "system",
}

/**
 * Notification channel enumeration - exported without namespace
 */
@doc("Notification delivery channel")
enum NotificationChannel {
  @doc("Email notification")
  email: "email",
  
  @doc("Push notification")
  push: "push",
  
  @doc("In-app notification")
  inApp: "in-app",
}

/**
 * Notification status enumeration - exported without namespace
 */
@doc("Notification delivery status")
enum NotificationStatus {
  @doc("Notification queued")
  queued: "queued",

  @doc("Notification sent")
  sent: "sent",

  @doc("Notification delivered")
  delivered: "delivered",

  @doc("Notification read")
  read: "read",

  @doc("Notification failed")
  failed: "failed",

  @doc("Notification expired")
  expired: "expired",

  @doc("Filter alias: Unread notifications (maps to sent or delivered)")
  unread: "unread",
}

/**
 * Notification model - exported without namespace
 */
@doc("System notification")
model Notification extends BaseEntity {
  @doc("Recipient person ID")
  recipient: UUID;

  @doc("Notification type")
  type: NotificationType;

  @doc("Notification channel")
  channel: NotificationChannel;

  @doc("Notification title")
  @maxLength(200)
  title: string;

  @doc("Notification message")
  @maxLength(1000)
  message: string;

  @doc("Scheduled send time")
  scheduledAt?: utcDateTime;

  @doc("Related entity type")
  relatedEntityType?: string;

  @doc("Related entity reference")
  relatedEntity?: UUID;

  @doc("Notification status")
  status: NotificationStatus;

  @doc("Sent timestamp")
  sentAt?: utcDateTime;

  @doc("Read timestamp")
  readAt?: utcDateTime;

  @doc("Consent validation status")
  consentValidated: boolean;
}

// Namespace for the interface/endpoints
@tag("Notifs")
namespace Notifs {

  /**
   * Notification management interface
   */
  interface NotificationManagement {
    @doc("List user notifications with filtering and pagination.")
    @operationId("listNotifications")
    @get
    @useAuth(bearerAuth)
    @extension("x-security-required-roles", #["user", "admin"])
    listNotifications(
      @doc("Filter by notification type")
      @query type?: NotificationType,
      @doc("Filter by delivery channel (defaults to 'in-app' if not specified)")
      @query channel?: NotificationChannel,
      @doc("Filter by notification status (use 'unread' to get sent/delivered notifications)")
      @query status?: NotificationStatus,
      @doc("Start date for filtering notifications (inclusive)")
      @query startDate?: utcDateTime,
      @doc("End date for filtering notifications (inclusive)")
      @query endDate?: utcDateTime,
      ...PaginationQuery
    ): ApiOkResponse<PaginatedResponse<Notification>>
      | ApiUnauthorizedResponse
      | ApiForbiddenResponse
      | ApiRateLimitResponse;

    @doc("Get notification by ID.")
    @operationId("getNotification")
    @get
    @route("/{notif}")
    @useAuth(bearerAuth)
    @extension("x-security-required-roles", #["user", "admin"])
    getNotification(
      @path notif: UUID
    ): ApiOkResponse<Notification>
      | ApiNotFoundResponse
      | ApiUnauthorizedResponse
      | ApiForbiddenResponse;

    @doc("Mark notification as read.")
    @operationId("markNotificationAsRead")
    @post
    @route("/{notif}/read")
    @useAuth(bearerAuth)
    @extension("x-security-required-roles", #["user"])
    markNotificationAsRead(
      @path notif: UUID
    ): ApiNoContentResponse
      | ApiNotFoundResponse
      | ApiUnauthorizedResponse
      | ApiForbiddenResponse;

    @doc("Mark all notifications as read.")
    @operationId("markAllNotificationsAsRead")
    @post
    @route("/read-all")
    @useAuth(bearerAuth)
    @extension("x-security-required-roles", #["user"])
    markAllNotificationsAsRead(
      @doc("Filter by notification type to mark as read (optional - marks all types if not specified)")
      @query type?: NotificationType
    ): ApiOkResponse<{
        @doc("Number of notifications marked as read")
        markedCount: int32;
      }>
      | ApiUnauthorizedResponse
      | ApiForbiddenResponse;
  }
}
