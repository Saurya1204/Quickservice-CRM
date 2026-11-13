import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import CustomerFeedback from '@/models/CustomerFeedback';
import { ServiceCall } from '@/models/ServiceCall';

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { callId, complaintNo } = body;

    if (!callId && !complaintNo) {
      return NextResponse.json({ success: false, message: 'callId or complaintNo is required' }, { status: 400 });
    }

    const query = callId ? { _id: callId } : { callNo: complaintNo };
    const serviceCall = await ServiceCall.findOne(query);

    if (!serviceCall) {
      return NextResponse.json({ success: false, message: 'Service Call not found' }, { status: 404 });
    }

    // Generate or fetch token
    let token = serviceCall.feedbackToken;
    if (!token) {
      token = crypto.randomBytes(16).toString('hex');
      serviceCall.feedbackToken = token;
      await serviceCall.save();
    }

    // Ensure CustomerFeedback record exists
    let feedback = await CustomerFeedback.findOne({ callId: serviceCall._id });
    if (!feedback) {
      feedback = await CustomerFeedback.create({
        feedbackToken: token,
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
        feedbackStatus: 'PENDING',
      });
    }

    const origin = req.headers.get('origin') || req.headers.get('host') || 'https://qs.onservice.in';
    const baseUrl = origin.startsWith('http') ? origin : `https://${origin}`;
    const feedbackUrl = `${baseUrl}/feedback/${token}`;

    const messageText = `Dear ${serviceCall.customerName}, please share your valuable feedback for your Quickserves service request #${serviceCall.callNo} by visiting: ${feedbackUrl}`;
    const whatsappUrl = `https://wa.me/91${serviceCall.customerMobile.replace(/\D/g, '')}?text=${encodeURIComponent(messageText)}`;

    return NextResponse.json({
      success: true,
      data: {
        token,
        feedbackUrl,
        whatsappUrl,
        messageText,
        feedbackStatus: feedback.feedbackStatus,
        complaintNo: serviceCall.callNo,
        customerName: serviceCall.customerName,
        customerMobile: serviceCall.customerMobile,
        engineerName: serviceCall.technicianName || 'Unassigned',
      },
    });
  } catch (error: any) {
    console.error('Error in POST /api/feedback/token:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
