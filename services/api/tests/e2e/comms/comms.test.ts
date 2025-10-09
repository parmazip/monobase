/**
 * Comms Module E2E Tests
 * Tests the complete communication workflow including chat rooms, messages, and video calls
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { faker } from '@faker-js/faker';
import { createApiClient, type ApiClient } from '../../helpers/client';
import { createTestApp, type TestApp } from '../../helpers/test-app';
import { generateUniqueEmail } from '../../helpers/unique';

import {
  // Chat room functions
  listChatRooms,
  getChatRoom,
  getChatMessages,
  createChatRoom,
  getOrCreateAppointmentChatRoom,

  // Message functions
  sendTextMessage,
  startVideoCall,

  // Video call action functions
  joinVideoCall,
  endVideoCall,
  leaveVideoCall,
  updateVideoCallParticipant,

  // ICE servers functions
  getIceServers,

  // Data generators
  generateTestMessageContent,
  generateVideoCallParticipants,

  // Cleanup helpers
  cleanupActiveVideoCall,

  // Validators
  validateChatRoomResponse,
  validateChatMessageResponse,
  validateVideoCallJoinResponse,
  validateVideoCallEndResponse,
  validateLeaveVideoCallResponse,
  validateIceServersResponse
} from '../../helpers/comms';

describe('Comms Module E2E Tests', () => {
  let testApp: TestApp;
  let apiClient: ApiClient;
  let providerClient: ApiClient;
  let patientClient: ApiClient;
  let secondPatientClient: ApiClient;
  
  let providerPersonId: string;
  let patientPersonId: string;
  let secondPatientPersonId: string;
  let appointmentId: string;
  let chatRoomId: string;
  
  // Mock appointment and chat room data for testing
  const mockAppointmentId = faker.string.uuid();
  const mockChatRoomId = faker.string.uuid();
  
  beforeAll(async () => {
    testApp = await createTestApp({ storage: true });

    // Create API clients with embedded app instance
    apiClient = createApiClient({
      app: testApp.app
    });
    providerClient = createApiClient({
      app: testApp.app
    });
    patientClient = createApiClient({
      app: testApp.app
    });
    secondPatientClient = createApiClient({
      app: testApp.app
    });
    
    // Sign up users with unique email addresses to prevent conflicts
    const providerUser = await providerClient.signup({
      email: generateUniqueEmail(),
      name: faker.person.fullName()
    });
    const patientUser = await patientClient.signup({
      email: generateUniqueEmail(),
      name: faker.person.fullName()
    });
    const secondPatientUser = await secondPatientClient.signup({
      email: generateUniqueEmail(),
      name: faker.person.fullName()
    });

    // Use Person IDs directly from authenticated users (no patient/provider profiles needed)
    providerPersonId = providerUser.id;
    patientPersonId = patientUser.id;
    secondPatientPersonId = secondPatientUser.id;
    
    // Set appointment ID for tests that need it
    appointmentId = mockAppointmentId;
    
    // For now, skip chat room creation since it depends on booking module
    // Tests that require chat rooms will skip or use mock IDs
    chatRoomId = '';
  }, 30000);

  afterAll(async () => {
    await testApp?.cleanup();
  });
  
  describe('Chat Room Management', () => {
    describe('GET /comms/chat-rooms', () => {
      test('should list chat rooms for authenticated user', async () => {
        const { response, data } = await listChatRooms(patientClient);
        
        expect(response.status).toBe(200);
        expect(data).toBeDefined();
        expect(data.data).toBeInstanceOf(Array);
        expect(data.pagination).toBeDefined();
        expect(typeof data.pagination.totalCount).toBe('number');
      });
      
      test('should fail without authentication', async () => {
        const { response } = await listChatRooms(apiClient);
        
        expect(response.status).toBe(401);
      });
      
      test('should support pagination', async () => {
        const { response, data } = await listChatRooms(patientClient, {
          page: 1,
          pageSize: 5
        });
        
        expect(response.status).toBe(200);
        expect(data.pagination.page).toBe(1);
        expect(data.pagination.pageSize).toBe(5);
      });
      
      test('should support status filtering', async () => {
        const { response, data } = await listChatRooms(patientClient, {
          status: 'active'
        });
        
        expect(response.status).toBe(200);
        if (data.data.length > 0) {
          expect(data.data.every((room: any) => room.status === 'active')).toBe(true);
        }
      });
      
      test('should filter for common rooms between users', async () => {
        const { response, data } = await listChatRooms(patientClient, {
          withParticipant: secondPatientClient.getUser().id // Find rooms shared with another user
        });
        
        // Should succeed but return empty results (no shared rooms between test users)
        expect(response.status).toBe(200);
        expect(data).toBeDefined();
        expect(data.data).toBeInstanceOf(Array);
        expect(data.data.length).toBe(0); // No shared rooms expected in test setup
      });
    });
    
    describe('POST /comms/chat-rooms (with appointment context)', () => {
      test('should create or get chat room for appointment using context', async () => {
        // Create/get chat room for appointment with context
        const { response, data } = await getOrCreateAppointmentChatRoom(
          providerClient, // Use provider client since they'll be the admin
          mockAppointmentId,
          patientPersonId,
          providerPersonId
        );


        // Should succeed in creating room
        expect(response.status).toBeGreaterThanOrEqual(200);
        expect(response.status).toBeLessThan(300);

        if (response.ok && data) {
          expect(validateChatRoomResponse(data)).toBe(true);
          expect(data.context).toBe(mockAppointmentId);
          expect(data.participants).toContain(patientPersonId);
          expect(data.participants).toContain(providerPersonId);
          expect(data.admins).toContain(providerPersonId);
          chatRoomId = data.id; // Use this for subsequent tests
        }
      });

      test('should find appointment chat room using appointment filter', async () => {
        // List rooms filtered by appointment ID
        const { response, data } = await listChatRooms(patientClient, {
          appointment: mockAppointmentId
        });

        expect(response.status).toBe(200);
        if (data?.data) {
          expect(data.data.length).toBeGreaterThan(0);
          const appointmentRoom = data.data.find(room => room.context === mockAppointmentId);
          expect(appointmentRoom).toBeDefined();
        }
      });
    });
  });
  
  describe('Message Management', () => {
    beforeEach(async () => {
      // Try to create or find a chat room for testing
      // First attempt to get rooms to see if any exist
      const { response: roomsResponse, data: roomsData } = await listChatRooms(patientClient);
      
      if (roomsResponse.ok && roomsData.data && roomsData.data.length > 0) {
        // Use existing chat room if available
        chatRoomId = roomsData.data[0].id;
      } else {
        // Create a room via general endpoint with appointment context
        const { response: roomResponse, data: roomData } =
          await getOrCreateAppointmentChatRoom(providerClient, mockAppointmentId, patientPersonId, providerPersonId);

        if (roomResponse.ok && roomData) {
          chatRoomId = roomData.id;
        }
      }
    });
    
    describe('POST /comms/chat-rooms/{roomId}/messages (text)', () => {
      test('should send text message', async () => {
        if (!chatRoomId) {
          test.skip('no chat room available');
          return;
        }
        
        const messageContent = generateTestMessageContent();
        const { response, data } = await sendTextMessage(patientClient, chatRoomId, messageContent);
        
        expect(response.status).toBe(201);
        expect(data).toBeDefined();
        expect(validateChatMessageResponse(data)).toBe(true);
        expect(data!.messageType).toBe('text');
        expect(data!.message).toBe(messageContent);
      });
      
      test('should fail with empty message', async () => {
        if (!chatRoomId) {
          test.skip('no chat room available');
          return;
        }
        
        const { response } = await sendTextMessage(patientClient, chatRoomId, '');
        
        expect(response.status).toBe(400);
      });
      
      test('should fail with message too long', async () => {
        if (!chatRoomId) {
          test.skip('no chat room available');
          return;
        }
        
        const longMessage = 'a'.repeat(5001); // Exceeds 5000 char limit
        const { response } = await sendTextMessage(patientClient, chatRoomId, longMessage);
        
        expect(response.status).toBe(400);
      });
      
      test('should fail for non-participants', async () => {
        if (!chatRoomId) {
          test.skip('no chat room available');
          return;
        }
        
        const messageContent = generateTestMessageContent();
        const { response } = await sendTextMessage(secondPatientClient, chatRoomId, messageContent);
        
        expect(response.status).toBe(403);
      });
    });
    
    describe('GET /comms/chat-rooms/{roomId}/messages', () => {
      test('should get messages for room participants', async () => {
        if (!chatRoomId) {
          test.skip('no chat room available');
          return;
        }
        
        const { response, data } = await getChatMessages(patientClient, chatRoomId);
        
        expect(response.status).toBe(200);
        expect(data).toBeDefined();
        expect(data.data).toBeInstanceOf(Array);
        expect(data.pagination).toBeDefined();
      });
      
      test('should support message type filtering', async () => {
        if (!chatRoomId) {
          test.skip('no chat room available');
          return;
        }
        
        const { response, data } = await getChatMessages(patientClient, chatRoomId, {
          messageType: 'text'
        });
        
        expect(response.status).toBe(200);
        if (data.data.length > 0) {
          expect(data.data.every((msg: any) => msg.messageType === 'text')).toBe(true);
        }
      });
      
      test('should fail for non-participants', async () => {
        if (!chatRoomId) {
          test.skip('no chat room available');
          return;
        }
        
        const { response } = await getChatMessages(secondPatientClient, chatRoomId);
        
        expect(response.status).toBe(403);
      });
    });
  });
  
  describe('Video Call Management', () => {
    let videoCallMessageId: string;

    beforeAll(async () => {
      // Clean up any active video calls before starting video call tests
      if (chatRoomId) {
        await cleanupActiveVideoCall(providerClient, chatRoomId);
      }
    });

    afterAll(async () => {
      // Clean up any active video calls after video call tests
      if (chatRoomId) {
        await cleanupActiveVideoCall(providerClient, chatRoomId);
      }
    });

    describe('POST /comms/chat-rooms/{roomId}/messages (video_call)', () => {
      test('should start video call as admin', async () => {
        if (!chatRoomId) {
          test.skip('no chat room available');
          return;
        }
        
        const participants = generateVideoCallParticipants(
          patientClient.getUser().id,
          providerClient.getUser().id,
          'Test Patient',
          'Dr. Test Provider'
        );
        const { response, data } = await startVideoCall(providerClient, chatRoomId, participants);
        
        expect(response.status).toBe(201);
        expect(data).toBeDefined();
        expect(validateChatMessageResponse(data)).toBe(true);
        expect(data!.messageType).toBe('video_call');
        expect(data!.videoCallData).toBeDefined();
        expect(data!.videoCallData!.status).toBe('starting');
        
        videoCallMessageId = data!.id;
      });
      
      test('should fail to start second video call in same room', async () => {
        if (!chatRoomId || !videoCallMessageId) {
          test.skip('prerequisites not met');
          return;
        }
        
        const participants = generateVideoCallParticipants(
          patientClient.getUser().id,
          providerClient.getUser().id,
          'Test Patient',
          'Dr. Test Provider'
        );
        const { response } = await startVideoCall(providerClient, chatRoomId, participants);
        
        expect(response.status).toBe(409); // Conflict
      });
      
      test('should fail for non-admin when onlyAdminCanStartCall is true', async () => {
        if (!chatRoomId) {
          test.skip('no chat room available');
          return;
        }
        
        const participants = generateVideoCallParticipants(
          patientClient.getUser().id,
          providerClient.getUser().id,
          'Test Patient',
          'Dr. Test Provider'
        );
        const { response } = await startVideoCall(patientClient, chatRoomId, participants);

        // Could be 403 (forbidden) or 409 (conflict if call already exists)
        expect([403, 409]).toContain(response.status);
      });
    });
    
    describe('POST /comms/chat-rooms/{roomId}/video-call/join', () => {
      test('should join active video call', async () => {
        if (!chatRoomId || !videoCallMessageId) {
          test.skip('prerequisites not met');
          return;
        }
        
        const { response, data } = await joinVideoCall(patientClient, chatRoomId, 'Test Patient', {
          audioEnabled: true,
          videoEnabled: true
        });
        
        expect(response.status).toBe(200);
        expect(data).toBeDefined();
        expect(validateVideoCallJoinResponse(data)).toBe(true);
        expect(data!.roomUrl).toContain('video-call/signal');
        expect(data!.roomUrl).toMatch(/^wss?:\/\//); // Should be WebSocket URL (ws:// or wss://)
        expect(data!.token).toBeDefined();
        expect(data!.callStatus).toBe('active');
      });
      
      test('should fail to join non-existent video call', async () => {
        if (!chatRoomId) {
          test.skip('no chat room available');
          return;
        }
        
        // First end any active call
        await endVideoCall(providerClient, chatRoomId);
        
        const { response } = await joinVideoCall(patientClient, chatRoomId, 'Test Patient');
        
        expect(response.status).toBe(404);
      });
      
      test('should fail for non-participants', async () => {
        if (!chatRoomId) {
          test.skip('no chat room available');
          return;
        }
        
        const { response } = await joinVideoCall(secondPatientClient, chatRoomId, 'Other Patient');
        
        expect(response.status).toBe(403);
      });
    });
    
    describe('PATCH /comms/chat-rooms/{roomId}/video-call/participant', () => {
      test('should update participant status', async () => {
        if (!chatRoomId) {
          test.skip('no chat room available');
          return;
        }

        // Ensure there's an active video call (previous test ended it)
        const participants = generateVideoCallParticipants(
          patientClient.getUser().id,
          providerClient.getUser().id,
          'Test Patient',
          'Dr. Test Provider'
        );
        await startVideoCall(providerClient, chatRoomId, participants);

        // Patient must join the call first before updating status
        await joinVideoCall(patientClient, chatRoomId, 'Test Patient');

        const { response, data } = await updateVideoCallParticipant(patientClient, chatRoomId, {
          audioEnabled: false,
          videoEnabled: true
        });
        
        expect(response.status).toBe(200);
        expect(data).toBeDefined();
        expect(data.audioEnabled).toBe(false);
        expect(data.videoEnabled).toBe(true);
      });
      
      test('should fail with no updates provided', async () => {
        if (!chatRoomId) {
          test.skip('no chat room available');
          return;
        }
        
        const { response } = await updateVideoCallParticipant(patientClient, chatRoomId, {});
        
        expect(response.status).toBe(400);
      });
    });
    
    describe('POST /comms/chat-rooms/{roomId}/video-call/leave', () => {
      test('should leave video call', async () => {
        if (!chatRoomId) {
          test.skip('no chat room available');
          return;
        }

        // Ensure there's an active video call (may have been ended by previous tests)
        const participants = generateVideoCallParticipants(
          patientClient.getUser().id,
          providerClient.getUser().id,
          'Test Patient',
          'Dr. Test Provider'
        );
        await startVideoCall(providerClient, chatRoomId, participants);

        // Patient must join the call first before leaving
        await joinVideoCall(patientClient, chatRoomId, 'Test Patient');

        const { response, data } = await leaveVideoCall(patientClient, chatRoomId);
        
        expect(response.status).toBe(200);
        expect(data).toBeDefined();
        expect(validateLeaveVideoCallResponse(data)).toBe(true);
        expect(typeof data!.callStillActive).toBe('boolean');
        expect(typeof data!.remainingParticipants).toBe('number');
      });
      
      test('should auto-end call when last participant leaves', async () => {
        if (!chatRoomId) {
          test.skip('no chat room available');
          return;
        }
        
        // Start a new call and have provider join then leave
        const participants = generateVideoCallParticipants(
          patientClient.getUser().id,
          providerClient.getUser().id,
          'Test Patient',
          'Dr. Test Provider'
        );
        await startVideoCall(providerClient, chatRoomId, participants);
        await joinVideoCall(providerClient, chatRoomId, 'Dr. Test');
        
        const { response, data } = await leaveVideoCall(providerClient, chatRoomId);
        
        expect(response.status).toBe(200);
        expect(data!.callStillActive).toBe(false);
        expect(data!.remainingParticipants).toBe(0);
      });
    });
    
    describe('POST /comms/chat-rooms/{roomId}/video-call/end', () => {
      test('should end video call as admin', async () => {
        if (!chatRoomId) {
          test.skip('no chat room available');
          return;
        }
        
        // Start a new call first
        const participants = generateVideoCallParticipants(
          patientClient.getUser().id,
          providerClient.getUser().id,
          'Test Patient',
          'Dr. Test Provider'
        );
        await startVideoCall(providerClient, chatRoomId, participants);
        
        const { response, data } = await endVideoCall(providerClient, chatRoomId);
        
        expect(response.status).toBe(200);
        expect(data).toBeDefined();
        expect(validateVideoCallEndResponse(data)).toBe(true);
        expect(data!.message).toContain('ended');
      });
      
      test('should fail for non-admin', async () => {
        if (!chatRoomId) {
          test.skip('no chat room available');
          return;
        }
        
        // Start a new call first
        const participants = generateVideoCallParticipants(
          patientClient.getUser().id,
          providerClient.getUser().id,
          'Test Patient',
          'Dr. Test Provider'
        );
        await startVideoCall(providerClient, chatRoomId, participants);
        
        const { response } = await endVideoCall(patientClient, chatRoomId);

        expect(response.status).toBe(403);

        // Clean up the active call so next test has no active call
        await endVideoCall(providerClient, chatRoomId);
      });
      
      test('should fail when no active call', async () => {
        if (!chatRoomId) {
          test.skip('no chat room available');
          return;
        }
        
        const { response } = await endVideoCall(providerClient, chatRoomId);
        
        expect(response.status).toBe(404);
      });
    });
  });
  
  describe('ICE Servers Configuration', () => {
    describe('GET /comms/ice-servers', () => {
      test('should return ICE servers for authenticated users', async () => {
        const { response, data } = await getIceServers(patientClient);

        expect(response.status).toBe(200);
        expect(data).toBeDefined();
        expect(validateIceServersResponse(data)).toBe(true);
        expect(data.iceServers).toBeInstanceOf(Array);
        expect(data.iceServers.length).toBeGreaterThan(0);
      });

      test('should fail without authentication', async () => {
        const { response } = await getIceServers(apiClient);

        expect(response.status).toBe(401);
      });

      test('should return valid STUN server configuration', async () => {
        const { response, data } = await getIceServers(patientClient);

        expect(response.status).toBe(200);
        expect(data).toBeDefined();

        // Check that at least one STUN server is present
        const stunServers = data.iceServers.filter((server: any) =>
          (typeof server.urls === 'string' && server.urls.startsWith('stun:')) ||
          (Array.isArray(server.urls) && server.urls.some((url: string) => url.startsWith('stun:')))
        );

        expect(stunServers.length).toBeGreaterThan(0);
      });

      test('should support both single and multiple URLs per server', async () => {
        const { response, data } = await getIceServers(patientClient);

        expect(response.status).toBe(200);
        expect(data).toBeDefined();

        // Check that each server has valid urls format
        data.iceServers.forEach((server: any) => {
          const hasValidUrls = typeof server.urls === 'string' ||
            (Array.isArray(server.urls) && server.urls.every((url: any) => typeof url === 'string'));

          expect(hasValidUrls).toBe(true);
        });
      });

      test('should include optional TURN credential fields', async () => {
        const { response, data } = await getIceServers(patientClient);

        expect(response.status).toBe(200);
        expect(data).toBeDefined();

        // Check that TURN servers can have username and credential
        data.iceServers.forEach((server: any) => {
          if (server.username !== undefined) {
            expect(typeof server.username).toBe('string');
          }
          if (server.credential !== undefined) {
            expect(typeof server.credential).toBe('string');
          }
        });
      });
    });
  });

  describe('Security and Authorization', () => {
    test('should require authentication for all endpoints', async () => {
      // Use valid UUIDs to pass parameter validation and test authentication
      const testRoomId = '00000000-0000-0000-0000-000000000000';
      const testAppointmentId = '11111111-1111-1111-1111-111111111111';

      const endpoints = [
        { method: 'GET', path: '/comms/chat-rooms' },
        { method: 'GET', path: `/comms/chat-rooms/${testRoomId}` },
        { method: 'GET', path: `/comms/chat-rooms/${testRoomId}/messages` },
        {
          method: 'POST',
          path: `/comms/chat-rooms/${testRoomId}/messages`,
          body: { messageType: 'text', message: 'test message' }
        },
        {
          method: 'POST',
          path: `/comms/chat-rooms/${testRoomId}/video-call/join`,
          body: { displayName: 'Test User', audioEnabled: true, videoEnabled: true }
        },
        { method: 'POST', path: `/comms/chat-rooms/${testRoomId}/video-call/end` },
        { method: 'POST', path: `/comms/chat-rooms/${testRoomId}/video-call/leave` },
        {
          method: 'PATCH',
          path: `/comms/chat-rooms/${testRoomId}/video-call/participant`,
          body: { audioEnabled: true }
        },
        { method: 'GET', path: '/comms/ice-servers' }, // ICE servers endpoint
        // Removed endpoint - this should return 404, not 401
        // { method: 'GET', path: `/comms/appointments/${testAppointmentId}/chat-room` }
      ];

      for (const endpoint of endpoints) {
        const response = await apiClient.fetch(endpoint.path, {
          method: endpoint.method,
          headers: { 'Content-Type': 'application/json' },
          body: endpoint.method !== 'GET' ? JSON.stringify(endpoint.body || {}) : undefined
        });

        expect(response.status).toBe(401);
      }
    });
    
    test('should enforce participant-only access to chat rooms', async () => {
      if (!chatRoomId) {
        test.skip('no chat room available');
        return;
      }
      
      // Try to access room as non-participant
      const { response: roomResponse } = await getChatRoom(secondPatientClient, chatRoomId);
      expect(roomResponse.status).toBe(403);
      
      const { response: messagesResponse } = await getChatMessages(secondPatientClient, chatRoomId);
      expect(messagesResponse.status).toBe(403);
    });
    
    test('should enforce admin-only video call control', async () => {
      if (!chatRoomId) {
        test.skip('no chat room available');
        return;
      }
      
      // Patient (non-admin) should not be able to start call
      const participants = generateVideoCallParticipants(patientClient.getUser().id, providerClient.getUser().id);
      const { response: startResponse } = await startVideoCall(patientClient, chatRoomId, participants);
      expect(startResponse.status).toBe(403);
      
      // Start call as provider (admin)
      await startVideoCall(providerClient, chatRoomId, participants);
      
      // Patient should not be able to end call
      const { response: endResponse } = await endVideoCall(patientClient, chatRoomId);
      expect(endResponse.status).toBe(403);
    });
  });
  
  describe('Edge Cases and Error Handling', () => {
    test('should handle invalid UUIDs gracefully', async () => {
      const invalidId = 'not-a-uuid';
      
      const { response: roomResponse } = await getChatRoom(patientClient, invalidId);
      expect(roomResponse.status).toBe(400);
      
      const { response: messagesResponse } = await getChatMessages(patientClient, invalidId);
      expect(messagesResponse.status).toBe(400);
    });
    
    test('should handle non-existent resources', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      
      const { response: roomResponse } = await getChatRoom(patientClient, nonExistentId);
      expect(roomResponse.status).toBe(404);
    });
    
    test('should validate request payloads', async () => {
      if (!chatRoomId) {
        test.skip('no chat room available');
        return;
      }
      
      // Invalid message type - use fetch instead of post
      const invalidMessageResponse = await patientClient.fetch(`/comms/chat-rooms/${chatRoomId}/messages`, {
        method: 'POST',
        body: {
          messageType: 'invalid',
          message: 'test'
        }
      });
      expect(invalidMessageResponse.status).toBe(400);

      // Missing required fields
      const missingFieldsResponse = await patientClient.fetch(`/comms/chat-rooms/${chatRoomId}/video-call/join`, {
        method: 'POST',
        body: {
          // Missing displayName
          audioEnabled: true
        }
      });
      expect(missingFieldsResponse.status).toBe(400);
    });
  });
});