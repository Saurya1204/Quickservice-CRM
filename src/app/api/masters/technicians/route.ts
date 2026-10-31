import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Technician } from '@/models/Technician';
import { AuditLog } from '@/models/AuditLog';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const branch = searchParams.get('branch') || '';
    const region = searchParams.get('region') || '';
    const state = searchParams.get('state') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const query: any = {};
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { technicianName: regex },
        { crmCode: regex },
        { contactNumber: regex },
        { emailId: regex },
        { city: regex },
        { skillSet: regex },
      ];
    }
    if (branch && branch !== 'all') {
      query.branchName = branch;
    }
    if (region && region !== 'all') {
      query.region = region;
    }
    if (state && state !== 'all') {
      query.state = state;
    }
    if (status && status !== 'all') {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    const total = await Technician.countDocuments(query);
    const technicians = await Technician.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: technicians,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error: any) {
    console.error('Error fetching technicians:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.technicianName || !body.contactNumber) {
      return NextResponse.json(
        { success: false, message: 'Technician Name and Contact Number are required' },
        { status: 400 }
      );
    }

    if (!body.crmCode) {
      const count = await Technician.countDocuments();
      body.crmCode = `QST${String(count + 1).padStart(4, '0')}`;
    } else {
      const existing = await Technician.findOne({
        crmCode: body.crmCode.toUpperCase().trim(),
      });
      if (existing) {
        return NextResponse.json(
          { success: false, message: `Technician CRM Code "${body.crmCode}" already exists.` },
          { status: 409 }
        );
      }
      body.crmCode = body.crmCode.toUpperCase().trim();
    }

    const newTechnician = await Technician.create(body);

    await AuditLog.create({
      action: 'CREATE_TECHNICIAN',
      module: 'TECHNICIAN_MASTER',
      performedBy: body.createdBy || 'Super Admin',
      entityId: newTechnician._id.toString(),
      details: `Created Technician "${newTechnician.technicianName}" (${newTechnician.crmCode})`,
    }).catch(() => null);

    return NextResponse.json(
      {
        success: true,
        data: newTechnician,
        message: `Technician "${newTechnician.technicianName}" (${newTechnician.crmCode}) created successfully!`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating technician:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Technician ID is required' }, { status: 400 });
    }

    const updated = await Technician.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) {
      return NextResponse.json({ success: false, message: 'Technician not found' }, { status: 404 });
    }

    await AuditLog.create({
      action: 'UPDATE_TECHNICIAN',
      module: 'TECHNICIAN_MASTER',
      performedBy: body.updatedBy || 'Super Admin',
      entityId: id,
      details: `Updated Technician "${updated.technicianName}" (${updated.crmCode})`,
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Technician "${updated.technicianName}" updated successfully!`,
    });
  } catch (error: any) {
    console.error('Error updating technician:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Technician ID is required' }, { status: 400 });
    }

    const technician = await Technician.findById(id);
    if (!technician) {
      return NextResponse.json({ success: false, message: 'Technician not found' }, { status: 404 });
    }

    await Technician.findByIdAndDelete(id);

    await AuditLog.create({
      action: 'DELETE_TECHNICIAN',
      module: 'TECHNICIAN_MASTER',
      performedBy: 'Super Admin',
      entityId: id,
      details: `Deleted Technician "${technician.technicianName}" (${technician.crmCode})`,
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      message: `Technician "${technician.technicianName}" deleted successfully!`,
    });
  } catch (error: any) {
    console.error('Error deleting technician:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
