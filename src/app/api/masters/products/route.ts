import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product } from '@/models/Product';
import { ProductCatalogue } from '@/models/ProductCatalogue';
import { Client } from '@/models/Client';
import { Brand } from '@/models/Brand';
import { Category } from '@/models/Category';
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
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const query: any = {};
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { productName: regex },
        { productCode: regex },
        { clientName: regex },
        { brandName: regex },
        { categoryName: regex },
      ];
    }
    if (clientId && clientId !== 'all') {
      query.clientId = clientId;
    }
    if (brandId && brandId !== 'all') {
      query.brandId = brandId;
    }
    if (categoryId && categoryId !== 'all') {
      query.categoryId = categoryId;
    }
    if (status && status !== 'all') {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    // Support either single creation or bulk assignment:
    // If assignedProductNames is provided as an array:
    if (Array.isArray(body.assignedProducts) && body.clientId && body.brandId && body.categoryId) {
      const client = await Client.findById(body.clientId);
      const brand = await Brand.findById(body.brandId);
      const category = await Category.findById(body.categoryId);

      if (!client || !brand || !category) {
        return NextResponse.json(
          { success: false, message: 'Invalid Client, Brand, or Category.' },
          { status: 400 }
        );
      }

      const results = [];
      for (const item of body.assignedProducts) {
        const prodName = typeof item === 'string' ? item : item.productName;
        if (!prodName) continue;

        const count = await Product.countDocuments();
        const productCode = typeof item === 'object' && item.productCode
          ? item.productCode
          : `QSP${String(count + 1).padStart(4, '0')}`;

        // Upsert by compound unique keys
        const prod = await Product.findOneAndUpdate(
          {
            clientId: client._id,
            brandId: brand._id,
            categoryId: category._id,
            productName: prodName,
          },
          {
            productCode,
            clientName: client.clientName,
            brandName: brand.brandName,
            categoryName: category.categoryName,
            status: 'A',
            updatedBy: body.createdBy || 'Super Admin',
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        results.push(prod);
      }

      await AuditLog.create({
        action: 'ASSIGN_PRODUCTS',
        module: 'PRODUCT_MASTER',
        performedBy: body.createdBy || 'Super Admin',
        entityId: `${body.clientId}_${body.brandId}_${body.categoryId}`,
        details: `Assigned ${results.length} products to ${client.clientName} / ${brand.brandName} / ${category.categoryName}`,
      }).catch(() => null);

      return NextResponse.json({
        success: true,
        data: results,
        message: `${results.length} product(s) assigned successfully!`,
      });
    }

    // Single creation
    if (!body.productName || !body.clientId || !body.brandId || !body.categoryId) {
      return NextResponse.json(
        { success: false, message: 'Product Name, Client, Brand, and Category are required.' },
        { status: 400 }
      );
    }

    const client = await Client.findById(body.clientId);
    const brand = await Brand.findById(body.brandId);
    const category = await Category.findById(body.categoryId);

    if (!client || !brand || !category) {
      return NextResponse.json(
        { success: false, message: 'Selected Client, Brand, or Category does not exist.' },
        { status: 404 }
      );
    }

    const existing = await Product.findOne({
      clientId: client._id,
      brandId: brand._id,
      categoryId: category._id,
      productName: body.productName.trim(),
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: `Product "${body.productName}" is already assigned to this Client, Brand, and Category.`,
        },
        { status: 409 }
      );
    }

    if (!body.productCode) {
      const count = await Product.countDocuments();
      body.productCode = `QSP${String(count + 1).padStart(4, '0')}`;
    }

    body.clientName = client.clientName;
    body.brandName = brand.brandName;
    body.categoryName = category.categoryName;

    const newProduct = await Product.create(body);

    await AuditLog.create({
      action: 'CREATE_PRODUCT',
      module: 'PRODUCT_MASTER',
      performedBy: body.createdBy || 'Super Admin',
      entityId: newProduct._id.toString(),
      details: `Created Product "${newProduct.productName}" (${newProduct.productCode}) for ${client.clientName} / ${brand.brandName}`,
    }).catch(() => null);

    return NextResponse.json(
      {
        success: true,
        data: newProduct,
        message: `Product "${newProduct.productName}" (${newProduct.productCode}) created successfully!`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Product ID is required' }, { status: 400 });
    }

    const updated = await Product.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Product "${updated.productName}" updated successfully!`,
    });
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Product ID is required' }, { status: 400 });
    }

    const prod = await Product.findById(id);
    if (!prod) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    await Product.findByIdAndDelete(id);

    await AuditLog.create({
      action: 'DELETE_PRODUCT',
      module: 'PRODUCT_MASTER',
      performedBy: 'Super Admin',
      entityId: id,
      details: `Deleted Product "${prod.productName}" (${prod.productCode})`,
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      message: `Product "${prod.productName}" deleted successfully!`,
    });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
