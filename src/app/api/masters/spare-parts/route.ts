import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { SparePart } from '@/models/SparePart';
import { ModelMaster } from '@/models/ModelMaster';
import { Client } from '@/models/Client';
import { Brand } from '@/models/Brand';
import { Category } from '@/models/Category';
import { Product } from '@/models/Product';
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
    const modelId = searchParams.get('modelId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const query: any = {};
    if (clientId && clientId !== 'all') query.clientId = clientId;
    if (brandId && brandId !== 'all') query.brandId = brandId;
    if (categoryId && categoryId !== 'all') query.categoryId = categoryId;
    if (productId && productId !== 'all') query.productId = productId;
    if (modelId && modelId !== 'all') query.modelId = modelId;
    if (status && status !== 'all') query.status = status;

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { spareName: regex },
        { partCode: regex },
        { partDescription: regex },
        { modelNo: regex },
        { productName: regex },
        { brandName: regex },
        { clientName: regex },
      ];
    }

    const total = await SparePart.countDocuments(query);
    const spares = await SparePart.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: spares,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (error: any) {
    console.error('Error fetching spare parts:', error);
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
      modelId,
      spareName,
      partDescription,
      partCode,
      partCategory,
      returnable,
      customerPrice,
      price,
      status,
    } = body;

    if (!clientId || !brandId || !categoryId || !productId || !modelId || !spareName) {
      return NextResponse.json(
        {
          success: false,
          message: 'Client, Brand, Category, Product, Model No and Spare Name are mandatory',
        },
        { status: 400 }
      );
    }

    // Verify model exists and belongs to the selected product
    const model = await ModelMaster.findById(modelId);
    if (!model) {
      return NextResponse.json(
        { success: false, message: 'Selected Model does not exist in Model Master' },
        { status: 404 }
      );
    }

    const codeToUse = partCode?.trim() || `PRT${Date.now().toString().slice(-6)}`;

    // Check duplicate
    const existing = await SparePart.findOne({
      modelId,
      partCode: codeToUse,
      spareName: spareName.trim(),
    });
    if (existing) {
      return NextResponse.json(
        { success: false, message: `Spare Part with code "${codeToUse}" already exists for this Model` },
        { status: 409 }
      );
    }

    const [client, brand, category, product] = await Promise.all([
      Client.findById(clientId),
      Brand.findById(brandId),
      Category.findById(categoryId),
      Product.findById(productId),
    ]);

    const newSpare = await SparePart.create({
      partCode: codeToUse,
      spareName: spareName.trim(),
      partDescription: partDescription || '',
      clientId,
      clientName: client?.clientName || model.clientName,
      brandId,
      brandName: brand?.brandName || model.brandName,
      categoryId,
      categoryName: category?.categoryName || model.categoryName,
      productId,
      productName: product?.productName || model.productName,
      modelId,
      modelNo: model.modelNo,
      partCategory: partCategory || 'A. Returnable',
      returnable: returnable || 'Yes',
      customerPrice: customerPrice !== undefined ? Number(customerPrice) : 0,
      price: price !== undefined ? Number(price) : 0,
      status: status || 'A',
      createdBy: 'Super Admin',
      updatedBy: 'Super Admin',
    });

    await AuditLog.create({
      action: 'CREATE',
      module: 'SparePart',
      recordId: newSpare._id.toString(),
      details: { partCode: newSpare.partCode, spareName: newSpare.spareName, modelNo: model.modelNo },
      performedBy: 'Super Admin',
    });

    return NextResponse.json({ success: true, data: newSpare, message: 'Spare Part created successfully' });
  } catch (error: any) {
    console.error('Error creating spare part:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { _id, ...updateData } = body;

    if (!_id) {
      return NextResponse.json({ success: false, message: 'Spare Part ID is required' }, { status: 400 });
    }

    if (updateData.modelId) {
      const model = await ModelMaster.findById(updateData.modelId);
      if (model) {
        updateData.modelNo = model.modelNo;
      }
    }

    const updated = await SparePart.findByIdAndUpdate(
      _id,
      { ...updateData, updatedAt: new Date(), updatedBy: 'Super Admin' },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, message: 'Spare Part not found' }, { status: 404 });
    }

    await AuditLog.create({
      action: 'UPDATE',
      module: 'SparePart',
      recordId: _id,
      details: { partCode: updated.partCode, spareName: updated.spareName },
      performedBy: 'Super Admin',
    });

    return NextResponse.json({ success: true, data: updated, message: 'Spare Part updated successfully' });
  } catch (error: any) {
    console.error('Error updating spare part:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Spare Part ID is required' }, { status: 400 });
    }

    const deleted = await SparePart.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, message: 'Spare Part not found' }, { status: 404 });
    }

    await AuditLog.create({
      action: 'DELETE',
      module: 'SparePart',
      recordId: id,
      details: { partCode: deleted.partCode, spareName: deleted.spareName },
      performedBy: 'Super Admin',
    });

    return NextResponse.json({ success: true, message: 'Spare Part deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting spare part:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
