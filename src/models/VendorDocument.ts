import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVendorDocument extends Document {
  vendorId: mongoose.Types.ObjectId;
  vendorName?: string;
  documentType:
    | 'Address Proof Document'
    | 'GST Number Document'
    | 'PAN Number Document'
    | 'Upload Cancel Cheque Image';
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedBy?: string;
  uploadedAt: Date;
  status: 'Active' | 'Inactive';
  createdAt: Date;
  updatedAt: Date;
}

const VendorDocumentSchema = new Schema<IVendorDocument>(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    vendorName: { type: String, default: '' },
    documentType: {
      type: String,
      enum: [
        'Address Proof Document',
        'GST Number Document',
        'PAN Number Document',
        'Upload Cancel Cheque Image',
      ],
      required: true,
    },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileSize: { type: Number, default: 0 },
    mimeType: { type: String, default: 'application/octet-stream' },
    uploadedBy: { type: String, default: 'Super Admin' },
    uploadedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  },
  { timestamps: true }
);

VendorDocumentSchema.index({ vendorId: 1, documentType: 1 });

if (mongoose.models && mongoose.models.VendorDocument) {
  delete (mongoose.models as any).VendorDocument;
}

export const VendorDocument: Model<IVendorDocument> =
  mongoose.models.VendorDocument || mongoose.model<IVendorDocument>('VendorDocument', VendorDocumentSchema);
