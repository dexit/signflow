export enum FieldType {
  SIGNATURE = 'SIGNATURE',
  INITIALS = 'INITIALS',
  TEXT = 'TEXT',
  NAME = 'NAME',
  DATE = 'DATE',
  CHECKBOX = 'CHECKBOX',
  NUMBER = 'NUMBER',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  RADIO = 'RADIO',
  SELECT = 'SELECT',
  STAMP = 'STAMP',
}

export interface DocumentField {
  id: string;
  type: FieldType;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  recipientId: string;
  value?: string; // For text, name, date, signature data URL, or 'true' for checkbox
  metadata?: {
    signedAt?: string;
  };
  // --- START: Added detailed field properties ---
  label?: string;
  placeholder?: string;
  options?: string[];
  required?: boolean;
  // --- END: Added detailed field properties ---
}

export interface Recipient {
  id:string;
  name: string;
  email: string;
  phone?: string;
  status: 'Pending' | 'Opened' | 'Signed' | 'Awaiting';
  signingUrl?: string;
  openedAt?: string;
  signedAt?: string;
  ipAddress?: string;
  signatureHash?: string;
  auditHash?: string;
}

export enum DocumentStatus {
  DRAFT = 'Draft',
  SENT = 'Sent',
  COMPLETED = 'Completed',
}

export interface Event {
  id: string;
  type: 'document.created' | 'document.sent' | 'recipient.added' | 'recipient.opened' | 'recipient.signed' | 'document.edited';
  message: string;
  timestamp: string;
}

export interface Document {
  id: string;
  name: string;
  status: DocumentStatus;
  file: string; // base64 encoded PDF
  fields: DocumentField[];
  recipients: Recipient[];
  createdAt: string;
  events: Event[];
  shareSettings?: {
    viewId?: string;
    editId?: string;
  };
  pageDimensions?: {
    width: number;
    height: number;
  }[];
}

// --- START: Updated UserSettings ---

export type SmtpConfig = {
  provider: 'smtp';
  smtpHost: string;
  smtpPort: string;
  smtpUsername: string;
  smtpPassword: string;
  smtpDomain: string;
  smtpAuth: string;
  smtpSecurity: string;
  sendFromEmail: string;
};

export type MsGraphConfig = {
  provider: 'msGraph';
  clientId: string;
  tenantId: string;
  clientSecret: string;
};

export type EmailWebhookConfig = {
  provider: 'webhook';
  url: string;
};

export type EmailConfig = SmtpConfig | MsGraphConfig | EmailWebhookConfig;

export type TwilioConfig = {
  provider: 'twilio';
  accountSid: string;
  authToken: string;
  twilioPhoneNumber: string;
};

export type SmsWebhookConfig = {
  provider: 'webhook';
  url: string;
};

export type SmsConfig = TwilioConfig | SmsWebhookConfig;

export type StorageConfig = 
  | { provider: 'disk' | 'aws' | 'gcp' | 'azure' }
  | { provider: 'postgresql'; connectionUrl: string; };

export interface UserSettings {
  personalization: {
    signatureRequestEmail: { subject: string; body: string; };
    documentsCopyEmail: { subject: string; body: string; };
    completedNotificationEmail: { subject: string; body: string; };
    companyLogo: string | null;
    completedFormMessage: string;
    redirectUrl: string;
    showConfetti: boolean;
  };
  email: EmailConfig;
  sms: SmsConfig;
  storage: StorageConfig;
}

// --- END: Updated UserSettings ---

export interface UserProfile {
  name: string;
  email: string;
  signature?: string;
  initials?: string;
  settings: UserSettings;
}