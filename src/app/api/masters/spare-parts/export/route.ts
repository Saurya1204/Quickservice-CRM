import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { SparePart } from '@/models/SparePart';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const brandId = searchParams.get('brandId');
    const categoryId = searchParams.get('categoryId');
    const productId = searchParams.get('productId');
    const modelId = searchParams.get('modelId');
    const status = searchParams.get('status');
    const search = searchParams.get('search') || '';

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

    const spares = await SparePart.find(query).sort({ createdAt: -1 });

    const rows = spares.map((s, idx) => ({
      'S.No': idx + 1,
      Client: s.clientName || '',
      Brand: s.brandName || '',
      'Product Category': s.categoryName || '',
      Product: s.productName || '',
      'Model No.': s.modelNo || '',
      'Spare Name': s.spareName || '',
      'Part Description': s.partDescription || '',
      'Part Code': s.partCode || '',
      'Part Category': s.partCategory || '',
      Returnable: s.returnable || 'Yes',
      'Customer Price': s.customerPrice || 0,
      Price: s.price || 0,
      Status: s.status === 'A' ? 'Active' : 'Inactive',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Spares Parts');

    const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new Response(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="Spares_Part_List.xlsx"',
      },
    });
  } catch (error: any) {
    console.error('Error exporting spare parts:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
