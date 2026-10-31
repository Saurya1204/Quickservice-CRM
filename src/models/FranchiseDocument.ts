import mongoose, { Schema, Document, Model } from 'mongoose';

export const FRANCHISE_DOCUMENT_TYPES = [
  'Firm Address Proof',
  'GST Certificate',
  'PAN Card',
  'Registration Certificate',
  'Proprietor Photo',
  'Proprietor Address Proof',
  'Partnership Deed',
  'Aadhar Card',
  'Cancel Cheque',
  'Rent Agreement',
] as const;

export type FranchiseDocumentType = typeof FRANCHISE_DOCUMENT_TYPES[number];

export interface IFranchiseDocument extends Document {
  franchiseId: mongoose.Types.ObjectId;
  franchiseCRMCode: string;
  franchiseName: string;
  documentType: FranchiseDocumentType | string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: Date;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: Date;
  updatedAt: Date;
}

const FranchiseDocumentSchema = new Schema<IFranchiseDocument>(
  {
    franchiseId: { type: Schema.Types.ObjectId, ref: 'Franchise', required: true, index: true },
    franchiseCRMCode: { type: String, required: true, uppercase: true, trim: true, index: true },
    franchiseName: { type: String, required: true },
    documentType: {
      type: String,
      required: true,
      enum: FRANCHISE_DOCUMENT_TYPES as any,
    },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileSize: { type: Number, default: 0 },
    mimeType: { type: String, default: '' },
    uploadedBy: { type: String, default: 'Super Admin' },
    uploadedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['ACTIVE', 'ARCHIVED'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.FranchiseDocument) {
  delete (mongoose.models as any).FranchiseDocument;
}

export const FranchiseDocument: Model<IFranchiseDocument> =
  mongoose.models.FranchiseDocument ||
  mongoose.model<IFranchiseDocument>('FranchiseDocument', FranchiseDocumentSchema);
