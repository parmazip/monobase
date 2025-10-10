/**
 * Get Merchant Account Handler
 *
 * Retrieves a merchant account by ID.
 * Follows TypeSpec billing.tsp definition with TypeSpec-aligned schema.
 */

import type { Context } from 'hono';
import { ForbiddenError, NotFoundError } from '@/core/errors';
import type { Session } from '@/types/auth';
import { MerchantAccountRepository } from './repos/billing.repo';
import { shouldExpand } from '@/utils/query';

/**
 * getMerchantAccount
 *
 * Path: GET /merchant-accounts/{merchantAccount}
 * OperationId: getMerchantAccount
 *
 * Get merchant account by ID with authorization checks
 */
export async function getMerchantAccount(ctx: Context) {
  const database = ctx.get('database');
  const logger = ctx.get('logger');

  // Get authenticated session (guaranteed by middleware)
  const session = ctx.get('session') as Session;
  const user = session.user;

  // Extract validated parameters
  const params = ctx.req.valid('param') as any;
  const query = ctx.req.valid('query') as any;

  let merchantAccountId = params.merchantAccount;

  logger.debug({ merchantAccountId, userId: user.id }, 'Getting merchant account');

  // Create repository instance
  const merchantAccountRepo = new MerchantAccountRepository(database, logger);

  // Handle special 'me' endpoint - get current user's merchant account
  if (merchantAccountId === 'me') {
    const merchantAccount = await merchantAccountRepo.findByPerson(user.id);
    if (!merchantAccount) {
      throw new NotFoundError('No merchant account found for current user', {
        resourceType: 'merchant-account',
        resource: 'me',
        suggestions: ['Create merchant account first', 'Complete merchant onboarding']
      });
    }
    merchantAccountId = merchantAccount.id;
  }

  // Check expansion needs
  const expandPerson = shouldExpand(query, 'person');

  // Get merchant account with optional expansion (TypeSpec-aligned)
  const merchantAccount = expandPerson
    ? await merchantAccountRepo.findOneWithPerson(merchantAccountId)
    : await merchantAccountRepo.findOneById(merchantAccountId);

  if (!merchantAccount) {
    throw new NotFoundError('Merchant account not found', {
      resourceType: 'merchant-account',
      resource: merchantAccountId,
      suggestions: ['Check merchant account ID format', 'Verify merchant account exists in system']
    });
  }

  // Authorization check: user must be the person who owns the merchant account
  // TODO: Add admin access check
  if (merchantAccount.person !== user.id) {
    throw new ForbiddenError('You can only access your own merchant account');
  }

  logger.info({
    merchantAccountId,
    personId: merchantAccount.person,
    metadata: merchantAccount.metadata,
    active: merchantAccount.active
  }, 'Merchant account retrieved successfully');

  // Format response to match TypeSpec MerchantAccount model
  const response = {
    id: merchantAccount.id,
    person: merchantAccount.person,
    active: merchantAccount.active,
    metadata: merchantAccount.metadata,
    createdAt: merchantAccount.createdAt.toISOString(),
    updatedAt: merchantAccount.updatedAt.toISOString(),
    version: merchantAccount.version,
    ...(expandPerson && 'person' in merchantAccount && merchantAccount.person && {
      personDetails: merchantAccount.person
    })
  };

  return ctx.json(response, 200);
}