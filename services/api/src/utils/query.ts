/**
 * Query parameter utilities for API handlers
 */

/**
 * Check if a field should be expanded based on the query object
 * @param query - The query object from the request
 * @param field - The field name to check for expansion
 * @returns true if the field should be expanded, false otherwise
 */
export function shouldExpand(query: any, field: string): boolean {
  return query?.expand?.includes(field) ?? false;
}

/**
 * Parse pagination parameters from query with defaults and limits
 * Supports both limit/offset and page/pageSize parameter styles
 * @param query - The query object from the request
 * @param defaults - Optional defaults for limit and maxLimit
 * @returns Parsed pagination parameters
 */
export function parsePagination(
  query: any, 
  defaults: { limit?: number; maxLimit?: number } = {}
): { limit: number; offset: number } {
  const defaultLimit = defaults.limit ?? 25;
  const maxLimit = defaults.maxLimit ?? 100;
  
  // Support both parameter styles
  let limit: number;
  let offset: number;
  
  if (query?.pageSize !== undefined || query?.page !== undefined) {
    // Use page/pageSize style (1-based page numbers)
    const pageSize = Math.min(
      parseInt(query?.pageSize?.toString()) || defaultLimit,
      maxLimit
    );
    const page = Math.max(parseInt(query?.page?.toString()) || 1, 1); // Ensure page >= 1
    
    limit = pageSize;
    offset = (page - 1) * pageSize;
  } else {
    // Use limit/offset style (0-based offset)
    limit = Math.min(
      parseInt(query?.limit?.toString()) || defaultLimit,
      maxLimit
    );
    offset = Math.max(parseInt(query?.offset?.toString()) || 0, 0); // Ensure offset >= 0
  }
  
  return { limit, offset };
}

/**
 * Build pagination metadata for consistent responses
 * @param data - The returned data array
 * @param totalCount - Total number of items available
 * @param limit - Items per page
 * @param offset - Current offset
 * @returns Standard pagination metadata
 */
export function buildPaginationMeta(
  data: any[], 
  totalCount: number, 
  limit: number, 
  offset: number
) {
  const totalPages = Math.ceil(totalCount / limit);
  const currentPage = Math.floor(offset / limit) + 1;
  const hasMore = offset + limit < totalCount;
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;
  
  return {
    limit,
    offset,
    pageSize: limit, // Add pageSize for backward compatibility
    page: currentPage, // Add page alias for backward compatibility
    count: data.length,
    totalCount,
    totalPages,
    currentPage,
    hasMore,
    hasNextPage,
    hasPreviousPage
  };
}

/**
 * Parse and clean filter parameters from query
 * @param query - The query object from the request
 * @param allowedFields - Array of allowed filter field names
 * @returns Clean filters object with only allowed fields
 */
export function parseFilters(query: any, allowedFields: string[]): Record<string, any> {
  const filters: Record<string, any> = {};

  // Handle undefined or null query object
  if (!query) {
    return filters;
  }

  for (const field of allowedFields) {
    if (query[field] !== undefined && query[field] !== null && query[field] !== '') {
      filters[field] = query[field];
    }
  }

  return Object.keys(filters).length > 0 ? filters : {};
}