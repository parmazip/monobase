/**
 * Handler registry - maps operationIds to handler functions
 * This file is regenerated on each run
 */

import { listAuditLogs } from '../../handlers/audit/listAuditLogs';
import { createChatRoom } from '../../handlers/comms/createChatRoom';
import { listChatRooms } from '../../handlers/comms/listChatRooms';
import { getChatRoom } from '../../handlers/comms/getChatRoom';
import { getChatMessages } from '../../handlers/comms/getChatMessages';
import { sendChatMessage } from '../../handlers/comms/sendChatMessage';
import { endVideoCall } from '../../handlers/comms/endVideoCall';
import { joinVideoCall } from '../../handlers/comms/joinVideoCall';
import { leaveVideoCall } from '../../handlers/comms/leaveVideoCall';
import { updateVideoCallParticipant } from '../../handlers/comms/updateVideoCallParticipant';
import { getIceServers } from '../../handlers/comms/getIceServers';
import { listEmailQueueItems } from '../../handlers/email/listEmailQueueItems';
import { getEmailQueueItem } from '../../handlers/email/getEmailQueueItem';
import { cancelEmailQueueItem } from '../../handlers/email/cancelEmailQueueItem';
import { retryEmailQueueItem } from '../../handlers/email/retryEmailQueueItem';
import { listEmailTemplates } from '../../handlers/email/listEmailTemplates';
import { createEmailTemplate } from '../../handlers/email/createEmailTemplate';
import { getEmailTemplate } from '../../handlers/email/getEmailTemplate';
import { updateEmailTemplate } from '../../handlers/email/updateEmailTemplate';
import { testEmailTemplate } from '../../handlers/email/testEmailTemplate';
import { listNotifications } from '../../handlers/notifs/listNotifications';
import { markAllNotificationsAsRead } from '../../handlers/notifs/markAllNotificationsAsRead';
import { getNotification } from '../../handlers/notifs/getNotification';
import { markNotificationAsRead } from '../../handlers/notifs/markNotificationAsRead';
import { createPerson } from '../../handlers/person/createPerson';
import { listPersons } from '../../handlers/person/listPersons';
import { getPerson } from '../../handlers/person/getPerson';
import { updatePerson } from '../../handlers/person/updatePerson';
import { listFiles } from '../../handlers/storage/listFiles';
import { uploadFile } from '../../handlers/storage/uploadFile';
import { getFile } from '../../handlers/storage/getFile';
import { deleteFile } from '../../handlers/storage/deleteFile';
import { completeFileUpload } from '../../handlers/storage/completeFileUpload';
import { getFileDownload } from '../../handlers/storage/getFileDownload';

export const registry = {
  // Audit handlers
  listAuditLogs,

  // Comms handlers
  createChatRoom,
  listChatRooms,
  getChatRoom,
  getChatMessages,
  sendChatMessage,
  endVideoCall,
  joinVideoCall,
  leaveVideoCall,
  updateVideoCallParticipant,
  getIceServers,

  // Email handlers
  listEmailQueueItems,
  getEmailQueueItem,
  cancelEmailQueueItem,
  retryEmailQueueItem,
  listEmailTemplates,
  createEmailTemplate,
  getEmailTemplate,
  updateEmailTemplate,
  testEmailTemplate,

  // Notifs handlers
  listNotifications,
  markAllNotificationsAsRead,
  getNotification,
  markNotificationAsRead,

  // Person handlers
  createPerson,
  listPersons,
  getPerson,
  updatePerson,

  // Storage handlers
  listFiles,
  uploadFile,
  getFile,
  deleteFile,
  completeFileUpload,
  getFileDownload,

};