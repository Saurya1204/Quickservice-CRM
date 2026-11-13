import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { ServiceCall } from '@/models/ServiceCall';
import { AuditLog } from '@/models/AuditLog';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const complaintNo = searchParams.get('complaintNo') || searchParams.get('callNo');
    const callId = searchParams.get('callId') || searchParams.get('id');

    if (!complaintNo && !callId) {
      return NextResponse.json(
        { success: false, message: 'Complaint Number or Call ID is required' },
        { status: 400 }
      );
    }

    // 1. Fetch Call by callNo or _id
    const query: any = {};
    if (callId) {
      query._id = callId;
    } else if (complaintNo) {
      query.callNo = { $regex: new RegExp(`^${complaintNo.trim()}$`, 'i') };
    }

    const call = await ServiceCall.findOne(query).lean();
    if (!call) {
      return NextResponse.json({ success: false, message: 'Call not found' }, { status: 404 });
    }

    // 2. Fetch Audit Logs matching this call
    const auditLogs = await AuditLog.find({
      $or: [
        { entityId: call._id.toString() },
        { entityName: { $regex: call.callNo, $options: 'i' } },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        call,
        callHistory: call.callHistory || [],
        auditLogs,
      },
    });
  } catch (error: any) {
    console.error('Error fetching call audit:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

