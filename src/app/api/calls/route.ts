import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { ServiceCall } from '@/models/ServiceCall';
import { AuditLog } from '@/models/AuditLog';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const branch = searchParams.get('branch');
    const region = searchParams.get('region');
    const city = searchParams.get('city');

    const query: any = {};

    if (status && status !== 'ALL') {
      if (status === 'ACTIVE') {
        query.callStatus = { $in: ['OPEN', 'APPOINTMENT', 'ALLOTED', 'PART_PENDING', 'REOPENED'] };
      } else if (status === 'CLOSED') {
        query.callStatus = { $in: ['COMPLETED', 'CANCEL'] };
      } else {
        query.callStatus = status;
      }
    }

    if (branch && branch !== 'All' && branch.trim()) {
      query.branch = branch;
    }
    if (region && region !== 'All' && region.trim()) {
      query.region = region;
    }
    if (city && city !== 'All' && city.trim()) {
      query.city = { $regex: new RegExp(`^${city}$`, 'i') };
    }

    if (search) {
      query.$or = [
        { callNo: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerMobile: { $regex: search, $options: 'i' } },
        { brandName: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
      ];
    }

    const calls = await ServiceCall.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: calls });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    // Check if bulk insert
    if (Array.isArray(body)) {
      if (body.length === 0) {
        return NextResponse.json({ success: false, message: 'No records provided' }, { status: 400 });
      }

      const count = await ServiceCall.countDocuments();
      const prepared = body.map((call: any, idx: number) => ({
        ...call,
        callNo: call.callNo || `QS-CALL-${1000 + count + idx + 1}`,
        callStatus: call.callStatus || 'OPEN',
        daysPending: call.daysPending || 0,
      }));

      const inserted = await ServiceCall.insertMany(prepared);
      return NextResponse.json({
        success: true,
        data: inserted,
        message: `Successfully uploaded ${inserted.length} live calls to database!`,
      });
    }

    if (!body.customerName || !body.customerMobile) {
      return NextResponse.json(
        { success: false, message: 'Customer Name and Mobile are required' },
        { status: 400 }
      );
    }

    if (!body.callNo) {
      const count = await ServiceCall.countDocuments();
      body.callNo = `QS-CALL-${1000 + count + 1}`;
    }

    const newCall = await ServiceCall.create(body);

    await AuditLog.create({
      action: 'CALL_CREATE',
      module: 'callManagement',
      entityId: newCall._id.toString(),
      entityName: `Call #${newCall.callNo}`,
      performedBy: body.createdBy || 'Call Coordinator',
    });

    return NextResponse.json({
      success: true,
      data: newCall,
      message: 'Service Call registered successfully',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { id, action, reopenReason, reopenedBy, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Call ID is required' }, { status: 400 });
    }

    // Support reopen in PUT directly
    if (action === 'reopen') {
      if (!reopenReason || !reopenReason.trim()) {
        return NextResponse.json(
          { success: false, message: 'Reopening Reason is required' },
          { status: 400 }
        );
      }
      const existingCall = await ServiceCall.findById(id);
      if (!existingCall) {
        return NextResponse.json({ success: false, message: 'Call not found' }, { status: 404 });
      }

      const updated = await ServiceCall.findByIdAndUpdate(
        id,
        {
          $set: { callStatus: 'REOPENED', daysPending: 0 },
          $push: {
            reopenHistory: {
              reopenedBy: reopenedBy || 'Authorized Officer',
              reopenedAt: new Date(),
              reason: reopenReason.trim(),
              previousStatus: existingCall.callStatus,
            },
          },
        },
        { new: true }
      );

      await AuditLog.create({
        action: 'REOPEN_CALL',
        module: 'callManagement',
        entityId: id,
        entityName: `Call #${existingCall.callNo}`,
        performedBy: reopenedBy || 'Authorized Officer',
        details: { reason: reopenReason },
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: `Call #${existingCall.callNo} reopened successfully!`,
      });
    }

    const updated = await ServiceCall.findByIdAndUpdate(id, updateData, { new: true });
    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Call updated successfully',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Call ID is required' }, { status: 400 });
    }

    await ServiceCall.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Call deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
