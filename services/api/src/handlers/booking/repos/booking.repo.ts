/**
 * BookingRepository - Data access layer for bookings
 * Handles CRUD operations for booking management
 */

import { eq, and, or, gte, lte, inArray, isNull, desc, asc, type SQL } from 'drizzle-orm';
import type { DatabaseInstance } from '@/core/database';
import { DatabaseRepository, type PaginationOptions } from '@/core/database.repo';
import {
  bookings,
  timeSlots,
  type Booking,
  type NewBooking,
  type BookingCreateRequest,
  type TimeSlot
} from './booking.schema';
import { persons } from '../../person/repos/person.schema';
import { NotFoundError, ConflictError, ValidationError } from '@/core/errors';

export interface BookingFilters {
  client?: string;
  provider?: string;
  status?: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed' | 'no_show_client' | 'no_show_provider';
  dateRange?: { start: Date; end: Date };
  upcoming?: boolean;
  past?: boolean;
}

export interface BookingWithDetails extends Booking {
  clientDetails?: any;
  providerDetails?: any;
  slotDetails?: TimeSlot;
}

export class BookingRepository extends DatabaseRepository<Booking, NewBooking, BookingFilters> {  constructor(
    db: DatabaseInstance,
    logger?: any
  ) {
    super(db, bookings, logger);
  }

  /**
   * Build where conditions for booking filtering
   */
  protected buildWhereConditions(filters?: BookingFilters): SQL<unknown> | undefined {
    if (!filters) return undefined;

    const conditions = [];

    if (filters.client) {
      conditions.push(eq(bookings.client, filters.client));
    }

    if (filters.provider) {
      conditions.push(eq(bookings.provider, filters.provider));
    }

    if (filters.status) {
      conditions.push(eq(bookings.status, filters.status));
    }

    if (filters.dateRange) {
      conditions.push(
        and(
          gte(bookings.scheduledAt, filters.dateRange.start),
          lte(bookings.scheduledAt, filters.dateRange.end)
        )
      );
    }    if (filters.upcoming) {
      conditions.push(
        and(
          gte(bookings.scheduledAt, new Date()),
          inArray(bookings.status, ['pending', 'confirmed'])
        )
      );
    }

    if (filters.past) {
      conditions.push(
        or(
          lte(bookings.scheduledAt, new Date()),
          inArray(bookings.status, ['completed', 'cancelled', 'no_show_client', 'no_show_provider'])
        )
      );
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  /**
   * Create a booking with slot validation
   */
  async createBooking(
    clientId: string,
    slotId: string,
    request: BookingCreateRequest
  ): Promise<BookingWithDetails> {
    this.logger?.debug({ clientId, slotId, request }, 'Creating booking');

    // Get slot details with transaction
    const slot = await this.db.select()
      .from(timeSlots)
      .where(eq(timeSlots.id, slotId))
      .limit(1);    if (!slot[0]) {
      throw new NotFoundError('Time slot not found');
    }

    if (slot[0].status !== 'available') {
      throw new ConflictError('Time slot is not available');
    }

    // Calculate duration in minutes
    const duration = Math.floor(
      (slot[0].endTime.getTime() - slot[0].startTime.getTime()) / 60000
    );

    // Create booking
    const bookingData: NewBooking = {
      client: clientId,
      provider: slot[0].owner, // Owner of the slot is the provider
      slot: slotId,
      locationType: request.locationType || slot[0].locationTypes[0],
      reason: request.reason,
      status: 'pending',
      scheduledAt: slot[0].startTime,
      durationMinutes: duration,
      formResponses: request.formResponses
    };

    const booking = await this.createOne(bookingData);

    // Update slot status
    await this.db.update(timeSlots)
      .set({ status: 'booked', booking: booking.id })
      .where(eq(timeSlots.id, slotId));

    this.logger?.info({ bookingId: booking.id, clientId, slotId }, 'Booking created');

    return { ...booking, slotDetails: slot[0] };
  }  /**
   * Confirm a booking
   */
  async confirmBooking(bookingId: string): Promise<Booking> {
    this.logger?.debug({ bookingId }, 'Confirming booking');

    const booking = await this.updateOneById(bookingId, {
      status: 'confirmed',
      confirmationTimestamp: new Date()
    });

    this.logger?.info({ bookingId }, 'Booking confirmed');
    return booking;
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(
    bookingId: string,
    cancelledBy: 'client' | 'provider',
    reason: string
  ): Promise<Booking> {
    this.logger?.debug({ bookingId, cancelledBy, reason }, 'Cancelling booking');

    const booking = await this.findOneById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // Update booking
    const cancelled = await this.updateOneById(bookingId, {
      status: 'cancelled',
      cancelledBy,
      cancellationReason: reason,
      cancelledAt: new Date()
    });    // Free up the slot
    await this.db.update(timeSlots)
      .set({ status: 'available', booking: null })
      .where(eq(timeSlots.id, booking.slot));

    this.logger?.info({ bookingId, cancelledBy }, 'Booking cancelled');
    return cancelled;
  }

  /**
   * Get upcoming bookings for a person (as client or provider)
   */
  async getUpcomingBookings(personId: string, role: 'client' | 'provider'): Promise<Booking[]> {
    this.logger?.debug({ personId, role }, 'Getting upcoming bookings');

    const filters: BookingFilters = {
      upcoming: true
    };

    if (role === 'client') {
      filters.client = personId;
    } else {
      filters.provider = personId;
    }

    const bookings = await this.findMany(filters);

    this.logger?.debug({ personId, role, count: bookings.length }, 'Upcoming bookings retrieved');
    return bookings;
  }

  /**
   * Mark booking as no-show
   */
  async markAsNoShow(bookingId: string, markedBy: 'client' | 'provider'): Promise<Booking> {
    this.logger?.debug({ bookingId, markedBy }, 'Marking booking as no-show');

    const status = markedBy === 'client' ? 'no_show_client' : 'no_show_provider';
    
    const updated = await this.updateOneById(bookingId, {
      status,
      noShowMarkedBy: markedBy,
      noShowMarkedAt: new Date()
    });

    this.logger?.info({ bookingId, markedBy, status }, 'Booking marked as no-show');
    return updated;
  }
}