import { Context } from 'hono';
import type { DatabaseInstance } from '@/core/database';
import type { User, Session } from '@/types/auth';
import type { EmailService } from '@/core/email';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '@/core/errors';
import { EmailTemplateRepository } from './repos/template.repo';
import type { TemplateTestResult } from './repos/email.schema';

/**
 * testEmailTemplate
 * 
 * Path: POST /email/templates/{template}/test
 * OperationId: testEmailTemplate
 */
export async function testEmailTemplate(ctx: Context) {
  // Get authenticated session from Better-Auth
  const session = ctx.get('session') as Session;

  // Get user for audit logging
  const user = ctx.get('user') as User;

  // Verify admin role is required for email template management
  const userRoles = user.role ? user.role.split(',').map(r => r.trim()) : [];
  if (!userRoles.includes('admin')) {
    throw new ForbiddenError('Admin role required for email template management');
  }
  
  // Extract validated parameters
  const params = ctx.req.valid('param') as { template: string };
  
  // Extract validated request body
  const body = ctx.req.valid('json') as {
    recipientEmail: string;
    recipientName?: string;
    variables?: Record<string, any>;
  };

  // Validate required fields
  if (!body.recipientEmail) {
    throw new ValidationError('Recipient email address is required for template testing');
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.recipientEmail)) {
    throw new ValidationError('Invalid recipient email address format');
  }
  
  // Get dependencies from context
  const db = ctx.get('database') as DatabaseInstance;
  const logger = ctx.get('logger');
  const emailService = ctx.get('email') as EmailService;

  // Instantiate repository
  const repo = new EmailTemplateRepository(db, logger);
  
  let testResult: TemplateTestResult;
  
  try {
    // Get the template first to check if it exists
    const template = await repo.getActiveTemplate(params.template);
    if (!template) {
      throw new NotFoundError('Email template not found or not active', {
        resourceType: 'emailTemplate',
        resource: params.template,
        suggestions: ['Check if the template ID is correct', 'Verify the template exists and is active']
      });
    }
    
    // Use provided variables or empty object (template validation will provide defaults)
    const testVariables = body.variables || {};

    // Include recipientName in variables if provided for personalization
    if (body.recipientName) {
      testVariables.recipientName = body.recipientName;
    }
    
    // Render the template
    const renderedContent = await repo.renderTemplate(params.template, testVariables);

    // Send actual test email using production email service
    const emailResult = await emailService.sendEmail({
      to: body.recipientEmail,
      subject: renderedContent.subject,
      html: renderedContent.bodyHtml,
      text: renderedContent.bodyText,
      // Use template settings or default from config
      from: template.fromEmail ? {
        name: template.fromName || undefined,
        email: template.fromEmail
      } : undefined,
      replyTo: template.replyToEmail ? {
        email: template.replyToEmail,
        name: template.replyToName || undefined
      } : undefined
    });

    if (emailResult.success) {
      testResult = {
        success: true,
        subject: renderedContent.subject,
        bodyHtml: renderedContent.bodyHtml,
        bodyText: renderedContent.bodyText,
        messageId: emailResult.messageId,
        provider: emailResult.provider
      };
    } else {
      testResult = {
        success: false,
        error: `Email sending failed: ${emailResult.error}`,
        subject: renderedContent.subject,
        bodyHtml: renderedContent.bodyHtml,
        bodyText: renderedContent.bodyText,
        provider: emailResult.provider
      };
    }
    
  } catch (error) {
    // Handle rendering or validation errors
    if (error instanceof ValidationError) {
      // Extract validation errors if they exist
      const validationErrors = error.message.includes('Variable validation failed') 
        ? error.message.split('Variable validation failed: ')[1]?.split(', ') 
        : [];
        
      testResult = {
        success: false,
        error: error.message,
        validationErrors: validationErrors.length > 0 ? validationErrors : [error.message],
      };
    } else {
      throw error; // Re-throw non-validation errors
    }
  }
  
  // Log comprehensive audit trail for healthcare compliance
  logger?.info({
    action: 'test_email_template',
    userId: user?.id,
    templateId: params.template,
    recipientEmail: body.recipientEmail,
    recipientName: body.recipientName,
    success: testResult.success,
    hasVariables: !!body.variables,
    messageId: testResult.messageId,
    provider: testResult.provider,
    error: testResult.error,
    timestamp: new Date().toISOString(),
    // Healthcare compliance fields
    activity: 'email_template_testing',
    resourceType: 'email_template',
    resourceId: params.template
  }, 'Email template test performed with production email service');
  
  return ctx.json(testResult, 200);
}