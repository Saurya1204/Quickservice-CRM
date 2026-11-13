import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import CustomerFeedback from '@/models/CustomerFeedback';
import { ServiceCall } from '@/models/ServiceCall';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ feedbackId: string }> }
) {
  try {
    await connectDB();
    const { feedbackId } = await params;

    const feedback = await CustomerFeedback.findById(feedbackId).lean();
    if (!feedback) {
      return NextResponse.json({ success: false, message: 'Feedback record not found' }, { status: 404 });
    }

    const serviceCall = await ServiceCall.findById(feedback.callId).lean();

    return NextResponse.json({
      success: true,
      data: {
        feedback,
        serviceCall,
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/feedback/[feedbackId]:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
