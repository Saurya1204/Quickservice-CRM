import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Client } from '@/models/Client';
import { NomenclatureService } from '@/lib/nomenclatureService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    // Preview candidates for migration
    const legacyClients = await Client.find({
      $or: [
        { clientCode: { $regex: /^CDCL/i } },
        { clientCode: { $regex: /^QSC[0-9]/i } },
      ],
    }).sort({ createdAt: 1, _id: 1 });

    const previewList = legacyClients.map((c, idx) => ({
      id: c._id.toString(),
      currentCode: c.clientCode,
      clientName: c.clientName,
      proposedStandardCode: `QSCL${String(idx + 1).padStart(3, '0')}`,
    }));

    return NextResponse.json({
      success: true,
      data: previewList,
      totalCount: previewList.length,
    });
  } catch (error: any) {
    console.error('Error in GET /api/nomenclature/migrate:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json().catch(() => ({}));
    const performedBy = body.performedBy || 'Super Admin';

    const result = await NomenclatureService.migrateLegacyClientIds(performedBy);

    return NextResponse.json({
      success: true,
      message: `Successfully migrated ${result.migratedCount} Client IDs to QSCL standard nomenclature. Original codes preserved for full traceability.`,
      data: result,
    });
  } catch (error: any) {
    console.error('Error in POST /api/nomenclature/migrate:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
