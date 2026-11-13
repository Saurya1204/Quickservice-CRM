import mongoose, { Schema, Document, Model } from 'mongoose';

export type ExperienceRating = 'Poor' | 'Average' | 'Good' | 'Very Good' | 'Excellent' | '';
export type YesNoRating = 'Yes' | 'No' | '';
export type ReceiptRating = 'Yes' | 'No' | 'Not Applicable' | '';

export interface ICustomerFeedback extends Document {
  feedbackToken: string;
  complaintNo: string;
  callId: mongoose.Types.ObjectId;
  customerId?: string;
  customerName: string;
  customerMobile: string;
  customerEmail?: string;
  engineerId?: string;
  engineerName?: string;
  productName?: string;
  brandName?: string;
  categoryName?: string;
  modelNo?: string;
  unitSerialNumber?: string;
  visitDate?: Date;

  // 13 Core Feedback Questions
  // Field 1: Engineer Visit as per Scheduled Appointment
  appointmentVisitRating: YesNoRating;
  // Field 2: Are You Getting Resolution on Time?
  resolutionOnTime: YesNoRating;
  // Field 3: Are You Satisfied with Product Service / Installation?
  productServiceSatisfaction: ExperienceRating;
  // Field 4: Engineer Attitude / Behavior / Attentiveness / Grooming
  engineerAttitudeRating: ExperienceRating;
  // Field 5: Engineer Knowledge or Skill of Product / Repair
  engineerKnowledgeRating: ExperienceRating;
  // Field 6: Is He Completing Work as per Your Satisfaction?
  workSatisfaction: ExperienceRating;
  // Field 7: Is He Giving You Proper Time?
  engineerTimeRating: YesNoRating;
  // Field 8: Is He Demonstrating the Product Properly?
  productDemonstration: YesNoRating;
  // Field 9: Has He Collected Any Amount from You?
  amountCollected: YesNoRating;
  // Field 10: Has He Given You a Receipt for the Collected Amount?
  receiptProvided: ReceiptRating;
  // Field 11: Reason Behind Dissatisfaction
  dissatisfactionReason?: string;
  // Field 12: Call Centre Interaction Experience
  callCentreExperience: ExperienceRating;
  // Field 13: Overall Experience
  overallExperience: ExperienceRating;

  // Metrics & State
  numericOverallScore: number; // 1 (Poor) to 5 (Excellent)
  feedbackStatus: 'PENDING' | 'SUBMITTED' | 'REOPENED';
  submittedBy: 'Customer' | 'Admin' | 'Call Centre' | 'Executive';
  verificationStatus: 'VERIFIED' | 'PENDING';
  ipAddress?: string;
  submittedAt?: Date;

  // Administrative Reopen History
  reopenReason?: string;
  reopenedBy?: string;
  reopenedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const CustomerFeedbackSchema = new Schema<ICustomerFeedback>(
  {
    feedbackToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    complaintNo: {
      type: String,
      required: true,
      index: true,
    },
    callId: {
      type: Schema.Types.ObjectId,
      ref: 'ServiceCall',
      required: true,
      index: true,
    },
    customerId: { type: String, default: '' },
    customerName: { type: String, required: true },
    customerMobile: { type: String, required: true, index: true },
    customerEmail: { type: String, default: '' },
    engineerId: { type: String, default: '' },
    engineerName: { type: String, default: 'Unassigned', index: true },
    productName: { type: String, default: '' },
    brandName: { type: String, default: '', index: true },
    categoryName: { type: String, default: '' },
    modelNo: { type: String, default: '' },
    unitSerialNumber: { type: String, default: '' },
    visitDate: { type: Date },

    // 13 Fields
    appointmentVisitRating: {
      type: String,
      enum: ['Yes', 'No', '', 'Select'],
      default: '',
    },
    resolutionOnTime: {
      type: String,
      enum: ['Yes', 'No', '', 'Select'],
      default: '',
    },
    productServiceSatisfaction: {
      type: String,
      enum: ['Poor', 'Average', 'Good', 'Very Good', 'Excellent', '', 'Select'],
      default: '',
    },
    engineerAttitudeRating: {
      type: String,
      enum: ['Poor', 'Average', 'Good', 'Very Good', 'Excellent', '', 'Select'],
      default: '',
    },
    engineerKnowledgeRating: {
      type: String,
      enum: ['Poor', 'Average', 'Good', 'Very Good', 'Excellent', '', 'Select'],
      default: '',
    },
    workSatisfaction: {
      type: String,
      enum: ['Poor', 'Average', 'Good', 'Very Good', 'Excellent', '', 'Select'],
      default: '',
    },
    engineerTimeRating: {
      type: String,
      enum: ['Yes', 'No', '', 'Select'],
      default: '',
    },
    productDemonstration: {
      type: String,
      enum: ['Yes', 'No', '', 'Select'],
      default: '',
    },
    amountCollected: {
      type: String,
      enum: ['Yes', 'No', '', 'Select'],
      default: '',
    },
    receiptProvided: {
      type: String,
      enum: ['Yes', 'No', 'Not Applicable', '', 'Select'],
      default: 'Not Applicable',
    },
    dissatisfactionReason: {
      type: String,
      default: '',
    },
    callCentreExperience: {
      type: String,
      enum: ['Poor', 'Average', 'Good', 'Very Good', 'Excellent', '', 'Select'],
      default: '',
    },
    overallExperience: {
      type: String,
      enum: ['Poor', 'Average', 'Good', 'Very Good', 'Excellent', '', 'Select'],
      default: '',
    },

    numericOverallScore: {
      type: Number,
      default: 0,
      index: true,
    },
    feedbackStatus: {
      type: String,
      enum: ['PENDING', 'SUBMITTED', 'REOPENED'],
      default: 'PENDING',
      index: true,
    },
    submittedBy: {
      type: String,
      enum: ['Customer', 'Admin', 'Call Centre', 'Executive'],
      default: 'Customer',
    },
    verificationStatus: {
      type: String,
      enum: ['VERIFIED', 'PENDING'],
      default: 'VERIFIED',
    },
    ipAddress: { type: String, default: '' },
    submittedAt: { type: Date },

    reopenReason: { type: String, default: '' },
    reopenedBy: { type: String, default: '' },
    reopenedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

CustomerFeedbackSchema.index({ complaintNo: 1, callId: 1 });
CustomerFeedbackSchema.index({ engineerName: 1, numericOverallScore: 1 });
CustomerFeedbackSchema.index({ feedbackStatus: 1, createdAt: -1 });

export default (mongoose.models.CustomerFeedback as Model<ICustomerFeedback>) ||
  mongoose.model<ICustomerFeedback>('CustomerFeedback', CustomerFeedbackSchema);

