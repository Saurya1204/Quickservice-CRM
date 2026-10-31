import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { ModelMaster } from '@/models/ModelMaster';
import { SparePart } from '@/models/SparePart';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const modelId = searchParams.get('modelId');

    const modelQuery: any = {};
    if (modelId) modelQuery._id = modelId;

    const models = await ModelMaster.find(modelQuery).populate('productId').populate('categoryId');

    const rows: any[] = [];

    for (const m of models) {
      const spares = await SparePart.find({ modelId: m._id });

      if (spares.length === 0) {
        rows.push({
          ProductID: m.productId ? (m.productId as any)._id?.toString() : '',
          Product: m.productName || '',
          ProductCode: (m.productId as any)?.productCode || '',
          Cat_ID: m.categoryId ? (m.categoryId as any)._id?.toString() : '',
          Cat_Name: m.categoryName || '',
          ModelID: m.legacyModelId || m.modelCode || m._id.toString(),
          ModelNo: m.modelNo,
          description: m.modelDescription || '',
          SerialLimit: m.serialNumberLimitMin || 0,
          SerialMaxLimit: m.serialNumberLimitMax || 99999999,
          PartID: '',
          PartCode: '',
          PartDescription: '',
          CustomerPrice: '',
        });
      } else {
        for (const s of spares) {
          rows.push({
            ProductID: m.productId ? (m.productId as any)._id?.toString() : '',
            Product: m.productName || '',
            ProductCode: (m.productId as any)?.productCode || '',
            Cat_ID: m.categoryId ? (m.categoryId as any)._id?.toString() : '',
            Cat_Name: m.categoryName || '',
            ModelID: m.legacyModelId || m.modelCode || m._id.toString(),
            ModelNo: m.modelNo,
            description: m.modelDescription || '',
            SerialLimit: m.serialNumberLimitMin || 0,
            SerialMaxLimit: m.serialNumberLimitMax || 99999999,
            PartID: s.legacyPartId || s.partCode || s._id.toString(),
            PartCode: s.partCode,
            PartDescription: s.partDescription || s.spareName,
            CustomerPrice: s.customerPrice || 0,
          });
        }
      }
    }

    const worksheet = XLSX.utils.json_to_sheet(rows, {
      header: [
        'ProductID',
        'Product',
        'ProductCode',
        'Cat_ID',
        'Cat_Name',
        'ModelID',
        'ModelNo',
        'description',
        'SerialLimit',
        'SerialMaxLimit',
        'PartID',
        'PartCode',
        'PartDescription',
        'CustomerPrice',
      ],
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customer Data');

    const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new Response(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="Customer_Data.xlsx"',
      },
    });
  } catch (error: any) {
    console.error('Error exporting model data:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
