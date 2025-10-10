/**
 * Audit Module Background Jobs
 * Registers and configures audit-related background jobs
 */

import type { JobScheduler, JobContext } from '@/core/jobs';

/**
 * Register all audit module jobs with the scheduler
 */
export function registerAuditJobs(scheduler: JobScheduler): void {
  // Audit retention job - runs daily at 3 AM
  scheduler.registerCron('audit.retention', '0 3 * * *', async (context: JobContext) => {
    const { db, logger, jobId } = context;
    logger.debug('Starting audit retention job', { jobId });
    
    try {
      const { AuditRepository } = await import('../repos/audit.repo');
      const auditRepo = new AuditRepository(db, logger);
      
      // Archive logs older than 1 year (365 days)
      const archivedCount = await auditRepo.archiveOldLogs(365);
      logger.info(`Archived ${archivedCount} audit logs older than 1 year`, { jobId, archivedCount });
      
      // Purge logs older than 7 years (2555 days - HIPAA compliance)
      const purgedCount = await auditRepo.purgeArchivedLogs(2555);
      logger.info(`Purged ${purgedCount} audit logs older than 7 years`, { jobId, purgedCount });
      
      logger.info('Audit retention job completed', { jobId, archivedCount, purgedCount });
    } catch (error) {
      logger.error({ error, jobId }, 'Audit retention job failed');
      throw error;
    }
  });
}
