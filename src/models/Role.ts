import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IActionPermissions {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  export: boolean;
  approve?: boolean;
  reopenCall?: boolean;
  uploadDocs?: boolean;
  downloadDocs?: boolean;
}

export interface IModulePermission {
  module: string;
  moduleName: string;
  accessLevel: 'FULL' | 'READ_ONLY' | 'RESTRICTED' | 'NO_ACCESS';
  actions: IActionPermissions;
  subSections?: Record<string, boolean>;
}

export interface IRole extends Document {
  name: string;
  code: string;
  description: string;
  hierarchyLevel: number;
  reportingTo?: string;
  reportingToRoleId?: mongoose.Types.ObjectId;
  status: 'ACTIVE' | 'INACTIVE';
  isSystem: boolean;
  permissions: IModulePermission[];
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ActionPermissionsSchema = new Schema<IActionPermissions>(
  {
    create: { type: Boolean, default: false },
    read: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
    export: { type: Boolean, default: false },
    approve: { type: Boolean, default: false },
    reopenCall: { type: Boolean, default: false },
    uploadDocs: { type: Boolean, default: false },
    downloadDocs: { type: Boolean, default: false },
  },
  { _id: false }
);

const ModulePermissionSchema = new Schema<IModulePermission>(
  {
    module: { type: String, required: true },
    moduleName: { type: String, required: true },
    accessLevel: {
      type: String,
      enum: ['FULL', 'READ_ONLY', 'RESTRICTED', 'NO_ACCESS'],
      default: 'READ_ONLY',
    },
    actions: { type: ActionPermissionsSchema, default: () => ({}) },
    subSections: { type: Map, of: Boolean, default: {} },
  },
  { _id: false }
);

const RoleSchema = new Schema<IRole>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: '' },
    hierarchyLevel: { type: Number, required: true, default: 5 },
    reportingTo: { type: String, default: '' },
    reportingToRoleId: { type: Schema.Types.ObjectId, ref: 'Role' },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    isSystem: { type: Boolean, default: false },
    permissions: [ModulePermissionSchema],
    createdBy: { type: String, default: 'SYSTEM' },
    updatedBy: { type: String, default: 'SYSTEM' },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.Role) {
  delete (mongoose.models as any).Role;
}

export const Role: Model<IRole> = mongoose.models.Role || mongoose.model<IRole>('Role', RoleSchema);
