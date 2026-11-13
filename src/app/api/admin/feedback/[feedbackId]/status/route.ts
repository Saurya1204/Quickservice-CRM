import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import CustomerFeedback from '@/models/CustomerFeedback';
import { ServiceCall } from '@/models/ServiceCall';
import { AuditLog } from '@/models/AuditLog';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ feedbackId: string }> }
) {
  try {
    await connectDB();
    const { feedbackId } = await params;
    const body = await req.json();

    const { status, reason, reopenedBy = 'Admin' } = body;
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';

    const feedback = await CustomerFeedback.findById(feedbackId);
    if (!feedback) {
      return NextResponse.json({ success: false, message: 'Feedback not found' }, { status: 404 });
    }

    if (status === 'REOPENED') {
      if (!reason || !reason.trim()) {
        return NextResponse.json(
          { success: false, message: 'Reopening Reason is mandatory. Please provide justification.' },
          { status: 400 }
        );
      }

      feedback.feedbackStatus = 'REOPENED';
      feedback.reopenReason = reason.trim();
      feedback.reopenedBy = reopenedBy;
      feedback.reopenedAt = new Date();
      await feedback.save();

      // Update ServiceCall status
      await ServiceCall.findByIdAndUpdate(feedback.callId, {
        $set: { feedbackStatus: 'REOPENED' },
        $push: {
          callHistory: {
            action: 'Feedback Reopened',
            remark: `Admin ${reopenedBy} reopened customer feedback: ${reason.trim()}`,
            transactionDate: new Date(),
            ipAddress: clientIp,
            enteredBy: reopenedBy,
            complaintStatus: 'REOPENED',
          },
        },
      });

      // Audit Log
      await AuditLog.create({
        action: 'FEEDBACK_REOPENED',
        module: 'callManagement',
        entityId: feedback._id.toString(),
        entityName: `Feedback for Call #${feedback.complaintNo}`,
        performedBy: reopenedBy,
        ipAddress: clientIp,
        details: { reason, previousStatus: 'SUBMITTED' },
      }).catch(() => null);

      return NextResponse.json({
        success: true,
        message: `Feedback for Call #${feedback.complaintNo} reopened successfully. Customer can now re-submit.`,
        data: feedback,
      });
    }

    if (status) {
      feedback.feedbackStatus = status;
      await feedback.save();
    }

    return NextResponse.json({ success: true, data: feedback });
  } catch (error: any) {
    console.error('Error in PATCH /api/admin/feedback/[feedbackId]/status:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
