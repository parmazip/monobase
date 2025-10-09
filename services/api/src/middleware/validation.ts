/**
 * Custom validation middleware and error handlers
 * Ensures validation errors use TypeSpec-compliant error format
 */

import type { Context } from 'hono';
import { ZodError } from 'zod';

/**
 * Custom error handler for zValidator that throws ZodError
 * This allows our global error handler to process validation errors
 * and return them in TypeSpec-compliant format
 */
export function validationErrorHandler(result: any, c: Context) {
  if (!result.success) {
    // Extract the ZodError and throw it
    // This will bubble up to our global error handler which knows how to format it properly
    throw new ZodError(result.error.issues);
  }
}