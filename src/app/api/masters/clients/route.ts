import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Client } from '@/models/Client';

export async function GET() {
  try {
    await connectDB();
    const clients = await Client.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: clients });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.clientName || !body.mobileNumber) {
      return NextResponse.json(
        { success: false, message: 'Client Name and Mobile Number are required' },
        { status: 400 }
      );
    }

    if (!body.clientCode) {
      const count = await Client.countDocuments();
      body.clientCode = `CDCL${String(count + 1).padStart(3, '0')}`;
    }

    body.city = body.city || 'NEW DELHI';
    body.state = body.state || 'DELHI';
    body.district = body.district || body.city || 'DELHI';
    body.locality = body.locality || body.city || 'NEW DELHI';
    body.pincode = body.pincode || '';
    body.registeredAddress = body.registeredAddress || '';

    const newClient = await Client.create(body);
    return NextResponse.json({
      success: true,
      data: newClient,
      message: 'Client created successfully',
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
      return NextResponse.json({ success: false, message: 'Client ID is required' }, { status: 400 });
    }

    const updated = await Client.findByIdAndUpdate(id, updateData, { new: true });
    return NextResponse.json({ success: true, data: updated, message: 'Client updated successfully' });
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
      return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
    }

    await Client.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Client deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
