import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import CustomerFeedback from '@/models/CustomerFeedback';
import { ServiceCall } from '@/models/ServiceCall';
import { AuditLog } from '@/models/AuditLog';

const RATING_SCORE_MAP: Record<string, number> = {
  'Poor': 1,
  'Average': 2,
  'Good': 3,
  'Very Good': 4,
  'Excellent': 5,
};

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const {
      token,
      callId,
      complaintNo,
      appointmentVisitRating,
      resolutionOnTime,
      productServiceSatisfaction,
      engineerAttitudeRating,
      engineerKnowledgeRating,
      workSatisfaction,
      engineerTimeRating,
      productDemonstration,
      amountCollected,
      receiptProvided,
      dissatisfactionReason,
      callCentreExperience,
      overallExperience,
      submittedBy = 'Customer',
    } = body;

    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';

    // 1. Identify Service Call
    let serviceCall: any = null;
    if (callId) {
      serviceCall = await ServiceCall.findById(callId);
    } else if (complaintNo) {
      serviceCall = await ServiceCall.findOne({ callNo: complaintNo });
    } else if (token) {
      serviceCall = await ServiceCall.findOne({
        $or: [
          { feedbackToken: token },
          { callNo: token },
          ...(token.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: token }] : []),
        ],
      });
    }

    if (!serviceCall) {
      return NextResponse.json(
        { success: false, message: 'Associated Service Call could not be identified.' },
        { status: 404 }
      );
    }

    // 2. Locate or initialize CustomerFeedback record
    let feedback = await CustomerFeedback.findOne({
      $or: [
        ...(token ? [{ feedbackToken: token }] : []),
        { callId: serviceCall._id },
      ],
    });

    // Check duplicate submission
    if (feedback && feedback.feedbackStatus === 'SUBMITTED' && submittedBy === 'Customer') {
      return NextResponse.json(
        {
          success: false,
          message: 'Feedback for this service call has already been submitted. Thank you for your feedback!',
          alreadySubmitted: true,
        },
        { status: 400 }
      );
    }

    // 3. Conditional Validations
    // Core mandatory check
    if (!appointmentVisitRating || appointmentVisitRating === 'Select') {
      return NextResponse.json({ success: false, message: 'Please answer: Engineer Visit as per Scheduled Appointment.' }, { status: 400 });
    }
    if (!resolutionOnTime || resolutionOnTime === 'Select') {
      return NextResponse.json({ success: false, message: 'Please answer: Are you get resolution on time.' }, { status: 400 });
    }
    if (!productServiceSatisfaction || productServiceSatisfaction === 'Select') {
      return NextResponse.json({ success: false, message: 'Please rate: Product Service / Installation.' }, { status: 400 });
    }
    if (!engineerAttitudeRating || engineerAttitudeRating === 'Select') {
      return NextResponse.json({ success: false, message: 'Please rate: Engineer Attitude / Behavior / Attentiveness / Grooming.' }, { status: 400 });
    }
    if (!engineerKnowledgeRating || engineerKnowledgeRating === 'Select') {
      return NextResponse.json({ success: false, message: 'Please rate: Engineer Knowledge or Skill of Product / Repair.' }, { status: 400 });
    }
    if (!workSatisfaction || workSatisfaction === 'Select') {
      return NextResponse.json({ success: false, message: 'Please rate: Is he Complete work as per your Satisfaction.' }, { status: 400 });
    }
    if (!engineerTimeRating || engineerTimeRating === 'Select') {
      return NextResponse.json({ success: false, message: 'Please answer: Is he given you proper time.' }, { status: 400 });
    }
    if (!productDemonstration || productDemonstration === 'Select') {
      return NextResponse.json({ success: false, message: 'Please answer: Is he Demonstrate you properly about Product.' }, { status: 400 });
    }
    if (!amountCollected || amountCollected === 'Select') {
      return NextResponse.json({ success: false, message: 'Please answer: Has He Collected Any Amount from You.' }, { status: 400 });
    }
    if (!callCentreExperience || callCentreExperience === 'Select') {
      return NextResponse.json({ success: false, message: 'Please rate: Call Centre Interaction experience.' }, { status: 400 });
    }
    if (!overallExperience || overallExperience === 'Select') {
      return NextResponse.json({ success: false, message: 'Please rate: Overall experience.' }, { status: 400 });
    }

    // Amount collected vs receipt logic
    let finalReceiptProvided = receiptProvided;
    if (amountCollected === 'Yes') {
      if (!receiptProvided || receiptProvided === 'Select' || receiptProvided === 'Not Applicable') {
        return NextResponse.json(
          { success: false, message: 'Since amount was collected, please answer: Has He Given You a Receipt for the Collected Amount?' },
          { status: 400 }
        );
      }
    } else {
      finalReceiptProvided = 'Not Applicable';
    }

    // Negative / Dissatisfaction validation
    const hasNegativeRating =
      productServiceSatisfaction === 'Poor' ||
      productServiceSatisfaction === 'Average' ||
      engineerAttitudeRating === 'Poor' ||
      engineerAttitudeRating === 'Average' ||
      engineerKnowledgeRating === 'Poor' ||
      engineerKnowledgeRating === 'Average' ||
      workSatisfaction === 'Poor' ||
      workSatisfaction === 'Average' ||
      callCentreExperience === 'Poor' ||
      callCentreExperience === 'Average' ||
      overallExperience === 'Poor' ||
      overallExperience === 'Average' ||
      appointmentVisitRating === 'No' ||
      resolutionOnTime === 'No' ||
      engineerTimeRating === 'No' ||
      productDemonstration === 'No';

    if (hasNegativeRating && (!dissatisfactionReason || !dissatisfactionReason.trim())) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please provide the Reason behind Dissatisfaction to help us address and rectify the issue.',
        },
        { status: 400 }
      );
    }

    // Calculate numeric score
    const numericScore = RATING_SCORE_MAP[overallExperience] || 3;

    // 4. Save CustomerFeedback document
    const feedbackPayload = {
      feedbackToken: feedback?.feedbackToken || serviceCall.feedbackToken || token || `fb-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      complaintNo: serviceCall.callNo,
      callId: serviceCall._id,
      customerName: serviceCall.customerName,
      customerMobile: serviceCall.customerMobile,
      customerEmail: serviceCall.customerEmail || '',
      engineerName: serviceCall.technicianName || 'Assigned Service Engineer',
      brandName: serviceCall.brandName || '',
      categoryName: serviceCall.categoryName || '',
      modelNo: serviceCall.modelNo || '',
      unitSerialNumber: serviceCall.unitSerialNumber || serviceCall.serialNo || '',
      visitDate:
        serviceCall.visitDetails?.visitDate ||
        serviceCall.completedDate ||
        serviceCall.appointmentDate ||
        serviceCall.createdAt,

      appointmentVisitRating,
      resolutionOnTime,
      productServiceSatisfaction,
      engineerAttitudeRating,
      engineerKnowledgeRating,
      workSatisfaction,
      engineerTimeRating,
      productDemonstration,
      amountCollected,
      receiptProvided: finalReceiptProvided,
      dissatisfactionReason: dissatisfactionReason?.trim() || '',
      callCentreExperience,
      overallExperience,

      numericOverallScore: numericScore,
      feedbackStatus: 'SUBMITTED',
      submittedBy,
      verificationStatus: 'VERIFIED',
      ipAddress: clientIp,
      submittedAt: new Date(),
    };

    if (feedback) {
      Object.assign(feedback, feedbackPayload);
      await feedback.save();
    } else {
      feedback = await CustomerFeedback.create(feedbackPayload);
    }

    // 5. Update ServiceCall model
    const feedbackRemark = `Customer feedback submitted: Overall experience - ${overallExperience} (${numericScore}/5)${
      dissatisfactionReason ? ` | Dissatisfaction Reason: ${dissatisfactionReason.trim()}` : ''
    }`;

    await ServiceCall.findByIdAndUpdate(
      serviceCall._id,
      {
        $set: {
          feedbackStatus: 'SUBMITTED',
          feedbackToken: feedback.feedbackToken,
          feedback: {
            rating: numericScore,
            customerRemarks: dissatisfactionReason?.trim() || overallExperience,
            collectedBy: submittedBy,
            collectedAt: new Date(),
          },
        },
        $push: {
          callHistory: {
            action: 'Call Feedback',
            remark: feedbackRemark,
            transactionDate: new Date(),
            ipAddress: clientIp,
            enteredBy: submittedBy,
            complaintStatus: serviceCall.callStatus,
          },
        },
      },
      { new: true }
    );

    // 6. Create Audit Log
    await AuditLog.create({
      action: 'FEEDBACK_SUBMITTED',
      module: 'callManagement',
      entityId: serviceCall._id.toString(),
      entityName: `Feedback for Call #${serviceCall.callNo}`,
      performedBy: submittedBy,
      ipAddress: clientIp,
      details: {
        complaintNo: serviceCall.callNo,
        overallExperience,
        numericScore,
        engineerName: serviceCall.technicianName,
        dissatisfactionReason,
      },
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      message: 'Thank you! Your feedback has been successfully submitted and recorded.',
      data: {
        feedbackId: feedback._id,
        complaintNo: serviceCall.callNo,
        overallExperience,
        submittedAt: feedback.submittedAt,
      },
    });
  } catch (error: any) {
    console.error('Error in POST /api/feedback/submit:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
