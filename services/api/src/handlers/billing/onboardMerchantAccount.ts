/**
 * Onboard Merchant Account Handler
 *
 * Gets merchant onboarding URL for account setup.
 * Follows TypeSpec billing.tsp definition with current schema adaptation.
 */

import type { Context } from 'hono';
import {
  ForbiddenError,
  NotFoundError,
  BusinessLogicError,
  ExternalServiceError
} from '@/core/errors';
import type { Session } from '@/types/auth';
import { MerchantAccountRepository } from './repos/billing.repo';
import { PersonRepository } from '../person/repos/person.repo';

/**
 * onboardMerchantAccount
 *
 * Path: POST /merchant-accounts/{merchantAccount}/onboard
 * OperationId: onboardMerchantAccount
 *
 * Get merchant onboarding URL
 */
export async function onboardMerchantAccount(ctx: Context) {
  const database = ctx.get('database');
  const logger = ctx.get('logger');
  const billing = ctx.get('billing');

  // Get authenticated session (guaranteed by middleware)
  const session = ctx.get('session') as Session;
  const user = session.user;

  // Extract validated parameters
  const params = ctx.req.valid('param') as any;
  const merchantAccountId = params.merchantAccount;

  // Extract request body (redirect URLs)
  const body = ctx.req.valid('json') as any;
  const { refreshUrl, returnUrl } = body;

  logger.info({ merchantAccountId, userId: user.id, refreshUrl, returnUrl }, 'Getting merchant account onboarding URL');

  // Create repository instance
  const merchantAccountRepo = new MerchantAccountRepository(database, logger);

  // Get merchant account
  const merchantAccount = await merchantAccountRepo.findOneById(merchantAccountId);

  if (!merchantAccount) {
    throw new NotFoundError('Merchant account not found', {
      resourceType: 'merchant-account',
      resource: merchantAccountId,
      suggestions: ['Check merchant account ID format', 'Verify merchant account exists in system']
    });
  }

  // Authorization check: user must be the person who owns the merchant account
  if (merchantAccount.person !== user.id) {
    throw new ForbiddenError('You can only onboard your own merchant account');
  }

  // Business rule: account must be active
  if (!merchantAccount.active) {
    throw new BusinessLogicError(
      'Cannot onboard inactive merchant account',
      'MERCHANT_ACCOUNT_INACTIVE'
    );
  }

  try {
    // Extract Stripe account data from metadata
    const metadata = merchantAccount.metadata as any;
    let stripeAccountId = metadata?.stripeAccountId;

    // Handle missing Stripe account (imported accounts or misconfiguration)
    if (!stripeAccountId) {
      logger.warn({
        merchantAccountId,
        personId: merchantAccount.person
      }, 'Merchant account missing Stripe account - creating one now');

      // Get person data for Stripe account creation
      const personRepo = new PersonRepository(database, logger);
      const person = await personRepo.findOneById(merchantAccount.person);

      if (!person) {
        throw new NotFoundError('Person not found for merchant account', {
          resourceType: 'person',
          resource: merchantAccount.person,
          suggestions: ['Verify person exists in system']
        });
      }

      // Extract email from contactInfo JSONB field
      const email = person.contactInfo?.email;
      if (!email) {
        throw new BusinessLogicError(
          'Cannot create Stripe account: person must have an email in contact info',
          'MISSING_PERSON_EMAIL',
          {
            field: 'person.contactInfo.email',
            suggestions: ['Update person contact info with a valid email address']
          }
        );
      }

      // Extract country from primaryAddress JSONB field
      const country = person.primaryAddress?.country;
      if (!country || country.length !== 2) {
        throw new BusinessLogicError(
          'Cannot create Stripe account: person must have a valid 2-letter ISO country code in their primary address',
          'INVALID_COUNTRY_CODE',
          {
            field: 'person.primaryAddress.country',
            value: country,
            suggestions: ['Update person primary address with valid ISO 3166-1 alpha-2 country code (e.g., US, CA, GB)']
          }
        );
      }

      // Create Stripe Connect account
      const connectAccount = await billing.createConnectAccount({
        email,
        country,
        businessType: 'individual',
        refreshUrl,
        returnUrl,
        metadata: {
          personId: merchantAccount.person,
          merchantAccountId: merchantAccount.id,
          createdBy: user.id,
          createdLate: true // Audit flag for late creation
        }
      });

      // Update merchant account with Stripe data
      await merchantAccountRepo.updateOneById(merchantAccountId, {
        metadata: {
          ...metadata,
          stripeAccountId: connectAccount.accountId,
          stripeAccountStatus: 'pending',
          onboardingComplete: false,
          onboardingUrl: connectAccount.onboardingUrl,
          email,
          country,
          businessType: 'individual',
          createdAt: new Date().toISOString(),
          createdLate: true
        }
      });

      stripeAccountId = connectAccount.accountId;

      logger.info({
        merchantAccountId,
        stripeAccountId
      }, 'Created Stripe account for existing merchant account');
    }

    // Proactively check current account status from Stripe
    logger.info({ stripeAccountId }, 'Checking Stripe account status');
    const accountStatus = await billing.getConnectAccountStatus(stripeAccountId);

    // Update metadata with latest status from Stripe
    const updatedMetadata = {
      ...metadata,
      stripeAccountStatus: accountStatus.status,
      onboardingComplete: accountStatus.onboardingComplete,
      lastStatusCheck: new Date().toISOString(),
      accountChargesEnabled: accountStatus.status === 'active',
      accountPayoutsEnabled: accountStatus.status === 'active'
    };

    await merchantAccountRepo.updateOneById(merchantAccountId, {
      metadata: updatedMetadata
    });

    // Check if already onboarded
    if (accountStatus.onboardingComplete) {
      logger.info({
        merchantAccountId,
        stripeAccountId,
        status: accountStatus.status
      }, 'Merchant account already onboarded - returning dashboard URL');

      // Return dashboard URL instead of onboarding URL if available
      if (accountStatus.dashboardUrl) {
        return ctx.json({
          onboardingUrl: accountStatus.dashboardUrl,
          metadata: {
            stripeAccountId,
            stripeAccountStatus: accountStatus.status,
            onboardingComplete: true,
            alreadyComplete: true, // Flag for frontend
            isDashboard: true
          }
        }, 200);
      }
    }

    // Generate fresh onboarding link for incomplete accounts
    const onboardingLink = await billing.generateOnboardingLink(
      stripeAccountId,
      refreshUrl,
      returnUrl
    );

    logger.info({
      merchantAccountId,
      stripeAccountId,
      onboardingComplete: accountStatus.onboardingComplete,
      status: accountStatus.status
    }, 'Merchant account onboarding URL generated');

    // Format response to match TypeSpec OnboardingResponse model
    return ctx.json({
      onboardingUrl: onboardingLink.onboardingUrl,
      metadata: {
        stripeAccountId,
        stripeAccountStatus: accountStatus.status,
        onboardingComplete: accountStatus.onboardingComplete,
        requiresOnboarding: !accountStatus.onboardingComplete
      }
    }, 200);

  } catch (error) {
    logger.error({
      error,
      merchantAccountId
    }, 'Failed to generate merchant onboarding URL');

    // Check if error is due to missing Stripe configuration
    if (error instanceof Error && error.message.includes('not configured')) {
      throw new ExternalServiceError(
        'Payment provider is not configured. Please contact support.',
        'STRIPE_NOT_CONFIGURED',
        { isConfigurationError: true }
      );
    }

    if (error instanceof ForbiddenError ||
        error instanceof NotFoundError ||
        error instanceof BusinessLogicError) {
      throw error;
    }

    throw new ExternalServiceError(
      'Failed to generate merchant onboarding URL',
      'STRIPE_ONBOARDING_ERROR',
      { originalError: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}