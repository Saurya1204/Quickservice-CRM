import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMasterDocument extends Document {
  masterType: string; // 'branch' | 'franchise' | 'technician' | 'client' | 'brand' | 'category' | 'role' | 'dynamic' etc.
  entityId?: string;
  entityName: string;
  crmCode?: string;
  documentType: string;
  description?: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: Date;
  updatedAt: Date;
}

const MasterDocumentSchema = new Schema<IMasterDocument>(
  {
    masterType: { type: String, required: true, index: true },
    entityId: { type: String, default: '' },
    entityName: { type: String, required: true },
    crmCode: { type: String, default: '' },
    documentType: { type: String, required: true },
    description: { type: String, default: '' },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileSize: { type: Number, default: 0 },
    fileType: { type: String, default: '' },
    uploadedBy: { type: String, default: 'Admin' },
    status: { type: String, enum: ['ACTIVE', 'ARCHIVED'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.MasterDocument) {
  delete (mongoose.models as any).MasterDocument;
}

export const MasterDocument: Model<IMasterDocument> =
  mongoose.models.MasterDocument || mongoose.model<IMasterDocument>('MasterDocument', MasterDocumentSchema);
