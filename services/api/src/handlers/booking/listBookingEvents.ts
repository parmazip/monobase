/**
 * List Booking Events Handler
 * Lists all available booking events for discovery
 */

import { Context } from 'hono';
import { BookingEventRepository } from './repos/bookingEvent.repo';
import { parsePagination } from '@/utils/query';

export async function listBookingEvents(c: Context) {
  const { db } = c.var;
  const query = c.req.query();
  const { limit, offset } = parsePagination(query);

  const repo = new BookingEventRepository(db, c.var.logger);

  try {
    // Get query parameters for filtering
    const status = c.req.query('status') as 'draft' | 'active' | 'paused' | 'archived' | undefined;
    const context = c.req.query('context');
    const effectiveDate = c.req.query('effectiveDate');

    // Build filters - only show active events by default for discovery
    const filters = {
      status: status || 'active',
      context,
      effectiveDate
    };

    // Get events with pagination
    const result = await repo.findManyPaginated(filters, { limit, offset });

    return c.json(result);
  } catch (error) {
    c.var.logger?.error({ error }, 'Failed to list booking events');
    return c.json({ error: 'Failed to list booking events' }, 500);
  }
}