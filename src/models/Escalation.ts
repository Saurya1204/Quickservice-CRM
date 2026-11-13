import mongoose, { Schema, Document, Model } from 'mongoose';

export type EscalationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PENDING_APPROVAL'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'INFO_REQUIRED'
  | 'RESUBMITTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REOPENED';

export type FulfilmentStatus =
  | 'NOT_STARTED'
  | 'PART_ORDERED'
  | 'DISPATCHED'
  | 'RECEIVED'
  | 'REPLACEMENT_COMPLETED';

export interface IEscalationAttachment {
  fileName: string;
  fileUrl: string;
  fileData?: string; // base64 for Vercel/serverless storage
  attachmentType: string;
  fileSize?: number;
  mimeType?: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface IEscalationHistoryItem {
  action: string;
  previousStatus: string;
  newStatus: string;
  performedBy: string;
  performedById?: mongoose.Types.ObjectId;
  userRole: string;
  comments: string;
  timestamp: Date;
  attachments?: Array<{ fileName: string; fileUrl: string }>;
}

export interface IEscalationApproval {
  decision: 'APPROVED' | 'REJECTED' | 'INFO_REQUIRED' | 'PENDING';
  managerId: mongoose.Types.ObjectId;
  managerName: string;
  managerRole?: string;
  comments: string;
  decisionDate: Date;
  attachments?: Array<{ fileName: string; fileUrl: string }>;
}

export interface IEscalation extends Document {
  escalationNo: string; // e.g. ESC-2026-00001
  sourceModule: string; // e.g. 'Call Management', 'Spare Parts', 'Direct'
  callId?: mongoose.Types.ObjectId;
  callNo?: string;
  complaintNo?: string;

  // Customer Coordinates (Auto-fetched)
  customerId?: string;
  customerName: string;
  customerMobile: string;
  customerEmail?: string;
  customerAddress?: string;
  city?: string;
  state?: string;
  pincode?: string;

  // Product & Service Coordinates (Auto-fetched)
  productCategoryId?: mongoose.Types.ObjectId;
  productCategory: string; // e.g. 'Television'
  productId?: mongoose.Types.ObjectId;
  productName: string;
  brandId?: mongoose.Types.ObjectId;
  brandName: string;
  modelId?: mongoose.Types.ObjectId;
  modelNo: string;
  unitSerialNumber: string;
  warrantyStatus: string;
  purchaseDate?: string;
  invoiceNo?: string;

  // Escalation Classification & Dynamic Workflow
  categoryId: mongoose.Types.ObjectId;
  categoryName: string;
  categoryCode: string;
  subcategoryId: mongoose.Types.ObjectId;
  subcategoryName: string;
  subcategoryCode: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: EscalationStatus;
  fulfilmentStatus: FulfilmentStatus;

  // Technical & Diagnosis Details (Dedicated for TV Panel & Special Approvals)
  requestedPart: string; // e.g. 'Television Panel', 'Compressor'
  reasonForReplacement: string;
  technicalDiagnosis: string;
  problemDescription: string;
  requestedReplacementDetails?: string;
  technicianRemarks?: string;
  estimatedPartCost?: number;

  // Requester
  requesterUserId: mongoose.Types.ObjectId;
  requesterName: string;
  requesterRole: string;

  // Manager Assignment & Routing
  assignedManagerId: mongoose.Types.ObjectId;
  assignedManagerName: string;
  backupManagerId?: mongoose.Types.ObjectId;
  backupManagerName?: string;
  assignmentRuleId?: mongoose.Types.ObjectId;

  // Organizational Hierarchy
  branch?: string;
  zone?: string;
  franchise?: string;

  // SLA Management
  slaHours: number;
  dueDate: Date;
  isOverdue: boolean;
  firstResponseAt?: Date;
  decisionDate?: Date;

  // Decision & Approvals
  approval?: IEscalationApproval;
  managerRemarks?: string;
  rejectionReason?: string;

  // Attachments & Audit History
  attachments: IEscalationAttachment[];
  history: IEscalationHistoryItem[];

  createdAt: Date;
  updatedAt: Date;
}

const EscalationSchema = new Schema<IEscalation>(
  {
    escalationNo: { type: String, required: true, unique: true, index: true },
    sourceModule: { type: String, default: 'Call Management' },
    callId: { type: Schema.Types.ObjectId, ref: 'ServiceCall', index: true },
    callNo: { type: String, default: '' },
    complaintNo: { type: String, default: '', index: true },

    // Customer Coordinates
    customerId: { type: String, default: '' },
    customerName: { type: String, required: true, trim: true },
    customerMobile: { type: String, required: true, trim: true, index: true },
    customerEmail: { type: String, default: '' },
    customerAddress: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    pincode: { type: String, default: '' },

    // Product & Service Coordinates
    productCategoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
    productCategory: { type: String, required: true, default: 'General' },
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    productName: { type: String, default: '' },
    brandId: { type: Schema.Types.ObjectId, ref: 'Brand' },
    brandName: { type: String, default: '' },
    modelId: { type: Schema.Types.ObjectId, ref: 'ModelMaster' },
    modelNo: { type: String, default: '' },
    unitSerialNumber: { type: String, default: '', index: true },
    warrantyStatus: { type: String, default: 'Under Warranty' },
    purchaseDate: { type: String, default: '' },
    invoiceNo: { type: String, default: '' },

    // Classification
    categoryId: { type: Schema.Types.ObjectId, ref: 'EscalationCategory', required: true, index: true },
    categoryName: { type: String, required: true },
    categoryCode: { type: String, required: true },
    subcategoryId: { type: Schema.Types.ObjectId, ref: 'EscalationSubcategory', required: true, index: true },
    subcategoryName: { type: String, required: true },
    subcategoryCode: { type: String, required: true },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'HIGH',
    },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'SUBMITTED',
        'PENDING_APPROVAL',
        'UNDER_REVIEW',
        'APPROVED',
        'REJECTED',
        'INFO_REQUIRED',
        'RESUBMITTED',
        'IN_PROGRESS',
        'COMPLETED',
        'CANCELLED',
        'REOPENED',
      ],
      default: 'PENDING_APPROVAL',
      index: true,
    },
    fulfilmentStatus: {
      type: String,
      enum: ['NOT_STARTED', 'PART_ORDERED', 'DISPATCHED', 'RECEIVED', 'REPLACEMENT_COMPLETED'],
      default: 'NOT_STARTED',
    },

    // Technical Details
    requestedPart: { type: String, required: true, trim: true },
    reasonForReplacement: { type: String, required: true },
    technicalDiagnosis: { type: String, required: true },
    problemDescription: { type: String, default: '' },
    requestedReplacementDetails: { type: String, default: '' },
    technicianRemarks: { type: String, default: '' },
    estimatedPartCost: { type: Number, default: 0 },

    // Requester
    requesterUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    requesterName: { type: String, required: true },
    requesterRole: { type: String, required: true },

    // Manager Assignment
    assignedManagerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedManagerName: { type: String, required: true },
    backupManagerId: { type: Schema.Types.ObjectId, ref: 'User' },
    backupManagerName: { type: String, default: '' },
    assignmentRuleId: { type: Schema.Types.ObjectId, ref: 'EscalationAssignmentRule' },

    // Hierarchy
    branch: { type: String, default: '' },
    zone: { type: String, default: '' },
    franchise: { type: String, default: '' },

    // SLA
    slaHours: { type: Number, default: 48 },
    dueDate: { type: Date, required: true, index: true },
    isOverdue: { type: Boolean, default: false, index: true },
    firstResponseAt: { type: Date },
    decisionDate: { type: Date },

    // Approval
    approval: {
      decision: {
        type: String,
        enum: ['APPROVED', 'REJECTED', 'INFO_REQUIRED', 'PENDING'],
        default: 'PENDING',
      },
      managerId: { type: Schema.Types.ObjectId, ref: 'User' },
      managerName: { type: String, default: '' },
      managerRole: { type: String, default: '' },
      comments: { type: String, default: '' },
      decisionDate: { type: Date },
      attachments: [{ fileName: String, fileUrl: String }],
    },
    managerRemarks: { type: String, default: '' },
    rejectionReason: { type: String, default: '' },

    // Attachments
    attachments: [
      {
        fileName: { type: String, required: true },
        fileUrl: { type: String, required: true },
        fileData: { type: String },
        attachmentType: { type: String, default: 'General' },
        fileSize: { type: Number, default: 0 },
        mimeType: { type: String, default: '' },
        uploadedBy: { type: String, default: '' },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    // History Timeline
    history: [
      {
        action: { type: String, required: true },
        previousStatus: { type: String, default: '' },
        newStatus: { type: String, required: true },
        performedBy: { type: String, required: true },
        performedById: { type: Schema.Types.ObjectId, ref: 'User' },
        userRole: { type: String, default: '' },
        comments: { type: String, default: '' },
        timestamp: { type: Date, default: Date.now },
        attachments: [{ fileName: String, fileUrl: String }],
      },
    ],
  },
  { timestamps: true }
);

EscalationSchema.index({ assignedManagerId: 1, status: 1 });
EscalationSchema.index({ requesterUserId: 1, status: 1 });
EscalationSchema.index({ categoryId: 1, subcategoryId: 1 });
EscalationSchema.index({ productCategory: 1, status: 1 });
EscalationSchema.index({ createdAt: -1 });

if (mongoose.models && mongoose.models.Escalation) {
  delete (mongoose.models as any).Escalation;
}

export const Escalation: Model<IEscalation> =
  mongoose.models.Escalation || mongoose.model<IEscalation>('Escalation', EscalationSchema);
export default Escalation;

