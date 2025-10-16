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

export const CurrencyAmountSchema = z.number().int().gte(0);

export const BillingConfigSchema = z.object({
  price: CurrencyAmountSchema,
  currency: z.string(),
  cancellationThresholdMinutes: z.number().int().gte(0).lte(10080)
});

export const BillingConfigUpdateSchema = z.object({
  price: CurrencyAmountSchema.optional(),
  currency: z.string().optional(),
  cancellationThresholdMinutes: z.number().int().gte(0).lte(10080).optional()
});

export const LocationTypeSchema = z.enum(["video", "phone", "in-person"]);

export const BookingStatusSchema = z.enum(["pending", "confirmed", "rejected", "cancelled", "completed", "no_show_client", "no_show_provider"]);

export const FormResponseMetaDataSchema = z.object({
  submittedAt: z.string().datetime().transform((str) => new Date(str)).optional(),
  completionTimeSeconds: z.number().int().optional(),
  ipAddress: z.string().optional()
});

export const FormResponsesSchema = z.object({
  data: z.record(z.string(), z.unknown()),
  metadata: FormResponseMetaDataSchema.optional()
});

export const BookingSchema = z.intersection(BaseEntitySchema, z.object({
  client: UUIDSchema,
  provider: UUIDSchema,
  slot: UUIDSchema,
  locationType: LocationTypeSchema,
  reason: z.string().max(500),
  status: BookingStatusSchema,
  bookedAt: z.string().datetime().transform((str) => new Date(str)),
  confirmationTimestamp: z.string().datetime().transform((str) => new Date(str)).optional(),
  scheduledAt: z.string().datetime().transform((str) => new Date(str)),
  durationMinutes: z.number().int().gte(15).lte(480),
  cancellationReason: z.string().optional(),
  cancelledBy: z.string().optional(),
  cancelledAt: z.string().datetime().transform((str) => new Date(str)).optional(),
  noShowMarkedBy: z.string().optional(),
  noShowMarkedAt: z.string().datetime().transform((str) => new Date(str)).optional(),
  formResponses: FormResponsesSchema.optional(),
  invoice: UUIDSchema.optional()
}));

export const BookingActionRequestSchema = z.object({
  reason: z.string().max(500)
});

export const FormResponseDataSchema = z.object({
  data: z.record(z.string(), z.unknown())
});

export const BookingCreateRequestSchema = z.object({
  slot: UUIDSchema,
  locationType: LocationTypeSchema.optional(),
  reason: z.string().max(500).optional(),
  formResponses: FormResponseDataSchema.optional()
});

export const FormFieldTypeSchema = z.enum(["text", "textarea", "email", "phone", "number", "datetime", "select", "multiselect", "checkbox", "display"]);

export const FormFieldOptionSchema = z.object({
  label: z.string(),
  value: z.string()
});

export const FormFieldValidationSchema = z.object({
  minLength: z.number().int().optional(),
  maxLength: z.number().int().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional()
});

export const FormFieldConfigSchema = z.object({
  id: z.string(),
  type: FormFieldTypeSchema,
  label: z.string(),
  required: z.boolean().optional(),
  options: z.array(FormFieldOptionSchema).optional(),
  validation: FormFieldValidationSchema.optional(),
  placeholder: z.string().optional(),
  helpText: z.string().optional()
});

export const FormConfigSchema = z.object({
  fields: z.array(FormFieldConfigSchema).optional()
});

export const BookingEventStatusSchema = z.enum(["draft", "active", "paused", "archived"]);

export const TimeBlockSchema = z.object({
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  slotDuration: z.number().int().gte(15).lte(480).optional(),
  bufferTime: z.number().int().gte(0).lte(120).optional()
});

export const DailyConfigSchema = z.object({
  enabled: z.boolean(),
  timeBlocks: z.array(TimeBlockSchema)
});

export const BookingEventSchema = z.intersection(BaseEntitySchema, z.object({
  owner: UUIDSchema,
  context: UUIDSchema.optional(),
  title: z.string(),
  description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  timezone: z.string(),
  locationTypes: z.array(LocationTypeSchema),
  maxBookingDays: z.number().int().gte(0).lte(365),
  minBookingMinutes: z.number().int().gte(0).lte(4320),
  formConfig: FormConfigSchema.optional(),
  billingConfig: BillingConfigSchema.optional(),
  status: BookingEventStatusSchema,
  effectiveFrom: z.string().datetime().transform((str) => new Date(str)),
  effectiveTo: z.string().datetime().transform((str) => new Date(str)).optional(),
  dailyConfigs: z.record(z.string(), z.unknown())
}));

export const BookingEventCreateRequestSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  context: UUIDSchema.optional(),
  timezone: z.string().optional(),
  locationTypes: z.array(LocationTypeSchema).optional(),
  maxBookingDays: z.number().int().gte(0).lte(365).optional(),
  minBookingMinutes: z.number().int().gte(0).lte(4320).optional(),
  formConfig: FormConfigSchema.optional(),
  billingConfig: BillingConfigSchema.optional(),
  status: BookingEventStatusSchema.optional(),
  effectiveFrom: z.string().datetime().transform((str) => new Date(str)).optional(),
  effectiveTo: z.string().datetime().transform((str) => new Date(str)).optional(),
  dailyConfigs: z.record(z.string(), z.unknown())
});

export const DailyConfigUpdateSchema = z.object({
  enabled: z.boolean().optional(),
  timeBlocks: z.array(TimeBlockSchema).optional()
});

export const BookingEventUpdateRequestSchema = z.object({
  title: z.string().optional(),
  description: z.union([z.string(), z.null()]).optional(),
  keywords: z.union([z.array(z.string()), z.null()]).optional(),
  tags: z.union([z.array(z.string()), z.null()]).optional(),
  timezone: z.string().optional(),
  locationTypes: z.array(LocationTypeSchema).optional(),
  maxBookingDays: z.number().int().optional(),
  minBookingMinutes: z.number().int().optional(),
  formConfig: z.union([FormConfigSchema, z.null()]).optional(),
  billingConfig: z.union([BillingConfigUpdateSchema, z.null()]).optional(),
  status: BookingEventStatusSchema.optional(),
  effectiveTo: z.union([z.string().datetime().transform((str) => new Date(str)), z.null()]).optional(),
  dailyConfigs: z.record(z.string(), z.unknown()).optional()
});

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

export const CaptureMethodSchema = z.enum(["automatic", "manual"]);

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

export const VitalsDataSchema = z.object({
  temperatureCelsius: z.number().optional(),
  systolicBp: z.number().int().optional(),
  diastolicBp: z.number().int().optional(),
  heartRate: z.number().int().optional(),
  weightKg: z.number().optional(),
  heightCm: z.number().optional(),
  respiratoryRate: z.number().int().optional(),
  oxygenSaturation: z.number().int().optional(),
  notes: z.string().optional()
});

export const SymptomSeveritySchema = z.union([z.string(), z.enum(["mild", "moderate", "severe"])]);

export const SymptomsDataSchema = z.object({
  onset: z.string().datetime().transform((str) => new Date(str)).optional(),
  durationHours: z.number().int().optional(),
  severity: SymptomSeveritySchema.optional(),
  description: z.string().optional(),
  associated: z.array(z.string()).optional(),
  denies: z.array(z.string()).optional()
});

export const PrescriptionDataSchema = z.object({
  id: z.string().optional(),
  medication: z.string(),
  dosageAmount: z.number().optional(),
  dosageUnit: z.string().optional(),
  frequency: z.string().optional(),
  durationDays: z.number().int().optional(),
  instructions: z.string().optional(),
  notes: z.string().optional()
});

export const FollowUpDataSchema = z.object({
  needed: z.boolean(),
  timeframeDays: z.number().int().optional(),
  instructions: z.string().optional(),
  specialistReferral: z.string().optional()
});

export const ConsultationStatusSchema = z.union([z.string(), z.enum(["draft", "finalized", "amended"])]);

export const ConsultationNoteSchema = z.intersection(BaseEntitySchema, z.object({
  patient: UUIDSchema,
  provider: UUIDSchema,
  context: z.string().max(255).optional(),
  chiefComplaint: z.string().min(1).max(500).optional(),
  assessment: z.string().min(1).max(2000).optional(),
  plan: z.string().min(1).max(2000).optional(),
  vitals: VitalsDataSchema.optional(),
  symptoms: SymptomsDataSchema.optional(),
  prescriptions: z.array(PrescriptionDataSchema).optional(),
  followUp: FollowUpDataSchema.optional(),
  externalDocumentation: z.record(z.string(), z.unknown()).optional(),
  status: ConsultationStatusSchema,
  finalizedAt: z.string().datetime().transform((str) => new Date(str)).optional(),
  finalizedBy: UUIDSchema.optional()
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

export const CreateConsultationRequestSchema = z.object({
  patient: UUIDSchema,
  provider: UUIDSchema,
  context: z.string().max(255).optional(),
  chiefComplaint: z.string().min(1).max(500).optional(),
  assessment: z.string().min(1).max(2000).optional(),
  plan: z.string().min(1).max(2000).optional(),
  vitals: VitalsDataSchema.optional(),
  symptoms: SymptomsDataSchema.optional(),
  prescriptions: z.array(PrescriptionDataSchema).optional(),
  followUp: FollowUpDataSchema.optional()
});

export const CurrencyCodeSchema = z.string().regex(/^[A-Z]{3}$/);

export const CreateLineItemRequestSchema = z.object({
  description: z.string().max(500),
  quantity: z.number().int().gte(1).optional(),
  unitPrice: CurrencyAmountSchema,
  metadata: z.record(z.string(), z.unknown()).optional()
});

export const CreateInvoiceRequestSchema = z.object({
  customer: UUIDSchema,
  merchant: UUIDSchema,
  context: z.string().max(255).optional(),
  currency: CurrencyCodeSchema.optional(),
  paymentCaptureMethod: CaptureMethodSchema.optional(),
  paymentDueAt: z.string().datetime().transform((str) => new Date(str)).optional(),
  voidThresholdMinutes: z.number().int().optional(),
  lineItems: z.array(CreateLineItemRequestSchema),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export const CreateMerchantAccountRequestSchema = z.object({
  person: UUIDSchema.optional(),
  refreshUrl: z.string().url(),
  returnUrl: z.string().url(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export const CreateReviewRequestSchema = z.object({
  context: UUIDSchema,
  reviewType: z.string().max(50),
  reviewedEntity: UUIDSchema.optional(),
  npsScore: z.number().int().gte(0).lte(10),
  comment: z.string().max(1000).optional()
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

export const DashboardResponseSchema = z.object({
  dashboardUrl: z.string().url(),
  expiresAt: z.string().datetime().transform((str) => new Date(str))
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

export const FaxNumberSchema = z.string().regex(/^\+?[0-9\s\-\(\)\,\.ext]+$/).max(50);

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

export const FollowUpDataUpdateSchema = z.object({
  needed: z.boolean().optional(),
  timeframeDays: z.number().int().optional(),
  instructions: z.string().optional(),
  specialistReferral: z.string().optional()
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

export const InvoiceStatusSchema = z.enum(["draft", "open", "paid", "void", "uncollectible"]);

export const InvoiceLineItemSchema = z.object({
  description: z.string().max(500),
  quantity: z.number().int().gte(1),
  unitPrice: CurrencyAmountSchema,
  amount: CurrencyAmountSchema,
  metadata: z.record(z.string(), z.unknown()).optional()
});

export const PaymentStatusSchema = z.enum(["pending", "requires_capture", "processing", "succeeded", "failed", "canceled"]);

export const InvoiceSchema = z.intersection(BaseEntitySchema, z.object({
  invoiceNumber: z.string().max(50),
  customer: UUIDSchema,
  merchant: UUIDSchema,
  merchantAccount: UUIDSchema.optional(),
  context: z.string().max(255).optional(),
  status: InvoiceStatusSchema,
  subtotal: CurrencyAmountSchema,
  tax: CurrencyAmountSchema.optional(),
  total: CurrencyAmountSchema,
  currency: CurrencyCodeSchema,
  paymentCaptureMethod: CaptureMethodSchema,
  paymentDueAt: z.string().datetime().transform((str) => new Date(str)).optional(),
  lineItems: z.array(InvoiceLineItemSchema),
  paymentStatus: PaymentStatusSchema.optional(),
  paidAt: z.string().datetime().transform((str) => new Date(str)).optional(),
  paidBy: UUIDSchema.optional(),
  voidedAt: z.string().datetime().transform((str) => new Date(str)).optional(),
  voidedBy: UUIDSchema.optional(),
  voidThresholdMinutes: z.number().int().optional(),
  authorizedAt: z.string().datetime().transform((str) => new Date(str)).optional(),
  authorizedBy: UUIDSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
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

export const MerchantAccountSchema = z.intersection(BaseEntitySchema, z.object({
  person: UUIDSchema,
  active: z.boolean(),
  metadata: z.record(z.string(), z.unknown())
}));

export const NotFoundErrorSchema = z.intersection(ErrorDetailSchema, z.object({
  resourceType: z.string().optional(),
  resource: z.string().optional(),
  suggestions: z.array(z.string()).optional()
}));

export const NotificationTypeSchema = z.enum(["billing", "security", "system", "booking.created", "booking.confirmed", "booking.rejected", "booking.cancelled", "booking.no-show-client", "booking.no-show-provider", "comms.video-call-started", "comms.video-call-joined", "comms.video-call-left", "comms.video-call-ended", "comms.chat-message"]);

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

export const OnboardingRequestSchema = z.object({
  refreshUrl: z.string().url(),
  returnUrl: z.string().url()
});

export const OnboardingResponseSchema = z.object({
  onboardingUrl: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional()
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

export const ProviderInfoSchema = z.object({
  name: z.string().min(1).max(100),
  specialty: z.string().max(100).optional(),
  phone: PhoneNumberSchema.optional(),
  fax: FaxNumberSchema.optional()
});

export const PharmacyInfoSchema = z.object({
  name: z.string().min(1).max(100),
  address: z.string().max(500).optional(),
  phone: PhoneNumberSchema.optional(),
  fax: FaxNumberSchema.optional()
});

export const PatientSchema = z.intersection(BaseEntitySchema, z.object({
  person: z.union([UUIDSchema, PersonSchema]),
  primaryProvider: ProviderInfoSchema.optional(),
  primaryPharmacy: PharmacyInfoSchema.optional()
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

export const PatientCreateRequestSchema = z.object({
  person: PersonCreateRequestSchema.optional(),
  primaryProvider: ProviderInfoSchema.optional(),
  primaryPharmacy: PharmacyInfoSchema.optional()
});

export const ProviderInfoUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  specialty: z.union([z.string().max(100), z.null()]).optional(),
  phone: z.union([z.intersection(PhoneNumberSchema, z.string()), z.null()]).optional(),
  fax: z.union([z.intersection(FaxNumberSchema, z.string()), z.null()]).optional()
});

export const PharmacyInfoUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  address: z.union([z.string().max(500), z.null()]).optional(),
  phone: z.union([z.intersection(PhoneNumberSchema, z.string()), z.null()]).optional(),
  fax: z.union([z.intersection(FaxNumberSchema, z.string()), z.null()]).optional()
});

export const PatientUpdateRequestSchema = z.object({
  primaryProvider: z.union([ProviderInfoUpdateSchema, z.null()]).optional(),
  primaryPharmacy: z.union([PharmacyInfoUpdateSchema, z.null()]).optional()
});

export const PaymentRequestSchema = z.object({
  paymentMethod: z.string().max(255).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export const PaymentResponseSchema = z.object({
  checkoutUrl: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional()
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

export const ProviderTypeSchema = z.enum(["pharmacist", "other"]);

export const ProviderSchema = z.intersection(BaseEntitySchema, z.object({
  person: z.union([UUIDSchema, PersonSchema]),
  providerType: ProviderTypeSchema,
  yearsOfExperience: z.number().int().gte(0).lte(70).optional(),
  biography: z.string().max(2000).optional(),
  minorAilmentsSpecialties: z.array(z.string()).optional(),
  minorAilmentsPracticeLocations: z.array(z.string()).optional()
}));

export const ProviderCreateRequestSchema = z.object({
  person: PersonCreateRequestSchema.optional(),
  providerType: ProviderTypeSchema,
  yearsOfExperience: z.number().int().gte(0).lte(70).optional(),
  biography: z.string().max(2000).optional(),
  minorAilmentsSpecialties: z.array(z.string()).optional(),
  minorAilmentsPracticeLocations: z.array(z.string()).optional()
});

export const ProviderUpdateRequestSchema = z.object({
  yearsOfExperience: z.union([z.number().int().gte(0).lte(70), z.null()]).optional(),
  biography: z.union([z.string().max(2000), z.null()]).optional(),
  minorAilmentsSpecialties: z.union([z.array(z.string()), z.null()]).optional(),
  minorAilmentsPracticeLocations: z.union([z.array(z.string()), z.null()]).optional()
});

export const RateLimitErrorSchema = z.intersection(ErrorDetailSchema, z.object({
  limitType: z.enum(["requests", "bandwidth", "concurrent"]),
  limit: z.number().int(),
  usage: z.number().int(),
  resetTime: z.number().int(),
  windowSize: z.number().int()
}));

export const RecurrenceTypeSchema = z.enum(["daily", "weekly", "monthly", "yearly"]);

export const RecurrencePatternSchema = z.object({
  type: RecurrenceTypeSchema,
  interval: z.number().int().gte(1).optional(),
  daysOfWeek: z.array(z.number().int()).optional(),
  dayOfMonth: z.number().int().gte(1).lte(31).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(val => { const parsed = new Date(val + "T00:00:00Z"); return !isNaN(parsed.getTime()) && parsed.toISOString().split("T")[0] === val; }, { message: "Invalid calendar date" }).optional(),
  maxOccurrences: z.number().int().gte(1).optional()
});

export const RefundRequestSchema = z.object({
  amount: CurrencyAmountSchema.optional(),
  reason: z.string().max(500).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export const RefundResponseSchema = z.object({
  refundedAmount: CurrencyAmountSchema,
  metadata: z.record(z.string(), z.unknown()).optional()
});

export const ReviewSchema = z.intersection(BaseEntitySchema, z.object({
  context: UUIDSchema,
  reviewer: UUIDSchema,
  reviewType: z.string().max(50),
  reviewedEntity: UUIDSchema.optional(),
  npsScore: z.number().int().gte(0).lte(10),
  comment: z.string().max(1000).optional()
}));

export const ScheduleExceptionSchema = z.intersection(BaseEntitySchema, z.object({
  event: UUIDSchema,
  owner: UUIDSchema,
  context: UUIDSchema.optional(),
  timezone: z.string(),
  startDatetime: z.string().datetime().transform((str) => new Date(str)),
  endDatetime: z.string().datetime().transform((str) => new Date(str)),
  reason: z.string().max(500),
  recurring: z.boolean(),
  recurrencePattern: RecurrencePatternSchema.optional()
}));

export const ScheduleExceptionCreateRequestSchema = z.object({
  timezone: z.string().optional(),
  startDatetime: z.string().datetime().transform((str) => new Date(str)),
  endDatetime: z.string().datetime().transform((str) => new Date(str)),
  reason: z.string().max(500),
  recurring: z.boolean().optional(),
  recurrencePattern: RecurrencePatternSchema.optional()
});

export const SendTextMessageRequestSchema = z.object({
  messageType: z.enum(["text"]),
  message: z.string().max(5000)
});

export const SlotStatusSchema = z.enum(["available", "booked", "blocked"]);

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
  queue: EmailQueueItemSchema
});

export const TimeSlotSchema = z.intersection(BaseEntitySchema, z.object({
  id: UUIDSchema,
  owner: UUIDSchema,
  event: UUIDSchema,
  context: UUIDSchema.optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(val => { const parsed = new Date(val + "T00:00:00Z"); return !isNaN(parsed.getTime()) && parsed.toISOString().split("T")[0] === val; }, { message: "Invalid calendar date" }),
  startTime: z.string().datetime().transform((str) => new Date(str)),
  endTime: z.string().datetime().transform((str) => new Date(str)),
  locationTypes: z.array(LocationTypeSchema),
  status: SlotStatusSchema,
  billingOverride: BillingConfigSchema.optional(),
  booking: UUIDSchema.optional()
}));

export const UpdateConsultationRequestSchema = z.object({
  chiefComplaint: z.union([z.string().max(500), z.null()]).optional(),
  assessment: z.union([z.string().max(2000), z.null()]).optional(),
  plan: z.union([z.string().max(2000), z.null()]).optional(),
  vitals: z.union([VitalsDataSchema, z.null()]).optional(),
  symptoms: z.union([SymptomsDataSchema, z.null()]).optional(),
  prescriptions: z.union([z.array(PrescriptionDataSchema), z.null()]).optional(),
  followUp: z.union([FollowUpDataUpdateSchema, z.null()]).optional(),
  externalDocumentation: z.union([z.record(z.string(), z.unknown()), z.null()]).optional()
});

export const UpdateInvoiceRequestSchema = z.object({
  paymentCaptureMethod: CaptureMethodSchema.optional(),
  paymentDueAt: z.string().datetime().transform((str) => new Date(str)).optional(),
  voidThresholdMinutes: z.number().int().optional(),
  lineItems: z.array(CreateLineItemRequestSchema).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
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

export const CreateInvoiceBody = CreateInvoiceRequestSchema;

export const CreateInvoiceResponse = InvoiceSchema;

export const ListInvoicesQuery = z.object({
  customer: UUIDSchema.optional(),
  merchant: UUIDSchema.optional(),
  status: InvoiceStatusSchema.optional(),
  context: z.string().optional(),
  offset: z.coerce.number().int().gte(0).optional(),
  limit: z.coerce.number().int().gte(1).lte(100).optional(),
  page: z.coerce.number().int().gte(1).optional(),
  pageSize: z.coerce.number().int().gte(1).lte(100).optional(),
  q: z.string().max(500).optional(),
  sort: z.string().optional(),
});

export const ListInvoicesResponse = z.object({
  data: z.array(InvoiceSchema),
  pagination: OffsetPaginationMetaSchema
});

export const GetInvoiceParams = z.object({
  invoice: UUIDSchema,
});

export const GetInvoiceResponse = InvoiceSchema;

export const UpdateInvoiceParams = z.object({
  invoice: UUIDSchema,
});

export const UpdateInvoiceBody = UpdateInvoiceRequestSchema;

export const UpdateInvoiceResponse = InvoiceSchema;

export const DeleteInvoiceParams = z.object({
  invoice: UUIDSchema,
});

export const DeleteInvoiceResponse = z.void();

export const CaptureInvoicePaymentParams = z.object({
  invoice: UUIDSchema,
});

export const CaptureInvoicePaymentResponse = InvoiceSchema;

export const FinalizeInvoiceParams = z.object({
  invoice: UUIDSchema,
});

export const FinalizeInvoiceResponse = InvoiceSchema;

export const MarkInvoiceUncollectibleParams = z.object({
  invoice: UUIDSchema,
});

export const MarkInvoiceUncollectibleResponse = InvoiceSchema;

export const PayInvoiceParams = z.object({
  invoice: UUIDSchema,
});

export const PayInvoiceBody = PaymentRequestSchema;

export const PayInvoiceResponse = PaymentResponseSchema;

export const RefundInvoicePaymentParams = z.object({
  invoice: UUIDSchema,
});

export const RefundInvoicePaymentBody = RefundRequestSchema;

export const RefundInvoicePaymentResponse = RefundResponseSchema;

export const VoidInvoiceParams = z.object({
  invoice: UUIDSchema,
});

export const VoidInvoiceResponse = InvoiceSchema;

export const CreateMerchantAccountBody = CreateMerchantAccountRequestSchema;

export const CreateMerchantAccountResponse = MerchantAccountSchema;

export const GetMerchantAccountParams = z.object({
  merchantAccount: z.union([UUIDSchema, z.enum(["me"])]),
});

export const GetMerchantAccountResponse = MerchantAccountSchema;

export const GetMerchantDashboardParams = z.object({
  merchantAccount: z.union([UUIDSchema, z.enum(["me"])]),
});

export const GetMerchantDashboardResponse = DashboardResponseSchema;

export const OnboardMerchantAccountParams = z.object({
  merchantAccount: UUIDSchema,
});

export const OnboardMerchantAccountBody = OnboardingRequestSchema;

export const OnboardMerchantAccountResponse = OnboardingResponseSchema;

export const HandleStripeWebhookBody = z.unknown();

export const HandleStripeWebhookResponse = z.unknown();

export const CreateBookingBody = BookingCreateRequestSchema;

export const CreateBookingResponse = BookingSchema;

export const ListBookingsQuery = z.object({
  provider: UUIDSchema.optional(),
  client: UUIDSchema.optional(),
  status: BookingStatusSchema.optional(),
  startDate: z.string().datetime().transform((str) => new Date(str)).optional(),
  endDate: z.string().datetime().transform((str) => new Date(str)).optional(),
  expand: z.string().optional(),
  offset: z.coerce.number().int().gte(0).optional(),
  limit: z.coerce.number().int().gte(1).lte(100).optional(),
  page: z.coerce.number().int().gte(1).optional(),
  pageSize: z.coerce.number().int().gte(1).lte(100).optional(),
  q: z.string().max(500).optional(),
  sort: z.string().optional(),
});

export const ListBookingsResponse = z.object({
  data: z.array(BookingSchema),
  pagination: OffsetPaginationMetaSchema
});

export const GetBookingParams = z.object({
  booking: UUIDSchema,
});

export const GetBookingQuery = z.object({
  expand: z.string().optional(),
});

export const GetBookingResponse = BookingSchema;

export const CancelBookingParams = z.object({
  booking: UUIDSchema,
});

export const CancelBookingBody = BookingActionRequestSchema;

export const CancelBookingResponse = BookingSchema;

export const ConfirmBookingParams = z.object({
  booking: UUIDSchema,
});

export const ConfirmBookingBody = BookingActionRequestSchema;

export const ConfirmBookingResponse = BookingSchema;

export const MarkNoShowBookingParams = z.object({
  booking: UUIDSchema,
});

export const MarkNoShowBookingBody = BookingActionRequestSchema;

export const MarkNoShowBookingResponse = BookingSchema;

export const RejectBookingParams = z.object({
  booking: UUIDSchema,
});

export const RejectBookingBody = BookingActionRequestSchema;

export const RejectBookingResponse = BookingSchema;

export const ListBookingEventsQuery = z.object({
  owner: UUIDSchema.optional(),
  context: UUIDSchema.optional(),
  locationType: LocationTypeSchema.optional(),
  status: BookingEventStatusSchema.optional(),
  availableFrom: z.string().datetime().transform((str) => new Date(str)).optional(),
  availableTo: z.string().datetime().transform((str) => new Date(str)).optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  expand: z.string().optional(),
  offset: z.coerce.number().int().gte(0).optional(),
  limit: z.coerce.number().int().gte(1).lte(100).optional(),
  page: z.coerce.number().int().gte(1).optional(),
  pageSize: z.coerce.number().int().gte(1).lte(100).optional(),
  q: z.string().max(500).optional(),
  sort: z.string().optional(),
});

export const ListBookingEventsResponse = z.object({
  data: z.array(BookingEventSchema),
  pagination: OffsetPaginationMetaSchema
});

export const CreateBookingEventBody = BookingEventCreateRequestSchema;

export const CreateBookingEventResponse = BookingEventSchema;

export const GetBookingEventParams = z.object({
  event: z.union([UUIDSchema, z.enum(["me"])]),
});

export const GetBookingEventQuery = z.object({
  expand: z.string().optional(),
});

export const GetBookingEventResponse = BookingEventSchema;

export const UpdateBookingEventParams = z.object({
  event: UUIDSchema,
});

export const UpdateBookingEventBody = BookingEventUpdateRequestSchema;

export const UpdateBookingEventResponse = BookingEventSchema;

export const DeleteBookingEventParams = z.object({
  event: UUIDSchema,
});

export const DeleteBookingEventResponse = z.void();

export const CreateScheduleExceptionParams = z.object({
  event: UUIDSchema,
});

export const CreateScheduleExceptionBody = ScheduleExceptionCreateRequestSchema;

export const CreateScheduleExceptionResponse = ScheduleExceptionSchema;

export const ListScheduleExceptionsParams = z.object({
  event: UUIDSchema,
});

export const ListScheduleExceptionsQuery = z.object({
  offset: z.coerce.number().int().gte(0).optional(),
  limit: z.coerce.number().int().gte(1).lte(100).optional(),
  page: z.coerce.number().int().gte(1).optional(),
  pageSize: z.coerce.number().int().gte(1).lte(100).optional(),
  q: z.string().max(500).optional(),
  sort: z.string().optional(),
});

export const ListScheduleExceptionsResponse = z.object({
  data: z.array(ScheduleExceptionSchema),
  pagination: OffsetPaginationMetaSchema
});

export const GetScheduleExceptionParams = z.object({
  event: UUIDSchema,
  exception: UUIDSchema,
});

export const GetScheduleExceptionResponse = ScheduleExceptionSchema;

export const DeleteScheduleExceptionParams = z.object({
  event: UUIDSchema,
  exception: UUIDSchema,
});

export const DeleteScheduleExceptionResponse = z.void();

export const GetTimeSlotParams = z.object({
  slotId: UUIDSchema,
});

export const GetTimeSlotQuery = z.object({
  expand: z.string().optional(),
});

export const GetTimeSlotResponse = TimeSlotSchema;

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
  status: z.union([EmailQueueStatusSchema, z.array(EmailQueueStatusSchema), z.string().transform(val => val.split(",").map(s => s.trim())).pipe(z.array(EmailQueueStatusSchema))]).optional(),
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

export const CreateConsultationBody = CreateConsultationRequestSchema;

export const CreateConsultationResponse = ConsultationNoteSchema;

export const ListConsultationsQuery = z.object({
  patient: UUIDSchema.optional(),
  status: ConsultationStatusSchema.optional(),
  offset: z.coerce.number().int().gte(0).optional(),
  limit: z.coerce.number().int().gte(1).lte(100).optional(),
  page: z.coerce.number().int().gte(1).optional(),
  pageSize: z.coerce.number().int().gte(1).lte(100).optional(),
  q: z.string().max(500).optional(),
  sort: z.string().optional(),
});

export const ListConsultationsResponse = z.object({
  data: z.array(ConsultationNoteSchema),
  pagination: OffsetPaginationMetaSchema
});

export const GetConsultationParams = z.object({
  consultation: UUIDSchema,
});

export const GetConsultationResponse = ConsultationNoteSchema;

export const UpdateConsultationParams = z.object({
  consultation: UUIDSchema,
});

export const UpdateConsultationBody = UpdateConsultationRequestSchema;

export const UpdateConsultationResponse = ConsultationNoteSchema;

export const FinalizeConsultationParams = z.object({
  consultation: UUIDSchema,
});

export const FinalizeConsultationResponse = ConsultationNoteSchema;

export const ListEMRPatientsQuery = z.object({
  expand: z.string().optional(),
  offset: z.coerce.number().int().gte(0).optional(),
  limit: z.coerce.number().int().gte(1).lte(100).optional(),
  page: z.coerce.number().int().gte(1).optional(),
  pageSize: z.coerce.number().int().gte(1).lte(100).optional(),
  q: z.string().max(500).optional(),
  sort: z.string().optional(),
});

export const ListEMRPatientsResponse = z.object({
  data: z.array(PatientSchema),
  pagination: OffsetPaginationMetaSchema
});

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

export const ListPatientsQuery = z.object({
  expand: z.string().optional(),
  offset: z.coerce.number().int().gte(0).optional(),
  limit: z.coerce.number().int().gte(1).lte(100).optional(),
  page: z.coerce.number().int().gte(1).optional(),
  pageSize: z.coerce.number().int().gte(1).lte(100).optional(),
  q: z.string().max(500).optional(),
  sort: z.string().optional(),
});

export const ListPatientsResponse = z.object({
  data: z.array(PatientSchema),
  pagination: OffsetPaginationMetaSchema
});

export const CreatePatientBody = PatientCreateRequestSchema;

export const CreatePatientResponse = PatientSchema;

export const GetPatientParams = z.object({
  patient: z.union([UUIDSchema, z.enum(["me"])]),
});

export const GetPatientQuery = z.object({
  expand: z.string().optional(),
});

export const GetPatientResponse = PatientSchema;

export const UpdatePatientParams = z.object({
  patient: UUIDSchema,
});

export const UpdatePatientBody = PatientUpdateRequestSchema;

export const UpdatePatientResponse = PatientSchema;

export const DeletePatientParams = z.object({
  patient: UUIDSchema,
});

export const DeletePatientResponse = z.void();

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

export const CreateReviewBody = CreateReviewRequestSchema;

export const CreateReviewResponse = ReviewSchema;

export const ListReviewsQuery = z.object({
  context: UUIDSchema.optional(),
  reviewer: UUIDSchema.optional(),
  reviewType: z.string().optional(),
  reviewedEntity: UUIDSchema.optional(),
  offset: z.coerce.number().int().gte(0).optional(),
  limit: z.coerce.number().int().gte(1).lte(100).optional(),
  page: z.coerce.number().int().gte(1).optional(),
  pageSize: z.coerce.number().int().gte(1).lte(100).optional(),
  q: z.string().max(500).optional(),
  sort: z.string().optional(),
});

export const ListReviewsResponse = z.object({
  data: z.array(ReviewSchema),
  pagination: OffsetPaginationMetaSchema
});

export const GetReviewParams = z.object({
  review: UUIDSchema,
});

export const GetReviewResponse = ReviewSchema;

export const DeleteReviewParams = z.object({
  review: UUIDSchema,
});

export const DeleteReviewResponse = z.void();

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
