import { Context } from 'hono';
import type { DatabaseInstance } from '@/core/database';
import type { User } from '@/types/auth';
import {
  NotFoundError,
  UnauthorizedError
} from '@/core/errors';
import { BookingEventRepository } from './repos/bookingEvent.repo';
import { TimeSlotRepository } from './repos/timeSlot.repo';

/**
 * getBookingEvent
 *
 * Path: GET /booking/events/{event}
 * OperationId: getBookingEvent
 * Security: Optional authentication (supports "me" parameter)
 */
export async function getBookingEvent(ctx: Context) {
  // Get validated parameters
  const params = ctx.req.valid('param') as { event: string };
  const query = ctx.req.valid('query') as { expand?: string };

  // Get dependencies from context
  const db = ctx.get('database') as DatabaseInstance;
  const logger = ctx.get('logger');

  // Instantiate repository
  const repo = new BookingEventRepository(db, logger);

  // Resolve "me" parameter
  let eventId = params.event;
  if (eventId === 'me') {
    const user = ctx.get('user') as User | undefined;
    if (!user) {
      throw new UnauthorizedError('Authentication required for "me" parameter');
    }

    // Find user's first event by owner
    const userEvents = await repo.findMany({ owner: user.id }, { limit: 1 });
    if (!userEvents.length) {
      throw new NotFoundError('No booking events found for current user');
    }
    eventId = userEvents[0].id;
  }

  // Find booking event (expand handled automatically by middleware)
  const event = await repo.findOneById(eventId);
  
  if (!event) {
    throw new NotFoundError('Booking event not found', {
      resourceType: 'booking_event',
      resource: params.event,
      suggestions: ['Check event ID', 'Verify event exists']
    });
  }

  // Handle custom slots expansion with time range (e.g., "slots:7d")
  // Note: Standard expands (owner, etc.) are handled by expand middleware
  let response: any = event;
  
  if (query.expand) {
    const expandFields = query.expand.split(',').map(f => f.trim());
    
    for (const field of expandFields) {
      // Support slots expansion with time range (e.g., "slots:7d")
      // This is a custom expansion that includes query parameters, so it can't use
      // the standard expand middleware which only handles simple ID expansion
      if (field.startsWith('slots')) {
        const slotRepo = new TimeSlotRepository(db, logger);
        const match = field.match(/slots:(\d+)([dhw])/);
        
        if (match) {
          const [, amount, unit] = match;
          const days = unit === 'd' ? parseInt(amount) : 
                       unit === 'w' ? parseInt(amount) * 7 : 
                       parseInt(amount) / 24;
          
          const startDate = new Date();
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + days);
          
          // Format dates as 'yyyy-MM-dd' strings for date column comparison
          const { format } = await import('date-fns');
          const startDateStr = format(startDate, 'yyyy-MM-dd');
          const endDateStr = format(endDate, 'yyyy-MM-dd');
          
          const slots = await slotRepo.findAvailableSlots(
            event.id,
            startDateStr,
            endDateStr
          );
          
          response = { ...response, slots };
        } else {
          // Support simple "slots" without time range (default to 7 days)
          const startDate = new Date();
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + 7);
          
          const { format } = await import('date-fns');
          const startDateStr = format(startDate, 'yyyy-MM-dd');
          const endDateStr = format(endDate, 'yyyy-MM-dd');
          
          const slots = await slotRepo.findAvailableSlots(
            event.id,
            startDateStr,
            endDateStr
          );
          
          response = { ...response, slots };
        }
      }
    }
  }

  // Log access (public endpoint - no user ID)
  logger?.info({
    eventId: event.id,
    action: 'view_booking_event_public',
    expand: query.expand
  }, 'Booking event retrieved (public)');

  return ctx.json(response, 200);
}
