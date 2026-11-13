import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  username: string;
  passwordHash: string;
  fullName: string;
  role: string;
  roleCode?: string;
  roleId?: mongoose.Types.ObjectId;
  reportingTo?: string;
  reportingManagerId?: mongoose.Types.ObjectId;

  // Organizational Scope & Geographic Assignments
  organizationalScope?: 'NATIONAL' | 'CLIENT' | 'BRANCH' | 'ZONE' | 'FRANCHISE' | 'TECHNICIAN';

  // Client assignment (for Client Admin / Client User)
  clientId?: mongoose.Types.ObjectId;
  clientName?: string;
  brandId?: mongoose.Types.ObjectId;
  brandName?: string;
  assignedBrands?: string[];

  // Branch assignment (for Branch Manager / BSM)
  branchId?: mongoose.Types.ObjectId;
  branchName?: string;

  // Zone assignment (for Zone Manager / ZSM)
  zoneId?: string;
  zoneName?: string;

  // Franchise assignment (for Franchise Manager)
  franchiseId?: mongoose.Types.ObjectId;
  franchiseName?: string;

  // Technician / Engineer assignment (for Technician / Engineer)
  technicianId?: mongoose.Types.ObjectId;
  technicianName?: string;

  // Legacy geographic fields
  assignedZone?: string;
  assignedBranch?: string;
  assignedArea?: string;
  branch?: string;
  categoryClientRegion?: string;

  // Personal details
  address?: string;
  landmark?: string;
  pincode?: string;
  state?: string;
  district?: string;
  city?: string;
  locality?: string;
  mobile?: string;
  email?: string;

  // Status & Metadata
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  accountStatus?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true, trim: true },
    role: {
      type: String,
      default: 'Super Admin',
      index: true,
    },
    roleCode: { type: String, index: true },
    roleId: { type: Schema.Types.ObjectId, ref: 'Role' },
    reportingTo: { type: String, default: '' },
    reportingManagerId: { type: Schema.Types.ObjectId, ref: 'User' },

    // Scope
    organizationalScope: {
      type: String,
      enum: ['NATIONAL', 'CLIENT', 'BRANCH', 'ZONE', 'FRANCHISE', 'TECHNICIAN'],
      default: 'NATIONAL',
      index: true,
    },

    // Client
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', index: true },
    clientName: { type: String, default: '' },
    brandId: { type: Schema.Types.ObjectId, ref: 'Brand' },
    brandName: { type: String, default: '' },
    assignedBrands: { type: [String], default: [] },

    // Branch
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', index: true },
    branchName: { type: String, default: '' },

    // Zone
    zoneId: { type: String, default: '' },
    zoneName: { type: String, default: '' },

    // Franchise
    franchiseId: { type: Schema.Types.ObjectId, ref: 'Franchise', index: true },
    franchiseName: { type: String, default: '' },

    // Technician
    technicianId: { type: Schema.Types.ObjectId, ref: 'Technician', index: true },
    technicianName: { type: String, default: '' },

    // Legacy fields for backward compatibility
    assignedZone: { type: String, default: '' },
    assignedBranch: { type: String, default: '' },
    assignedArea: { type: String, default: '' },
    branch: { type: String, default: '' },
    categoryClientRegion: { type: String, default: '' },

    // Personal & Address
    address: { type: String, default: '' },
    landmark: { type: String, default: '' },
    pincode: { type: String, default: '' },
    state: { type: String, default: '' },
    district: { type: String, default: '' },
    city: { type: String, default: '' },
    locality: { type: String, default: '' },
    mobile: { type: String, default: '' },
    email: { type: String, default: '' },

    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
      default: 'ACTIVE',
      index: true,
    },
    accountStatus: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
      default: 'ACTIVE',
    },
    createdBy: { type: String, default: 'Super Admin' },
    updatedBy: { type: String, default: 'Super Admin' },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.User) {
  delete (mongoose.models as any).User;
}

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
