import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBulkImportError {
  rowNumber: number;
  column?: string;
  value?: string;
  reason: string;
}

export interface IBulkImportHistory extends Document {
  excelOf: 'Symptom' | 'Cause' | 'Analysis' | 'Spare';
  fileName: string;
  fileSize?: number;
  totalRows: number;
  validRecords: number;
  duplicateRecords: number;
  invalidRecords: number;
  importedRecords: number;
  failedRecords: number;
  status: 'Preview' | 'Completed' | 'Aborted' | 'Failed';
  validationErrors: IBulkImportError[];
  previewRows?: any[];
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const BulkImportErrorSchema = new Schema<IBulkImportError>(
  {
    rowNumber: { type: Number, required: true },
    column: { type: String, default: '' },
    value: { type: String, default: '' },
    reason: { type: String, required: true },
  },
  { _id: false }
);

const BulkImportHistorySchema = new Schema<IBulkImportHistory>(
  {
    excelOf: {
      type: String,
      enum: ['Symptom', 'Cause', 'Analysis', 'Spare'],
      required: true,
      index: true,
    },
    fileName: { type: String, required: true },
    fileSize: { type: Number, default: 0 },
    totalRows: { type: Number, default: 0 },
    validRecords: { type: Number, default: 0 },
    duplicateRecords: { type: Number, default: 0 },
    invalidRecords: { type: Number, default: 0 },
    importedRecords: { type: Number, default: 0 },
    failedRecords: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Preview', 'Completed', 'Aborted', 'Failed'],
      default: 'Preview',
    },
    validationErrors: { type: [BulkImportErrorSchema], default: [] },
    previewRows: { type: [Schema.Types.Mixed], default: [] },
    uploadedBy: { type: String, default: 'Super Admin' },
  },
  { timestamps: true, suppressReservedKeysWarning: true }
);

if (mongoose.models && mongoose.models.BulkImportHistory) {
  delete (mongoose.models as any).BulkImportHistory;
}

export const BulkImportHistory: Model<IBulkImportHistory> =
  mongoose.models.BulkImportHistory ||
  mongoose.model<IBulkImportHistory>('BulkImportHistory', BulkImportHistorySchema);
