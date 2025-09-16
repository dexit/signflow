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
  }
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

export interface Document {
  id: string;
  name: string;
  status: DocumentStatus;
  file: string; // base64 encoded PDF
  fields: DocumentField[];
  recipients: Recipient[];
  createdAt: string;
  shareSettings?: {
    viewId?: string;
    editId?: string;
  };
  pageDimensions?: {
    width: number;
    height: number;
  }[];
}

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
  email: {
    smtpHost: string;
    smtpPort: string;
    smtpUsername: string;
    smtpPassword: string;
    smtpDomain: string;
    smtpAuth: string;
    smtpSecurity: string;
    sendFromEmail: string;
  };
  storage: {
    provider: 'disk' | 'aws' | 'gcp' | 'azure';
  };
}

export interface UserProfile {
  signature?: string;
  initials?: string;
  settings: UserSettings;
}