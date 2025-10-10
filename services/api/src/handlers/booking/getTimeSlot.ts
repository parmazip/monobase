import { Context } from 'hono';
import type { DatabaseInstance } from '@/core/database';
import { NotFoundError } from '@/core/errors';
import { TimeSlotRepository } from './repos/timeSlot.repo';
import { BookingEventRepository } from './repos/bookingEvent.repo';
import { shouldExpand } from '@/utils/query';

/**
 * getTimeSlot
 *
 * Path: GET /booking/slots/{slotId}
 * OperationId: getTimeSlot
 */
export async function getTimeSlot(ctx: Context) {
  // Public endpoint - no auth required

  // Extract validated parameters
  const params = ctx.req.valid('param') as { slotId: string };
  const query = ctx.req.valid('query') as { expand?: string };

  // Get dependencies from context
  const db = ctx.get('database') as DatabaseInstance;
  const logger = ctx.get('logger');

  // Use repository pattern
  const slotRepo = new TimeSlotRepository(db, logger);

  // Find time slot
  const slot = await slotRepo.findOneById(params.slotId);

  if (!slot) {
    throw new NotFoundError('Time slot not found', {
      resourceType: 'timeSlot',
      resource: params.slotId
    });
  }

  // Build response with optional event expansion
  let response: any = { ...slot };

  // Check if event should be expanded
  if (shouldExpand(query, 'event') && slot.event) {
    const eventRepo = new BookingEventRepository(db, logger);
    const event = await eventRepo.findOneById(slot.event);
    
    if (event) {
      response.event = event;
      
      logger?.info({
        slotId: slot.id,
        eventId: event.id,
        action: 'get_slot_with_event'
      }, 'Time slot retrieved with event expansion');
    }
  }

  return ctx.json(response, 200);
}