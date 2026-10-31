import { NextResponse } from 'next/server';
import { ExcelImportService } from '@/lib/excelImportService';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { batchId, rows, adminUser } = body;

    if (!batchId || !rows || !Array.isArray(rows)) {
      return NextResponse.json(
        { success: false, message: 'Batch ID and parsed rows array are required for import.' },
        { status: 400 }
      );
    }

    const result = await ExcelImportService.executeImport(
      batchId,
      rows,
      adminUser || 'Super Admin'
    );

    return NextResponse.json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error: any) {
    console.error('Error in /api/uploader/import:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
