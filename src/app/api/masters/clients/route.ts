import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Client } from '@/models/Client';
import { AuditLog } from '@/models/AuditLog';
import { NomenclatureService } from '@/lib/nomenclatureService';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const state = searchParams.get('state') || '';
    const city = searchParams.get('city') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const query: any = {};
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { clientName: regex },
        { clientCode: regex },
        { contactPerson: regex },
        { mobileNumber: regex },
        { emailId: regex },
        { city: regex },
        { gstNumber: regex },
      ];
    }
    if (state && state !== 'all') {
      query.state = state;
    }
    if (city && city !== 'all') {
      query.city = city;
    }
    if (status && status !== 'all') {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    const total = await Client.countDocuments(query);
    const clients = await Client.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: clients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error: any) {
    console.error('Error fetching clients:', error);
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
      body.clientCode = await NomenclatureService.getNextCode('Client');
    } else {
      const existing = await Client.findOne({
        clientCode: body.clientCode.toUpperCase().trim(),
      });
      if (existing) {
        return NextResponse.json(
          { success: false, message: `Client ID "${body.clientCode}" already exists.` },
          { status: 409 }
        );
      }
      body.clientCode = body.clientCode.toUpperCase().trim();
    }

    body.city = body.city || 'NEW DELHI';
    body.state = body.state || 'DELHI';
    body.district = body.district || body.city || 'DELHI';
    body.locality = body.locality || body.city || 'NEW DELHI';

    const newClient = await Client.create(body);

    await AuditLog.create({
      action: 'CREATE_CLIENT',
      module: 'CLIENT_MASTER',
      performedBy: body.createdBy || 'Super Admin',
      entityId: newClient._id.toString(),
      details: `Created Client "${newClient.clientName}" (${newClient.clientCode})`,
    }).catch(() => null);

    return NextResponse.json(
      {
        success: true,
        data: newClient,
        message: `Client "${newClient.clientName}" (${newClient.clientCode}) created successfully!`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating client:', error);
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
    if (!updated) {
      return NextResponse.json({ success: false, message: 'Client not found' }, { status: 404 });
    }

    await AuditLog.create({
      action: 'UPDATE_CLIENT',
      module: 'CLIENT_MASTER',
      performedBy: body.updatedBy || 'Super Admin',
      entityId: id,
      details: `Updated Client "${updated.clientName}" (${updated.clientCode})`,
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Client "${updated.clientName}" updated successfully!`,
    });
  } catch (error: any) {
    console.error('Error updating client:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Client ID is required' }, { status: 400 });
    }

    const client = await Client.findById(id);
    if (!client) {
      return NextResponse.json({ success: false, message: 'Client not found' }, { status: 404 });
    }

    await Client.findByIdAndDelete(id);

    await AuditLog.create({
      action: 'DELETE_CLIENT',
      module: 'CLIENT_MASTER',
      performedBy: 'Super Admin',
      entityId: id,
      details: `Deleted Client "${client.clientName}" (${client.clientCode})`,
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      message: `Client "${client.clientName}" deleted successfully!`,
    });
  } catch (error: any) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
