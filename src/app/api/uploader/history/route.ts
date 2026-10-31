import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { BulkImportHistory } from '@/models/BulkImportHistory';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const history = await BulkImportHistory.find({})
      .sort({ createdAt: -1 })
      .limit(30);

    return NextResponse.json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    console.error('Error in GET /api/uploader/history:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
