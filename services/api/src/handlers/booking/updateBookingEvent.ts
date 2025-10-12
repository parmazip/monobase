/**
 * Update Booking Event Handler
 * Updates an existing booking event
 */

import { Context } from 'hono';
import type { DatabaseInstance } from '@/core/database';
import type { User } from '@/types/auth';
import { BookingEventRepository } from './repos/bookingEvent.repo';
import type { BookingEventUpdateRequest } from './repos/booking.schema';
import { regenerateOwnerSlots } from './jobs/slotGenerator';

export async function updateBookingEvent(ctx: Context) {
  // Get authenticated user
  const user = ctx.get('user') as User;

  // Get path parameters and validated body
  const { event: eventId } = ctx.req.param();
  const body = ctx.req.valid('json') as BookingEventUpdateRequest;

  // Get dependencies from context
  const db = ctx.get('database') as DatabaseInstance;
  const logger = ctx.get('logger');

  const repo = new BookingEventRepository(db, logger);

  try {
    // Check ownership
    const existingEvent = await repo.findOneById(eventId);
    if (!existingEvent) {
      return ctx.json({ error: 'Booking event not found' }, 404);
    }

    if (existingEvent.owner !== user.id) {
      return ctx.json({ error: 'Access denied' }, 403);
    }

    // Validate updates
    const errors = repo.validateEventConfig(body);
    if (errors.length > 0) {
      return ctx.json({ error: 'Validation failed', details: errors }, 400);
    }

    // Update with change detection
    const { event: updatedEvent, requiresSlotRegeneration, changes } = await repo.updateWithChangeDetection(eventId, body);

    // Log audit trail with change details
    logger?.info({
      eventId: updatedEvent.id,
      ownerId: updatedEvent.owner,
      action: 'update',
      updatedBy: user.id,
      changes,
      requiresSlotRegeneration
    }, 'Booking event updated with change detection');

    // If major changes were detected, regenerate slots immediately
    if (requiresSlotRegeneration) {
      logger?.info({
        eventId: updatedEvent.id,
        ownerId: updatedEvent.owner,
        changes
      }, 'Event update requires slot regeneration - regenerating now');

      try {
        await regenerateOwnerSlots(db, updatedEvent.owner);
        logger?.info({ eventId: updatedEvent.id, ownerId: updatedEvent.owner }, 'Slots regenerated successfully');
      } catch (error) {
        // Log but don't fail the request
        logger?.error({
          eventId: updatedEvent.id,
          ownerId: updatedEvent.owner,
          error: error instanceof Error ? error.message : 'Unknown error'
        }, 'Failed to regenerate slots - will be handled by background job');
      }
    }

    return ctx.json(updatedEvent);
  } catch (error) {
    logger?.error({ error, eventId }, 'Failed to update booking event');
    return ctx.json({ error: 'Failed to update booking event' }, 500);
  }
}