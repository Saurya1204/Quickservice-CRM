import mongoose, { Schema, Document, Model } from 'mongoose';

export const FREELANCER_DOCUMENT_TYPES = [
  'Freelancer Photo Upload',
  'PAN Card No.',
  'Aadhar Card Document',
  'Voter ID Document',
  'Driving License Document',
  'Residential Address Proof Document',
  'Cancel Cheque Image Upload',
  'Service Agreement Document',
] as const;

export type FreelancerDocumentType = typeof FREELANCER_DOCUMENT_TYPES[number];

export interface IFreelancerDocument extends Document {
  freelancerId: mongoose.Types.ObjectId;
  freelancerCode: string;
  freelancerName?: string;
  documentType: FreelancerDocumentType | string;
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

const FreelancerDocumentSchema = new Schema<IFreelancerDocument>(
  {
    freelancerId: {
      type: Schema.Types.ObjectId,
      ref: 'Freelancer',
      required: true,
      index: true,
    },
    freelancerCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    freelancerName: {
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

FreelancerDocumentSchema.index({ freelancerId: 1, documentType: 1, status: 1 });

if (mongoose.models && mongoose.models.FreelancerDocument) {
  delete (mongoose.models as any).FreelancerDocument;
}

export const FreelancerDocument: Model<IFreelancerDocument> =
  mongoose.models.FreelancerDocument ||
  mongoose.model<IFreelancerDocument>('FreelancerDocument', FreelancerDocumentSchema);
