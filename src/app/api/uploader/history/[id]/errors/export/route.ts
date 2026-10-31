import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { connectDB } from '@/lib/db';
import { BulkImportHistory } from '@/models/BulkImportHistory';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const history = await BulkImportHistory.findById(id);

    if (!history) {
      return NextResponse.json({ success: false, message: 'Upload record not found' }, { status: 404 });
    }

    const errors = history.validationErrors || [];
    const reportRows = errors.map((e) => ({
      'Row Number': e.rowNumber,
      'Column / Field': e.column || 'General',
      'Provided Value': e.value || '(blank)',
      'Validation Error': e.reason,
    }));

    // If no errors, create a summary row
    if (reportRows.length === 0) {
      reportRows.push({
        'Row Number': 0,
        'Column / Field': 'All Rows',
        'Provided Value': 'N/A',
        'Validation Error': 'No validation errors recorded for this import batch.',
      });
    }

    const worksheet = XLSX.utils.json_to_sheet(reportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Validation Errors');

    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Error_Report_${history.excelOf}_${history._id}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating error report export:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
