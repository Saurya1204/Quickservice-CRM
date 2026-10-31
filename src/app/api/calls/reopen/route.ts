import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { ServiceCall } from '@/models/ServiceCall';
import { AuditLog } from '@/models/AuditLog';

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { id, reason, reopenedBy } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Call ID is required.' }, { status: 400 });
    }

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { success: false, message: 'Reopening Reason is mandatory.' },
        { status: 400 }
      );
    }

    const call = await ServiceCall.findById(id);
    if (!call) {
      return NextResponse.json({ success: false, message: 'Service call not found.' }, { status: 404 });
    }

    const previousStatus = call.callStatus;
    if (!['COMPLETED', 'CANCEL'].includes(previousStatus)) {
      return NextResponse.json(
        {
          success: false,
          message: `Only closed calls (COMPLETED or CANCEL) can be reopened. Current status: ${previousStatus}`,
        },
        { status: 400 }
      );
    }

    const reopenEntry = {
      reopenedBy: reopenedBy || 'Authorized Officer',
      reopenedAt: new Date(),
      reason: reason.trim(),
      previousStatus: previousStatus,
    };

    const updatedCall = await ServiceCall.findByIdAndUpdate(
      id,
      {
        $set: {
          callStatus: 'REOPENED',
          daysPending: 0,
        },
        $push: {
          reopenHistory: reopenEntry,
        },
      },
      { new: true }
    );

    // Audit log
    await AuditLog.create({
      action: 'REOPEN_CALL',
      module: 'callManagement',
      entityId: call._id.toString(),
      entityName: `Call #${call.callNo}`,
      performedBy: reopenedBy || 'Authorized Officer',
      details: {
        callNo: call.callNo,
        previousStatus,
        reason: reason.trim(),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedCall,
      message: `Call #${call.callNo} has been successfully reopened and placed in active workflow.`,
    });
  } catch (error: any) {
    console.error('Call reopen error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
