import { Context } from 'hono';
import type { DatabaseInstance } from '@/core/database';
import { 
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  BusinessLogicError
} from '@/core/errors';
import { ProviderRepository } from './repos/provider.repo';
import { shouldExpand, parsePagination, buildPaginationMeta, parseFilters } from '@/utils/query';

/**
 * listProviders
 * 
 * Path: GET /providers
 * OperationId: listProviders
 * Security: Public endpoint - no authentication required
 */
export async function listProviders(ctx: Context) {
  // Public endpoint - no auth required
  
  // Extract validated query parameters
  const query = ctx.req.valid('query') as {
    limit?: number;
    offset?: number;
    q?: string;
    expand?: string[];
    minorAilmentsSpecialty?: string;
    minorAilmentsPracticeLocation?: string;
    languageSpoken?: string;
  };
  
  // Parse pagination with utilities
  const { limit, offset } = parsePagination(query);
  
  // Parse filters with utilities
  const filters = parseFilters(query, ['q', 'minorAilmentsSpecialty', 'minorAilmentsPracticeLocation', 'languageSpoken']);
  
  // Check if person field should be expanded
  const expandPerson = shouldExpand(query, 'person');
  
  // Get dependencies from context
  const db = ctx.get('database') as DatabaseInstance;
  const logger = ctx.get('logger');
  
  // Instantiate repository
  const repo = new ProviderRepository(db, logger);
  
  // Call the appropriate repository method
  const providers = expandPerson
    ? await repo.findManyWithPerson(filters, { pagination: { limit, offset } })
    : await repo.findMany(filters, { pagination: { limit, offset } });
  
  // Get total count for proper pagination metadata
  const totalCount = await repo.count(filters);
  
  // Build pagination metadata
  const paginationMeta = buildPaginationMeta(providers, totalCount, limit, offset);
  
  // Log audit trail
  logger?.info({
    action: 'list',
    filters,
    pagination: { limit, offset },
    expandPerson,
    resultCount: providers.length,
    totalCount,
    isPublic: true
  }, 'Providers list retrieved (public)');
  
  // Return standardized paginated response
  return ctx.json({
    data: providers,
    pagination: paginationMeta
  }, 200);
}