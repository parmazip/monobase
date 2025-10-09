import { Context } from 'hono';
import type { DatabaseInstance } from '@/core/database';
import {
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  BusinessLogicError
} from '@/core/errors';
import { type FileDownloadResponse, type StoredFile } from './repos/file.schema';
import type { StorageProvider } from '@/core/storage';
import { StorageFileRepository } from './repos/file.repo';
import { addMinutes } from 'date-fns';

/**
 * getFileDownload
 * 
 * Path: GET /storage/files/{fileId}/download
 * OperationId: getFileDownload
 */
export async function getFileDownload(ctx: Context) {
  // Get file ID from path parameters
  const fileId = ctx.req.param('file') as string;
  
  // Get dependencies from context
  const storage = ctx.get('storage') as StorageProvider;
  const logger = ctx.get('logger');
  const db = ctx.get('database') as DatabaseInstance;
  const repo = new StorageFileRepository(db, logger);
  
  // Get file record from database
  const file = await repo.findOneById(fileId);
  
  if (!file) {
    throw new NotFoundError('File not found', {
      resourceType: 'file',
      resource: fileId,
      suggestions: ['Check file ID', 'Verify file exists', 'Check file permissions']
    });
  }
  
  // Check if file is available
  if (file.status !== 'available') {
    throw new BusinessLogicError(`File is not available for download (status: ${file.status})`, 'FILE_NOT_AVAILABLE');
  }
  
  // Generate presigned download URL
  const downloadUrl = await storage.generateDownloadUrl(fileId);

  // Calculate expiry time (15 minutes from now)
  const expiresAt = addMinutes(new Date(), 15);
  
  // Log audit trail
  logger?.info({ 
    fileId, 
    filename: file.filename,
    userId: ctx.get('userId') || 'anonymous',
    action: 'download'
  }, 'File download requested');
  
  // Return download response with StoredFile
  const response: FileDownloadResponse = {
    downloadUrl,
    expiresAt,
    file
  };
  
  return ctx.json(response, 200);
}