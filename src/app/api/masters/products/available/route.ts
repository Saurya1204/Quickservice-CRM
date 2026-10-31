import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product } from '@/models/Product';
import { ProductCatalogue } from '@/models/ProductCatalogue';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const brandId = searchParams.get('brandId');
    const categoryId = searchParams.get('categoryId');

    if (!clientId || !brandId || !categoryId) {
      return NextResponse.json({
        success: false,
        message: 'clientId, brandId, and categoryId are required',
      }, { status: 400 });
    }

    // Currently assigned products
    const assigned = await Product.find({
      clientId,
      brandId,
      categoryId,
      status: 'A',
    }).sort({ productName: 1 });

    const assignedNames = new Set(assigned.map((p) => p.productName.toLowerCase().trim()));

    // Master catalogue products (optionally filtered by categoryId if set)
    const catalogueQuery: any = { status: 'A' };
    if (categoryId) {
      catalogueQuery.$or = [{ categoryId }, { categoryId: null }, { categoryId: { $exists: false } }];
    }
    const allCatalogue = await ProductCatalogue.find(catalogueQuery).sort({ productName: 1 });

    // Available products are catalogue items not yet assigned
    const available = allCatalogue.filter(
      (c) => !assignedNames.has(c.productName.toLowerCase().trim())
    );

    return NextResponse.json({
      success: true,
      data: {
        assigned,
        available,
      },
    });
  } catch (error: any) {
    console.error('Error fetching available products:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
