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
}

export interface Recipient {
  id: string;
  name: string;
  email: string;
  status: 'Pending' | 'Signed';
  signingUrl?: string;
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
}