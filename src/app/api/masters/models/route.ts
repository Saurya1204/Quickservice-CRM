import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { ModelMaster } from '@/models/ModelMaster';
import { Client } from '@/models/Client';
import { Brand } from '@/models/Brand';
import { Category } from '@/models/Category';
import { Product } from '@/models/Product';
import { SparePart } from '@/models/SparePart';
import { AuditLog } from '@/models/AuditLog';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const clientId = searchParams.get('clientId');
    const brandId = searchParams.get('brandId');
    const categoryId = searchParams.get('categoryId');
    const productId = searchParams.get('productId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const query: any = {};
    if (clientId && clientId !== 'all') query.clientId = clientId;
    if (brandId && brandId !== 'all') query.brandId = brandId;
    if (categoryId && categoryId !== 'all') query.categoryId = categoryId;
    if (productId && productId !== 'all') query.productId = productId;
    if (status && status !== 'all') query.status = status;

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { modelNo: regex },
        { modelCode: regex },
        { modelDescription: regex },
        { productName: regex },
        { brandName: regex },
        { clientName: regex },
        { categoryName: regex },
      ];
    }

    const total = await ModelMaster.countDocuments(query);
    const models = await ModelMaster.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: models,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (error: any) {
    console.error('Error fetching models:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const {
      clientId,
      brandId,
      categoryId,
      productId,
      modelNo,
      modelDescription,
      sizeCapacity,
      colour,
      manufacturingStartDate,
      manufacturingStopDate,
      serialNumberLimitMin,
      serialNumberLimitMax,
      warrantyPeriod,
      warrantyType,
      specificWarranty,
      specificWarrantyType,
      specificParts,
      specificPeriod,
      status,
    } = body;

    if (!clientId || !brandId || !categoryId || !productId || !modelNo) {
      return NextResponse.json(
        { success: false, message: 'Client, Brand, Category, Product and Model No are mandatory' },
        { status: 400 }
      );
    }

    if (manufacturingStartDate && manufacturingStopDate) {
      if (new Date(manufacturingStopDate) < new Date(manufacturingStartDate)) {
        return NextResponse.json(
          { success: false, message: 'Manufacturing Stop Date cannot precede Manufacturing Start Date' },
          { status: 400 }
        );
      }
    }

    if (
      serialNumberLimitMin !== undefined &&
      serialNumberLimitMax !== undefined &&
      Number(serialNumberLimitMin) > Number(serialNumberLimitMax)
    ) {
      return NextResponse.json(
        { success: false, message: 'Serial Number Limit Min cannot exceed Limit Max' },
        { status: 400 }
      );
    }

    // Check duplicate
    const existing = await ModelMaster.findOne({
      clientId,
      brandId,
      categoryId,
      productId,
      modelNo: modelNo.trim(),
    });
    if (existing) {
      return NextResponse.json(
        { success: false, message: `Model No "${modelNo}" already exists for this Product hierarchy` },
        { status: 409 }
      );
    }

    // Populate display names
    const [client, brand, category, product] = await Promise.all([
      Client.findById(clientId),
      Brand.findById(brandId),
      Category.findById(categoryId),
      Product.findById(productId),
    ]);

    const count = await ModelMaster.countDocuments();
    const modelCode = `MDL${String(count + 1).padStart(4, '0')}`;

    const newModel = await ModelMaster.create({
      modelCode,
      modelNo: modelNo.trim(),
      modelDescription: modelDescription || '',
      clientId,
      clientName: client?.clientName || '',
      brandId,
      brandName: brand?.brandName || '',
      categoryId,
      categoryName: category?.categoryName || '',
      productId,
      productName: product?.productName || '',
      sizeCapacity: sizeCapacity || '',
      colour: colour || '',
      manufacturingStartDate: manufacturingStartDate ? new Date(manufacturingStartDate) : undefined,
      manufacturingStopDate: manufacturingStopDate ? new Date(manufacturingStopDate) : undefined,
      serialNumberLimitMin: serialNumberLimitMin ? Number(serialNumberLimitMin) : 0,
      serialNumberLimitMax: serialNumberLimitMax ? Number(serialNumberLimitMax) : 99999999,
      warrantyPeriod: warrantyPeriod ? Number(warrantyPeriod) : 12,
      warrantyType: warrantyType || 'Comprehensive',
      specificWarranty: specificWarranty || '',
      specificWarrantyType: specificWarrantyType || '',
      specificParts: specificParts || '',
      specificPeriod: specificPeriod || '',
      status: status || 'A',
      createdBy: 'Super Admin',
      updatedBy: 'Super Admin',
    });

    await AuditLog.create({
      action: 'CREATE',
      module: 'ModelMaster',
      recordId: newModel._id.toString(),
      details: { modelCode, modelNo, productName: newModel.productName },
      performedBy: 'Super Admin',
    });

    return NextResponse.json({ success: true, data: newModel, message: 'Model created successfully' });
  } catch (error: any) {
    console.error('Error creating model:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { _id, ...updateData } = body;

    if (!_id) {
      return NextResponse.json({ success: false, message: 'Model ID is required' }, { status: 400 });
    }

    if (updateData.manufacturingStartDate && updateData.manufacturingStopDate) {
      if (new Date(updateData.manufacturingStopDate) < new Date(updateData.manufacturingStartDate)) {
        return NextResponse.json(
          { success: false, message: 'Manufacturing Stop Date cannot precede Manufacturing Start Date' },
          { status: 400 }
        );
      }
    }

    const updated = await ModelMaster.findByIdAndUpdate(
      _id,
      { ...updateData, updatedAt: new Date(), updatedBy: 'Super Admin' },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, message: 'Model not found' }, { status: 404 });
    }

    await AuditLog.create({
      action: 'UPDATE',
      module: 'ModelMaster',
      recordId: _id,
      details: { modelNo: updated.modelNo, status: updated.status },
      performedBy: 'Super Admin',
    });

    return NextResponse.json({ success: true, data: updated, message: 'Model updated successfully' });
  } catch (error: any) {
    console.error('Error updating model:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Model ID is required' }, { status: 400 });
    }

    // Dependency check: Spare parts referencing this model
    const spareCount = await SparePart.countDocuments({ modelId: id });
    if (spareCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete Model: It is referenced by ${spareCount} Spare Part(s). Please deactivate it instead.`,
        },
        { status: 400 }
      );
    }

    const deleted = await ModelMaster.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, message: 'Model not found' }, { status: 404 });
    }

    await AuditLog.create({
      action: 'DELETE',
      module: 'ModelMaster',
      recordId: id,
      details: { modelNo: deleted.modelNo },
      performedBy: 'Super Admin',
    });

    return NextResponse.json({ success: true, message: 'Model deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting model:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
