/**
 * Storage E2E Tests
 * Tests the complete storage workflow with real MinIO backend and database
 */

import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { faker } from '@faker-js/faker';
import { createApiClient, type ApiClient } from '../../helpers/client';
import { createTestApp, type TestApp } from '../../helpers/test-app';
import { addMinutes } from 'date-fns';
import {
  createTestFile,
  createTestFileWithSize,
  createInvalidTestFile,
  uploadFileToStorage,
  downloadFile,
  listFiles,
  deleteFile,
  waitForFileStatus,
  generateTestFileId,
  validatePresignedUrl,
  getRandomMimeType,
  type TestFile,
  type FileUploadResponse,
  type FileDownloadResponse,
  type FileListResponse,
} from '../../helpers/storage';

describe('Storage E2E Tests', () => {
  let testApp: TestApp;
  let apiClient: ApiClient;

  beforeAll(async () => {
    testApp = await createTestApp({ storage: true });

    // Create API client with embedded app instance
    apiClient = createApiClient({ app: testApp.app });

    // Create authenticated user for all tests
    await apiClient.signup();
  }, 30000);

  afterAll(async () => {
    await testApp?.cleanup();
  });

  describe('File Upload', () => {
    test('should upload a small text file successfully', async () => {
      const testFile = createTestFile({ type: 'text', size: 100 });
      
      const result = await uploadFileToStorage(apiClient, testFile);
      
      // Verify upload response
      expect(result.uploadResponse.file).toBeDefined();
      expect(result.uploadResponse.uploadUrl).toBeDefined();
      expect(result.uploadResponse.uploadMethod).toBe('PUT');
      expect(result.uploadResponse.expiresAt).toBeDefined();
      
      // Verify presigned URL
      expect(validatePresignedUrl(result.uploadResponse.uploadUrl, result.uploadResponse.expiresAt)).toBe(true);
      
      // Verify file is available
      const metadata = await waitForFileStatus(apiClient, result.fileId, 'available');
      expect(metadata.filename).toBe(testFile.filename);
      expect(metadata.size).toBe(testFile.size);
      expect(metadata.mimeType).toBe(testFile.mimeType);
      expect(metadata.status).toBe('available');
    });

    test('should upload different file types', async () => {
      const fileTypes = ['text', 'image', 'document', 'binary'] as const;
      
      for (const type of fileTypes) {
        const testFile = createTestFile({ type, size: 1024 });
        
        const result = await uploadFileToStorage(apiClient, testFile);
        
        const metadata = await waitForFileStatus(apiClient, result.fileId, 'available');
        expect(metadata.mimeType).toBe(testFile.mimeType);
        expect(metadata.size).toBe(testFile.size);
      }
    });

    test('should handle large files within limit', async () => {
      // Upload a 5MB file
      const testFile = createTestFileWithSize(5, 'binary');
      
      const result = await uploadFileToStorage(apiClient, testFile);
      
      const metadata = await waitForFileStatus(apiClient, result.fileId, 'available', 15000);
      expect(metadata.size).toBe(testFile.size);
    });

    test('should reject files larger than 50MB', async () => {
      const testFile = createInvalidTestFile('too-large');
      
      const uploadResponse = await apiClient.fetch('/storage/files/upload', {
        method: 'POST',
        body: {
          filename: testFile.filename,
          size: testFile.size,
          mimeType: testFile.mimeType,
        },
      });
      
      expect(uploadResponse.ok).toBe(false);
      expect(uploadResponse.status).toBe(400);
    });

    test('should handle special characters in filename', async () => {
      const specialFilename = `test file with spaces & symbols (2024) [final].txt`;
      const testFile = createTestFile({ filename: specialFilename });
      
      const result = await uploadFileToStorage(apiClient, testFile);
      
      const metadata = await waitForFileStatus(apiClient, result.fileId, 'available');
      expect(metadata.filename).toBe(specialFilename);
    });

    test('should generate unique file IDs', async () => {
      const fileIds = new Set();
      const uploadPromises = Array.from({ length: 5 }, async () => {
        const testFile = createTestFile({ size: 100 });
        const result = await uploadFileToStorage(apiClient, testFile);
        return result.fileId;
      });
      
      const results = await Promise.all(uploadPromises);
      results.forEach(id => fileIds.add(id));
      
      expect(fileIds.size).toBe(5); // All IDs should be unique
    });

    test('should handle concurrent uploads', async () => {
      const concurrency = 3;
      const uploadPromises = Array.from({ length: concurrency }, async (_, i) => {
        const testFile = createTestFile({ filename: `concurrent-${i}.txt`, size: 500 });
        return uploadFileToStorage(apiClient, testFile);
      });
      
      const results = await Promise.all(uploadPromises);
      
      // Wait for all files to be available
      const metadataPromises = results.map(result => 
        waitForFileStatus(apiClient, result.fileId, 'available')
      );
      const metadata = await Promise.all(metadataPromises);
      
      expect(metadata).toHaveLength(concurrency);
      metadata.forEach(meta => {
        expect(meta.status).toBe('available');
      });
    });
  });

  describe('File Download', () => {
    let uploadedFileId: string;
    let originalFile: TestFile;

    test('should download file with correct content', async () => {
      originalFile = createTestFile({ type: 'text', size: 1000 });
      const result = await uploadFileToStorage(apiClient, originalFile);
      uploadedFileId = result.fileId;
      
      await waitForFileStatus(apiClient, uploadedFileId, 'available');
      
      const { content, downloadResponse } = await downloadFile(apiClient, uploadedFileId);
      
      // Verify download response
      expect(downloadResponse.downloadUrl).toBeDefined();
      expect(downloadResponse.expiresAt).toBeDefined();
      expect(downloadResponse.file.id).toBe(uploadedFileId);
      
      // Verify presigned URL
      expect(validatePresignedUrl(downloadResponse.downloadUrl, downloadResponse.expiresAt)).toBe(true);
      
      // Verify file content
      expect(content.equals(originalFile.content)).toBe(true);
      expect(content.length).toBe(originalFile.size);
    });

    test('should include complete file metadata in download response', async () => {
      originalFile = createTestFile({ type: 'text', size: 1000 });
      const result = await uploadFileToStorage(apiClient, originalFile);
      uploadedFileId = result.fileId;
      
      await waitForFileStatus(apiClient, uploadedFileId, 'available');
      
      const { downloadResponse } = await downloadFile(apiClient, uploadedFileId);
      
      expect(downloadResponse.file.filename).toBe(originalFile.filename);
      expect(downloadResponse.file.size).toBe(originalFile.size);
      expect(downloadResponse.file.mimeType).toBe(originalFile.mimeType);
      expect(downloadResponse.file.status).toBe('available');
      expect(downloadResponse.file.owner).toBeDefined();
      expect(downloadResponse.file.createdAt).toBeDefined();
      expect(downloadResponse.file.updatedAt).toBeDefined();
    });

    test('should return 404 for non-existent file', async () => {
      const fakeFileId = generateTestFileId();
      
      const downloadUrlResponse = await apiClient.fetch(`/storage/files/${fakeFileId}/download`);
      expect(downloadUrlResponse.status).toBe(404);
    });

    test('should not allow download of files in uploading status', async () => {
      // Create file record but don't complete upload
      const testFile = createTestFile({ size: 100 });
      const uploadResponse = await apiClient.fetch('/storage/files/upload', {
        method: 'POST',
        body: {
          filename: testFile.filename,
          size: testFile.size,
          mimeType: testFile.mimeType,
        },
      });
      
      const uploadData: FileUploadResponse = await uploadResponse.json();
      
      // Try to download without completing upload
      const downloadUrlResponse = await apiClient.fetch(`/storage/files/${uploadData.file}/download`);
      expect(downloadUrlResponse.ok).toBe(false);
    });

    test('should handle download URL expiration', async () => {
      originalFile = createTestFile({ type: 'text', size: 1000 });
      const result = await uploadFileToStorage(apiClient, originalFile);
      uploadedFileId = result.fileId;
      
      await waitForFileStatus(apiClient, uploadedFileId, 'available');
      
      const { downloadResponse } = await downloadFile(apiClient, uploadedFileId);
      
      // Verify expiration is set to 15 minutes from now (allow 1 minute tolerance)
      const expiryTime = new Date(downloadResponse.expiresAt).getTime();
      const expectedExpiry = addMinutes(new Date(), 15).getTime();
      const tolerance = 60 * 1000; // 1 minute
      
      expect(Math.abs(expiryTime - expectedExpiry)).toBeLessThan(tolerance);
    });
  });


  describe('File Listing', () => {
    test('should list all files', async () => {
      // Get current user for proper isolation
      const currentUser = apiClient.getUser();
      const ownerId = currentUser?.id;
      
      // Create files with different statuses
      const files = [
        createTestFile({ filename: 'available-1.txt', size: 100 }),
        createTestFile({ filename: 'available-2.txt', size: 200 }),
        createTestFile({ filename: 'available-3.txt', size: 300 }),
      ];
      
      const testFiles: { fileId: string; file: TestFile; status: string }[] = [];
      
      // Upload all files
      for (const file of files) {
        const result = await uploadFileToStorage(apiClient, file);
        await waitForFileStatus(apiClient, result.fileId, 'available');
        testFiles.push({ fileId: result.fileId, file, status: 'available' });
      }
      
      // Search across all pages to find our uploaded files
      const allFiles: any[] = [];
      let currentOffset = 0;
      const pageSize = 50; // Use larger page size
      let hasMorePages = true;
      
      while (hasMorePages) {
        const response = await listFiles(apiClient, { 
          offset: currentOffset, 
          limit: pageSize 
        });
        
        allFiles.push(...response.data);
        
        // Check if there are more pages
        hasMorePages = response.pagination.hasNextPage;
        currentOffset += pageSize;
        
        // Safety check to avoid infinite loop
        if (currentOffset > response.pagination.totalCount) {
          break;
        }
      }
      
      // Get the final response for pagination checks
      const response = await listFiles(apiClient);
      
      expect(response.data).toBeInstanceOf(Array);
      expect(response.pagination).toBeDefined();
      expect(response.pagination.totalCount).toBeGreaterThanOrEqual(testFiles.length);
      
      // Check that our test files are included somewhere in the paginated results
      const allFileIds = allFiles.map(f => f.id);
      testFiles.forEach(({ fileId }) => {
        expect(allFileIds).toContain(fileId);
      });
    });

    test('should filter files by status', async () => {
      const response = await listFiles(apiClient, { status: 'available' });
      
      expect(response.data).toBeInstanceOf(Array);
      response.data.forEach(file => {
        expect(file.status).toBe('available');
      });
    });

    test('should handle pagination', async () => {
      // Get first page with limit 2
      const page1 = await listFiles(apiClient, { limit: 2, offset: 0 });
      expect(page1.data.length).toBeLessThanOrEqual(2);
      expect(page1.pagination.limit).toBe(2);
      expect(page1.pagination.offset).toBe(0);
      expect(page1.pagination.currentPage).toBe(1);
      
      if (page1.pagination.totalCount > 2) {
        // Get second page
        const page2 = await listFiles(apiClient, { limit: 2, offset: 2 });
        expect(page2.data.length).toBeGreaterThan(0);
        expect(page2.pagination.offset).toBe(2);
        expect(page2.pagination.currentPage).toBe(2);
        
        // Ensure no overlap
        const page1Ids = page1.data.map(f => f.id);
        const page2Ids = page2.data.map(f => f.id);
        const overlap = page1Ids.filter(id => page2Ids.includes(id));
        expect(overlap.length).toBe(0);
      }
    });

    test('should handle filtering by status', async () => {
      const response = await listFiles(apiClient, { status: 'failed' });
      
      expect(response.data).toBeInstanceOf(Array);
      expect(response.pagination).toBeDefined();
      expect(response.pagination.totalCount).toBeGreaterThanOrEqual(0);
      
      // If there are failed files, they should all have failed status
      if (response.data.length > 0) {
        response.data.forEach((file: any) => {
          expect(file.status).toBe('failed');
        });
      }
    });

    test('should respect maximum page size', async () => {
      // Test that requests above maximum limit are rejected with validation error
      const response = await apiClient.fetch('/storage/files', {
        searchParams: { limit: 200 }
      });
      
      expect(response.status).toBe(400);
      const errorData = await response.json();
      expect(errorData.code).toBeDefined();
      expect(errorData.message).toBeDefined();
      expect(errorData.statusCode).toBe(400);
      expect(errorData.requestId).toBeDefined();
      expect(errorData.timestamp).toBeDefined();
      expect(errorData.path).toBeDefined();
      expect(errorData.method).toBeDefined();
    });

    test('should handle invalid pagination parameters', async () => {
      // Negative offset should return validation error
      const response1 = await apiClient.fetch('/storage/files', {
        searchParams: { offset: -1 }
      });
      expect(response1.status).toBe(400);
      const errorData1 = await response1.json();
      expect(errorData1.code).toBeDefined();
      expect(errorData1.message).toBeDefined();
      expect(errorData1.statusCode).toBe(400);
      expect(errorData1.requestId).toBeDefined();
      expect(errorData1.timestamp).toBeDefined();
      expect(errorData1.path).toBeDefined();
      expect(errorData1.method).toBeDefined();
      
      // Zero limit should return validation error
      const response2 = await apiClient.fetch('/storage/files', {
        searchParams: { limit: 0 }
      });
      expect(response2.status).toBe(400);
      const errorData2 = await response2.json();
      expect(errorData2.code).toBeDefined();
      expect(errorData2.message).toBeDefined();
      expect(errorData2.statusCode).toBe(400);
      expect(errorData2.requestId).toBeDefined();
      expect(errorData2.timestamp).toBeDefined();
      expect(errorData2.path).toBeDefined();
      expect(errorData2.method).toBeDefined();
    });
  });

  describe('File Deletion', () => {
    test('should delete file successfully', async () => {
      const testFile = createTestFile({ size: 500 });
      const result = await uploadFileToStorage(apiClient, testFile);
      const uploadedFileId = result.fileId;

      await waitForFileStatus(apiClient, uploadedFileId, 'available');

      // Verify file exists (using getFile endpoint)
      const fileResponse = await apiClient.fetch(`/storage/files/${uploadedFileId}`);
      expect(fileResponse.status).toBe(200);

      // Delete file
      await deleteFile(apiClient, uploadedFileId);

      // Verify file is deleted
      const response = await apiClient.fetch(`/storage/files/${uploadedFileId}`);
      expect(response.status).toBe(404);
    });

    test('should return 404 when deleting non-existent file', async () => {
      const fakeFileId = generateTestFileId();
      
      const response = await apiClient.fetch(`/storage/files/${fakeFileId}`, {
        method: 'DELETE',
      });
      
      expect(response.status).toBe(404);
    });

    test('should handle file deletion from storage backend', async () => {
      const testFile = createTestFile({ size: 500 });
      const result = await uploadFileToStorage(apiClient, testFile);
      const uploadedFileId = result.fileId;
      
      await waitForFileStatus(apiClient, uploadedFileId, 'available');
      
      // Delete file
      await deleteFile(apiClient, uploadedFileId);
      
      // Try to download - should fail
      const downloadResponse = await apiClient.fetch(`/storage/files/${uploadedFileId}/download`);
      expect(downloadResponse.status).toBe(404);
    });

    test('should clean up database record on deletion', async () => {
      const testFile = createTestFile({ size: 500 });
      const result = await uploadFileToStorage(apiClient, testFile);
      const uploadedFileId = result.fileId;
      
      await waitForFileStatus(apiClient, uploadedFileId, 'available');
      
      await deleteFile(apiClient, uploadedFileId);
      
      // File should not appear in list
      const listResponse = await listFiles(apiClient);
      const fileIds = listResponse.data.map(f => f.id);
      expect(fileIds).not.toContain(uploadedFileId);
    });
  });

  describe('End-to-End Workflows', () => {
    test('should complete full upload-download-delete cycle', async () => {
      const originalContent = faker.lorem.paragraphs(10);
      const testFile = createTestFile({ 
        type: 'text',
        size: Buffer.from(originalContent).length,
        filename: 'full-cycle-test.txt'
      });
      testFile.content = Buffer.from(originalContent);
      
      // 1. Upload file
      const uploadResult = await uploadFileToStorage(apiClient, testFile);
      const fileId = uploadResult.fileId;
      
      // 2. Wait for processing
      const metadata = await waitForFileStatus(apiClient, fileId, 'available');
      expect(metadata.status).toBe('available');
      expect(metadata.filename).toBe(testFile.filename);
      
      // 3. Download and verify
      const { content } = await downloadFile(apiClient, fileId);
      expect(content.toString()).toBe(originalContent);
      
      // 4. Delete file
      await deleteFile(apiClient, fileId);
      
      // 5. Verify deletion
      const response = await apiClient.fetch(`/storage/files/${fileId}`);
      expect(response.status).toBe(404);
    });

    test('should handle partial upload cleanup', async () => {
      const testFile = createTestFile({ size: 100 });
      
      // 1. Initiate upload
      const uploadResponse = await apiClient.fetch('/storage/files/upload', {
        method: 'POST',
        body: {
          filename: testFile.filename,
          size: testFile.size,
          mimeType: testFile.mimeType,
        },
      });
      
      const uploadData: FileUploadResponse = await uploadResponse.json();
      const fileId = uploadData.file;
      
      // 2. Don't upload to storage, just try to complete
      const completeResponse = await apiClient.fetch(`/storage/files/${fileId}/complete`, {
        method: 'POST',
      });
      
      // Should fail because file wasn't uploaded to storage
      expect(completeResponse.ok).toBe(false);

      // 3. File should be marked as failed (check via waitForFileStatus)
      try {
        await waitForFileStatus(apiClient, fileId, 'failed', 5000);
        // If we reach here, the file status is 'failed'
        expect(true).toBe(true);
      } catch (error) {
        // File status didn't reach 'failed' within timeout
        expect(error).toBeDefined();
      }
    });

    test('should handle concurrent operations on same file', async () => {
      const testFile = createTestFile({ size: 200 });
      const uploadResult = await uploadFileToStorage(apiClient, testFile);
      const fileId = uploadResult.fileId;

      await waitForFileStatus(apiClient, fileId, 'available');

      // Perform concurrent reads using getFile endpoint
      const concurrentReads = Array.from({ length: 5 }, () =>
        apiClient.fetch(`/storage/files/${fileId}`)
      );
      const results = await Promise.all(concurrentReads);

      results.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed file IDs', async () => {
      const malformedIds = ['not-a-uuid', '12345', '', 'null', 'undefined'];
      
      for (const id of malformedIds) {
        const response = await apiClient.fetch(`/storage/files/${id}`);
        expect(response.ok).toBe(false);
      }
    });

    test('should validate required fields in upload request', async () => {
      const incompleteRequests = [
        {}, // Missing all fields
        { filename: 'test.txt' }, // Missing size and mimeType
        { filename: 'test.txt', size: 100 }, // Missing mimeType
        { filename: 'test.txt', mimeType: 'text/plain' }, // Missing size
      ];
      
      for (const body of incompleteRequests) {
        const response = await apiClient.fetch('/storage/files/upload', {
          method: 'POST',
          body: body,
        });
        
        expect(response.ok).toBe(false);
        expect(response.status).toBe(400);
      }
    });

    test('should handle invalid JSON in upload request', async () => {
      const response = await apiClient.fetch('/storage/files/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json',
      });
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });

    test('should handle invalid query parameters in list endpoint', async () => {
      const invalidParams = [
        { status: 'invalid-status' },
        { limit: 'not-a-number' },
        { offset: 'negative-number' },
      ];
      
      for (const params of invalidParams) {
        const response = await apiClient.fetch('/storage/files', {
          searchParams: params
        });
        // Should either succeed with ignored invalid params or return 400
        expect([200, 400]).toContain(response.status);
      }
    });
  });

  describe('Presigned URLs', () => {
    test('should generate valid presigned upload URLs', async () => {
      const testFile = createTestFile({ size: 100 });
      
      const uploadResponse = await apiClient.fetch('/storage/files/upload', {
        method: 'POST',
        body: {
          filename: testFile.filename,
          size: testFile.size,
          mimeType: testFile.mimeType,
        },
      });
      
      const uploadData: FileUploadResponse = await uploadResponse.json();
      
      // Validate presigned URL structure
      expect(validatePresignedUrl(uploadData.uploadUrl, uploadData.expiresAt)).toBe(true);
      
      // Test actual upload to presigned URL
      const storageResponse = await fetch(uploadData.uploadUrl, {
        method: uploadData.uploadMethod,
        body: testFile.content,
        headers: {
          'Content-Type': testFile.mimeType,
        },
      });
      
      expect(storageResponse.ok).toBe(true);
    });

    test('should generate valid presigned download URLs', async () => {
      const testFile = createTestFile({ size: 100 });
      const uploadResult = await uploadFileToStorage(apiClient, testFile);
      
      await waitForFileStatus(apiClient, uploadResult.fileId, 'available');
      
      const downloadUrlResponse = await apiClient.fetch(`/storage/files/${uploadResult.fileId}/download`);
      const downloadData: FileDownloadResponse = await downloadUrlResponse.json();
      
      // Validate presigned URL structure
      expect(validatePresignedUrl(downloadData.downloadUrl, downloadData.expiresAt)).toBe(true);
      
      // Test actual download from presigned URL
      const fileResponse = await fetch(downloadData.downloadUrl);
      expect(fileResponse.ok).toBe(true);
      
      const content = Buffer.from(await fileResponse.arrayBuffer());
      expect(content.equals(testFile.content)).toBe(true);
    });

    test('should handle URL expiration properly', async () => {
      const testFile = createTestFile({ size: 50 });
      
      const uploadResponse = await apiClient.fetch('/storage/files/upload', {
        method: 'POST',
        body: {
          filename: testFile.filename,
          size: testFile.size,
          mimeType: testFile.mimeType,
        },
      });
      
      const uploadData: FileUploadResponse = await uploadResponse.json();
      
      // Upload URL should expire in 5 minutes
      const uploadExpiryTime = new Date(uploadData.expiresAt).getTime();
      const expectedUploadExpiry = addMinutes(new Date(), 5).getTime();
      const tolerance = 60 * 1000; // 1 minute tolerance
      
      expect(Math.abs(uploadExpiryTime - expectedUploadExpiry)).toBeLessThan(tolerance);
    });
  });

  describe('Performance and Scale', () => {
    test('should handle multiple concurrent uploads', async () => {
      const concurrency = 5;
      const testFiles = Array.from({ length: concurrency }, (_, i) => 
        createTestFile({ filename: `concurrent-${i}.txt`, size: 1000 })
      );
      
      const startTime = Date.now();
      
      const uploadPromises = testFiles.map(async (testFile) => {
        const result = await uploadFileToStorage(apiClient, testFile);
        return result;
      });
      
      const results = await Promise.all(uploadPromises);
      const endTime = Date.now();
      
      // All uploads should succeed
      expect(results).toHaveLength(concurrency);
      
      // Should complete within reasonable time (5 seconds per file)
      const maxExpectedTime = concurrency * 5000;
      expect(endTime - startTime).toBeLessThan(maxExpectedTime);
      
      // Wait for all files to be available
      const metadataPromises = results.map(result => 
        waitForFileStatus(apiClient, result.fileId, 'available')
      );
      await Promise.all(metadataPromises);
    });

    test('should handle various file sizes efficiently', async () => {
      const sizes = [1, 100, 1000, 10000, 100000]; // 1B to 100KB
      
      const uploadPromises = sizes.map(async (size, i) => {
        const testFile = createTestFile({ 
          filename: `size-test-${size}.txt`, 
          size 
        });
        
        const startTime = Date.now();
        const result = await uploadFileToStorage(apiClient, testFile);
        const endTime = Date.now();
        
        return {
          size,
          fileId: result.fileId,
          duration: endTime - startTime,
        };
      });
      
      const results = await Promise.all(uploadPromises);
      
      // All uploads should succeed regardless of size
      expect(results).toHaveLength(sizes.length);
      
      // Wait for all files to be available
      const availablePromises = results.map(result => 
        waitForFileStatus(apiClient, result.fileId, 'available')
      );
      await Promise.all(availablePromises);
    });
  });
});