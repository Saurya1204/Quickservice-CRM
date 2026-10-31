import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Category } from '@/models/Category';
import { Symptom } from '@/models/Symptom';
import { Cause } from '@/models/Cause';
import { Analysis } from '@/models/Analysis';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');

    const catQuery: any = {};
    if (categoryId && categoryId !== 'all') catQuery._id = categoryId;

    const categories = await Category.find(catQuery).sort({ categoryName: 1 });
    const rows: any[] = [];

    for (const cat of categories) {
      const symptoms = await Symptom.find({ categoryId: cat._id }).sort({ symptomName: 1 });

      if (symptoms.length === 0) {
        rows.push({
          Product: cat.categoryName,
          'Symptom ID': '',
          Symptom: '',
          'Cause ID': '',
          Cause: '',
          'Analysis ID': '',
          Aanalysis: '',
        });
      } else {
        for (const sym of symptoms) {
          const causes = await Cause.find({ symptomId: sym._id }).sort({ causeName: 1 });

          if (causes.length === 0) {
            rows.push({
              Product: cat.categoryName,
              'Symptom ID': sym.legacySymptomId || sym.symptomCode,
              Symptom: sym.symptomName,
              'Cause ID': '',
              Cause: '',
              'Analysis ID': '',
              Aanalysis: '',
            });
          } else {
            for (const cau of causes) {
              const analyses = await Analysis.find({ causeId: cau._id }).sort({ analysisName: 1 });

              if (analyses.length === 0) {
                rows.push({
                  Product: cat.categoryName,
                  'Symptom ID': sym.legacySymptomId || sym.symptomCode,
                  Symptom: sym.symptomName,
                  'Cause ID': cau.legacyCauseId || cau.causeCode,
                  Cause: cau.causeName,
                  'Analysis ID': '',
                  Aanalysis: '',
                });
              } else {
                for (const ana of analyses) {
                  rows.push({
                    Product: cat.categoryName,
                    'Symptom ID': sym.legacySymptomId || sym.symptomCode,
                    Symptom: sym.symptomName,
                    'Cause ID': cau.legacyCauseId || cau.causeCode,
                    Cause: cau.causeName,
                    'Analysis ID': ana.legacyAnalysisId || ana.analysisCode,
                    Aanalysis: ana.analysisName,
                  });
                }
              }
            }
          }
        }
      }
    }

    const worksheet = XLSX.utils.json_to_sheet(rows, {
      header: ['Product', 'Symptom ID', 'Symptom', 'Cause ID', 'Cause', 'Analysis ID', 'Aanalysis'],
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Symptom Cause Analysis');

    const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new Response(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="Symptom_Cause_Analysis_Master_Data.xlsx"',
      },
    });
  } catch (error: any) {
    console.error('Error exporting symptom-cause-analysis data:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
