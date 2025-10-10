/**
 * Simplified Hono types for handlers
 * Relaxed typing approach to avoid complex validation issues
 */

import { Context, Hono } from 'hono';
import type { DatabaseInstance } from '@/core/database';
import type { Logger } from '@/types/logger';
import type { User, Session, AdminLevel } from '@/types/auth';
import type { AuthInstance } from '@/core/auth';
import type { StorageProvider } from '@/core/storage';
import type { JobScheduler } from '@/core/jobs';
import type { NotificationService } from '@/core/notifs';
import type { AuditService } from '@/core/audit';
import type { EmailService } from '@/core/email';
import type { WebSocketService } from '@/core/ws';
import type { BillingService } from '@/core/billing';
import type { Config } from '@/core/config';

/**
 * Variables available in the Hono context
 * These are set by middleware and available to all handlers
 */
export type Variables = {
  requestId: string;

  // Core dependencies
  logger: Logger;
  database: DatabaseInstance;
  auth: AuthInstance;
  storage: StorageProvider;
  jobs: JobScheduler;
  notifs: NotificationService;
  audit: AuditService;
  email: EmailService;
  ws: WebSocketService;
  billing: BillingService;
  config: Config;

  // Auth context
  user?: User;
  session?: Session;
};

/**
 * Simple context type for handlers - uses 'any' to avoid typing complexity
 * In a real app you'd want stronger typing, but for generated handlers this is pragmatic
 */
export type AppContext = any;

/**
 * Unified App type that includes Hono with Variables and all attached dependencies
 * This is the complete return type of createApp function
 */
export type App = Hono<{ Variables: Variables }> & {
  logger: Logger;
  database: DatabaseInstance;
  auth: AuthInstance;
  storage: StorageProvider;
  jobs: JobScheduler;
  notifs: NotificationService;
  audit: AuditService;
  email: EmailService;
  ws: WebSocketService;
  billing: BillingService;
};
