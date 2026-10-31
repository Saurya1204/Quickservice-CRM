import { NextResponse } from 'next/server';
import { parseExcelBuffer } from '@/lib/excelParser';
import { ExcelImportService } from '@/lib/excelImportService';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const excelOf = (formData.get('excelOf') as any) || 'Symptom';
    const uploadedBy = (formData.get('uploadedBy') as string) || 'Super Admin';

    if (!file) {
      return NextResponse.json({ success: false, message: 'Please upload an Excel file.' }, { status: 400 });
    }

    if (!['Symptom', 'Cause', 'Analysis', 'Spare'].includes(excelOf)) {
      return NextResponse.json(
        { success: false, message: 'Invalid target master. Must be Symptom, Cause, Analysis, or Spare.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse records from standard xlsx/xls or HTML-table .xls
    const parsedRows = parseExcelBuffer(buffer);

    if (!parsedRows || parsedRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unable to parse rows from uploaded file. Please verify file format (.xlsx, .xls) and table headers.',
        },
        { status: 400 }
      );
    }

    const preview = await ExcelImportService.validateAndPreview(
      excelOf,
      file.name,
      parsedRows,
      uploadedBy
    );

    return NextResponse.json({
      success: true,
      data: {
        ...preview,
        parsedRows,
      },
    });
  } catch (error: any) {
    console.error('Error in /api/uploader/preview:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
