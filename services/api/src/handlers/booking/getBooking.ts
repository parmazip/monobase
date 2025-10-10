import { Context } from 'hono';
import type { DatabaseInstance } from '@/core/database';
import type { User } from '@/types/auth';
import { 
  ForbiddenError,
  NotFoundError,
  ValidationError,
  BusinessLogicError
} from '@/core/errors';
import { BookingRepository } from './repos/booking.repo';
import { shouldExpand } from '@/utils/query';
import { checkBookingOwnership } from './utils/ownership';

/**
 * getBooking
 *
 * Path: GET /booking/bookings/{booking}
 * OperationId: getBooking
 *
 * Supports expansion: provider, client, slot
 * Role-based access: clients see own, providers see theirs, admin sees all
 */
export async function getBooking(ctx: Context) {
  // Get authenticated user from Better-Auth (guaranteed by middleware)
  const user = ctx.get('user') as User;
  
  // Extract validated parameters
  const params = ctx.req.valid('param') as { booking: string };
  const query = ctx.req.valid('query') as { expand?: string[] };
  
  // Get dependencies from context
  const db = ctx.get('database') as DatabaseInstance;
  const logger = ctx.get('logger');
  const auth = ctx.get('auth');
  
  // Instantiate repository
  const repo = new BookingRepository(db, logger);
  
  // Check expansion requirements
  const expandProvider = shouldExpand(query, 'provider');
  const expandClient = shouldExpand(query, 'client'); 
  const expandSlot = shouldExpand(query, 'slot');
  
  // Get booking (with details if any expansions requested)
  const booking = (expandProvider || expandClient || expandSlot)
    ? await repo.findWithDetails(params.booking)
    : await repo.findOneById(params.booking);
    
  if (!booking) {
    throw new NotFoundError('Booking not found', {
      resourceType: 'booking',
      resource: params.booking,
      suggestions: ['Check booking ID', 'Verify booking exists', 'Check booking status']
    });
  }
  
  // Check authorization based on ownership
  if (!(await checkBookingOwnership(db, logger, user, booking))) {
    throw new ForbiddenError('You can only access your own bookings');
  }
  
  // Log audit trail
  logger?.info({
    bookingId: booking.id,
    userId: user.id,
    expandProvider,
    expandClient,
    expandSlot,
    action: 'view_booking'
  }, 'Booking retrieved');
  
  return ctx.json(booking, 200);
}