import mongoose, { Schema, Document, Model } from 'mongoose';

export const CLIENT_DOCUMENT_TYPES = [
  'Address Proof',
  'GST Certificate',
  'PAN Card',
  'Aadhar Card',
] as const;

export type ClientDocumentType = typeof CLIENT_DOCUMENT_TYPES[number];

export interface IClientDocument extends Document {
  clientId: mongoose.Types.ObjectId;
  clientCode: string;
  clientName?: string;
  documentType: ClientDocumentType | string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: Date;
  status: 'ACTIVE' | 'ARCHIVED' | 'DELETED';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClientDocumentSchema = new Schema<IClientDocument>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    clientCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    clientName: {
      type: String,
      default: '',
    },
    documentType: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      default: 'application/octet-stream',
    },
    uploadedBy: {
      type: String,
      default: 'Super Admin',
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ARCHIVED', 'DELETED'],
      default: 'ACTIVE',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

ClientDocumentSchema.index({ clientId: 1, documentType: 1, status: 1 });

if (mongoose.models && mongoose.models.ClientDocument) {
  delete (mongoose.models as any).ClientDocument;
}

export const ClientDocument: Model<IClientDocument> =
  mongoose.models.ClientDocument ||
  mongoose.model<IClientDocument>('ClientDocument', ClientDocumentSchema);
