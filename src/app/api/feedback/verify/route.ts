import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import CustomerFeedback from '@/models/CustomerFeedback';
import { ServiceCall } from '@/models/ServiceCall';

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { complaintNo, mobileNumber } = body;

    if (!complaintNo || !complaintNo.trim()) {
      return NextResponse.json({ success: false, message: 'Complaint Number is required' }, { status: 400 });
    }
    if (!mobileNumber || !mobileNumber.trim()) {
      return NextResponse.json({ success: false, message: 'Registered Mobile Number is required' }, { status: 400 });
    }

    const cleanComplaint = complaintNo.trim();
    const cleanMobile = mobileNumber.trim().replace(/\D/g, '');

    // Search ServiceCall
    const serviceCall = await ServiceCall.findOne({
      $and: [
        {
          $or: [
            { callNo: cleanComplaint },
            { lastComplaintNo: cleanComplaint },
          ],
        },
        {
          $or: [
            { customerMobile: { $regex: cleanMobile.slice(-10) } },
            { alternateMobile: { $regex: cleanMobile.slice(-10) } },
          ],
        },
      ],
    });

    if (!serviceCall) {
      return NextResponse.json(
        {
          success: false,
          message: 'No matching service record found for the provided Complaint Number and Mobile Number. Please verify your details.',
        },
        { status: 404 }
      );
    }

    // Ensure token exists
    let token = serviceCall.feedbackToken;
    if (!token) {
      token = crypto.randomBytes(16).toString('hex');
      serviceCall.feedbackToken = token;
      await serviceCall.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Service record verified successfully!',
      data: {
        token,
        callId: serviceCall._id,
        complaintNo: serviceCall.callNo,
        customerName: serviceCall.customerName,
        customerMobile: serviceCall.customerMobile,
        feedbackStatus: serviceCall.feedbackStatus || 'PENDING',
      },
    });
  } catch (error: any) {
    console.error('Error in POST /api/feedback/verify:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
