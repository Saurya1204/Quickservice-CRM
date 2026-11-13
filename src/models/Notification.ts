import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotification extends Document {
  recipientUserId: mongoose.Types.ObjectId;
  recipientRole?: string;
  title: string;
  message: string;
  type: 'ESCALATION_ASSIGNED' | 'ESCALATION_APPROVED' | 'ESCALATION_REJECTED' | 'INFO_REQUESTED' | 'SLA_BREACH' | 'SYSTEM';
  escalationId?: mongoose.Types.ObjectId;
  escalationNo?: string;
  callId?: mongoose.Types.ObjectId;
  complaintNo?: string;
  actionUrl?: string;
  isRead: boolean;
  readAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    recipientRole: { type: String, default: '' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['ESCALATION_ASSIGNED', 'ESCALATION_APPROVED', 'ESCALATION_REJECTED', 'INFO_REQUESTED', 'SLA_BREACH', 'SYSTEM'],
      default: 'SYSTEM',
    },
    escalationId: { type: Schema.Types.ObjectId, ref: 'Escalation' },
    escalationNo: { type: String, default: '' },
    callId: { type: Schema.Types.ObjectId, ref: 'ServiceCall' },
    complaintNo: { type: String, default: '' },
    actionUrl: { type: String, default: '' },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

NotificationSchema.index({ recipientUserId: 1, isRead: 1, createdAt: -1 });

if (mongoose.models && mongoose.models.Notification) {
  delete (mongoose.models as any).Notification;
}

export const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', NotificationSchema);
export default Notification;

