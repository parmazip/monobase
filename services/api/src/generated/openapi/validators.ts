import { z } from 'zod';
import ISO6391 from 'iso-639-1';
import countries from 'i18n-iso-countries';
import { getTimeZones } from '@vvo/tzdb';
import { isValidPhoneNumber } from 'libphonenumber-js';

// Generated Zod validators from OpenAPI spec

// Healthcare validation helpers
const validateNPI = (npi: string): boolean => {
  // NPI validation algorithm (Luhn algorithm)
  const digits = npi.split("").map(Number);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let digit = digits[i];
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return (10 - (sum % 10)) % 10 === digits[9];
};

const containsPHI = (value: string): boolean => {
  // Basic PHI detection patterns
  const phiPatterns = [
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card
    /\b[A-Z]{2}\d{6}[A-Z]\b/, // Medical record patterns
  ];
  return phiPatterns.some(pattern => pattern.test(value));
};

// International data validation helpers
const validateLanguageCode = (code: string): boolean => {
  return ISO6391.validate(code);
};

const validateCountryCode = (code: string): boolean => {
  return countries.isValid(code);
};

const validatePhoneNumber = (phone: string): boolean => {
  try {
    // libphonenumber-js validates E.164 format and country-specific rules
    return isValidPhoneNumber(phone);
  } catch {
    return false;
  }
};

const timezoneNames = getTimeZones().map(tz => tz.name);
const validateTimezone = (tz: string): boolean => {
  return timezoneNames.includes(tz);
};

export const CountryCodeSchema = z.string().regex(/^[A-Z]{2}$/).refine(val => validateCountryCode(val), { message: "Invalid ISO 3166-1 country code" });

export const GeoCoordinatesSchema = z.object({
  latitude: z.number().gte(-90).lte(90),
  longitude: z.number().gte(-180).lte(180),
  accuracy: z.number().gte(0).optional()
});

export const AddressSchema = z.object({
  street1: z.string().min(1).max(100),
  street2: z.string().max(100).optional(),
  city: z.string().min(1).max(50),
  state: z.string().min(1).max(50),
  postalCode: z.string().min(1).max(20),
  country: CountryCodeSchema,
  coordinates: GeoCoordinatesSchema.optional()
});

export const GeoCoordinatesUpdateSchema = z.object({
  latitude: z.number().gte(-90).lte(90).optional(),
  longitude: z.number().gte(-180).lte(180).optional(),
  accuracy: z.number().gte(0).optional()
});

export const AddressUpdateSchema = z.object({
  street1: z.string().min(1).max(100).optional(),
  street2: z.union([z.string().max(100), z.null()]).optional(),
  city: z.string().min(1).max(50).optional(),
  state: z.string().min(1).max(50).optional(),
  postalCode: z.string().min(1).max(20).optional(),
  country: CountryCodeSchema.optional(),
  coordinates: z.union([GeoCoordinatesUpdateSchema, z.null()]).optional()
});

export const AuditActionSchema = z.enum(["create", "read", "update", "delete", "login", "logout"]);

export const AuditCategorySchema = z.enum(["regulatory", "security", "privacy", "administrative", "domain", "financial"]);

export const AuditEventTypeSchema = z.enum(["authentication", "data-access", "data-modification", "system-config", "security", "compliance"]);

export const UUIDSchema = z.string().uuid();

export const AuditOutcomeSchema = z.enum(["success", "failure", "partial", "denied"]);

export const AuditRetentionStatusSchema = z.enum(["active", "archived", "pending-purge"]);

export const BaseEntitySchema = z.object({
  id: UUIDSchema,
  version: z.number().int(),
  createdAt: z.string().datetime().transform((str) => new Date(str)),
  createdBy: UUIDSchema.optional(),
  updatedAt: z.string().datetime().transform((str) => new Date(str)),
  updatedBy: UUIDSchema.optional(),
  deletedAt: z.string().datetime().transform((str) => new Date(str)).optional(),
  deletedBy: UUIDSchema.optional()
});

export const AuditLogEntrySchema = z.intersection(BaseEntitySchema, z.object({
  eventType: AuditEventTypeSchema,
  category: AuditCategorySchema,
  user: UUIDSchema.optional(),
  userType: z.enum(["client", "service_provider", "admin", "system"]).optional(),
  resourceType: z.string(),
  resource: z.string(),
  action: AuditActionSchema,
  outcome: AuditOutcomeSchema,
  description: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  session: z.string().optional(),
  request: z.string().optional(),
  integrityHash: z.string().optional(),
  retentionStatus: AuditRetentionStatusSchema,
  archivedAt: z.string().datetime().transform((str) => new Date(str)).optional(),
  archivedBy: UUIDSchema.optional(),
  purgeAfter: z.string().datetime().transform((str) => new Date(str)).optional()
}));

export const UrlSchema = z.string().url();

export const ErrorDetailSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
  requestId: z.string(),
  timestamp: z.string().datetime().transform((str) => new Date(str)),
  path: z.string(),
  method: z.string(),
  statusCode: z.number().int(),
  helpUrl: UrlSchema.optional()
});

export const AuthenticationErrorSchema = z.intersection(ErrorDetailSchema, z.object({
  scheme: z.enum(["bearer", "api-key", "oauth2"]).optional(),
  supportedSchemes: z.array(z.string()).optional()
}));

export const AuthorizationErrorSchema = z.intersection(ErrorDetailSchema, z.object({
  requiredPermission: z.string().optional(),
  userPermissions: z.array(z.string()).optional(),
  resource: z.string().optional()
}));

export const CallParticipantSchema = z.object({
  user: UUIDSchema,
  displayName: z.string().max(100),
  joinedAt: z.string().datetime().transform((str) => new Date(str)).optional(),
  leftAt: z.string().datetime().transform((str) => new Date(str)).optional(),
  audioEnabled: z.boolean(),
  videoEnabled: z.boolean()
});

export const CancelEmailRequestSchema = z.object({
  reason: z.string().max(500)
});

export const MessageTypeSchema = z.enum(["text", "system", "video_call"]);

export const VideoCallStatusSchema = z.enum(["starting", "active", "ended", "cancelled"]);

export const VideoCallDataSchema = z.object({
  status: VideoCallStatusSchema,
  roomUrl: z.string().optional(),
  token: z.string().optional(),
  startedAt: z.string().datetime().transform((str) => new Date(str)).optional(),
  startedBy: UUIDSchema.optional(),
  endedAt: z.string().datetime().transform((str) => new Date(str)).optional(),
  endedBy: UUIDSchema.optional(),
  durationMinutes: z.number().int().optional(),
  participants: z.array(CallParticipantSchema)
});

export const ChatMessageSchema = z.intersection(BaseEntitySchema, z.object({
  chatRoom: UUIDSchema,
  sender: UUIDSchema,
  timestamp: z.string().datetime().transform((str) => new Date(str)),
  messageType: MessageTypeSchema,
  message: z.string().max(5000).optional(),
  videoCallData: VideoCallDataSchema.optional()
}));

export const ChatRoomStatusSchema = z.enum(["active", "archived"]);

export const ChatRoomSchema = z.intersection(BaseEntitySchema, z.object({
  participants: z.array(UUIDSchema),
  admins: z.array(UUIDSchema),
  context: UUIDSchema.optional(),
  status: ChatRoomStatusSchema,
  lastMessageAt: z.string().datetime().transform((str) => new Date(str)).optional(),
  messageCount: z.number().int(),
  activeVideoCallMessage: UUIDSchema.optional()
}));

export const ConflictErrorSchema = z.intersection(ErrorDetailSchema, z.object({
  conflictingResource: z.string().optional(),
  reason: z.enum(["duplicate", "version-mismatch", "state-conflict", "dependency"]).optional(),
  currentState: z.record(z.string(), z.unknown()).optional(),
  resolution: z.array(z.string()).optional()
}));

export const EmailSchema = z.string().email();

export const PhoneNumberSchema = z.string().regex(/^\+[1-9]\d{1,14}$/).refine(val => validatePhoneNumber(val), { message: "Invalid phone number in E.164 format" });

export const ContactInfoSchema = z.object({
  email: EmailSchema.optional(),
  phone: PhoneNumberSchema.optional()
});

export const CreateChatRoomRequestSchema = z.object({
  participants: z.array(UUIDSchema),
  admins: z.array(UUIDSchema).optional(),
  context: UUIDSchema.optional(),
  upsert: z.boolean().optional()
});

export const VariableTypeSchema = z.enum(["string", "number", "boolean", "date", "datetime", "url", "email", "array"]);

export const TemplateVariableSchema = z.object({
  id: z.string().max(100),
  type: VariableTypeSchema,
  label: z.string().max(255).optional(),
  required: z.boolean().optional(),
  defaultValue: z.string().optional(),
  minLength: z.number().int().gte(0).optional(),
  maxLength: z.number().int().lte(10000).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().max(500).optional(),
  options: z.array(z.string()).optional()
});

export const TemplateStatusSchema = z.enum(["draft", "active", "archived"]);

export const CreateTemplateRequestSchema = z.object({
  tags: z.array(z.string()).optional(),
  name: z.string().max(255),
  description: z.string().max(500).optional(),
  subject: z.string().max(500),
  bodyHtml: z.string(),
  bodyText: z.string().optional(),
  variables: z.array(TemplateVariableSchema).optional(),
  fromName: z.string().optional(),
  fromEmail: EmailSchema.optional(),
  replyToEmail: EmailSchema.optional(),
  replyToName: z.string().optional(),
  status: TemplateStatusSchema.optional()
});

export const EmailProviderSchema = z.enum(["smtp", "postmark"]);

export const EmailQueueStatusSchema = z.enum(["pending", "processing", "sent", "failed", "cancelled"]);

export const EmailQueueItemSchema = z.intersection(BaseEntitySchema, z.object({
  template: UUIDSchema.optional(),
  templateTags: z.array(z.string()).optional(),
  recipientEmail: EmailSchema,
  recipientName: z.string().max(255).optional(),
  variables: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  status: EmailQueueStatusSchema,
  priority: z.number().int().gte(1).lte(10),
  scheduledAt: z.string().datetime().transform((str) => new Date(str)).optional(),
  attempts: z.number().int().gte(0),
  lastAttemptAt: z.string().datetime().transform((str) => new Date(str)).optional(),
  nextRetryAt: z.string().datetime().transform((str) => new Date(str)).optional(),
  lastError: z.string().optional(),
  sentAt: z.string().datetime().transform((str) => new Date(str)).optional(),
  provider: EmailProviderSchema.optional(),
  providerMessageId: z.string().max(255).optional(),
  cancelledAt: z.string().datetime().transform((str) => new Date(str)).optional(),
  cancelledBy: UUIDSchema.optional(),
  cancellationReason: z.string().max(500).optional()
}));

export const EmailTemplateSchema = z.intersection(BaseEntitySchema, z.object({
  tags: z.array(z.string()).optional(),
  name: z.string().max(255),
  description: z.string().max(500).optional(),
  subject: z.string().max(500),
  bodyHtml: z.string(),
  bodyText: z.string().optional(),
  variables: z.array(TemplateVariableSchema).optional(),
  fromName: z.string().max(255).optional(),
  fromEmail: EmailSchema.optional(),
  replyToEmail: EmailSchema.optional(),
  replyToName: z.string().max(255).optional(),
  status: TemplateStatusSchema,
  version: z.number().int().gte(1)
}));

export const FieldErrorSchema = z.object({
  field: z.string(),
  value: z.unknown().optional(),
  code: z.string(),
  message: z.string(),
  context: z.record(z.string(), z.unknown()).optional()
});

export const FileStatusSchema = z.enum(["uploading", "processing", "available", "failed"]);

export const StoredFileSchema = z.intersection(BaseEntitySchema, z.object({
  filename: z.string().max(255),
  mimeType: z.string().max(100),
  size: z.number().int().gte(0),
  status: FileStatusSchema,
  owner: UUIDSchema,
  uploadedAt: z.string().datetime().transform((str) => new Date(str))
}));

export const FileDownloadResponseSchema = z.object({
  downloadUrl: UrlSchema,
  expiresAt: z.string().datetime().transform((str) => new Date(str)),
  file: StoredFileSchema
});

export const FileUploadRequestSchema = z.object({
  filename: z.string().max(255),
  size: z.number().int().gte(1),
  mimeType: z.string().max(100)
});

export const FileUploadResponseSchema = z.object({
  file: UUIDSchema,
  uploadUrl: UrlSchema,
  uploadMethod: z.enum(["PUT"]),
  expiresAt: z.string().datetime().transform((str) => new Date(str))
});

export const GenderSchema = z.enum(["male", "female", "non-binary", "other", "prefer-not-to-say"]);

export const IceServerSchema = z.object({
  urls: z.union([z.string(), z.array(z.string())]),
  username: z.string().optional(),
  credential: z.string().optional()
});

export const IceServersResponseSchema = z.object({
  iceServers: z.array(IceServerSchema)
});

export const InternalServerErrorSchema = z.intersection(ErrorDetailSchema, z.object({
  trackingId: z.string().optional(),
  reported: z.boolean().optional()
}));

export const JoinVideoCallRequestSchema = z.object({
  displayName: z.string().max(100),
  audioEnabled: z.boolean(),
  videoEnabled: z.boolean()
});

export const LanguageCodeSchema = z.string().regex(/^[a-z]{2}$/).refine(val => validateLanguageCode(val), { message: "Invalid ISO 639-1 language code" });

export const LeaveVideoCallResponseSchema = z.object({
  message: z.string(),
  callStillActive: z.boolean(),
  remainingParticipants: z.number().int()
});

export const MaybeStoredFileSchema = z.object({
  file: UUIDSchema.optional(),
  url: z.string().url()
});

export const MaybeStoredFileUpdateSchema = z.object({
  file: z.union([z.intersection(UUIDSchema, z.string()), z.null()]).optional(),
  url: z.string().url().optional()
});

export const NotFoundErrorSchema = z.intersection(ErrorDetailSchema, z.object({
  resourceType: z.string().optional(),
  resource: z.string().optional(),
  suggestions: z.array(z.string()).optional()
}));

export const NotificationTypeSchema = z.enum(["booking-reminder", "billing", "security", "system", "comms.video-call-started", "comms.video-call-joined", "comms.video-call-left", "comms.video-call-ended", "comms.chat-message"]);

export const NotificationChannelSchema = z.enum(["email", "push", "in-app"]);

export const NotificationStatusSchema = z.enum(["queued", "sent", "delivered", "read", "failed", "expired", "unread"]);

export const NotificationSchema = z.intersection(BaseEntitySchema, z.object({
  recipient: UUIDSchema,
  type: NotificationTypeSchema,
  channel: NotificationChannelSchema,
  title: z.string().max(200),
  message: z.string().max(1000),
  scheduledAt: z.string().datetime().transform((str) => new Date(str)).optional(),
  relatedEntityType: z.string().optional(),
  relatedEntity: UUIDSchema.optional(),
  status: NotificationStatusSchema,
  sentAt: z.string().datetime().transform((str) => new Date(str)).optional(),
  readAt: z.string().datetime().transform((str) => new Date(str)).optional(),
  consentValidated: z.boolean()
}));

export const OffsetPaginationMetaSchema = z.object({
  offset: z.number().int(),
  limit: z.number().int(),
  count: z.number().int(),
  totalCount: z.number().int(),
  totalPages: z.number().int(),
  currentPage: z.number().int(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean()
});

export const TimezoneIdSchema = z.string().regex(/^[A-Za-z_]+\/[A-Za-z_]+$/).refine(val => validateTimezone(val), { message: "Invalid IANA timezone identifier" });

export const PersonSchema = z.intersection(BaseEntitySchema, z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50).optional(),
  middleName: z.string().max(50).optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(val => { const parsed = new Date(val + "T00:00:00Z"); return !isNaN(parsed.getTime()) && parsed.toISOString().split("T")[0] === val; }, { message: "Invalid calendar date" }).optional(),
  gender: GenderSchema.optional(),
  primaryAddress: AddressSchema.optional(),
  contactInfo: ContactInfoSchema.optional(),
  avatar: MaybeStoredFileSchema.optional(),
  languagesSpoken: z.array(LanguageCodeSchema).optional(),
  timezone: TimezoneIdSchema.optional()
}));

export const PersonCreateRequestSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50).optional(),
  middleName: z.string().max(50).optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(val => { const parsed = new Date(val + "T00:00:00Z"); return !isNaN(parsed.getTime()) && parsed.toISOString().split("T")[0] === val; }, { message: "Invalid calendar date" }).optional(),
  gender: GenderSchema.optional(),
  primaryAddress: AddressSchema.optional(),
  contactInfo: ContactInfoSchema.optional(),
  avatar: MaybeStoredFileSchema.optional(),
  languagesSpoken: z.array(LanguageCodeSchema).optional(),
  timezone: TimezoneIdSchema.optional()
});

export const PersonUpdateRequestSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.union([z.string().min(1).max(50), z.null()]).optional(),
  middleName: z.union([z.string().max(50), z.null()]).optional(),
  dateOfBirth: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(val => { const parsed = new Date(val + "T00:00:00Z"); return !isNaN(parsed.getTime()) && parsed.toISOString().split("T")[0] === val; }, { message: "Invalid calendar date" }), z.null()]).optional(),
  gender: z.union([GenderSchema, z.null()]).optional(),
  primaryAddress: z.union([AddressUpdateSchema, z.null()]).optional(),
  contactInfo: z.union([ContactInfoSchema, z.null()]).optional(),
  avatar: z.union([MaybeStoredFileUpdateSchema, z.null()]).optional(),
  languagesSpoken: z.union([z.array(LanguageCodeSchema), z.null()]).optional(),
  timezone: z.union([z.intersection(TimezoneIdSchema, z.string()), z.null()]).optional()
});

export const RateLimitErrorSchema = z.intersection(ErrorDetailSchema, z.object({
  limitType: z.enum(["requests", "bandwidth", "concurrent"]),
  limit: z.number().int(),
  usage: z.number().int(),
  resetTime: z.number().int(),
  windowSize: z.number().int()
}));

export const SendTextMessageRequestSchema = z.object({
  messageType: z.enum(["text"]),
  message: z.string().max(5000)
});

export const StartVideoCallDataSchema = z.object({
  status: z.enum(["starting"]),
  participants: z.array(CallParticipantSchema)
});

export const StartVideoCallRequestSchema = z.object({
  messageType: z.enum(["video_call"]),
  videoCallData: StartVideoCallDataSchema
});

export const TestTemplateRequestSchema = z.object({
  recipientEmail: EmailSchema,
  recipientName: z.string().max(255).optional(),
  variables: z.record(z.string(), z.unknown()).optional()
});

export const TestTemplateResultSchema = z.object({
  queue: UUIDSchema
});

export const UpdateParticipantRequestSchema = z.object({
  audioEnabled: z.boolean().optional(),
  videoEnabled: z.boolean().optional()
});

export const UpdateTemplateRequestSchema = z.object({
  tags: z.array(z.string()).optional(),
  name: z.string().max(255).optional(),
  description: z.string().max(500).optional(),
  subject: z.string().max(500).optional(),
  bodyHtml: z.string().optional(),
  bodyText: z.string().optional(),
  variables: z.array(TemplateVariableSchema).optional(),
  fromName: z.string().optional(),
  fromEmail: EmailSchema.optional(),
  replyToEmail: EmailSchema.optional(),
  replyToName: z.string().optional(),
  status: TemplateStatusSchema.optional()
});

export const ValidationErrorSchema = z.intersection(ErrorDetailSchema, z.object({
  fieldErrors: z.array(FieldErrorSchema).optional(),
  globalErrors: z.array(z.string()).optional()
}));

export const VideoCallEndResponseSchema = z.object({
  message: z.string(),
  callDuration: z.number().int().optional()
});

export const VideoCallJoinResponseSchema = z.object({
  roomUrl: z.string(),
  token: z.string(),
  callStatus: VideoCallStatusSchema,
  participants: z.array(CallParticipantSchema)
});

export const ListAuditLogsQuery = z.object({
  resourceType: z.string().optional(),
  resource: UUIDSchema.optional(),
  user: UUIDSchema.optional(),
  action: AuditActionSchema.optional(),
  startDate: z.string().datetime().transform((str) => new Date(str)).optional(),
  endDate: z.string().datetime().transform((str) => new Date(str)).optional(),
  offset: z.coerce.number().int().gte(0).optional(),
  limit: z.coerce.number().int().gte(1).lte(100).optional(),
  page: z.coerce.number().int().gte(1).optional(),
  pageSize: z.coerce.number().int().gte(1).lte(100).optional(),
  q: z.string().max(500).optional(),
  sort: z.string().optional(),
});

export const ListAuditLogsResponse = z.object({
  data: z.array(AuditLogEntrySchema),
  pagination: OffsetPaginationMetaSchema
});

export const CreateChatRoomBody = CreateChatRoomRequestSchema;

export const CreateChatRoomResponse = ChatRoomSchema;

export const ListChatRoomsQuery = z.object({
  status: ChatRoomStatusSchema.optional(),
  context: UUIDSchema.optional(),
  withParticipant: UUIDSchema.optional(),
  hasActiveCall: z.coerce.boolean().optional(),
  offset: z.coerce.number().int().gte(0).optional(),
  limit: z.coerce.number().int().gte(1).lte(100).optional(),
  page: z.coerce.number().int().gte(1).optional(),
  pageSize: z.coerce.number().int().gte(1).lte(100).optional(),
  q: z.string().max(500).optional(),
  sort: z.string().optional(),
});

export const ListChatRoomsResponse = z.object({
  data: z.array(ChatRoomSchema),
  pagination: OffsetPaginationMetaSchema
});

export const GetChatRoomParams = z.object({
  room: UUIDSchema,
});

export const GetChatRoomResponse = ChatRoomSchema;

export const GetChatMessagesParams = z.object({
  room: UUIDSchema,
});

export const GetChatMessagesQuery = z.object({
  messageType: MessageTypeSchema.optional(),
  offset: z.coerce.number().int().gte(0).optional(),
  limit: z.coerce.number().int().gte(1).lte(100).optional(),
  page: z.coerce.number().int().gte(1).optional(),
  pageSize: z.coerce.number().int().gte(1).lte(100).optional(),
  q: z.string().max(500).optional(),
  sort: z.string().optional(),
});

export const GetChatMessagesResponse = z.object({
  data: z.array(ChatMessageSchema),
  pagination: OffsetPaginationMetaSchema
});

export const SendChatMessageParams = z.object({
  room: UUIDSchema,
});

export const SendChatMessageBody = z.union([SendTextMessageRequestSchema, StartVideoCallRequestSchema]);

export const SendChatMessageResponse = ChatMessageSchema;

export const EndVideoCallParams = z.object({
  room: UUIDSchema,
});

export const EndVideoCallResponse = VideoCallEndResponseSchema;

export const JoinVideoCallParams = z.object({
  room: UUIDSchema,
});

export const JoinVideoCallBody = JoinVideoCallRequestSchema;

export const JoinVideoCallResponse = VideoCallJoinResponseSchema;

export const LeaveVideoCallParams = z.object({
  room: UUIDSchema,
});

export const LeaveVideoCallResponse = LeaveVideoCallResponseSchema;

export const UpdateVideoCallParticipantParams = z.object({
  room: UUIDSchema,
});

export const UpdateVideoCallParticipantBody = UpdateParticipantRequestSchema;

export const UpdateVideoCallParticipantResponse = CallParticipantSchema;

export const GetIceServersResponse = IceServersResponseSchema;

export const ListEmailQueueItemsQuery = z.object({
  status: z.union([EmailQueueStatusSchema, z.array(EmailQueueStatusSchema)]).optional(),
  recipientEmail: EmailSchema.optional(),
  dateFrom: z.string().datetime().transform((str) => new Date(str)).optional(),
  dateTo: z.string().datetime().transform((str) => new Date(str)).optional(),
  priority: z.coerce.number().int().optional(),
  scheduledOnly: z.coerce.boolean().optional(),
  offset: z.coerce.number().int().gte(0).optional(),
  limit: z.coerce.number().int().gte(1).lte(100).optional(),
  page: z.coerce.number().int().gte(1).optional(),
  pageSize: z.coerce.number().int().gte(1).lte(100).optional(),
  q: z.string().max(500).optional(),
  sort: z.string().optional(),
});

export const ListEmailQueueItemsResponse = z.object({
  data: z.array(EmailQueueItemSchema),
  pagination: OffsetPaginationMetaSchema
});

export const GetEmailQueueItemParams = z.object({
  queue: UUIDSchema,
});

export const GetEmailQueueItemResponse = EmailQueueItemSchema;

export const CancelEmailQueueItemParams = z.object({
  queue: UUIDSchema,
});

export const CancelEmailQueueItemBody = CancelEmailRequestSchema;

export const CancelEmailQueueItemResponse = EmailQueueItemSchema;

export const RetryEmailQueueItemParams = z.object({
  queue: UUIDSchema,
});

export const RetryEmailQueueItemResponse = EmailQueueItemSchema;

export const ListEmailTemplatesQuery = z.object({
  status: TemplateStatusSchema.optional(),
  tags: z.string().transform(val => val.split(",").filter(Boolean)).optional(),
  offset: z.coerce.number().int().gte(0).optional(),
  limit: z.coerce.number().int().gte(1).lte(100).optional(),
  page: z.coerce.number().int().gte(1).optional(),
  pageSize: z.coerce.number().int().gte(1).lte(100).optional(),
  q: z.string().max(500).optional(),
  sort: z.string().optional(),
});

export const ListEmailTemplatesResponse = z.object({
  data: z.array(EmailTemplateSchema),
  pagination: OffsetPaginationMetaSchema
});

export const CreateEmailTemplateBody = CreateTemplateRequestSchema;

export const CreateEmailTemplateResponse = EmailTemplateSchema;

export const GetEmailTemplateParams = z.object({
  template: UUIDSchema,
});

export const GetEmailTemplateResponse = EmailTemplateSchema;

export const UpdateEmailTemplateParams = z.object({
  template: UUIDSchema,
});

export const UpdateEmailTemplateBody = UpdateTemplateRequestSchema;

export const UpdateEmailTemplateResponse = EmailTemplateSchema;

export const TestEmailTemplateParams = z.object({
  template: UUIDSchema,
});

export const TestEmailTemplateBody = TestTemplateRequestSchema;

export const TestEmailTemplateResponse = TestTemplateResultSchema;

export const ListNotificationsQuery = z.object({
  type: NotificationTypeSchema.optional(),
  channel: NotificationChannelSchema.optional(),
  status: NotificationStatusSchema.optional(),
  startDate: z.string().datetime().transform((str) => new Date(str)).optional(),
  endDate: z.string().datetime().transform((str) => new Date(str)).optional(),
  offset: z.coerce.number().int().gte(0).optional(),
  limit: z.coerce.number().int().gte(1).lte(100).optional(),
  page: z.coerce.number().int().gte(1).optional(),
  pageSize: z.coerce.number().int().gte(1).lte(100).optional(),
  q: z.string().max(500).optional(),
  sort: z.string().optional(),
});

export const ListNotificationsResponse = z.object({
  data: z.array(NotificationSchema),
  pagination: OffsetPaginationMetaSchema
});

export const MarkAllNotificationsAsReadQuery = z.object({
  type: NotificationTypeSchema.optional(),
});

export const MarkAllNotificationsAsReadResponse = z.object({
  markedCount: z.number().int()
});

export const GetNotificationParams = z.object({
  notif: UUIDSchema,
});

export const GetNotificationResponse = NotificationSchema;

export const MarkNotificationAsReadParams = z.object({
  notif: UUIDSchema,
});

export const MarkNotificationAsReadResponse = NotificationSchema;

export const CreatePersonBody = PersonCreateRequestSchema;

export const CreatePersonResponse = PersonSchema;

export const ListPersonsQuery = z.object({
  offset: z.coerce.number().int().gte(0).optional(),
  limit: z.coerce.number().int().gte(1).lte(100).optional(),
  page: z.coerce.number().int().gte(1).optional(),
  pageSize: z.coerce.number().int().gte(1).lte(100).optional(),
  q: z.string().max(500).optional(),
  sort: z.string().optional(),
});

export const ListPersonsResponse = z.object({
  data: z.array(PersonSchema),
  pagination: OffsetPaginationMetaSchema
});

export const GetPersonParams = z.object({
  person: z.union([UUIDSchema, z.enum(["me"])]),
});

export const GetPersonResponse = PersonSchema;

export const UpdatePersonParams = z.object({
  person: UUIDSchema,
});

export const UpdatePersonBody = PersonUpdateRequestSchema;

export const UpdatePersonResponse = PersonSchema;

export const ListFilesQuery = z.object({
  status: FileStatusSchema.optional(),
  owner: UUIDSchema.optional(),
  offset: z.coerce.number().int().gte(0).optional(),
  limit: z.coerce.number().int().gte(1).lte(100).optional(),
  page: z.coerce.number().int().gte(1).optional(),
  pageSize: z.coerce.number().int().gte(1).lte(100).optional(),
  q: z.string().max(500).optional(),
  sort: z.string().optional(),
});

export const ListFilesResponse = z.object({
  data: z.array(StoredFileSchema),
  pagination: OffsetPaginationMetaSchema
});

export const UploadFileBody = FileUploadRequestSchema;

export const UploadFileResponse = FileUploadResponseSchema;

export const GetFileParams = z.object({
  file: UUIDSchema,
});

export const GetFileResponse = StoredFileSchema;

export const DeleteFileParams = z.object({
  file: UUIDSchema,
});

export const DeleteFileResponse = z.void();

export const CompleteFileUploadParams = z.object({
  file: UUIDSchema,
});

export const CompleteFileUploadResponse = StoredFileSchema;

export const GetFileDownloadParams = z.object({
  file: UUIDSchema,
});

export const GetFileDownloadResponse = FileDownloadResponseSchema;
