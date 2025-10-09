/**
 * Configuration management for Monobase API
 * Parses environment variables into a typed configuration object
 */

import type { AuthConfig } from '@/types/auth';
import { DEFAULT_ICE_SERVERS, parseIceServerUrls, type IceServer } from '@/utils/webrtc';
import type { DatabaseConfig } from './database';
import type { StorageConfig } from './storage';
import type { EmailConfig } from './email';
import type { NotificationConfig } from './notifs';

export interface Config {
  // Server configuration
  server: {
    host: string;
    port: number;
    publicUrl?: string;
  };
  
  // Database configuration
  database: DatabaseConfig;
  
  // CORS configuration
  cors: {
    origins: string[];
    credentials: boolean;
    allowLocalNetwork: boolean;
    allowTunneling: boolean;
    strict: boolean;
  };
  
  // Logging configuration
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    pretty: boolean;
  };
  
  // Authentication configuration
  auth: AuthConfig;
  
  // Rate limiting configuration
  rateLimit: {
    enabled: boolean;
    max: number;
  };
  
  // Storage configuration
  storage: StorageConfig;
  
  // Email configuration
  email: EmailConfig;

  // Notification configuration
  notifs: NotificationConfig;

  // WebRTC configuration
  webrtc: {
    iceServers: IceServer[];
  };
}

/**
 * Parse configuration from environment variables
 * Provides sensible defaults for development
 */
export function parseConfig(): Config {
  // Helper function to parse comma-separated lists
  const parseList = (value: string | undefined, defaultList: string[]): string[] => {
    if (!value) return defaultList;
    return value.split(',').map(s => s.trim()).filter(Boolean);
  };

  // Helper function to parse boolean values
  const parseBoolean = (value: string | undefined, defaultValue: boolean): boolean => {
    if (value === undefined) return defaultValue;
    return value.toLowerCase() === 'true';
  };

  // Helper function to parse integer values
  const parseInt = (value: string | undefined, defaultValue: number): number => {
    if (!value) return defaultValue;
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? defaultValue : parsed;
  };

  // Helper function to parse log level
  const parseLogLevel = (value: string | undefined): Config['logging']['level'] => {
    const validLevels: Config['logging']['level'][] = ['debug', 'info', 'warn', 'error'];
    const level = value?.toLowerCase();
    return validLevels.includes(level as any) ? level as Config['logging']['level'] : 'info';
  };

  // Parse server configuration
  const serverPort = parseInt(process.env['SERVER_PORT'] || process.env['PORT'], 7213);
  const serverHost = process.env['SERVER_HOST'] || '0.0.0.0';
  const publicUrl = process.env['SERVER_PUBLIC_URL'] || process.env['PUBLIC_URL'];

  return {
    // Server configuration
    server: {
      host: serverHost,
      port: serverPort,
      publicUrl,
    },
    
    // Database configuration
    database: {
      url: process.env['DATABASE_URL'] || 'postgres://postgres:password@localhost:5432/monobase',
      poolMin: parseInt(process.env['DB_POOL_MIN'], 2),
      poolMax: parseInt(process.env['DB_POOL_MAX'], 20),
      idleTimeoutMs: parseInt(process.env['DB_IDLE_TIMEOUT'], 30000),
      ssl: parseBoolean(process.env['DB_SSL'], false),
      logging: parseBoolean(process.env['DB_LOGGING'], false),
    },
    
    // CORS configuration
    cors: {
      origins: parseList(process.env['CORS_ORIGINS'], ['*']),
      credentials: parseBoolean(process.env['CORS_CREDENTIALS'], true),
      allowLocalNetwork: parseBoolean(process.env['CORS_ALLOW_LOCAL_NETWORK'], true),
      allowTunneling: parseBoolean(process.env['CORS_ALLOW_TUNNELING'], true),
      strict: parseBoolean(process.env['CORS_STRICT'], false),
    },
    
    // Logging configuration
    logging: {
      level: parseLogLevel(process.env['LOG_LEVEL']),
      pretty: parseBoolean(process.env['LOG_PRETTY'], true),
    },
    
    // Authentication configuration
    auth: {
      baseUrl: process.env['AUTH_BASE_URL'] || publicUrl || `http://${serverHost}:${serverPort}`,
      secret: process.env['AUTH_SECRET'] || 'development-secret-change-in-production-' + Math.random(),
      sessionExpiresIn: parseInt(process.env['AUTH_SESSION_EXPIRES_IN'], 60 * 60 * 24 * 7), // 7 days
      rateLimitEnabled: parseBoolean(process.env['AUTH_RATE_LIMIT_ENABLED'], true),
      rateLimitWindow: parseInt(process.env['AUTH_RATE_LIMIT_WINDOW'], 60), // 1 minute
      rateLimitMax: parseInt(process.env['AUTH_RATE_LIMIT_MAX'], 10), // 10 attempts
      adminEmails: parseList(process.env['AUTH_ADMIN_EMAILS'], []),
      socialProviders: {
        google: process.env['GOOGLE_CLIENT_ID'] && process.env['GOOGLE_CLIENT_SECRET'] ? {
          clientId: process.env['GOOGLE_CLIENT_ID'],
          clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
        } : undefined,
      },
    },
    
    // Rate limiting configuration
    rateLimit: {
      enabled: parseBoolean(process.env['RATE_LIMIT_ENABLED'], true),
      max: parseInt(process.env['RATE_LIMIT_MAX'], 100),
    },
    
    // Storage configuration
    storage: {
      provider: (process.env['STORAGE_PROVIDER'] as 'minio' | 's3') || 'minio',
      endpoint: process.env['STORAGE_ENDPOINT'] || 'http://localhost:9000', // Default to localhost for development
      publicEndpoint: process.env['STORAGE_PUBLIC_ENDPOINT'] || 'http://localhost:9000', // External URL for presigned URLs
      bucket: process.env['STORAGE_BUCKET'] || 'monobase-files',
      region: process.env['STORAGE_REGION'] || 'us-east-1',
      credentials: {
        accessKeyId: process.env['STORAGE_ACCESS_KEY_ID'] || 'minioadmin',
        secretAccessKey: process.env['STORAGE_SECRET_ACCESS_KEY'] || 'minioadmin',
      },
      uploadUrlExpiry: parseInt(process.env['STORAGE_UPLOAD_URL_EXPIRY'] || '300'), // 5 minutes
      downloadUrlExpiry: parseInt(process.env['STORAGE_DOWNLOAD_URL_EXPIRY'] || '900'), // 15 minutes
    },
    
    // Email configuration
    email: {
      provider: (process.env['EMAIL_PROVIDER'] as 'smtp' | 'postmark' | 'onesignal') || 'smtp',
      from: {
        name: process.env['EMAIL_FROM_NAME'] || 'Monobase',
        email: process.env['EMAIL_FROM_EMAIL'] || 'noreply@monobase.com'
      },
      smtp: {
        host: process.env['SMTP_HOST'] || 'localhost',
        port: parseInt(process.env['SMTP_PORT'] || '1025'),
        secure: parseBoolean(process.env['SMTP_SECURE'], false),
        auth: {
          user: process.env['SMTP_USER'] || '',
          pass: process.env['SMTP_PASS'] || ''
        }
      },
      postmark: process.env['POSTMARK_API_KEY'] ? {
        apiKey: process.env['POSTMARK_API_KEY'],
        messageStream: process.env['POSTMARK_MESSAGE_STREAM'] || 'outbound'
      } : undefined,
      onesignal: process.env['ONESIGNAL_APP_ID'] && process.env['ONESIGNAL_API_KEY'] ? {
        appId: process.env['ONESIGNAL_APP_ID'],
        apiKey: process.env['ONESIGNAL_API_KEY']
      } : undefined
    },

    // Notification configuration
    notifs: {
      provider: 'onesignal',
      onesignal: process.env['ONESIGNAL_APP_ID'] && process.env['ONESIGNAL_API_KEY'] ? {
        appId: process.env['ONESIGNAL_APP_ID'],
        apiKey: process.env['ONESIGNAL_API_KEY']
      } : undefined
    },

    // WebRTC configuration
    webrtc: {
      iceServers: process.env['WEBRTC_ICE_SERVERS']
        ? parseIceServerUrls(process.env['WEBRTC_ICE_SERVERS'])
        : DEFAULT_ICE_SERVERS
    },
  };
}
