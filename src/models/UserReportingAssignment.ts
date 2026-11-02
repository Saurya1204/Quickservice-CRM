import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserReportingHistory {
  previousManagerId?: mongoose.Types.ObjectId;
  previousManagerName?: string;
  previousManagerRole?: string;
  newManagerId?: mongoose.Types.ObjectId;
  newManagerName?: string;
  newManagerRole?: string;
  changedBy: string;
  changedAt: Date;
  reason?: string;
}

export interface IUserReportingAssignment extends Document {
  userId: mongoose.Types.ObjectId;
  userName: string;
  userEmail?: string;
  userMobile?: string;
  roleCode: string;
  roleName: string;
  reportingManagerId?: mongoose.Types.ObjectId;
  reportingManagerName?: string;
  reportingManagerRole?: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
  isActive: boolean;
  history: IUserReportingHistory[];
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserReportingHistorySchema = new Schema<IUserReportingHistory>(
  {
    previousManagerId: { type: Schema.Types.ObjectId, ref: 'User' },
    previousManagerName: { type: String, default: '' },
    previousManagerRole: { type: String, default: '' },
    newManagerId: { type: Schema.Types.ObjectId, ref: 'User' },
    newManagerName: { type: String, default: '' },
    newManagerRole: { type: String, default: '' },
    changedBy: { type: String, default: 'Super Admin' },
    changedAt: { type: Date, default: Date.now },
    reason: { type: String, default: '' },
  },
  { _id: false }
);

const UserReportingAssignmentSchema = new Schema<IUserReportingAssignment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    userEmail: {
      type: String,
      default: '',
      trim: true,
    },
    userMobile: {
      type: String,
      default: '',
      trim: true,
    },
    roleCode: {
      type: String,
      required: true,
      trim: true,
    },
    roleName: {
      type: String,
      required: true,
      trim: true,
    },
    reportingManagerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    reportingManagerName: {
      type: String,
      default: '',
      trim: true,
    },
    reportingManagerRole: {
      type: String,
      default: '',
      trim: true,
    },
    effectiveFrom: {
      type: Date,
      default: Date.now,
    },
    effectiveTo: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    history: {
      type: [UserReportingHistorySchema],
      default: [],
    },
    updatedBy: {
      type: String,
      default: 'Super Admin',
    },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.UserReportingAssignment) {
  delete (mongoose.models as any).UserReportingAssignment;
}

export const UserReportingAssignment: Model<IUserReportingAssignment> =
  mongoose.models.UserReportingAssignment ||
  mongoose.model<IUserReportingAssignment>('UserReportingAssignment', UserReportingAssignmentSchema);

