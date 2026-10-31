import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Vendor } from '@/models/Vendor';
import { AuditLog } from '@/models/AuditLog';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const vendorAs = searchParams.get('vendorAs');
    const status = searchParams.get('status');
    const state = searchParams.get('state');
    const city = searchParams.get('city');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const query: any = { isDeleted: false };
    if (vendorAs && vendorAs !== 'all') query.vendorAs = vendorAs;
    if (status && status !== 'all') query.status = status;
    if (state && state !== 'all') query.state = state;
    if (city && city !== 'all') query.city = city;

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { vendorName: regex },
        { vendorId: regex },
        { vendorAs: regex },
        { proprietorName: regex },
        { proprietorContactNumbers: regex },
        { proprietorEmailId: regex },
        { gstNumber: regex },
        { panNumber: regex },
        { city: regex },
        { state: regex },
      ];
    }

    const total = await Vendor.countDocuments(query);
    const vendors = await Vendor.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: vendors,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (error: any) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const {
      vendorAs,
      vendorName,
      address,
      pincode,
      district,
      state,
      city,
      landlineNumber,
      gstNumber,
      panNumber,
      proprietorName,
      proprietorContactNumbers,
      proprietorEmailId,
      bankName,
      branch,
      accountHolderName,
      accountNumber,
      ifscNumber,
      paymentTerms,
      otherClient,
      status,
    } = body;

    if (!vendorName || !vendorAs) {
      return NextResponse.json(
        { success: false, message: 'Vendor Name and Vendor As are required' },
        { status: 400 }
      );
    }

    // Auto generate sequential vendor code VND0001+
    const count = await Vendor.countDocuments();
    const vendorId = `VND${String(count + 1).padStart(4, '0')}`;

    const newVendor = await Vendor.create({
      vendorId,
      vendorAs: vendorAs || 'Supplier',
      vendorName: vendorName.trim(),
      address: address || '',
      pincode: pincode || '',
      district: district || '',
      state: state || '',
      city: city || '',
      landlineNumber: landlineNumber || '',
      gstNumber: gstNumber?.trim().toUpperCase() || '',
      panNumber: panNumber?.trim().toUpperCase() || '',
      proprietorName: proprietorName || '',
      proprietorContactNumbers: proprietorContactNumbers || '',
      proprietorEmailId: proprietorEmailId || '',
      bankName: bankName || '',
      branch: branch || '',
      accountHolderName: accountHolderName || '',
      accountNumber: accountNumber || '',
      ifscNumber: ifscNumber?.trim().toUpperCase() || '',
      paymentTerms: paymentTerms || '',
      otherClient: otherClient || '',
      status: status || 'Active',
      isDeleted: false,
      createdBy: 'Super Admin',
      updatedBy: 'Super Admin',
    });

    await AuditLog.create({
      action: 'CREATE',
      module: 'VendorMaster',
      recordId: newVendor._id.toString(),
      details: { vendorId, vendorName: newVendor.vendorName, vendorAs: newVendor.vendorAs },
      performedBy: 'Super Admin',
    });

    return NextResponse.json({ success: true, data: newVendor, message: 'Vendor created successfully' });
  } catch (error: any) {
    console.error('Error creating vendor:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { _id, ...updateData } = body;

    if (!_id) {
      return NextResponse.json({ success: false, message: 'Vendor ID is required' }, { status: 400 });
    }

    const updated = await Vendor.findByIdAndUpdate(
      _id,
      { ...updateData, updatedAt: new Date(), updatedBy: 'Super Admin' },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, message: 'Vendor not found' }, { status: 404 });
    }

    await AuditLog.create({
      action: 'UPDATE',
      module: 'VendorMaster',
      recordId: _id,
      details: { vendorId: updated.vendorId, status: updated.status },
      performedBy: 'Super Admin',
    });

    return NextResponse.json({ success: true, data: updated, message: 'Vendor updated successfully' });
  } catch (error: any) {
    console.error('Error updating vendor:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, message: 'ID and Status are required' }, { status: 400 });
    }

    const updated = await Vendor.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date(), updatedBy: 'Super Admin' },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, message: 'Vendor not found' }, { status: 404 });
    }

    await AuditLog.create({
      action: 'STATUS_CHANGE',
      module: 'VendorMaster',
      recordId: id,
      details: { status },
      performedBy: 'Super Admin',
    });

    return NextResponse.json({ success: true, data: updated, message: `Vendor status changed to ${status}` });
  } catch (error: any) {
    console.error('Error updating vendor status:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Vendor ID is required' }, { status: 400 });
    }

    // Soft delete
    const deleted = await Vendor.findByIdAndUpdate(
      id,
      { isDeleted: true, status: 'Inactive', updatedAt: new Date(), updatedBy: 'Super Admin' },
      { new: true }
    );

    if (!deleted) {
      return NextResponse.json({ success: false, message: 'Vendor not found' }, { status: 404 });
    }

    await AuditLog.create({
      action: 'DELETE',
      module: 'VendorMaster',
      recordId: id,
      details: { vendorId: deleted.vendorId, softDeleted: true },
      performedBy: 'Super Admin',
    });

    return NextResponse.json({ success: true, message: 'Vendor deactivated / deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting vendor:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
