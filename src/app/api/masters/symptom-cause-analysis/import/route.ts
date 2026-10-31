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
        { success: false, message: 'No valid rows found in file.' },
        { status: 400 }
      );
    }

    const validRows: any[] = [];
    const invalidRows: any[] = [];
    const uniqueCategories = new Set<string>();
    const uniqueSymptoms = new Set<string>();
    const uniqueCauses = new Set<string>();
    const uniqueAnalyses = new Set<string>();

    rawRows.forEach((row, idx) => {
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

      const category = getVal(['Product', 'Category', 'ProductCategory']);
      const symptomId = getVal(['Symptom ID', 'SymptomID', 'Symptom_ID']);
      const symptom = getVal(['Symptom', 'SymptomName']);
      const causeId = getVal(['Cause ID', 'CauseID', 'Cause_ID']);
      const cause = getVal(['Cause', 'CauseName']);
      const analysisId = getVal(['Analysis ID', 'AnalysisID', 'Analysis_ID']);
      const analysis = getVal(['Aanalysis', 'Analysis', 'AnalysisName']);

      if (!category && !symptom && !cause && !analysis) {
        return;
      }

      if (!category || !symptom) {
        invalidRows.push({
          rowNumber: idx + 2,
          reason: 'Product (Category) or Symptom is missing',
          data: row,
        });
        return;
      }

      const item = {
        rowNumber: idx + 2,
        category,
        symptomId,
        symptom,
        causeId,
        cause: cause || '',
        analysisId,
        analysis: analysis || '',
      };

      validRows.push(item);
      uniqueCategories.add(category);
      uniqueSymptoms.add(`${category}_${symptom}`);
      if (cause) uniqueCauses.add(`${category}_${symptom}_${cause}`);
      if (analysis) uniqueAnalyses.add(`${category}_${symptom}_${cause}_${analysis}`);
    });

    return NextResponse.json({
      success: true,
      summary: {
        totalRows: rawRows.length,
        validCount: validRows.length,
        invalidCount: invalidRows.length,
        uniqueCategoriesCount: uniqueCategories.size,
        uniqueSymptomsCount: uniqueSymptoms.size,
        uniqueCausesCount: uniqueCauses.size,
        uniqueAnalysesCount: uniqueAnalyses.size,
      },
      preview: validRows.slice(0, 25),
      validRows,
      invalidRows,
    });
  } catch (error: any) {
    console.error('Error previewing symptom-cause-analysis import:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
