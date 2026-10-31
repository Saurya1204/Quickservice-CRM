import { NextResponse } from 'next/server';
import { ReportService } from '@/lib/reportService';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'pendingOpenCalls';
    const from = searchParams.get('from') || undefined;
    const to = searchParams.get('to') || undefined;

    let result;
    switch (type) {
      case 'pendingOpenCalls':
        result = await ReportService.getPendingOpenCalls();
        break;
      case 'pendingForParts':
        result = await ReportService.getPendingForParts();
        break;
      case 'registeredCalls':
        result = await ReportService.getRegisteredCalls(from, to);
        break;
      case 'completedCalls':
        result = await ReportService.getCompletedCalls(from, to);
        break;
      case 'allPartDemanded':
        result = await ReportService.getAllPartDemanded(from, to);
        break;
      case 'partConsumption':
        result = await ReportService.getPartConsumption(from, to);
        break;
      case 'poRaised':
        result = await ReportService.getPoRaisedReport(from, to);
        break;
      case 'replacementCalls':
        result = await ReportService.getReplacementCallReport(from, to);
        break;
      case 'cancelledCalls':
        result = await ReportService.getCancelledCalls(from, to);
        break;
      case 'writaxProducts':
        result = await ReportService.getWritaxProductReport(from, to);
        break;
      case 'defectiveToReturn':
        result = await ReportService.getDefectiveToBeReturn(from, to);
        break;
      case 'sfStock':
        result = await ReportService.getSfStockReport();
        break;
      default:
        return NextResponse.json({ success: false, message: `Unknown report type: ${type}` }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error fetching report:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
