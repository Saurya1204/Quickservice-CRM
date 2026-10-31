import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBranchDocument extends Document {
  branchId: mongoose.Types.ObjectId;
  branchName: string;
  crmCode: string;
  documentType:
    | 'Address Proof Document'
    | 'Shop & Establishment Registration File Upload'
    | 'GST Number Proof Document'
    | 'Rent Agreement Document'
    | string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: Date;
  updatedAt: Date;
}

const BranchDocumentSchema = new Schema<IBranchDocument>(
  {
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    branchName: { type: String, required: true },
    crmCode: { type: String, default: '' },
    documentType: {
      type: String,
      required: true,
      enum: [
        'Address Proof Document',
        'Shop & Establishment Registration File Upload',
        'GST Number Proof Document',
        'Rent Agreement Document',
      ],
    },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileSize: { type: Number, default: 0 },
    fileType: { type: String, default: '' },
    uploadedBy: { type: String, default: 'Admin' },
    status: { type: String, enum: ['ACTIVE', 'ARCHIVED'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.BranchDocument) {
  delete (mongoose.models as any).BranchDocument;
}

export const BranchDocument: Model<IBranchDocument> =
  mongoose.models.BranchDocument || mongoose.model<IBranchDocument>('BranchDocument', BranchDocumentSchema);
