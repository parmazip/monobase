import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import * as validators from './validators';
import { registry } from './registry';
import { authMiddleware } from '@/middleware/auth';
import { validationErrorHandler } from '@/middleware/validation';
import { createExpandMiddleware } from '@/middleware/expand';

export function registerRoutes(app: Hono) {
  // listAuditLogs
  app.get('/audit/logs',
    authMiddleware({ roles: ["admin", "support"] }),
    zValidator('query', validators.ListAuditLogsQuery, validationErrorHandler),
    registry.listAuditLogs
  );

  // createInvoice
  app.post('/billing/invoices',
    authMiddleware(),
    zValidator('json', validators.CreateInvoiceBody, validationErrorHandler),
    createExpandMiddleware("Invoice"),
    registry.createInvoice
  );

  // listInvoices
  app.get('/billing/invoices',
    authMiddleware(),
    zValidator('query', validators.ListInvoicesQuery, validationErrorHandler),
    registry.listInvoices
  );

  // getInvoice
  app.get('/billing/invoices/:invoice',
    authMiddleware(),
    zValidator('param', validators.GetInvoiceParams, validationErrorHandler),
    zValidator('query', validators.GetInvoiceQuery, validationErrorHandler),
    createExpandMiddleware("Invoice"),
    registry.getInvoice
  );

  // updateInvoice
  app.patch('/billing/invoices/:invoice',
    authMiddleware(),
    zValidator('param', validators.UpdateInvoiceParams, validationErrorHandler),
    zValidator('json', validators.UpdateInvoiceBody, validationErrorHandler),
    createExpandMiddleware("Invoice"),
    registry.updateInvoice
  );

  // deleteInvoice
  app.delete('/billing/invoices/:invoice',
    authMiddleware(),
    zValidator('param', validators.DeleteInvoiceParams, validationErrorHandler),
    registry.deleteInvoice
  );

  // captureInvoicePayment
  app.post('/billing/invoices/:invoice/capture',
    authMiddleware(),
    zValidator('param', validators.CaptureInvoicePaymentParams, validationErrorHandler),
    createExpandMiddleware("Invoice"),
    registry.captureInvoicePayment
  );

  // finalizeInvoice
  app.post('/billing/invoices/:invoice/finalize',
    authMiddleware(),
    zValidator('param', validators.FinalizeInvoiceParams, validationErrorHandler),
    createExpandMiddleware("Invoice"),
    registry.finalizeInvoice
  );

  // markInvoiceUncollectible
  app.post('/billing/invoices/:invoice/mark-uncollectible',
    authMiddleware(),
    zValidator('param', validators.MarkInvoiceUncollectibleParams, validationErrorHandler),
    createExpandMiddleware("Invoice"),
    registry.markInvoiceUncollectible
  );

  // payInvoice
  app.post('/billing/invoices/:invoice/pay',
    authMiddleware(),
    zValidator('param', validators.PayInvoiceParams, validationErrorHandler),
    zValidator('json', validators.PayInvoiceBody, validationErrorHandler),
    registry.payInvoice
  );

  // refundInvoicePayment
  app.post('/billing/invoices/:invoice/refund',
    authMiddleware(),
    zValidator('param', validators.RefundInvoicePaymentParams, validationErrorHandler),
    zValidator('json', validators.RefundInvoicePaymentBody, validationErrorHandler),
    registry.refundInvoicePayment
  );

  // voidInvoice
  app.post('/billing/invoices/:invoice/void',
    authMiddleware(),
    zValidator('param', validators.VoidInvoiceParams, validationErrorHandler),
    createExpandMiddleware("Invoice"),
    registry.voidInvoice
  );

  // createMerchantAccount
  app.post('/billing/merchant-accounts',
    authMiddleware(),
    zValidator('json', validators.CreateMerchantAccountBody, validationErrorHandler),
    createExpandMiddleware("MerchantAccount"),
    registry.createMerchantAccount
  );

  // getMerchantAccount
  app.get('/billing/merchant-accounts/:merchantAccount',
    authMiddleware(),
    zValidator('param', validators.GetMerchantAccountParams, validationErrorHandler),
    zValidator('query', validators.GetMerchantAccountQuery, validationErrorHandler),
    createExpandMiddleware("MerchantAccount"),
    registry.getMerchantAccount
  );

  // getMerchantDashboard
  app.post('/billing/merchant-accounts/:merchantAccount/dashboard',
    authMiddleware(),
    zValidator('param', validators.GetMerchantDashboardParams, validationErrorHandler),
    registry.getMerchantDashboard
  );

  // onboardMerchantAccount
  app.post('/billing/merchant-accounts/:merchantAccount/onboard',
    authMiddleware(),
    zValidator('param', validators.OnboardMerchantAccountParams, validationErrorHandler),
    zValidator('json', validators.OnboardMerchantAccountBody, validationErrorHandler),
    registry.onboardMerchantAccount
  );

  // handleStripeWebhook
  app.post('/billing/webhooks/stripe',
    zValidator('json', validators.HandleStripeWebhookBody, validationErrorHandler),
    registry.handleStripeWebhook
  );

  // createBooking
  app.post('/booking/bookings',
    authMiddleware({ roles: ["user"] }),
    zValidator('json', validators.CreateBookingBody, validationErrorHandler),
    registry.createBooking
  );

  // listBookings
  app.get('/booking/bookings',
    authMiddleware({ roles: ["client:owner", "provider:owner", "admin", "support"] }),
    zValidator('query', validators.ListBookingsQuery, validationErrorHandler),
    registry.listBookings
  );

  // getBooking
  app.get('/booking/bookings/:booking',
    authMiddleware({ roles: ["client:owner", "provider:owner", "admin", "support"] }),
    zValidator('param', validators.GetBookingParams, validationErrorHandler),
    zValidator('query', validators.GetBookingQuery, validationErrorHandler),
    registry.getBooking
  );

  // cancelBooking
  app.post('/booking/bookings/:booking/cancel',
    authMiddleware({ roles: ["client:owner", "provider:owner", "admin"] }),
    zValidator('param', validators.CancelBookingParams, validationErrorHandler),
    zValidator('json', validators.CancelBookingBody, validationErrorHandler),
    registry.cancelBooking
  );

  // confirmBooking
  app.post('/booking/bookings/:booking/confirm',
    authMiddleware({ roles: ["provider:owner", "admin"] }),
    zValidator('param', validators.ConfirmBookingParams, validationErrorHandler),
    zValidator('json', validators.ConfirmBookingBody, validationErrorHandler),
    registry.confirmBooking
  );

  // markNoShowBooking
  app.post('/booking/bookings/:booking/no-show',
    authMiddleware({ roles: ["client:owner", "provider:owner", "admin"] }),
    zValidator('param', validators.MarkNoShowBookingParams, validationErrorHandler),
    zValidator('json', validators.MarkNoShowBookingBody, validationErrorHandler),
    registry.markNoShowBooking
  );

  // rejectBooking
  app.post('/booking/bookings/:booking/reject',
    authMiddleware({ roles: ["provider:owner", "admin"] }),
    zValidator('param', validators.RejectBookingParams, validationErrorHandler),
    zValidator('json', validators.RejectBookingBody, validationErrorHandler),
    registry.rejectBooking
  );

  // listBookingEvents
  app.get('/booking/events',
    zValidator('query', validators.ListBookingEventsQuery, validationErrorHandler),
    registry.listBookingEvents
  );

  // createBookingEvent
  app.post('/booking/events',
    authMiddleware({ roles: ["user"] }),
    zValidator('json', validators.CreateBookingEventBody, validationErrorHandler),
    registry.createBookingEvent
  );

  // getBookingEvent
  app.get('/booking/events/:event',
    authMiddleware({ required: false }),
    zValidator('param', validators.GetBookingEventParams, validationErrorHandler),
    zValidator('query', validators.GetBookingEventQuery, validationErrorHandler),
    registry.getBookingEvent
  );

  // updateBookingEvent
  app.patch('/booking/events/:event',
    authMiddleware({ roles: ["event:owner", "admin"] }),
    zValidator('param', validators.UpdateBookingEventParams, validationErrorHandler),
    zValidator('json', validators.UpdateBookingEventBody, validationErrorHandler),
    registry.updateBookingEvent
  );

  // deleteBookingEvent
  app.delete('/booking/events/:event',
    authMiddleware({ roles: ["event:owner", "admin"] }),
    zValidator('param', validators.DeleteBookingEventParams, validationErrorHandler),
    registry.deleteBookingEvent
  );

  // createScheduleException
  app.post('/booking/events/:event/exceptions',
    authMiddleware({ roles: ["event:owner", "admin"] }),
    zValidator('param', validators.CreateScheduleExceptionParams, validationErrorHandler),
    zValidator('json', validators.CreateScheduleExceptionBody, validationErrorHandler),
    registry.createScheduleException
  );

  // listScheduleExceptions
  app.get('/booking/events/:event/exceptions',
    authMiddleware({ roles: ["event:owner", "admin", "support"] }),
    zValidator('param', validators.ListScheduleExceptionsParams, validationErrorHandler),
    zValidator('query', validators.ListScheduleExceptionsQuery, validationErrorHandler),
    registry.listScheduleExceptions
  );

  // getScheduleException
  app.get('/booking/events/:event/exceptions/:exception',
    authMiddleware({ roles: ["event:owner", "admin", "support"] }),
    zValidator('param', validators.GetScheduleExceptionParams, validationErrorHandler),
    registry.getScheduleException
  );

  // deleteScheduleException
  app.delete('/booking/events/:event/exceptions/:exception',
    authMiddleware({ roles: ["event:owner", "admin"] }),
    zValidator('param', validators.DeleteScheduleExceptionParams, validationErrorHandler),
    registry.deleteScheduleException
  );

  // getTimeSlot
  app.get('/booking/slots/:slotId',
    zValidator('param', validators.GetTimeSlotParams, validationErrorHandler),
    zValidator('query', validators.GetTimeSlotQuery, validationErrorHandler),
    registry.getTimeSlot
  );

  // createChatRoom
  app.post('/comms/chat-rooms',
    authMiddleware({ roles: ["user"] }),
    zValidator('json', validators.CreateChatRoomBody, validationErrorHandler),
    registry.createChatRoom
  );

  // listChatRooms
  app.get('/comms/chat-rooms',
    authMiddleware({ roles: ["user:participant"] }),
    zValidator('query', validators.ListChatRoomsQuery, validationErrorHandler),
    registry.listChatRooms
  );

  // getChatRoom
  app.get('/comms/chat-rooms/:room',
    authMiddleware({ roles: ["user:participant"] }),
    zValidator('param', validators.GetChatRoomParams, validationErrorHandler),
    registry.getChatRoom
  );

  // getChatMessages
  app.get('/comms/chat-rooms/:room/messages',
    authMiddleware({ roles: ["user:participant"] }),
    zValidator('param', validators.GetChatMessagesParams, validationErrorHandler),
    zValidator('query', validators.GetChatMessagesQuery, validationErrorHandler),
    registry.getChatMessages
  );

  // sendChatMessage
  app.post('/comms/chat-rooms/:room/messages',
    authMiddleware({ roles: ["user:participant"] }),
    zValidator('param', validators.SendChatMessageParams, validationErrorHandler),
    zValidator('json', validators.SendChatMessageBody, validationErrorHandler),
    registry.sendChatMessage
  );

  // endVideoCall
  app.post('/comms/chat-rooms/:room/video-call/end',
    authMiddleware({ roles: ["user:admin"] }),
    zValidator('param', validators.EndVideoCallParams, validationErrorHandler),
    registry.endVideoCall
  );

  // joinVideoCall
  app.post('/comms/chat-rooms/:room/video-call/join',
    authMiddleware({ roles: ["user:participant"] }),
    zValidator('param', validators.JoinVideoCallParams, validationErrorHandler),
    zValidator('json', validators.JoinVideoCallBody, validationErrorHandler),
    registry.joinVideoCall
  );

  // leaveVideoCall
  app.post('/comms/chat-rooms/:room/video-call/leave',
    authMiddleware({ roles: ["user:participant"] }),
    zValidator('param', validators.LeaveVideoCallParams, validationErrorHandler),
    registry.leaveVideoCall
  );

  // updateVideoCallParticipant
  app.patch('/comms/chat-rooms/:room/video-call/participant',
    authMiddleware({ roles: ["user:participant"] }),
    zValidator('param', validators.UpdateVideoCallParticipantParams, validationErrorHandler),
    zValidator('json', validators.UpdateVideoCallParticipantBody, validationErrorHandler),
    registry.updateVideoCallParticipant
  );

  // getIceServers
  app.get('/comms/ice-servers',
    authMiddleware({ roles: ["user"] }),
    registry.getIceServers
  );

  // listEmailQueueItems
  app.get('/email/queue',
    authMiddleware({ roles: ["admin"] }),
    zValidator('query', validators.ListEmailQueueItemsQuery, validationErrorHandler),
    registry.listEmailQueueItems
  );

  // getEmailQueueItem
  app.get('/email/queue/:queue',
    authMiddleware({ roles: ["admin"] }),
    zValidator('param', validators.GetEmailQueueItemParams, validationErrorHandler),
    registry.getEmailQueueItem
  );

  // cancelEmailQueueItem
  app.post('/email/queue/:queue/cancel',
    authMiddleware({ roles: ["admin"] }),
    zValidator('param', validators.CancelEmailQueueItemParams, validationErrorHandler),
    zValidator('json', validators.CancelEmailQueueItemBody, validationErrorHandler),
    registry.cancelEmailQueueItem
  );

  // retryEmailQueueItem
  app.post('/email/queue/:queue/retry',
    authMiddleware({ roles: ["admin"] }),
    zValidator('param', validators.RetryEmailQueueItemParams, validationErrorHandler),
    registry.retryEmailQueueItem
  );

  // listEmailTemplates
  app.get('/email/templates',
    authMiddleware({ roles: ["admin"] }),
    zValidator('query', validators.ListEmailTemplatesQuery, validationErrorHandler),
    registry.listEmailTemplates
  );

  // createEmailTemplate
  app.post('/email/templates',
    authMiddleware({ roles: ["admin"] }),
    zValidator('json', validators.CreateEmailTemplateBody, validationErrorHandler),
    registry.createEmailTemplate
  );

  // getEmailTemplate
  app.get('/email/templates/:template',
    authMiddleware({ roles: ["admin"] }),
    zValidator('param', validators.GetEmailTemplateParams, validationErrorHandler),
    registry.getEmailTemplate
  );

  // updateEmailTemplate
  app.patch('/email/templates/:template',
    authMiddleware({ roles: ["admin"] }),
    zValidator('param', validators.UpdateEmailTemplateParams, validationErrorHandler),
    zValidator('json', validators.UpdateEmailTemplateBody, validationErrorHandler),
    registry.updateEmailTemplate
  );

  // testEmailTemplate
  app.post('/email/templates/:template/test',
    authMiddleware({ roles: ["admin"] }),
    zValidator('param', validators.TestEmailTemplateParams, validationErrorHandler),
    zValidator('json', validators.TestEmailTemplateBody, validationErrorHandler),
    registry.testEmailTemplate
  );

  // listNotifications
  app.get('/notifs',
    authMiddleware({ roles: ["user", "admin"] }),
    zValidator('query', validators.ListNotificationsQuery, validationErrorHandler),
    registry.listNotifications
  );

  // markAllNotificationsAsRead
  app.post('/notifs/read-all',
    authMiddleware({ roles: ["user"] }),
    zValidator('query', validators.MarkAllNotificationsAsReadQuery, validationErrorHandler),
    registry.markAllNotificationsAsRead
  );

  // getNotification
  app.get('/notifs/:notif',
    authMiddleware({ roles: ["user", "admin"] }),
    zValidator('param', validators.GetNotificationParams, validationErrorHandler),
    registry.getNotification
  );

  // markNotificationAsRead
  app.post('/notifs/:notif/read',
    authMiddleware({ roles: ["user"] }),
    zValidator('param', validators.MarkNotificationAsReadParams, validationErrorHandler),
    registry.markNotificationAsRead
  );

  // createPerson
  app.post('/persons',
    authMiddleware({ roles: ["user"] }),
    zValidator('json', validators.CreatePersonBody, validationErrorHandler),
    registry.createPerson
  );

  // listPersons
  app.get('/persons',
    authMiddleware({ roles: ["admin", "support"] }),
    zValidator('query', validators.ListPersonsQuery, validationErrorHandler),
    registry.listPersons
  );

  // getPerson
  app.get('/persons/:person',
    authMiddleware({ roles: ["admin", "support", "user:owner"] }),
    zValidator('param', validators.GetPersonParams, validationErrorHandler),
    registry.getPerson
  );

  // updatePerson
  app.patch('/persons/:person',
    authMiddleware({ roles: ["user:owner"] }),
    zValidator('param', validators.UpdatePersonParams, validationErrorHandler),
    zValidator('json', validators.UpdatePersonBody, validationErrorHandler),
    registry.updatePerson
  );

  // createReview
  app.post('/reviews/',
    authMiddleware({ roles: ["user"] }),
    zValidator('json', validators.CreateReviewBody, validationErrorHandler),
    registry.createReview
  );

  // listReviews
  app.get('/reviews/',
    authMiddleware({ roles: ["user"] }),
    zValidator('query', validators.ListReviewsQuery, validationErrorHandler),
    registry.listReviews
  );

  // getReview
  app.get('/reviews/:review',
    authMiddleware({ roles: ["user"] }),
    zValidator('param', validators.GetReviewParams, validationErrorHandler),
    registry.getReview
  );

  // deleteReview
  app.delete('/reviews/:review',
    authMiddleware({ roles: ["review:owner", "admin"] }),
    zValidator('param', validators.DeleteReviewParams, validationErrorHandler),
    registry.deleteReview
  );

  // listFiles
  app.get('/storage/files',
    authMiddleware(),
    zValidator('query', validators.ListFilesQuery, validationErrorHandler),
    registry.listFiles
  );

  // uploadFile
  app.post('/storage/files/upload',
    authMiddleware({ roles: ["user"] }),
    zValidator('json', validators.UploadFileBody, validationErrorHandler),
    registry.uploadFile
  );

  // getFile
  app.get('/storage/files/:file',
    authMiddleware({ roles: ["admin", "user:owner"] }),
    zValidator('param', validators.GetFileParams, validationErrorHandler),
    registry.getFile
  );

  // deleteFile
  app.delete('/storage/files/:file',
    authMiddleware({ roles: ["user:owner"] }),
    zValidator('param', validators.DeleteFileParams, validationErrorHandler),
    registry.deleteFile
  );

  // completeFileUpload
  app.post('/storage/files/:file/complete',
    authMiddleware({ roles: ["user:owner"] }),
    zValidator('param', validators.CompleteFileUploadParams, validationErrorHandler),
    registry.completeFileUpload
  );

  // getFileDownload
  app.get('/storage/files/:file/download',
    authMiddleware({ roles: ["admin", "user:owner"] }),
    zValidator('param', validators.GetFileDownloadParams, validationErrorHandler),
    registry.getFileDownload
  );

}