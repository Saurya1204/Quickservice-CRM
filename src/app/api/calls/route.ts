import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { ServiceCall } from '@/models/ServiceCall';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const query: any = {};
    if (status && status !== 'ALL') {
      query.callStatus = status;
    }
    if (search) {
      query.$or = [
        { callNo: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerMobile: { $regex: search, $options: 'i' } },
        { brandName: { $regex: search, $options: 'i' } },
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
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Call ID is required' }, { status: 400 });
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
