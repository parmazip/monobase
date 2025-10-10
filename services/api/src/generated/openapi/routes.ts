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

  // createInvoice
  app.post('/billing/invoices',
    authMiddleware(),
    zValidator('json', validators.CreateInvoiceBody, validationErrorHandler),
    async (ctx) => {
      return registry.createInvoice(ctx);
    }
  );

  // listInvoices
  app.get('/billing/invoices',
    authMiddleware(),
    zValidator('query', validators.ListInvoicesQuery, validationErrorHandler),
    async (ctx) => {
      return registry.listInvoices(ctx);
    }
  );

  // getInvoice
  app.get('/billing/invoices/:invoice',
    authMiddleware(),
    zValidator('param', validators.GetInvoiceParams, validationErrorHandler),
    async (ctx) => {
      return registry.getInvoice(ctx);
    }
  );

  // updateInvoice
  app.patch('/billing/invoices/:invoice',
    authMiddleware(),
    zValidator('param', validators.UpdateInvoiceParams, validationErrorHandler),
    zValidator('json', validators.UpdateInvoiceBody, validationErrorHandler),
    async (ctx) => {
      return registry.updateInvoice(ctx);
    }
  );

  // deleteInvoice
  app.delete('/billing/invoices/:invoice',
    authMiddleware(),
    zValidator('param', validators.DeleteInvoiceParams, validationErrorHandler),
    async (ctx) => {
      return registry.deleteInvoice(ctx);
    }
  );

  // captureInvoicePayment
  app.post('/billing/invoices/:invoice/capture',
    authMiddleware(),
    zValidator('param', validators.CaptureInvoicePaymentParams, validationErrorHandler),
    async (ctx) => {
      return registry.captureInvoicePayment(ctx);
    }
  );

  // finalizeInvoice
  app.post('/billing/invoices/:invoice/finalize',
    authMiddleware(),
    zValidator('param', validators.FinalizeInvoiceParams, validationErrorHandler),
    async (ctx) => {
      return registry.finalizeInvoice(ctx);
    }
  );

  // markInvoiceUncollectible
  app.post('/billing/invoices/:invoice/mark-uncollectible',
    authMiddleware(),
    zValidator('param', validators.MarkInvoiceUncollectibleParams, validationErrorHandler),
    async (ctx) => {
      return registry.markInvoiceUncollectible(ctx);
    }
  );

  // payInvoice
  app.post('/billing/invoices/:invoice/pay',
    authMiddleware(),
    zValidator('param', validators.PayInvoiceParams, validationErrorHandler),
    zValidator('json', validators.PayInvoiceBody, validationErrorHandler),
    async (ctx) => {
      return registry.payInvoice(ctx);
    }
  );

  // refundInvoicePayment
  app.post('/billing/invoices/:invoice/refund',
    authMiddleware(),
    zValidator('param', validators.RefundInvoicePaymentParams, validationErrorHandler),
    zValidator('json', validators.RefundInvoicePaymentBody, validationErrorHandler),
    async (ctx) => {
      return registry.refundInvoicePayment(ctx);
    }
  );

  // voidInvoice
  app.post('/billing/invoices/:invoice/void',
    authMiddleware(),
    zValidator('param', validators.VoidInvoiceParams, validationErrorHandler),
    async (ctx) => {
      return registry.voidInvoice(ctx);
    }
  );

  // createMerchantAccount
  app.post('/billing/merchant-accounts',
    authMiddleware(),
    zValidator('json', validators.CreateMerchantAccountBody, validationErrorHandler),
    async (ctx) => {
      return registry.createMerchantAccount(ctx);
    }
  );

  // getMerchantAccount
  app.get('/billing/merchant-accounts/:merchantAccount',
    authMiddleware(),
    zValidator('param', validators.GetMerchantAccountParams, validationErrorHandler),
    async (ctx) => {
      return registry.getMerchantAccount(ctx);
    }
  );

  // getMerchantDashboard
  app.post('/billing/merchant-accounts/:merchantAccount/dashboard',
    authMiddleware(),
    zValidator('param', validators.GetMerchantDashboardParams, validationErrorHandler),
    async (ctx) => {
      return registry.getMerchantDashboard(ctx);
    }
  );

  // onboardMerchantAccount
  app.post('/billing/merchant-accounts/:merchantAccount/onboard',
    authMiddleware(),
    zValidator('param', validators.OnboardMerchantAccountParams, validationErrorHandler),
    zValidator('json', validators.OnboardMerchantAccountBody, validationErrorHandler),
    async (ctx) => {
      return registry.onboardMerchantAccount(ctx);
    }
  );

  // handleStripeWebhook
  app.post('/billing/webhooks/stripe',
    zValidator('json', validators.HandleStripeWebhookBody, validationErrorHandler),
    async (ctx) => {
      return registry.handleStripeWebhook(ctx);
    }
  );

  // createBooking
  app.post('/booking/bookings',
    authMiddleware({ roles: ["user"] }),
    zValidator('json', validators.CreateBookingBody, validationErrorHandler),
    async (ctx) => {
      return registry.createBooking(ctx);
    }
  );

  // listBookings
  app.get('/booking/bookings',
    authMiddleware({ roles: ["client:owner", "provider:owner", "admin", "support"] }),
    zValidator('query', validators.ListBookingsQuery, validationErrorHandler),
    async (ctx) => {
      return registry.listBookings(ctx);
    }
  );

  // getBooking
  app.get('/booking/bookings/:booking',
    authMiddleware({ roles: ["client:owner", "provider:owner", "admin", "support"] }),
    zValidator('param', validators.GetBookingParams, validationErrorHandler),
    zValidator('query', validators.GetBookingQuery, validationErrorHandler),
    async (ctx) => {
      return registry.getBooking(ctx);
    }
  );

  // cancelBooking
  app.post('/booking/bookings/:booking/cancel',
    authMiddleware({ roles: ["client:owner", "provider:owner", "admin"] }),
    zValidator('param', validators.CancelBookingParams, validationErrorHandler),
    zValidator('json', validators.CancelBookingBody, validationErrorHandler),
    async (ctx) => {
      return registry.cancelBooking(ctx);
    }
  );

  // confirmBooking
  app.post('/booking/bookings/:booking/confirm',
    authMiddleware({ roles: ["provider:owner", "admin"] }),
    zValidator('param', validators.ConfirmBookingParams, validationErrorHandler),
    zValidator('json', validators.ConfirmBookingBody, validationErrorHandler),
    async (ctx) => {
      return registry.confirmBooking(ctx);
    }
  );

  // markNoShowBooking
  app.post('/booking/bookings/:booking/no-show',
    authMiddleware({ roles: ["client:owner", "provider:owner", "admin"] }),
    zValidator('param', validators.MarkNoShowBookingParams, validationErrorHandler),
    zValidator('json', validators.MarkNoShowBookingBody, validationErrorHandler),
    async (ctx) => {
      return registry.markNoShowBooking(ctx);
    }
  );

  // rejectBooking
  app.post('/booking/bookings/:booking/reject',
    authMiddleware({ roles: ["provider:owner", "admin"] }),
    zValidator('param', validators.RejectBookingParams, validationErrorHandler),
    zValidator('json', validators.RejectBookingBody, validationErrorHandler),
    async (ctx) => {
      return registry.rejectBooking(ctx);
    }
  );

  // listBookingEvents
  app.get('/booking/events',
    zValidator('query', validators.ListBookingEventsQuery, validationErrorHandler),
    async (ctx) => {
      return registry.listBookingEvents(ctx);
    }
  );

  // createBookingEvent
  app.post('/booking/events',
    authMiddleware({ roles: ["user"] }),
    zValidator('json', validators.CreateBookingEventBody, validationErrorHandler),
    async (ctx) => {
      return registry.createBookingEvent(ctx);
    }
  );

  // getBookingEvent
  app.get('/booking/events/:event',
    zValidator('param', validators.GetBookingEventParams, validationErrorHandler),
    zValidator('query', validators.GetBookingEventQuery, validationErrorHandler),
    async (ctx) => {
      return registry.getBookingEvent(ctx);
    }
  );

  // updateBookingEvent
  app.patch('/booking/events/:event',
    authMiddleware({ roles: ["event:owner", "admin"] }),
    zValidator('param', validators.UpdateBookingEventParams, validationErrorHandler),
    zValidator('json', validators.UpdateBookingEventBody, validationErrorHandler),
    async (ctx) => {
      return registry.updateBookingEvent(ctx);
    }
  );

  // deleteBookingEvent
  app.delete('/booking/events/:event',
    authMiddleware({ roles: ["event:owner", "admin"] }),
    zValidator('param', validators.DeleteBookingEventParams, validationErrorHandler),
    async (ctx) => {
      return registry.deleteBookingEvent(ctx);
    }
  );

  // createScheduleException
  app.post('/booking/events/:event/exceptions',
    authMiddleware({ roles: ["event:owner", "admin"] }),
    zValidator('param', validators.CreateScheduleExceptionParams, validationErrorHandler),
    zValidator('json', validators.CreateScheduleExceptionBody, validationErrorHandler),
    async (ctx) => {
      return registry.createScheduleException(ctx);
    }
  );

  // listScheduleExceptions
  app.get('/booking/events/:event/exceptions',
    authMiddleware({ roles: ["event:owner", "admin", "support"] }),
    zValidator('param', validators.ListScheduleExceptionsParams, validationErrorHandler),
    zValidator('query', validators.ListScheduleExceptionsQuery, validationErrorHandler),
    async (ctx) => {
      return registry.listScheduleExceptions(ctx);
    }
  );

  // getScheduleException
  app.get('/booking/events/:event/exceptions/:exception',
    authMiddleware({ roles: ["event:owner", "admin", "support"] }),
    zValidator('param', validators.GetScheduleExceptionParams, validationErrorHandler),
    async (ctx) => {
      return registry.getScheduleException(ctx);
    }
  );

  // deleteScheduleException
  app.delete('/booking/events/:event/exceptions/:exception',
    authMiddleware({ roles: ["event:owner", "admin"] }),
    zValidator('param', validators.DeleteScheduleExceptionParams, validationErrorHandler),
    async (ctx) => {
      return registry.deleteScheduleException(ctx);
    }
  );

  // getTimeSlot
  app.get('/booking/slots/:slotId',
    zValidator('param', validators.GetTimeSlotParams, validationErrorHandler),
    zValidator('query', validators.GetTimeSlotQuery, validationErrorHandler),
    async (ctx) => {
      return registry.getTimeSlot(ctx);
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