import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Brand } from '@/models/Brand';
import { Client } from '@/models/Client';
import { AuditLog } from '@/models/AuditLog';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const query: any = {};
    if (clientId && clientId !== 'all') {
      query.clientId = clientId;
    }
    if (status && status !== 'all') {
      query.status = status;
    }
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [{ brandName: regex }, { brandCode: regex }, { clientName: regex }];
    }

    const brands = await Brand.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: brands });
  } catch (error: any) {
    console.error('Error fetching brands:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.brandName || !body.clientId) {
      return NextResponse.json(
        { success: false, message: 'Brand Name and Client are required' },
        { status: 400 }
      );
    }

    const client = await Client.findById(body.clientId);
    if (!client) {
      return NextResponse.json({ success: false, message: 'Selected Client does not exist' }, { status: 404 });
    }
    body.clientName = client.clientName;

    // Check duplicate brand for the same client
    const normalized = body.brandName.toLowerCase().trim();
    const existing = await Brand.findOne({
      clientId: body.clientId,
      normalizedBrandName: normalized,
    });
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: `Brand "${body.brandName}" is already registered under Client "${client.clientName}".`,
        },
        { status: 409 }
      );
    }

    if (!body.brandCode) {
      const count = await Brand.countDocuments();
      body.brandCode = `QSBRD${String(count + 1).padStart(4, '0')}`;
    }

    body.normalizedBrandName = normalized;

    const newBrand = await Brand.create(body);

    await AuditLog.create({
      action: 'CREATE_BRAND',
      module: 'BRAND_MASTER',
      performedBy: body.createdBy || 'Super Admin',
      entityId: newBrand._id.toString(),
      details: `Created Brand "${newBrand.brandName}" (${newBrand.brandCode}) for Client "${client.clientName}"`,
    }).catch(() => null);

    return NextResponse.json(
      {
        success: true,
        data: newBrand,
        message: `Brand "${newBrand.brandName}" (${newBrand.brandCode}) created successfully!`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating brand:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Brand ID is required' }, { status: 400 });
    }

    if (updateData.clientId) {
      const client = await Client.findById(updateData.clientId);
      if (client) {
        updateData.clientName = client.clientName;
      }
    }

    if (updateData.brandName) {
      updateData.normalizedBrandName = updateData.brandName.toLowerCase().trim();
    }

    const updated = await Brand.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) {
      return NextResponse.json({ success: false, message: 'Brand not found' }, { status: 404 });
    }

    await AuditLog.create({
      action: 'UPDATE_BRAND',
      module: 'BRAND_MASTER',
      performedBy: body.updatedBy || 'Super Admin',
      entityId: id,
      details: `Updated Brand "${updated.brandName}" (${updated.brandCode})`,
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Brand "${updated.brandName}" updated successfully!`,
    });
  } catch (error: any) {
    console.error('Error updating brand:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Brand ID is required' }, { status: 400 });
    }

    const brand = await Brand.findById(id);
    if (!brand) {
      return NextResponse.json({ success: false, message: 'Brand not found' }, { status: 404 });
    }

    await Brand.findByIdAndDelete(id);

    await AuditLog.create({
      action: 'DELETE_BRAND',
      module: 'BRAND_MASTER',
      performedBy: 'Super Admin',
      entityId: id,
      details: `Deleted Brand "${brand.brandName}" (${brand.brandCode})`,
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      message: `Brand "${brand.brandName}" deleted successfully!`,
    });
  } catch (error: any) {
    console.error('Error deleting brand:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
