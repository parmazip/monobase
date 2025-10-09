/**
 * Email processor job
 * Processes pending emails from the queue
 */

import type { JobContext } from '@/core/jobs';
import type { EmailService } from '@/core/email';

/**
 * Process pending emails from the queue
 */
export async function emailProcessorJob(
  context: JobContext,
  emailService: EmailService
): Promise<void> {
  const { logger, jobId } = context;
  
  logger.debug('Starting email processor job', { jobId });
  
  try {
    await emailService.processPendingEmails();
    
    logger.debug('Email processor job completed', { jobId });
  } catch (error) {
    logger.error({ error, jobId }, 'Email processor job failed');
    throw error;
  }
}