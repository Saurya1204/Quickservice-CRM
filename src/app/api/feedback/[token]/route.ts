import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import CustomerFeedback from '@/models/CustomerFeedback';
import { ServiceCall } from '@/models/ServiceCall';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    await connectDB();
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ success: false, message: 'Feedback token is required' }, { status: 400 });
    }

    // 1. Check existing CustomerFeedback record
    let feedback = await CustomerFeedback.findOne({ feedbackToken: token }).lean();

    // 2. If not found by feedbackToken, check if token matches ServiceCall feedbackToken, callNo, or _id
    let serviceCall: any = null;
    if (feedback) {
      serviceCall = await ServiceCall.findById(feedback.callId).lean();
    } else {
      serviceCall = await ServiceCall.findOne({
        $or: [
          { feedbackToken: token },
          { callNo: token },
          ...(token.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: token }] : []),
        ],
      }).lean();

      if (serviceCall) {
        feedback = await CustomerFeedback.findOne({ callId: serviceCall._id }).lean();
      }
    }

    if (!serviceCall && !feedback) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired feedback link. Please check your complaint reference.' },
        { status: 404 }
      );
    }

    // Construct response payload
    const payload = {
      feedbackToken: feedback?.feedbackToken || serviceCall?.feedbackToken || token,
      feedbackId: feedback?._id || null,
      feedbackStatus: feedback?.feedbackStatus || 'PENDING',
      submittedAt: feedback?.submittedAt || null,
      call: {
        id: serviceCall?._id || feedback?.callId,
        complaintNo: serviceCall?.callNo || feedback?.complaintNo,
        customerName: serviceCall?.customerName || feedback?.customerName,
        customerMobile: serviceCall?.customerMobile || feedback?.customerMobile,
        engineerName: serviceCall?.technicianName || feedback?.engineerName || 'Assigned Service Engineer',
        brandName: serviceCall?.brandName || feedback?.brandName || '',
        categoryName: serviceCall?.categoryName || feedback?.categoryName || '',
        modelNo: serviceCall?.modelNo || feedback?.modelNo || '',
        unitSerialNumber: serviceCall?.unitSerialNumber || serviceCall?.serialNo || feedback?.unitSerialNumber || '',
        reportedFault: serviceCall?.reportedFault || '',
        callStatus: serviceCall?.callStatus || 'COMPLETED',
        visitDate:
          serviceCall?.visitDetails?.visitDate ||
          serviceCall?.completedDate ||
          serviceCall?.appointmentDate ||
          serviceCall?.createdAt,
      },
      responses: feedback
        ? {
            appointmentVisitRating: feedback.appointmentVisitRating || '',
            resolutionOnTime: feedback.resolutionOnTime || '',
            productServiceSatisfaction: feedback.productServiceSatisfaction || '',
            engineerAttitudeRating: feedback.engineerAttitudeRating || '',
            engineerKnowledgeRating: feedback.engineerKnowledgeRating || '',
            workSatisfaction: feedback.workSatisfaction || '',
            engineerTimeRating: feedback.engineerTimeRating || '',
            productDemonstration: feedback.productDemonstration || '',
            amountCollected: feedback.amountCollected || '',
            receiptProvided: feedback.receiptProvided || 'Not Applicable',
            dissatisfactionReason: feedback.dissatisfactionReason || '',
            callCentreExperience: feedback.callCentreExperience || '',
            overallExperience: feedback.overallExperience || '',
          }
        : null,
    };

    return NextResponse.json({ success: true, data: payload });
  } catch (error: any) {
    console.error('Error in GET /api/feedback/[token]:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
