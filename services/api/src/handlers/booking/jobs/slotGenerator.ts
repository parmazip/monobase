/**
 * Slot Generator Background Job
 * Generates booking slots from booking events on a daily basis
 */

import type { JobContext } from '@/core/jobs';
import { TimeSlotRepository } from '../repos/timeSlot.repo';
import { BookingEventRepository } from '../repos/bookingEvent.repo';
import type { BookingEvent, DailyConfig, TimeBlock, NewTimeSlot } from '../repos/booking.schema';
import { timeSlots, DayOfWeek } from '../repos/booking.schema';
import { eq, and, gte } from 'drizzle-orm';
import { addDays, startOfDay, format, getDay, eachDayOfInterval, parseISO, setHours, setMinutes, addMinutes } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';

/**
 * Configuration for slot generation job
 */
export interface SlotGeneratorConfig {
  daysToGenerate: number; // How many days ahead to generate slots (default: 30)
  batchSize: number; // Number of events to process at once (default: 10)
  retryOnError: boolean; // Whether to retry failed events (default: true)
}

const DEFAULT_CONFIG: SlotGeneratorConfig = {
  daysToGenerate: 30,
  batchSize: 10,
  retryOnError: true
};

/**
 * Daily slot generation job
 * Runs at 2 AM to generate slots for the next 30 days
 */
export async function slotGeneratorJob(context: JobContext): Promise<void> {
  const { db, logger, jobId } = context;
  const config = { ...DEFAULT_CONFIG };
  
  logger.info(`Starting slot generation job`, { jobId, config });
  
  const timeSlotRepo = new TimeSlotRepository(db, logger);
  const eventRepo = new BookingEventRepository(db, logger);
  
  try {
    // Calculate date range for slot generation
    const startDate = startOfDay(new Date());
    const endDate = addDays(startDate, config.daysToGenerate);
    
    logger.info('Slot generation date range', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      days: config.daysToGenerate
    });
    
    // Get active booking events for date range
    const activeEvents = await eventRepo.findActiveInDateRange(startDate, endDate);

    if (activeEvents.length === 0) {
      logger.warn('No active booking events found for slot generation');
      return;
    }

    logger.info(`Found ${activeEvents.length} active booking events`, {
      eventCount: activeEvents.length,
      dateRange: `${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`
    });

    // Process events and generate slots
    const results = {
      totalGenerated: 0,
      totalCreated: 0,
      totalDuplicates: 0,
      failedEvents: [] as string[],
      errors: [] as string[]
    };

    for (const event of activeEvents) {
      try {
        logger.debug(`Processing booking event ${event.id}`, {
          eventId: event.id,
          owner: event.owner,
          status: event.status
        });

        // Generate slots from this event
        const slots = await generateSlotsFromEvent(event, startDate, endDate, logger);
        results.totalGenerated += slots.length;

        if (slots.length > 0) {
          // Bulk create the slots using the repository
          const createResult = await timeSlotRepo.bulkCreateSlots(slots);
          results.totalCreated += createResult.created.length;
          results.totalDuplicates += createResult.duplicates;

          logger.info(`Completed slot generation for event ${event.id}`, {
            eventId: event.id,
            owner: event.owner,
            generated: slots.length,
            created: createResult.created.length,
            duplicates: createResult.duplicates,
            errors: createResult.errors
          });
        } else {
          logger.debug(`No slots generated for event ${event.id} - likely no enabled days in range`, {
            eventId: event.id,
            owner: event.owner
          });
        }

      } catch (error) {
        const errorMsg = `Event ${event.id} failed: ${error instanceof Error ? error.message : String(error)}`;
        results.errors.push(errorMsg);
        results.failedEvents.push(event.id);

        logger.error(`Event processing failed`, {
          eventId: event.id,
          owner: event.owner,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // Log final results
    logger.info('Slot generation job completed', {
      jobId,
      totalEvents: activeEvents.length,
      totalGenerated: results.totalGenerated,
      totalCreated: results.totalCreated,
      totalDuplicates: results.totalDuplicates,
      failedEvents: results.failedEvents.length,
      errors: results.errors.length,
      successRate: `${((activeEvents.length - results.failedEvents.length) / activeEvents.length * 100).toFixed(2)}%`
    });

    // If there were any failures, log them for investigation
    if (results.failedEvents.length > 0) {
      logger.warn('Some events failed during slot generation', {
        failedEvents: results.failedEvents,
        errors: results.errors
      });
    }

    // Clean up old slots for performance (optional)
    if (config.daysToGenerate > 7) {
      logger.info('Starting cleanup of old available slots');
      try {
        const deletedCount = await timeSlotRepo.cleanupOldAvailableSlots(30);
        logger.info(`Cleaned up ${deletedCount} old available slots`);
      } catch (cleanupError) {
        logger.warn('Old slot cleanup failed but continuing', {
          error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError)
        });
      }
    }

  } catch (error) {
    logger.error('Slot generation job failed', {
      jobId,
      error: error instanceof Error ? error.message : String(error),
      attempt: context.attempt
    });
    throw error;
  }
}

/**
 * Generate time slots from a BookingEvent
 * Processes the event's dailyConfigs and creates slots for the date range
 */
async function generateSlotsFromEvent(
  event: BookingEvent,
  startDate: Date,
  endDate: Date,
  logger?: any
): Promise<NewTimeSlot[]> {
  logger?.debug(`Generating slots from event ${event.id}`, {
    eventId: event.id,
    owner: event.owner,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  });

  const slots: NewTimeSlot[] = [];

  // Convert day numbers to DayOfWeek enum keys
  const dayMapping: Record<number, DayOfWeek> = {
    0: DayOfWeek.sun,
    1: DayOfWeek.mon,
    2: DayOfWeek.tue,
    3: DayOfWeek.wed,
    4: DayOfWeek.thu,
    5: DayOfWeek.fri,
    6: DayOfWeek.sat
  };

  // Generate slots for each day in the range
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  for (const day of days) {
    const dayOfWeek = dayMapping[getDay(day)];
    const dailyConfig = event.dailyConfigs[dayOfWeek];

    // Skip if the day is not enabled or has no config
    if (!dailyConfig || !dailyConfig.enabled || !dailyConfig.timeBlocks?.length) {
      continue;
    }

    // Check if the day falls within the event's effective date range
    const dayStr = format(day, 'yyyy-MM-dd');
    const effectiveFromStr = event.effectiveFrom instanceof Date
      ? format(event.effectiveFrom, 'yyyy-MM-dd')
      : event.effectiveFrom;
    const effectiveToStr = event.effectiveTo
      ? (event.effectiveTo instanceof Date ? format(event.effectiveTo, 'yyyy-MM-dd') : event.effectiveTo)
      : null;

    if (dayStr < effectiveFromStr || (effectiveToStr && dayStr > effectiveToStr)) {
      continue;
    }

    // Process each time block for this day
    for (const timeBlock of dailyConfig.timeBlocks) {
      const daySlots = generateSlotsFromTimeBlock(
        event,
        day,
        timeBlock,
        logger
      );
      slots.push(...daySlots);
    }
  }

  logger?.info(`Generated ${slots.length} slots from event ${event.id}`, {
    eventId: event.id,
    owner: event.owner,
    slotCount: slots.length
  });

  return slots;
}

/**
 * Generate slots from a single time block within a day
 */
function generateSlotsFromTimeBlock(
  event: BookingEvent,
  day: Date,
  timeBlock: TimeBlock,
  logger?: any
): NewTimeSlot[] {
  const slots: NewTimeSlot[] = [];
  const slotDuration = timeBlock.slotDuration || 30; // Default 30 minutes
  const bufferTime = timeBlock.bufferTime || 0; // Default 0 minutes

  // Parse start and end times
  const [startHour, startMinute] = timeBlock.startTime.split(':').map(Number);
  const [endHour, endMinute] = timeBlock.endTime.split(':').map(Number);

  // Create start and end DateTime objects in owner's timezone
  let currentTime = setMinutes(setHours(day, startHour), startMinute);
  const endTime = setMinutes(setHours(day, endHour), endMinute);

  // Generate slots within the time block
  while (currentTime < endTime) {
    const slotEndTime = addMinutes(currentTime, slotDuration);

    // Check if the slot would exceed the time block
    if (slotEndTime > endTime) {
      break;
    }

    // Convert from owner's local time to UTC for storage
    const slotStartUtc = fromZonedTime(currentTime, event.timezone);
    const slotEndUtc = fromZonedTime(slotEndTime, event.timezone);

    // Create the slot
    const slot: NewTimeSlot = {
      owner: event.owner,
      event: event.id,
      context: event.context,
      date: format(day, 'yyyy-MM-dd'),
      startTime: slotStartUtc,
      endTime: slotEndUtc,
      locationTypes: event.locationTypes,
      status: 'available',
      // Include billing override if specified in the event
      billingOverride: event.billingConfig || undefined
    };

    slots.push(slot);

    // Move to next slot (including buffer time) using immutable date-fns
    currentTime = addMinutes(slotEndTime, bufferTime);
  }

  return slots;
}

/**
 * Regenerate slots for a specific booking event owner
 * Used when schedule changes occur - now works with BookingEvent system
 */
export async function regenerateOwnerSlots(
  db: any,
  ownerId: string,
  fromDate?: Date
): Promise<void> {
  const logger = console; // Use proper logger in production

  const timeSlotRepo = new TimeSlotRepository(db, logger);
  const eventRepo = new BookingEventRepository(db, logger);

  // Use UTC date to match how effectiveFrom is stored
  // This prevents timezone mismatch when querying booking events
  const startDate = fromDate || new Date(format(new Date(), 'yyyy-MM-dd'));
  const endDate = addDays(startDate, 30);

  logger.info(`Regenerating slots for owner ${ownerId}`, {
    ownerId,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  });

  try {
    // Get active booking events for this owner within the date range
    const activeEvents = await eventRepo.findActiveInDateRange(startDate, endDate);
    const ownerEvents = activeEvents.filter(event => event.owner === ownerId);

    if (ownerEvents.length === 0) {
      logger.warn(`No active booking events found for owner ${ownerId}`);
      return;
    }

    logger.info(`Found ${ownerEvents.length} active events for owner ${ownerId}`);

    // Delete existing future available slots for this owner from the start date
    const deletedSlots = await db
      .delete(timeSlots)
      .where(
        and(
          eq(timeSlots.owner, ownerId),
          eq(timeSlots.status, 'available'),
          // Compare with DATE column using date-only string (timeSlots.date stores owner-local calendar day)
          gte(timeSlots.date, format(startDate, 'yyyy-MM-dd'))
        )
      );

    logger.info(`Deleted ${deletedSlots} existing available slots for owner ${ownerId}`);

    // Generate new slots from all active events for this owner
    const results = {
      totalGenerated: 0,
      totalCreated: 0,
      totalDuplicates: 0,
      failedEvents: [] as string[],
      errors: [] as string[]
    };

    for (const event of ownerEvents) {
      try {
        logger.debug(`Regenerating slots for event ${event.id}`, {
          eventId: event.id,
          owner: event.owner
        });

        // Generate slots from this event
        const slots = await generateSlotsFromEvent(event, startDate, endDate, logger);
        results.totalGenerated += slots.length;

        if (slots.length > 0) {
          // Bulk create the slots
          const createResult = await timeSlotRepo.bulkCreateSlots(slots);
          results.totalCreated += createResult.created.length;
          results.totalDuplicates += createResult.duplicates;

          logger.debug(`Completed slot regeneration for event ${event.id}`, {
            eventId: event.id,
            generated: slots.length,
            created: createResult.created.length,
            duplicates: createResult.duplicates
          });
        }

      } catch (error) {
        const errorMsg = `Event ${event.id} failed: ${error instanceof Error ? error.message : String(error)}`;
        results.errors.push(errorMsg);
        results.failedEvents.push(event.id);

        logger.error(`Event regeneration failed`, {
          eventId: event.id,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    logger.info(`Slot regeneration completed for owner ${ownerId}`, {
      ownerId,
      totalEvents: ownerEvents.length,
      totalGenerated: results.totalGenerated,
      totalCreated: results.totalCreated,
      totalDuplicates: results.totalDuplicates,
      failedEvents: results.failedEvents.length,
      successRate: `${((ownerEvents.length - results.failedEvents.length) / ownerEvents.length * 100).toFixed(2)}%`
    });

    if (results.failedEvents.length > 0) {
      logger.warn(`Some events failed during regeneration for owner ${ownerId}`, {
        failedEvents: results.failedEvents,
        errors: results.errors
      });
    }

  } catch (error) {
    logger.error(`Slot regeneration failed for owner ${ownerId}`, {
      ownerId,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}