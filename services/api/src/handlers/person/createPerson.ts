import { Context } from 'hono';
import type { DatabaseInstance } from '@/core/database';
import type { User } from '@/types/auth';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
  BusinessLogicError,
  ConflictError
} from '@/core/errors';
import { PersonRepository } from './repos/person.repo';
import { type PersonCreateRequest } from './repos/person.schema';
import { validatedDateOfBirth } from '@/utils/date';

/**
 * createPerson
 * 
 * Path: POST /persons
 * OperationId: createPerson
 * Security: bearerAuth with role ["owner"]
 */
export async function createPerson(ctx: Context) {
  // Get authenticated user (guaranteed by auth middleware)
  const user = ctx.get('user') as User;
  
  // Get validated request body
  const body = ctx.req.valid('json') as PersonCreateRequest;
  
  // Get dependencies from context
  const db = ctx.get('database') as DatabaseInstance;
  const logger = ctx.get('logger');
  
  // Instantiate repository
  const repo = new PersonRepository(db, logger);
  
  // Check if user already has a person profile
  const existingPerson = await repo.findOneById(user.id);
  if (existingPerson) {
    throw new ConflictError('User already has a person profile');
  }
  
  // Create person record with user's ID
  const person = await repo.createOne({
    id: user.id, // Set person.id to user.id for 1:1 relationship
    firstName: body.firstName,
    lastName: body.lastName || null,
    middleName: body.middleName || null,
    dateOfBirth: body.dateOfBirth ? validatedDateOfBirth(new Date(body.dateOfBirth)) : null,
    gender: body.gender || null,
    contactInfo: body.contactInfo || null,
    primaryAddress: body.primaryAddress || null,
    languagesSpoken: body.languagesSpoken || [],
    timezone: body.timezone || null,
    createdBy: user.id // Audit trail
  });
  
  // Log audit trail
  logger?.info({
    personId: person.id,
    userId: user.id,
    action: 'create',
    email: body.contactInfo?.email,
    ipAddress: ctx.req.header('x-forwarded-for') || ctx.req.header('x-real-ip'),
    isOwner: true
  }, 'Person created for authenticated user');
  
  return ctx.json(person, 201);
}