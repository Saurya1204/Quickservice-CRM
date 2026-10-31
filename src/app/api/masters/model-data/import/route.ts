import { NextResponse } from 'next/server';
import { parseExcelBuffer } from '@/lib/excelParser';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, message: 'Excel file is required' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const rawRows = parseExcelBuffer(buffer);

    if (!rawRows || rawRows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No valid data found in file. Please ensure valid Excel or HTML format.' },
        { status: 400 }
      );
    }

    const validRows: any[] = [];
    const invalidRows: any[] = [];
    const uniqueModels = new Set<string>();
    const uniqueSpares = new Set<string>();

    rawRows.forEach((row, idx) => {
      // Normalize key lookup regardless of casing or spaces
      const getVal = (names: string[]) => {
        for (const key of Object.keys(row)) {
          const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
          for (const target of names) {
            if (cleanKey === target.toLowerCase().replace(/[^a-z0-9]/g, '')) {
              return String(row[key] || '').trim();
            }
          }
        }
        return '';
      };

      const product = getVal(['Product', 'ProductName']);
      const productCode = getVal(['ProductCode']);
      const productId = getVal(['ProductID']);
      const catName = getVal(['Cat_Name', 'CatName', 'Category', 'ProductCategory']);
      const catId = getVal(['Cat_ID', 'CatID']);
      const modelNo = getVal(['ModelNo', 'Model_No', 'Model Number']);
      const modelId = getVal(['ModelID', 'Model_ID']);
      const description = getVal(['description', 'ModelDescription']);
      const serialLimit = getVal(['SerialLimit', 'SerialMinLimit']) || '0';
      const serialMaxLimit = getVal(['SerialMaxLimit']) || '99999999';
      const partId = getVal(['PartID']);
      const partCode = getVal(['PartCode']);
      const partDescription = getVal(['PartDescription', 'SpareName', 'Part_Description']);
      const customerPrice = getVal(['CustomerPrice', 'Price']) || '0';

      if (!modelNo && !product && !catName) {
        // Skip completely empty row
        return;
      }

      if (!modelNo) {
        invalidRows.push({
          rowNumber: idx + 2,
          reason: 'ModelNo is missing',
          data: row,
        });
        return;
      }

      const item = {
        rowNumber: idx + 2,
        productId,
        product: product || 'General Product',
        productCode: productCode || `PRD${idx + 1}`,
        catId,
        catName: catName || 'Consumer Electronics',
        modelId,
        modelNo,
        description,
        serialLimit: Number(serialLimit) || 0,
        serialMaxLimit: Number(serialMaxLimit) || 99999999,
        partId,
        partCode: partCode || '',
        partDescription: partDescription || '',
        customerPrice: Number(customerPrice) || 0,
      };

      validRows.push(item);
      uniqueModels.add(modelNo);
      if (partCode || partDescription) {
        uniqueSpares.add(`${modelNo}_${partCode || partDescription}`);
      }
    });

    return NextResponse.json({
      success: true,
      summary: {
        totalRows: rawRows.length,
        validCount: validRows.length,
        invalidCount: invalidRows.length,
        uniqueModelsCount: uniqueModels.size,
        uniqueSparesCount: uniqueSpares.size,
      },
      preview: validRows.slice(0, 25),
      validRows,
      invalidRows,
    });
  } catch (error: any) {
    console.error('Error previewing model data import:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
