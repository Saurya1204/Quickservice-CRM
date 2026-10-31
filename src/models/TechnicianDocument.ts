import mongoose, { Schema, Document, Model } from 'mongoose';

export const TECHNICIAN_DOCUMENT_TYPES = [
  'Technician Photo Upload',
  'PAN Card No.',
  'Aadhar Card Document',
  'Voter ID Document',
  'Driving License Document',
  'Residential Address Proof Document',
  'Cancel Cheque Image Upload',
] as const;

export type TechnicianDocumentType = typeof TECHNICIAN_DOCUMENT_TYPES[number];

export interface ITechnicianDocument extends Document {
  technicianId: mongoose.Types.ObjectId;
  technicianCRMCode: string;
  technicianName?: string;
  documentType: TechnicianDocumentType | string;
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

const TechnicianDocumentSchema = new Schema<ITechnicianDocument>(
  {
    technicianId: {
      type: Schema.Types.ObjectId,
      ref: 'Technician',
      required: true,
      index: true,
    },
    technicianCRMCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    technicianName: {
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

TechnicianDocumentSchema.index({ technicianId: 1, documentType: 1, status: 1 });

if (mongoose.models && mongoose.models.TechnicianDocument) {
  delete (mongoose.models as any).TechnicianDocument;
}

export const TechnicianDocument: Model<ITechnicianDocument> =
  mongoose.models.TechnicianDocument ||
  mongoose.model<ITechnicianDocument>('TechnicianDocument', TechnicianDocumentSchema);
