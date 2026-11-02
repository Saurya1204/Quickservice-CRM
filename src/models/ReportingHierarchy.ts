import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReportingHierarchyHistory {
  previousParentRoleCode?: string;
  previousParentRoleName?: string;
  newParentRoleCode?: string;
  newParentRoleName?: string;
  changedBy: string;
  changedAt: Date;
  reason?: string;
}

export interface IReportingHierarchy extends Document {
  roleId: mongoose.Types.ObjectId;
  roleCode: string;
  roleName: string;
  parentRoleId?: mongoose.Types.ObjectId;
  parentRoleCode?: string;
  parentRoleName?: string;
  hierarchyLevel: number;
  isActive: boolean;
  history: IReportingHierarchyHistory[];
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReportingHierarchyHistorySchema = new Schema<IReportingHierarchyHistory>(
  {
    previousParentRoleCode: { type: String, default: '' },
    previousParentRoleName: { type: String, default: '' },
    newParentRoleCode: { type: String, default: '' },
    newParentRoleName: { type: String, default: '' },
    changedBy: { type: String, default: 'Super Admin' },
    changedAt: { type: Date, default: Date.now },
    reason: { type: String, default: '' },
  },
  { _id: false }
);

const ReportingHierarchySchema = new Schema<IReportingHierarchy>(
  {
    roleId: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
      unique: true,
      index: true,
    },
    roleCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    roleName: {
      type: String,
      required: true,
      trim: true,
    },
    parentRoleId: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
      default: null,
    },
    parentRoleCode: {
      type: String,
      default: '',
      uppercase: true,
      trim: true,
    },
    parentRoleName: {
      type: String,
      default: '',
      trim: true,
    },
    hierarchyLevel: {
      type: Number,
      default: 5,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    history: {
      type: [ReportingHierarchyHistorySchema],
      default: [],
    },
    createdBy: {
      type: String,
      default: 'Super Admin',
    },
    updatedBy: {
      type: String,
      default: 'Super Admin',
    },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.ReportingHierarchy) {
  delete (mongoose.models as any).ReportingHierarchy;
}

export const ReportingHierarchy: Model<IReportingHierarchy> =
  mongoose.models.ReportingHierarchy ||
  mongoose.model<IReportingHierarchy>('ReportingHierarchy', ReportingHierarchySchema);

