import { NextResponse } from 'next/server';
import { ReportService } from '@/lib/reportService';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from') || undefined;
    const to = searchParams.get('to') || undefined;

    let result;
    switch (slug) {
      case 'pending-open-calls':
      case 'pendingOpenCalls':
        result = await ReportService.getPendingOpenCalls();
        break;
      case 'pending-for-parts':
      case 'pendingForParts':
        result = await ReportService.getPendingForParts();
        break;
      case 'registered-calls':
      case 'registeredCalls':
        result = await ReportService.getRegisteredCalls(from, to);
        break;
      case 'completed-calls':
      case 'completedCalls':
        result = await ReportService.getCompletedCalls(from, to);
        break;
      case 'all-parts-demanded':
      case 'allPartDemanded':
        result = await ReportService.getAllPartDemanded(from, to);
        break;
      case 'part-consumption':
      case 'partConsumption':
        result = await ReportService.getPartConsumption(from, to);
        break;
      case 'po-raised':
      case 'poRaised':
        result = await ReportService.getPoRaisedReport(from, to);
        break;
      case 'replacement-calls':
      case 'replacementCalls':
        result = await ReportService.getReplacementCallReport(from, to);
        break;
      case 'cancelled-calls':
      case 'cancelledCalls':
        result = await ReportService.getCancelledCalls(from, to);
        break;
      case 'writax-products':
      case 'writaxProducts':
        result = await ReportService.getWritaxProductReport(from, to);
        break;
      case 'defective-to-return':
      case 'defectiveToReturn':
        result = await ReportService.getDefectiveToBeReturn(from, to);
        break;
      case 'sf-stock':
      case 'sfStock':
        result = await ReportService.getSfStockReport();
        break;
      default:
        return NextResponse.json(
          { success: false, message: `Report endpoint "${slug}" not found` },
          { status: 404 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error(`Error in /api/reports/[slug]:`, error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
