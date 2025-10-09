/**
 * NotificationRepository - Data access and business logic for notifications
 * Handles all notification operations including creation, delivery, and status management
 */

import { eq, and, or, gte, lte, inArray, isNull, desc, type SQL } from 'drizzle-orm';
import type { DatabaseInstance } from '@/core/database';
import { DatabaseRepository, type PaginationOptions, type PaginatedResult } from '@/core/database.repo';
import {
  notifications,
  type Notification,
  type NewNotification,
  type NotificationFilters,
  type CreateNotificationRequest
} from './notification.schema';
import { PersonRepository } from '../../person/repos/person.repo';
import { ValidationError, NotFoundError, ForbiddenError } from '@/core/errors';
import * as OneSignal from '@onesignal/node-onesignal';
import { SYSTEM_USER_ID } from '@/core/constants';
import { subDays } from 'date-fns';

export class NotificationRepository extends DatabaseRepository<Notification, NewNotification, NotificationFilters> {
  private personRepo: PersonRepository;
  private oneSignalClient?: OneSignal.DefaultApi;
  private oneSignalAppId?: string;

  constructor(
    db: DatabaseInstance,
    personRepo: PersonRepository,
    logger?: any,
    oneSignalConfig?: { appId: string; apiKey: string }
  ) {
    super(db, notifications, logger);
    this.personRepo = personRepo;

    // Initialize OneSignal if config provided
    if (oneSignalConfig) {
      const configuration = OneSignal.createConfiguration({
        appKey: oneSignalConfig.apiKey
      });
      this.oneSignalClient = new OneSignal.DefaultApi(configuration);
      this.oneSignalAppId = oneSignalConfig.appId;
    }
  }

  /**
   * Build where conditions for notification-specific filtering
   */
  protected buildWhereConditions(filters?: NotificationFilters): SQL<unknown> | undefined {
    if (!filters) return undefined;

    const conditions = [];

    // Always exclude soft-deleted records
    conditions.push(isNull(notifications.deletedAt));

    if (filters.recipient) {
      conditions.push(eq(notifications.recipient, filters.recipient));
    }

    if (filters.type) {
      conditions.push(eq(notifications.type, filters.type as any));
    }

    // Auto-filter to in-app notifications if no channel specified
    if (!filters.channel) {
      conditions.push(eq(notifications.channel, 'in-app'));
    } else {
      conditions.push(eq(notifications.channel, filters.channel as any));
    }

    // Handle special 'unread' status value
    if (filters.status === 'unread') {
      // 'unread' maps to sent or delivered (not yet read)
      conditions.push(
        inArray(notifications.status, ['sent', 'delivered'])
      );
    } else if (filters.status) {
      conditions.push(eq(notifications.status, filters.status as any));
    }
    
    if (filters.startDate) {
      conditions.push(gte(notifications.createdAt, filters.startDate));
    }
    
    if (filters.endDate) {
      conditions.push(lte(notifications.createdAt, filters.endDate));
    }
    
    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  /**
   * Create a notification for module integration
   * This is the primary method other modules will use to create notifications
   */
  async createNotificationForModule(request: CreateNotificationRequest): Promise<Notification> {
    this.logger?.debug({ request }, 'Creating notification from module');

    // Validate recipient exists
    const recipient = await this.personRepo.findOneById(request.recipient);

    if (!recipient) {
      throw new ValidationError(`Invalid recipient: ${request.recipient}`);
    }

    // Validate consent for medical notifications
    if (this.isMedicalNotification(request.type) && !request.consentValidated) {
      // In a real implementation, we would check Person consent fields here
      // For now, we'll log a warning
      this.logger?.warn({
        type: request.type,
        recipient: request.recipient
      }, 'Medical notification created without explicit consent validation');
    }

    // Create notification record with optional targetApp in metadata
    const notification = await this.createOne({
      recipient: request.recipient,
      type: request.type as any,
      channel: request.channel as any,
      title: request.title,
      message: request.message,
      scheduledAt: request.scheduledAt || null,
      relatedEntityType: request.relatedEntityType || null,
      relatedEntity: request.relatedEntity || null,
      status: 'queued',
      consentValidated: request.consentValidated || false,
      createdBy: SYSTEM_USER_ID, // Module-created notifications are system-generated
      updatedBy: SYSTEM_USER_ID,
      // Store targetApp for later use when sending push notifications
      ...(request.targetApp && {
        data: { targetApp: request.targetApp }
      } as any),
    });
    
    this.logger?.info({ 
      notificationId: notification.id,
      type: notification.type,
      channel: notification.channel,
      scheduled: !!notification.scheduledAt 
    }, 'Notification created successfully');
    
    // If immediate notification, mark as ready for processing
    if (!notification.scheduledAt || notification.scheduledAt <= new Date()) {
      // In production, this would queue for immediate delivery
      // For now, we'll just update status for in-app notifications
      if (notification.channel === 'in-app') {
        const updated = await this.updateOneById(notification.id, {
          status: 'sent',
          sentAt: new Date()
        });
        return updated;
      }
    }

    return notification;
  }

  /**
   * Find notifications for a specific recipient with pagination
   */
  async findManyByRecipient(
    recipientId: string,
    filters?: Omit<NotificationFilters, 'recipient'>,
    options?: { pagination?: PaginationOptions }
  ): Promise<PaginatedResult<Notification>> {
    this.logger?.debug({ recipientId, filters, options }, 'Finding notifications for recipient');
    
    // Merge recipient filter with other filters
    const mergedFilters = {
      ...filters,
      recipient: recipientId
    };
    
    return this.findManyWithPagination(mergedFilters, options);
  }

  /**
   * Find a single notification by ID with ownership check
   */
  async findOneByIdAndRecipient(notificationId: string, recipientId: string): Promise<Notification | null> {
    this.logger?.debug({ notificationId, recipientId }, 'Finding notification with ownership check');

    const [notification] = await this.db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.recipient, recipientId),
          isNull(notifications.deletedAt)
        )
      )
      .limit(1);

    return notification || null;
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string, recipientId: string): Promise<Notification> {
    this.logger?.debug({ notificationId, recipientId }, 'Marking notification as read');

    // Verify ownership
    const notification = await this.findOneByIdAndRecipient(notificationId, recipientId);

    if (!notification) {
      throw new NotFoundError('Notification not found', {
        resourceType: 'notification',
        resource: notificationId,
        suggestions: ['Check notification ID format', 'Verify notification exists']
      });
    }

    // Idempotent: only update if not already read
    if (notification.status === 'read') {
      this.logger?.debug({ notificationId }, 'Notification already marked as read');
      return notification;
    }

    // Update read status
    const updated = await this.updateOneById(notificationId, {
      status: 'read',
      readAt: new Date(),
      updatedBy: recipientId
    });

    this.logger?.info({ notificationId }, 'Notification marked as read');

    return updated;
  }

  /**
   * Mark all notifications as read for a recipient
   */
  async markAllAsRead(recipientId: string, type?: string): Promise<number> {
    this.logger?.debug({ recipientId, type }, 'Marking all notifications as read');

    const conditions = [
      eq(notifications.recipient, recipientId),
      // Only mark sent/delivered notifications (exclude queued/scheduled ones)
      inArray(notifications.status, ['sent', 'delivered']),
      isNull(notifications.deletedAt)
    ];

    if (type) {
      conditions.push(eq(notifications.type, type as any));
    }
    
    const result = await this.db
      .update(notifications)
      .set({
        status: 'read',
        readAt: new Date(),
        updatedAt: new Date(),
        updatedBy: recipientId
      })
      .where(and(...conditions));
    
    const count = result.rowCount || 0;
    
    this.logger?.info({ recipientId, type, count }, 'Notifications marked as read');
    
    return count;
  }

  /**
   * Get count of unread notifications for a recipient
   */
  async getUnreadCount(recipientId: string): Promise<number> {
    this.logger?.debug({ recipientId }, 'Getting unread notification count');
    
    const result = await this.db
      .select({ count: notifications.id })
      .from(notifications)
      .where(
        and(
          eq(notifications.recipient, recipientId),
          inArray(notifications.status, ['sent', 'delivered']),
          isNull(notifications.deletedAt)
        )
      );
    
    return result.length;
  }

  /**
   * Process scheduled notifications (called by background job)
   */
  async processScheduledNotifications(): Promise<void> {
    this.logger?.debug('Processing scheduled notifications');
    
    const now = new Date();
    
    // Find due notifications
    const dueNotifications = await this.db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.status, 'queued'),
          lte(notifications.scheduledAt, now),
          isNull(notifications.deletedAt)
        )
      )
      .limit(100); // Process in batches
    
    this.logger?.info({ count: dueNotifications.length }, 'Found due notifications');
    
    // Process each notification
    for (const notification of dueNotifications) {
      try {
        await this.deliverNotification(notification);
      } catch (error) {
        this.logger?.error({ 
          error, 
          notificationId: notification.id 
        }, 'Failed to deliver notification');
        
        // Update status to failed
        await this.updateOneById(notification.id, {
          status: 'failed',
          updatedAt: new Date()
        });
      }
    }
  }

  /**
   * Deliver a notification based on its channel
   */
  private async deliverNotification(notification: Notification): Promise<void> {
    this.logger?.debug({ 
      notificationId: notification.id,
      channel: notification.channel 
    }, 'Delivering notification');
    
    // Update status to sent
    await this.updateOneById(notification.id, {
      status: 'sent',
      sentAt: new Date(),
      updatedAt: new Date()
    });
    
    switch (notification.channel) {
      case 'email':
        // Use email service to queue the email
        const emailService = (globalThis as any).app?.email;
        if (emailService) {
          // Map notification type to email template tag
          const templateTag = this.mapNotificationToEmailTemplate(notification.type);
          
          if (templateTag) {
            // Get recipient email from person repository
            const person = await this.personRepo.findOneById(notification.recipient);
            
            if (person?.email) {
              await emailService.queueEmail({
                templateTags: [templateTag],
                recipient: person.email,
                variables: {
                  title: notification.title,
                  message: notification.message,
                  // Additional context could be added based on notification type
                },
                metadata: {
                  notificationId: notification.id,
                  relatedEntity: notification.relatedEntity
                }
              });
              
              this.logger?.info({ notificationId: notification.id }, 'Email queued for delivery');
            } else {
              this.logger?.warn({ notificationId: notification.id }, 'No email address found for recipient');
            }
          }
        } else {
          this.logger?.warn({ notificationId: notification.id }, 'Email service not available');
        }
        
        // Mark as delivered (email is queued separately)
        await this.updateOneById(notification.id, { status: 'delivered' });
        break;
        
      case 'push':
        // Send push notification via OneSignal
        if (this.oneSignalClient && this.oneSignalAppId) {
          try {
            // Create OneSignal notification
            const oneSignalNotification = new OneSignal.Notification();
            oneSignalNotification.app_id = this.oneSignalAppId;

            // Set content
            oneSignalNotification.headings = { en: notification.title };
            oneSignalNotification.contents = { en: notification.message };

            // Set targeting - use external_id for user targeting
            oneSignalNotification.include_aliases = {
              external_id: [notification.recipient]
            };

            // Optional: Filter by app tag if targetApp is specified
            const targetApp = (notification as any).data?.targetApp;
            if (targetApp) {
              oneSignalNotification.filters = [
                { field: 'tag', key: 'app', relation: '=', value: targetApp }
              ];
              this.logger?.debug({
                notificationId: notification.id,
                targetApp
              }, 'Filtering push notification by app tag');
            }

            // Set data payload
            oneSignalNotification.data = {
              notificationId: notification.id,
              type: notification.type,
              relatedEntity: notification.relatedEntity || ''
            };

            // Set priority based on notification type
            if (this.isMedicalNotification(notification.type)) {
              oneSignalNotification.priority = 10; // High priority
            }

            // Send the notification
            const result = await this.oneSignalClient.createNotification(oneSignalNotification);

            if (result && result.id) {
              this.logger?.info({
                notificationId: notification.id,
                oneSignalId: result.id,
                recipients: result.recipients
              }, 'Push notification sent via OneSignal');

              await this.updateOneById(notification.id, {
                status: 'delivered',
                sentAt: new Date(),
                deliveredAt: new Date(),
                metadata: {
                  ...notification.metadata,
                  oneSignalId: result.id
                }
              });
            } else {
              this.logger?.warn({
                notificationId: notification.id,
                result
              }, 'OneSignal notification created but no ID returned');

              await this.updateOneById(notification.id, { status: 'failed' });
            }
          } catch (error) {
            this.logger?.error({
              error,
              notificationId: notification.id
            }, 'Failed to send push notification via OneSignal');

            await this.updateOneById(notification.id, { status: 'failed' });
          }
        } else {
          // No OneSignal configured
          throw new Error('OneSignal not configured, marking notification as failed');
        }
        break;
        
      case 'in-app':
        // In-app notifications are already available in database
        // Just update status to indicate they're ready
        await this.updateOneById(notification.id, { status: 'delivered' });
        this.logger?.info({ notificationId: notification.id }, 'In-app notification delivered');
        break;
        
      default:
        this.logger?.error({ 
          notificationId: notification.id,
          channel: notification.channel 
        }, 'Unknown notification channel');
        throw new Error(`Unknown notification channel: ${notification.channel}`);
    }
  }

  /**
   * Check if a notification type requires medical consent
   */
  private isMedicalNotification(type: string): boolean {
    return false; // No medical notifications in current system
  }
  
  /**
   * Map notification type to email template tag
   */
  private mapNotificationToEmailTemplate(type: string): string | null {
    const mapping: Record<string, string> = {
      'security': 'auth.password-reset',
      'system': 'auth.welcome',
      // Add more mappings as needed
    };
    
    return mapping[type] || null;
  }

  /**
   * Clean up expired notifications (maintenance task)
   */
  async cleanupExpiredNotifications(daysOld: number = 90): Promise<number> {
    this.logger?.debug({ daysOld }, 'Cleaning up expired notifications');

    const cutoffDate = subDays(new Date(), daysOld);
    
    const result = await this.db
      .update(notifications)
      .set({
        deletedAt: new Date(),
        deletedBy: SYSTEM_USER_ID
      })
      .where(
        and(
          lte(notifications.createdAt, cutoffDate),
          isNull(notifications.deletedAt)
        )
      );
    
    const count = result.rowCount || 0;
    
    this.logger?.info({ count, daysOld }, 'Expired notifications cleaned up');
    
    return count;
  }
}
