import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReopenRecord {
  reopenedBy: string;
  reopenedAt: Date;
  reason: string;
  previousStatus: string;
}

export interface ICallAttachment {
  fileName: string;
  fileUrl: string;
  fileData?: string;
  mimeType?: string;
  fileSize?: number;
  uploadedAt: Date;
}

export interface IRequiredPart {
  partName: string;
  partCode: string;
  quantity: number;
  status: 'Required' | 'Change';
}

export interface ICallCharges {
  spareCharge: number;
  spareTax: number;
  labourCharge: number;
  labourTax: number;
  transportCharge: number;
  otherCharge: number;
  totalAmount: number;
  tcrNo: string;
}

export interface IVisitDetails {
  engineerName: string;
  visitDate?: Date | string;
  inTimeHour: string;
  inTimeMinute: string;
  outTimeHour: string;
  outTimeMinute: string;
  actionTaken: string;
  engineerRemark: string;
  lastStatus: string;
  presentStatus: string;
  happyCode: string;
  distanceFromSF: number;
  updatedAt?: Date;
}

export interface ICallHistoryItem {
  action: string;
  remark: string;
  transactionDate: Date;
  ipAddress?: string;
  enteredBy: string;
  complaintStatus: string;
  previousStatus?: string;
}

export interface IReminderItem {
  reminderDate: Date;
  reminderTime?: string;
  remarks: string;
  scheduledBy: string;
  scheduledAt: Date;
  status: string;
}

export interface IAppointmentHistoryItem {
  appointmentDate: Date;
  appointmentTime?: string;
  remarks?: string;
  scheduledBy: string;
  scheduledAt: Date;
  status?: string;
}

export interface ITransferHistoryItem {
  fromEngineer?: string;
  toEngineer: string;
  fromTeam?: string;
  toTeam?: string;
  remarks: string;
  transferredBy: string;
  transferredAt: Date;
}

export interface ICallFeedback {
  rating: number;
  customerRemarks: string;
  collectedBy: string;
  collectedAt: Date;
}

export interface IPendingPart {
  partName: string;
  partCode: string;
  quantity: number;
  unitSerialNumber?: string;
  pendingReason: string;
  invoiceCopyUrl?: string;
  defectiveImageUrl?: string;
  pendingDate: Date;
  pendingStatus: string;
}

export interface IConsumedPart {
  partName: string;
  partCode: string;
  consumedQuantity: number;
  partSerialNumber?: string;
  consumptionDate: Date;
  engineerName: string;
  relatedCallId?: string;
}

export interface IWorkDoneRecord {
  workDone: string;
  symptom?: string;
  cause?: string;
  analysis?: string;
  recordedDate: Date;
  recordedBy: string;
}

export interface ISerialNoHistoryItem {
  oldSerialNo: string;
  newSerialNo: string;
  changedBy: string;
  changedAt: Date;
  remarks: string;
}

export interface IServiceCall extends Document {
  callNo: string;
  customerName: string;
  customerMobile: string;
  customerAddress: string;
  city: string;
  state: string;
  pincode: string;
  clientName: string;
  brandName: string;
  categoryName: string;
  reportedFault: string;
  technicianName?: string;
  branch?: string;
  region?: string;
  productName?: string;
  modelNo?: string;
  serialNo?: string;
  symptomName?: string;
  causeName?: string;
  analysisName?: string;
  completedDate?: Date;
  serviceRemarks?: string;
  sparePartsUsed?: string;
  cancelledDate?: Date;
  cancellationReason?: string;
  cancelledBy?: string;

  // Older CRM Enhancement Fields
  // Section A: Basic Details
  callRegisterBy?: string;
  callSource?: string;

  // Section B: Customer Details
  customerTitle?: string;
  customerFirstName?: string;
  customerLastName?: string;
  customerAddress1?: string;
  landmark?: string;
  district?: string;

  // Section C: Contact Details
  customerEmail?: string;
  contactPersonName?: string;
  contactPersonMobile?: string;
  languages?: string[];

  // Section D: Dealer Details
  dealerName?: string;
  dealerCity?: string;
  dealerMobile?: string;
  dealerEmail?: string;
  invoiceNo?: string;
  dealerDOP?: string;

  // Section E: Product Details
  unitSerialNumber?: string;
  productDOP?: string;
  warrantyStatus?: string;
  stockOf?: string;
  purchaseOrderNo?: string;
  clientId?: string;
  brandId?: string;
  productId?: string;
  modelId?: string;

  // Section F: Complaint Details
  callType?: string;
  complaintPriority?: string;
  callNature?: string;
  visitType?: string;
  lastComplaintNo?: string;
  complaintDescription?: string;
  specialInstruction?: string;
  serviceProviderType?: string;
  serviceProviderName?: string;
  promiseDate?: string;
  promiseTime?: string;
  registeredBy?: string;

  replacementDetails?: {
    replacementType?: string;
    oldPartOrProduct?: string;
    newPartOrProduct?: string;
    replacementReason?: string;
    replacementDate?: Date;
  };

  // Job Sheet / Call Update fields
  locality?: string;
  alternateMobile?: string;
  customerAddress2?: string;
  stdCode?: string;
  residencePhone?: string;
  officePhone?: string;
  customerLanguage?: string;
  contractDetails?: string;
  callBy?: string;
  complaintType?: string;
  complaintCategory?: string;
  ascName?: string;
  talkToWhom?: string;
  cancelRemarks?: string;
  appointmentTime?: string;
  poNumber?: string;
  poStatus?: string;
  poCancellationReason?: string;
  poCancelledBy?: string;
  poCancelledAt?: Date;

  invoiceFile?: ICallAttachment;
  defectivePartImages?: ICallAttachment[];
  jobDetails?: string;
  symptomRegistered?: string;
  symptomObserved?: string;
  cause?: string;
  analysis?: string;
  partRequired?: string;
  requiredParts?: IRequiredPart[];
  charges?: ICallCharges;
  visitDetails?: IVisitDetails;
  visitHistory?: IVisitDetails[];

  // Operational Timeline & Detailed Arrays
  callHistory?: ICallHistoryItem[];
  reminders?: IReminderItem[];
  appointmentHistory?: IAppointmentHistoryItem[];
  transferHistory?: ITransferHistoryItem[];
  feedback?: ICallFeedback;
  pendingParts?: IPendingPart[];
  consumedParts?: IConsumedPart[];
  workDoneRecords?: IWorkDoneRecord[];
  serialNoHistory?: ISerialNoHistoryItem[];

  callStatus: 'OPEN' | 'APPOINTMENT' | 'ALLOTED' | 'PART_PENDING' | 'COMPLETED' | 'CANCEL' | 'REOPENED';
  appointmentDate?: Date;
  daysPending: number;
  reopenHistory: IReopenRecord[];
  createdAt: Date;
  updatedAt: Date;
}

const CallAttachmentSchema = new Schema<ICallAttachment>(
  {
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileData: { type: String, select: false },
    mimeType: { type: String, default: 'application/octet-stream' },
    fileSize: { type: Number, default: 0 },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const RequiredPartSchema = new Schema<IRequiredPart>(
  {
    partName: { type: String, required: true },
    partCode: { type: String, default: '' },
    quantity: { type: Number, default: 1 },
    status: { type: String, enum: ['Required', 'Change'], default: 'Required' },
  },
  { _id: false }
);

const CallChargesSchema = new Schema<ICallCharges>(
  {
    spareCharge: { type: Number, default: 0 },
    spareTax: { type: Number, default: 0 },
    labourCharge: { type: Number, default: 0 },
    labourTax: { type: Number, default: 0 },
    transportCharge: { type: Number, default: 0 },
    otherCharge: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    tcrNo: { type: String, default: '' },
  },
  { _id: false }
);

const VisitDetailsSchema = new Schema<IVisitDetails>(
  {
    engineerName: { type: String, default: '' },
    visitDate: { type: Date },
    inTimeHour: { type: String, default: '10' },
    inTimeMinute: { type: String, default: '00' },
    outTimeHour: { type: String, default: '11' },
    outTimeMinute: { type: String, default: '00' },
    actionTaken: { type: String, default: '' },
    engineerRemark: { type: String, default: '' },
    lastStatus: { type: String, default: '' },
    presentStatus: { type: String, default: '' },
    happyCode: { type: String, default: '' },
    distanceFromSF: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ReopenRecordSchema = new Schema<IReopenRecord>(
  {
    reopenedBy: { type: String, required: true },
    reopenedAt: { type: Date, default: Date.now },
    reason: { type: String, required: true },
    previousStatus: { type: String, required: true },
  },
  { _id: false }
);

const CallHistorySchema = new Schema<ICallHistoryItem>(
  {
    action: { type: String, required: true },
    remark: { type: String, default: '' },
    transactionDate: { type: Date, default: Date.now },
    ipAddress: { type: String, default: '' },
    enteredBy: { type: String, default: 'System' },
    complaintStatus: { type: String, default: 'OPEN' },
    previousStatus: { type: String, default: '' },
  },
  { _id: false }
);

const ReminderSchema = new Schema<IReminderItem>(
  {
    reminderDate: { type: Date, required: true },
    reminderTime: { type: String, default: '10:00 AM' },
    remarks: { type: String, default: '' },
    scheduledBy: { type: String, default: 'Call Centre Executive' },
    scheduledAt: { type: Date, default: Date.now },
    status: { type: String, default: 'PENDING' },
  },
  { _id: false }
);

const AppointmentHistorySchema = new Schema<IAppointmentHistoryItem>(
  {
    appointmentDate: { type: Date, required: true },
    appointmentTime: { type: String, default: '10:00 AM' },
    remarks: { type: String, default: '' },
    scheduledBy: { type: String, default: 'Call Coordinator' },
    scheduledAt: { type: Date, default: Date.now },
    status: { type: String, default: 'APPOINTMENT' },
  },
  { _id: false }
);

const TransferHistorySchema = new Schema<ITransferHistoryItem>(
  {
    fromEngineer: { type: String, default: '' },
    toEngineer: { type: String, required: true },
    fromTeam: { type: String, default: '' },
    toTeam: { type: String, default: '' },
    remarks: { type: String, default: '' },
    transferredBy: { type: String, default: 'Service Manager' },
    transferredAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const CallFeedbackSchema = new Schema<ICallFeedback>(
  {
    rating: { type: Number, default: 5 },
    customerRemarks: { type: String, default: '' },
    collectedBy: { type: String, default: 'Call Centre Executive' },
    collectedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const PendingPartSchema = new Schema<IPendingPart>(
  {
    partName: { type: String, required: true },
    partCode: { type: String, default: '' },
    quantity: { type: Number, default: 1 },
    unitSerialNumber: { type: String, default: '' },
    pendingReason: { type: String, default: '' },
    invoiceCopyUrl: { type: String, default: '' },
    defectiveImageUrl: { type: String, default: '' },
    pendingDate: { type: Date, default: Date.now },
    pendingStatus: { type: String, default: 'PART_PENDING' },
  },
  { _id: false }
);

const ConsumedPartSchema = new Schema<IConsumedPart>(
  {
    partName: { type: String, required: true },
    partCode: { type: String, default: '' },
    consumedQuantity: { type: Number, default: 1 },
    partSerialNumber: { type: String, default: '' },
    consumptionDate: { type: Date, default: Date.now },
    engineerName: { type: String, default: '' },
    relatedCallId: { type: String, default: '' },
  },
  { _id: false }
);

const WorkDoneRecordSchema = new Schema<IWorkDoneRecord>(
  {
    workDone: { type: String, required: true },
    symptom: { type: String, default: '' },
    cause: { type: String, default: '' },
    analysis: { type: String, default: '' },
    recordedDate: { type: Date, default: Date.now },
    recordedBy: { type: String, default: '' },
  },
  { _id: false }
);

const SerialNoHistorySchema = new Schema<ISerialNoHistoryItem>(
  {
    oldSerialNo: { type: String, default: '' },
    newSerialNo: { type: String, required: true },
    changedBy: { type: String, default: 'Super Admin' },
    changedAt: { type: Date, default: Date.now },
    remarks: { type: String, default: '' },
  },
  { _id: false }
);

const ServiceCallSchema = new Schema<IServiceCall>(
  {
    callNo: { type: String, required: true, unique: true, uppercase: true },
    customerName: { type: String, required: true },
    customerMobile: { type: String, required: true },
    customerAddress: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    clientName: { type: String, required: true },
    brandName: { type: String, required: true },
    categoryName: { type: String, required: true },
    reportedFault: { type: String, required: true },
    technicianName: { type: String },
    branch: { type: String, default: '' },
    region: { type: String, default: 'North' },
    productName: { type: String, default: '' },
    modelNo: { type: String, default: '' },
    serialNo: { type: String, default: '' },
    symptomName: { type: String, default: '' },
    causeName: { type: String, default: '' },
    analysisName: { type: String, default: '' },
    completedDate: { type: Date },
    serviceRemarks: { type: String, default: '' },
    sparePartsUsed: { type: String, default: '' },
    cancelledDate: { type: Date },
    cancellationReason: { type: String, default: '' },
    cancelledBy: { type: String, default: '' },
    replacementDetails: {
      replacementType: { type: String, default: '' },
      oldPartOrProduct: { type: String, default: '' },
      newPartOrProduct: { type: String, default: '' },
      replacementReason: { type: String, default: '' },
      replacementDate: { type: Date },
    },
    // Older CRM Enhancement Fields
    callRegisterBy: { type: String, default: 'Customer' },
    callSource: { type: String, default: 'Call Centre' },
    customerTitle: { type: String, default: 'Mr' },
    customerFirstName: { type: String, default: '' },
    customerLastName: { type: String, default: '' },
    customerAddress1: { type: String, default: '' },
    landmark: { type: String, default: '' },
    district: { type: String, default: '' },
    customerEmail: { type: String, default: '' },
    contactPersonName: { type: String, default: '' },
    contactPersonMobile: { type: String, default: '' },
    languages: { type: [String], default: [] },
    dealerName: { type: String, default: '' },
    dealerCity: { type: String, default: '' },
    dealerMobile: { type: String, default: '' },
    dealerEmail: { type: String, default: '' },
    invoiceNo: { type: String, default: '' },
    dealerDOP: { type: String, default: '' },
    unitSerialNumber: { type: String, default: '' },
    productDOP: { type: String, default: '' },
    warrantyStatus: { type: String, default: 'Under Warranty' },
    stockOf: { type: String, default: 'Customer Stock' },
    purchaseOrderNo: { type: String, default: '' },
    clientId: { type: String, default: '' },
    brandId: { type: String, default: '' },
    productId: { type: String, default: '' },
    modelId: { type: String, default: '' },
    callType: { type: String, default: 'Service' },
    complaintPriority: { type: String, default: 'Normal complaint' },
    callNature: { type: String, default: 'Normal' },
    visitType: { type: String, default: 'On site - Local' },
    lastComplaintNo: { type: String, default: '' },
    complaintDescription: { type: String, default: '' },
    specialInstruction: { type: String, default: '' },
    serviceProviderType: { type: String, default: 'Branch' },
    serviceProviderName: { type: String, default: '' },
    promiseDate: { type: String, default: '' },
    promiseTime: { type: String, default: '9-11 AM' },
    registeredBy: { type: String, default: 'Call Coordinator' },

    // Job Sheet / Call Update fields
    locality: { type: String, default: '' },
    alternateMobile: { type: String, default: '' },
    customerAddress2: { type: String, default: '' },
    stdCode: { type: String, default: '' },
    residencePhone: { type: String, default: '' },
    officePhone: { type: String, default: '' },
    customerLanguage: { type: String, default: 'Hindi' },
    contractDetails: { type: String, default: '' },
    callBy: { type: String, default: 'Customer' },
    complaintType: { type: String, default: 'Service' },
    complaintCategory: { type: String, default: 'General' },
    ascName: { type: String, default: '' },
    talkToWhom: { type: String, default: '' },
    cancelRemarks: { type: String, default: '' },
    appointmentTime: { type: String, default: '10:00 AM' },
    poNumber: { type: String, default: '' },
    poStatus: { type: String, default: 'ACTIVE' },
    poCancellationReason: { type: String, default: '' },
    poCancelledBy: { type: String, default: '' },
    poCancelledAt: { type: Date },

    invoiceFile: { type: CallAttachmentSchema },
    defectivePartImages: { type: [CallAttachmentSchema], default: [] },
    jobDetails: { type: String, default: '' },
    symptomRegistered: { type: String, default: '' },
    symptomObserved: { type: String, default: '' },
    cause: { type: String, default: '' },
    analysis: { type: String, default: '' },
    partRequired: { type: String, default: 'No' },
    requiredParts: { type: [RequiredPartSchema], default: [] },
    charges: { type: CallChargesSchema, default: () => ({}) },
    visitDetails: { type: VisitDetailsSchema, default: () => ({}) },
    visitHistory: { type: [VisitDetailsSchema], default: [] },

    // Operational Timeline & Detailed Arrays
    callHistory: { type: [CallHistorySchema], default: [] },
    reminders: { type: [ReminderSchema], default: [] },
    appointmentHistory: { type: [AppointmentHistorySchema], default: [] },
    transferHistory: { type: [TransferHistorySchema], default: [] },
    feedback: { type: CallFeedbackSchema },
    pendingParts: { type: [PendingPartSchema], default: [] },
    consumedParts: { type: [ConsumedPartSchema], default: [] },
    workDoneRecords: { type: [WorkDoneRecordSchema], default: [] },
    serialNoHistory: { type: [SerialNoHistorySchema], default: [] },

    callStatus: {
      type: String,
      enum: ['OPEN', 'APPOINTMENT', 'ALLOTED', 'PART_PENDING', 'COMPLETED', 'CANCEL', 'REOPENED'],
      default: 'OPEN',
    },
    appointmentDate: { type: Date },
    daysPending: { type: Number, default: 0 },
    reopenHistory: { type: [ReopenRecordSchema], default: [] },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.ServiceCall) {
  delete (mongoose.models as any).ServiceCall;
}

export const ServiceCall: Model<IServiceCall> =
  mongoose.models.ServiceCall || mongoose.model<IServiceCall>('ServiceCall', ServiceCallSchema);
