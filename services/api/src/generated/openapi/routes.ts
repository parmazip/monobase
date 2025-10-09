import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import * as validators from './validators';
import { registry } from './registry';
import { authMiddleware } from '@/middleware/auth';
import { validationErrorHandler } from '@/middleware/validation';

export function registerRoutes(app: Hono) {
  // listAuditLogs
  app.get('/audit/logs',
    authMiddleware({ roles: ["admin", "support"] }),
    zValidator('query', validators.ListAuditLogsQuery, validationErrorHandler),
    async (ctx) => {
      return registry.listAuditLogs(ctx);
    }
  );

  // createChatRoom
  app.post('/comms/chat-rooms',
    authMiddleware({ roles: ["user"] }),
    zValidator('json', validators.CreateChatRoomBody, validationErrorHandler),
    async (ctx) => {
      return registry.createChatRoom(ctx);
    }
  );

  // listChatRooms
  app.get('/comms/chat-rooms',
    authMiddleware({ roles: ["user:participant"] }),
    zValidator('query', validators.ListChatRoomsQuery, validationErrorHandler),
    async (ctx) => {
      return registry.listChatRooms(ctx);
    }
  );

  // getChatRoom
  app.get('/comms/chat-rooms/:room',
    authMiddleware({ roles: ["user:participant"] }),
    zValidator('param', validators.GetChatRoomParams, validationErrorHandler),
    async (ctx) => {
      return registry.getChatRoom(ctx);
    }
  );

  // getChatMessages
  app.get('/comms/chat-rooms/:room/messages',
    authMiddleware({ roles: ["user:participant"] }),
    zValidator('param', validators.GetChatMessagesParams, validationErrorHandler),
    zValidator('query', validators.GetChatMessagesQuery, validationErrorHandler),
    async (ctx) => {
      return registry.getChatMessages(ctx);
    }
  );

  // sendChatMessage
  app.post('/comms/chat-rooms/:room/messages',
    authMiddleware({ roles: ["user:participant"] }),
    zValidator('param', validators.SendChatMessageParams, validationErrorHandler),
    zValidator('json', validators.SendChatMessageBody, validationErrorHandler),
    async (ctx) => {
      return registry.sendChatMessage(ctx);
    }
  );

  // endVideoCall
  app.post('/comms/chat-rooms/:room/video-call/end',
    authMiddleware({ roles: ["user:admin"] }),
    zValidator('param', validators.EndVideoCallParams, validationErrorHandler),
    async (ctx) => {
      return registry.endVideoCall(ctx);
    }
  );

  // joinVideoCall
  app.post('/comms/chat-rooms/:room/video-call/join',
    authMiddleware({ roles: ["user:participant"] }),
    zValidator('param', validators.JoinVideoCallParams, validationErrorHandler),
    zValidator('json', validators.JoinVideoCallBody, validationErrorHandler),
    async (ctx) => {
      return registry.joinVideoCall(ctx);
    }
  );

  // leaveVideoCall
  app.post('/comms/chat-rooms/:room/video-call/leave',
    authMiddleware({ roles: ["user:participant"] }),
    zValidator('param', validators.LeaveVideoCallParams, validationErrorHandler),
    async (ctx) => {
      return registry.leaveVideoCall(ctx);
    }
  );

  // updateVideoCallParticipant
  app.patch('/comms/chat-rooms/:room/video-call/participant',
    authMiddleware({ roles: ["user:participant"] }),
    zValidator('param', validators.UpdateVideoCallParticipantParams, validationErrorHandler),
    zValidator('json', validators.UpdateVideoCallParticipantBody, validationErrorHandler),
    async (ctx) => {
      return registry.updateVideoCallParticipant(ctx);
    }
  );

  // getIceServers
  app.get('/comms/ice-servers',
    authMiddleware({ roles: ["user"] }),
    async (ctx) => {
      return registry.getIceServers(ctx);
    }
  );

  // listEmailQueueItems
  app.get('/email/queue',
    authMiddleware({ roles: ["admin"] }),
    zValidator('query', validators.ListEmailQueueItemsQuery, validationErrorHandler),
    async (ctx) => {
      return registry.listEmailQueueItems(ctx);
    }
  );

  // getEmailQueueItem
  app.get('/email/queue/:queue',
    authMiddleware({ roles: ["admin"] }),
    zValidator('param', validators.GetEmailQueueItemParams, validationErrorHandler),
    async (ctx) => {
      return registry.getEmailQueueItem(ctx);
    }
  );

  // cancelEmailQueueItem
  app.post('/email/queue/:queue/cancel',
    authMiddleware({ roles: ["admin"] }),
    zValidator('param', validators.CancelEmailQueueItemParams, validationErrorHandler),
    zValidator('json', validators.CancelEmailQueueItemBody, validationErrorHandler),
    async (ctx) => {
      return registry.cancelEmailQueueItem(ctx);
    }
  );

  // retryEmailQueueItem
  app.post('/email/queue/:queue/retry',
    authMiddleware({ roles: ["admin"] }),
    zValidator('param', validators.RetryEmailQueueItemParams, validationErrorHandler),
    async (ctx) => {
      return registry.retryEmailQueueItem(ctx);
    }
  );

  // listEmailTemplates
  app.get('/email/templates',
    authMiddleware({ roles: ["admin"] }),
    zValidator('query', validators.ListEmailTemplatesQuery, validationErrorHandler),
    async (ctx) => {
      return registry.listEmailTemplates(ctx);
    }
  );

  // createEmailTemplate
  app.post('/email/templates',
    authMiddleware({ roles: ["admin"] }),
    zValidator('json', validators.CreateEmailTemplateBody, validationErrorHandler),
    async (ctx) => {
      return registry.createEmailTemplate(ctx);
    }
  );

  // getEmailTemplate
  app.get('/email/templates/:template',
    authMiddleware({ roles: ["admin"] }),
    zValidator('param', validators.GetEmailTemplateParams, validationErrorHandler),
    async (ctx) => {
      return registry.getEmailTemplate(ctx);
    }
  );

  // updateEmailTemplate
  app.patch('/email/templates/:template',
    authMiddleware({ roles: ["admin"] }),
    zValidator('param', validators.UpdateEmailTemplateParams, validationErrorHandler),
    zValidator('json', validators.UpdateEmailTemplateBody, validationErrorHandler),
    async (ctx) => {
      return registry.updateEmailTemplate(ctx);
    }
  );

  // testEmailTemplate
  app.post('/email/templates/:template/test',
    authMiddleware({ roles: ["admin"] }),
    zValidator('param', validators.TestEmailTemplateParams, validationErrorHandler),
    zValidator('json', validators.TestEmailTemplateBody, validationErrorHandler),
    async (ctx) => {
      return registry.testEmailTemplate(ctx);
    }
  );

  // listNotifications
  app.get('/notifs',
    authMiddleware({ roles: ["user", "admin"] }),
    zValidator('query', validators.ListNotificationsQuery, validationErrorHandler),
    async (ctx) => {
      return registry.listNotifications(ctx);
    }
  );

  // markAllNotificationsAsRead
  app.post('/notifs/read-all',
    authMiddleware({ roles: ["user"] }),
    zValidator('query', validators.MarkAllNotificationsAsReadQuery, validationErrorHandler),
    async (ctx) => {
      return registry.markAllNotificationsAsRead(ctx);
    }
  );

  // getNotification
  app.get('/notifs/:notif',
    authMiddleware({ roles: ["user", "admin"] }),
    zValidator('param', validators.GetNotificationParams, validationErrorHandler),
    async (ctx) => {
      return registry.getNotification(ctx);
    }
  );

  // markNotificationAsRead
  app.post('/notifs/:notif/read',
    authMiddleware({ roles: ["user"] }),
    zValidator('param', validators.MarkNotificationAsReadParams, validationErrorHandler),
    async (ctx) => {
      return registry.markNotificationAsRead(ctx);
    }
  );

  // createPerson
  app.post('/persons',
    authMiddleware({ roles: ["user"] }),
    zValidator('json', validators.CreatePersonBody, validationErrorHandler),
    async (ctx) => {
      return registry.createPerson(ctx);
    }
  );

  // listPersons
  app.get('/persons',
    authMiddleware({ roles: ["admin", "support"] }),
    zValidator('query', validators.ListPersonsQuery, validationErrorHandler),
    async (ctx) => {
      return registry.listPersons(ctx);
    }
  );

  // getPerson
  app.get('/persons/:person',
    authMiddleware({ roles: ["admin", "support", "user:owner"] }),
    zValidator('param', validators.GetPersonParams, validationErrorHandler),
    async (ctx) => {
      return registry.getPerson(ctx);
    }
  );

  // updatePerson
  app.patch('/persons/:person',
    authMiddleware({ roles: ["user:owner"] }),
    zValidator('param', validators.UpdatePersonParams, validationErrorHandler),
    zValidator('json', validators.UpdatePersonBody, validationErrorHandler),
    async (ctx) => {
      return registry.updatePerson(ctx);
    }
  );

  // listFiles
  app.get('/storage/files',
    authMiddleware(),
    zValidator('query', validators.ListFilesQuery, validationErrorHandler),
    async (ctx) => {
      return registry.listFiles(ctx);
    }
  );

  // uploadFile
  app.post('/storage/files/upload',
    authMiddleware({ roles: ["user"] }),
    zValidator('json', validators.UploadFileBody, validationErrorHandler),
    async (ctx) => {
      return registry.uploadFile(ctx);
    }
  );

  // getFile
  app.get('/storage/files/:file',
    authMiddleware({ roles: ["admin", "user:owner"] }),
    zValidator('param', validators.GetFileParams, validationErrorHandler),
    async (ctx) => {
      return registry.getFile(ctx);
    }
  );

  // deleteFile
  app.delete('/storage/files/:file',
    authMiddleware({ roles: ["user:owner"] }),
    zValidator('param', validators.DeleteFileParams, validationErrorHandler),
    async (ctx) => {
      return registry.deleteFile(ctx);
    }
  );

  // completeFileUpload
  app.post('/storage/files/:file/complete',
    authMiddleware({ roles: ["user:owner"] }),
    zValidator('param', validators.CompleteFileUploadParams, validationErrorHandler),
    async (ctx) => {
      return registry.completeFileUpload(ctx);
    }
  );

  // getFileDownload
  app.get('/storage/files/:file/download',
    authMiddleware({ roles: ["admin", "user:owner"] }),
    zValidator('param', validators.GetFileDownloadParams, validationErrorHandler),
    async (ctx) => {
      return registry.getFileDownload(ctx);
    }
  );

}