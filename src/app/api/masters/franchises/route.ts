import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Franchise } from '@/models/Franchise';
import { AuditLog } from '@/models/AuditLog';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const region = searchParams.get('region') || 'ALL';
    const status = searchParams.get('status') || 'ALL';
    const crmCode = searchParams.get('crmCode') || '';

    const query: any = {};

    if (crmCode) {
      query.crmCode = crmCode.toUpperCase().trim();
    }
    if (region && region !== 'ALL') {
      query.region = region;
    }
    if (status && status !== 'ALL') {
      query.status = status;
    }
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { firmName: regex },
        { crmCode: regex },
        { contactNumber: regex },
        { emailId: regex },
        { city: regex },
        { district: regex },
        { state: regex },
        { proprietorName: regex },
      ];
    }

    const franchises = await Franchise.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: franchises, count: franchises.length });
  } catch (error: any) {
    console.error('Error fetching franchises:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.firmName?.trim()) {
      return NextResponse.json({ success: false, message: 'Firm Name is required' }, { status: 400 });
    }
    if (!body.firmAddress?.trim()) {
      return NextResponse.json({ success: false, message: 'Firm Address is required' }, { status: 400 });
    }
    if (!body.contactNumber?.trim()) {
      return NextResponse.json({ success: false, message: 'Contact Number is required' }, { status: 400 });
    }
    if (!body.emailId?.trim()) {
      return NextResponse.json({ success: false, message: 'Email ID is required' }, { status: 400 });
    }
    if (!body.proprietorName?.trim()) {
      return NextResponse.json({ success: false, message: 'Proprietor Name is required' }, { status: 400 });
    }

    // Auto-generate CRM Code if not provided
    if (!body.crmCode?.trim()) {
      const count = await Franchise.countDocuments();
      let nextNum = count + 1;
      let candidate = `QSSF${String(nextNum).padStart(3, '0')}`;
      while (await Franchise.findOne({ crmCode: candidate })) {
        nextNum++;
        candidate = `QSSF${String(nextNum).padStart(3, '0')}`;
      }
      body.crmCode = candidate;
    } else {
      body.crmCode = body.crmCode.toUpperCase().trim();
      const existing = await Franchise.findOne({ crmCode: body.crmCode });
      if (existing) {
        return NextResponse.json(
          { success: false, message: `Franchise with CRM Code "${body.crmCode}" already exists.` },
          { status: 400 }
        );
      }
    }

    const newFranchise = await Franchise.create(body);

    await AuditLog.create({
      action: 'CREATE_FRANCHISE',
      module: 'franchiseMaster',
      entityId: newFranchise._id.toString(),
      entityName: `${newFranchise.firmName} (${newFranchise.crmCode})`,
      performedBy: body.createdBy || 'Super Admin',
      details: { crmCode: newFranchise.crmCode, region: newFranchise.region, city: newFranchise.city },
    });

    return NextResponse.json({
      success: true,
      data: newFranchise,
      message: `Franchise "${newFranchise.firmName}" (${newFranchise.crmCode}) created successfully!`,
    });
  } catch (error: any) {
    console.error('Error creating franchise:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Franchise ID is required' }, { status: 400 });
    }

    // Prevent changing crmCode to duplicate
    if (updateData.crmCode) {
      updateData.crmCode = updateData.crmCode.toUpperCase().trim();
      const dup = await Franchise.findOne({ crmCode: updateData.crmCode, _id: { $ne: id } });
      if (dup) {
        return NextResponse.json(
          { success: false, message: `Franchise with CRM Code "${updateData.crmCode}" already exists.` },
          { status: 400 }
        );
      }
    }

    const updated = await Franchise.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) {
      return NextResponse.json({ success: false, message: 'Franchise not found' }, { status: 404 });
    }

    await AuditLog.create({
      action: 'UPDATE_FRANCHISE',
      module: 'franchiseMaster',
      entityId: updated._id.toString(),
      entityName: `${updated.firmName} (${updated.crmCode})`,
      performedBy: updateData.updatedBy || 'Super Admin',
      details: { crmCode: updated.crmCode, region: updated.region },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Franchise "${updated.firmName}" updated successfully!`,
    });
  } catch (error: any) {
    console.error('Error updating franchise:', error);
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

    const franchise = await Franchise.findById(id);
    if (!franchise) {
      return NextResponse.json({ success: false, message: 'Franchise not found' }, { status: 404 });
    }

    await Franchise.findByIdAndDelete(id);

    await AuditLog.create({
      action: 'DELETE_FRANCHISE',
      module: 'franchiseMaster',
      entityId: id,
      entityName: `${franchise.firmName} (${franchise.crmCode})`,
      performedBy: 'Super Admin',
      details: { crmCode: franchise.crmCode },
    });

    return NextResponse.json({
      success: true,
      message: `Franchise "${franchise.firmName}" deleted successfully.`,
    });
  } catch (error: any) {
    console.error('Error deleting franchise:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
