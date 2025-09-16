export enum FieldType {
  SIGNATURE = 'SIGNATURE',
  INITIALS = 'INITIALS',
  NAME = 'NAME',
  DATE = 'DATE',
  TEXT = 'TEXT',
  CHECKBOX = 'CHECKBOX',
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
  status: 'Pending' | 'Opened' | 'Signed';
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