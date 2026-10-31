import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuditLog extends Document {
  action: string;
  module: string;
  entityId?: string;
  entityName?: string;
  performedBy: string;
  performedByRole?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: { type: String, required: true, index: true },
    module: { type: String, required: true, index: true },
    entityId: { type: String },
    entityName: { type: String },
    performedBy: { type: String, required: true },
    performedByRole: { type: String },
    details: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

if (mongoose.models && mongoose.models.AuditLog) {
  delete (mongoose.models as any).AuditLog;
}

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
