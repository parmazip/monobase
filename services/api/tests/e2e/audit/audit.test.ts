/**
 * Audit E2E Tests
 * Tests audit log generation and querying
 */

import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { createApiClient, type ApiClient } from '../../helpers/client';
import { createTestApp, type TestApp } from '../../helpers/test-app';
import { listAuditLogs, waitForAuditLog } from '../../helpers/audit';
import { createPerson, updatePerson } from '../../helpers/person';
import { faker } from '@faker-js/faker';

describe('Audit E2E Tests', () => {
  let testApp: TestApp;
  let apiClient: ApiClient;
  let adminClient: ApiClient;

  beforeAll(async () => {
    testApp = await createTestApp();

    // Regular user for triggering auditable actions
    apiClient = createApiClient({ app: testApp.app });
    await apiClient.signup();

    // Admin user for querying audit logs
    adminClient = createApiClient({ app: testApp.app });
    await adminClient.signinAsAdmin();
  }, 30000);

  afterAll(async () => {
    await testApp?.cleanup();
  });

  describe('Person Audit Logging', () => {
    test('should create audit log when person profile is created', async () => {
      const user = apiClient.getUser();

      // Create person profile
      const personData = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        contactInfo: {
          email: faker.internet.email(),
          phone: faker.phone.number()
        }
      };

      const { response: createResponse } = await createPerson(apiClient, personData);
      expect(createResponse.ok).toBe(true);

      // Wait for audit log to be created (use admin to query)
      const auditLog = await waitForAuditLog(
        adminClient,
        log =>
          log.eventType === 'data-modification' &&
          log.action === 'create' &&
          log.resourceType === 'person' &&
          log.resource === user?.id
      );

      // Verify audit log was created
      expect(auditLog).toBeDefined();
      expect(auditLog.category).toBe('privacy');
      expect(auditLog.outcome).toBe('success');
      expect(auditLog.user).toBe(user?.id);
      expect(auditLog.description).toBe('Person profile created');
      expect(auditLog.details).toBeDefined();
      expect(auditLog.ipAddress).toBeDefined();
    });

    test('should create audit log when person profile is updated', async () => {
      const user = apiClient.getUser();

      // Update person profile
      const updateData = {
        firstName: faker.person.firstName(),
        timezone: 'America/New_York'
      };

      const { response: updateResponse } = await updatePerson(apiClient, 'me', updateData);
      expect(updateResponse.ok).toBe(true);

      // Wait for audit log to be created (use admin to query)
      const auditLog = await waitForAuditLog(
        adminClient,
        log =>
          log.eventType === 'data-modification' &&
          log.action === 'update' &&
          log.resourceType === 'person' &&
          log.resource === user?.id
      );

      // Verify audit log was created
      expect(auditLog).toBeDefined();
      expect(auditLog.category).toBe('privacy');
      expect(auditLog.outcome).toBe('success');
      expect(auditLog.user).toBe(user?.id);
      expect(auditLog.description).toBe('Person profile updated');
      expect(auditLog.details.updatedFields).toBeDefined();
      expect(auditLog.details.updatedFields).toContain('firstName');
      expect(auditLog.details.updatedFields).toContain('timezone');
    });
  });

  describe('Audit Log Querying', () => {
    test('should list audit logs with pagination', async () => {
      const { response, data } = await listAuditLogs(adminClient, {
        limit: 10,
        offset: 0
      });

      expect(response.ok).toBe(true);
      expect(data.data).toBeInstanceOf(Array);
      expect(data.pagination).toBeDefined();
      expect(data.pagination.limit).toBe(10);
      expect(data.pagination.offset).toBe(0);
    });

    test('should filter audit logs by resourceType', async () => {
      const { response, data } = await listAuditLogs(adminClient, {
        resourceType: 'person'
      });

      expect(response.ok).toBe(true);
      expect(data.data).toBeInstanceOf(Array);

      // All returned logs should be for person resources
      data.data.forEach((log: any) => {
        expect(log.resourceType).toBe('person');
      });
    });

    test('should filter audit logs by action', async () => {
      const { response, data } = await listAuditLogs(adminClient, {
        action: 'update'
      });

      expect(response.ok).toBe(true);
      expect(data.data).toBeInstanceOf(Array);

      // All returned logs should have update action
      data.data.forEach((log: any) => {
        expect(log.action).toBe('update');
      });
    });

    test('should filter audit logs by user', async () => {
      const user = apiClient.getUser();

      const { response, data } = await listAuditLogs(adminClient, {
        user: user?.id
      });

      expect(response.ok).toBe(true);
      expect(data.data).toBeInstanceOf(Array);

      // All returned logs should be for the current user
      data.data.forEach((log: any) => {
        expect(log.user).toBe(user?.id);
      });
    });

    test('should filter audit logs by date range', async () => {
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0); // Start of today

      const { response, data } = await listAuditLogs(adminClient, {
        startDate: startDate.toISOString()
      });

      expect(response.ok).toBe(true);
      expect(data.data).toBeInstanceOf(Array);

      // All returned logs should be from today onwards
      data.data.forEach((log: any) => {
        const logDate = new Date(log.createdAt);
        expect(logDate >= startDate).toBe(true);
      });
    });

    test('should combine multiple filters', async () => {
      const user = apiClient.getUser();

      const { response, data } = await listAuditLogs(adminClient, {
        resourceType: 'person',
        action: 'update',
        user: user?.id
      });

      expect(response.ok).toBe(true);
      expect(data.data).toBeInstanceOf(Array);

      // All returned logs should match all filters
      data.data.forEach((log: any) => {
        expect(log.resourceType).toBe('person');
        expect(log.action).toBe('update');
        expect(log.user).toBe(user?.id);
      });
    });

    test('should handle pagination correctly', async () => {
      // Get first page
      const page1 = await listAuditLogs(adminClient, { limit: 2, offset: 0 });
      expect(page1.response.ok).toBe(true);
      expect(page1.data.data.length).toBeLessThanOrEqual(2);

      if (page1.data.pagination.totalCount > 2) {
        // Get second page
        const page2 = await listAuditLogs(adminClient, { limit: 2, offset: 2 });
        expect(page2.response.ok).toBe(true);

        // Ensure no overlap between pages
        const page1Ids = page1.data.data.map((log: any) => log.id);
        const page2Ids = page2.data.data.map((log: any) => log.id);
        const overlap = page1Ids.filter((id: string) => page2Ids.includes(id));
        expect(overlap.length).toBe(0);
      }
    });

    test('should return empty results for non-existent resource', async () => {
      const fakeUserId = faker.string.uuid();

      const { response, data } = await listAuditLogs(adminClient, {
        user: fakeUserId
      });

      expect(response.ok).toBe(true);
      expect(data.data).toBeInstanceOf(Array);
      expect(data.data.length).toBe(0);
    });
  });

  describe('Audit Log Metadata', () => {
    test('audit logs should include IP address and user agent', async () => {
      const user = apiClient.getUser();

      // Trigger an auditable action
      await updatePerson(apiClient, 'me', { timezone: 'UTC' });

      // Get the audit log (use admin to query)
      const auditLog = await waitForAuditLog(
        adminClient,
        log =>
          log.resourceType === 'person' &&
          log.action === 'update' &&
          log.user === user?.id
      );

      expect(auditLog).toBeDefined();
      expect(auditLog.ipAddress).toBeDefined();
      expect(auditLog.userAgent).toBeDefined();
    });

    test('audit logs should have integrity hash', async () => {
      const { data } = await listAuditLogs(adminClient, { limit: 1 });

      expect(data.data.length).toBeGreaterThan(0);

      const log = data.data[0];
      expect(log.integrityHash).toBeDefined();
      expect(typeof log.integrityHash).toBe('string');
      expect(log.integrityHash.length).toBe(64); // SHA-256 hash length
    });

    test('audit logs should have retention status', async () => {
      const { data } = await listAuditLogs(adminClient, { limit: 1 });

      expect(data.data.length).toBeGreaterThan(0);

      const log = data.data[0];
      expect(log.retentionStatus).toBeDefined();
      expect(['active', 'archived', 'pending-purge']).toContain(log.retentionStatus);
    });
  });
});
