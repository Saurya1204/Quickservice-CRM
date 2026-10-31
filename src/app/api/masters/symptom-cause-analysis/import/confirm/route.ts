import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Category } from '@/models/Category';
import { Symptom } from '@/models/Symptom';
import { Cause } from '@/models/Cause';
import { Analysis } from '@/models/Analysis';
import { AuditLog } from '@/models/AuditLog';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { rows } = body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ success: false, message: 'No rows provided to import' }, { status: 400 });
    }

    let importedSymptoms = 0;
    let importedCauses = 0;
    let importedAnalyses = 0;

    const categoryCache = new Map<string, any>();
    const symptomCache = new Map<string, any>();
    const causeCache = new Map<string, any>();

    for (const r of rows) {
      if (!r.category || !r.symptom) continue;

      const catName = r.category.trim();
      let category = categoryCache.get(catName);
      if (!category) {
        category = await Category.findOne({ categoryName: catName });
        if (!category) {
          const catCount = await Category.countDocuments();
          category = await Category.create({
            categoryCode: `CAT${String(catCount + 1).padStart(3, '0')}`,
            categoryName: catName,
            status: 'A',
          });
        }
        categoryCache.set(catName, category);
      }

      // Upsert Symptom
      const symKey = `${category._id}_${r.symptom.trim()}`;
      let symptom = symptomCache.get(symKey);
      if (!symptom) {
        symptom = await Symptom.findOne({
          categoryId: category._id,
          symptomName: r.symptom.trim(),
        });
        if (!symptom) {
          const symCount = await Symptom.countDocuments();
          symptom = await Symptom.create({
            symptomCode: `SYM${String(symCount + 1).padStart(4, '0')}`,
            categoryId: category._id,
            categoryName: category.categoryName,
            symptomName: r.symptom.trim(),
            legacySymptomId: r.symptomId || '',
            status: 'A',
            createdBy: 'Excel Importer',
          });
          importedSymptoms++;
        }
        symptomCache.set(symKey, symptom);
      }

      // Upsert Cause (if cause name present)
      if (r.cause && r.cause.trim()) {
        const cauKey = `${symptom._id}_${r.cause.trim()}`;
        let cause = causeCache.get(cauKey);
        if (!cause) {
          cause = await Cause.findOne({
            symptomId: symptom._id,
            causeName: r.cause.trim(),
          });
          if (!cause) {
            const cauCount = await Cause.countDocuments();
            cause = await Cause.create({
              causeCode: `CAU${String(cauCount + 1).padStart(4, '0')}`,
              categoryId: category._id,
              categoryName: category.categoryName,
              symptomId: symptom._id,
              symptomName: symptom.symptomName,
              causeName: r.cause.trim(),
              legacyCauseId: r.causeId || '',
              status: 'A',
              createdBy: 'Excel Importer',
            });
            importedCauses++;
          }
          causeCache.set(cauKey, cause);
        }

        // Upsert Analysis (if analysis present)
        if (r.analysis && r.analysis.trim()) {
          const existingAnalysis = await Analysis.findOne({
            causeId: cause._id,
            analysisName: r.analysis.trim(),
          });
          if (!existingAnalysis) {
            const anaCount = await Analysis.countDocuments();
            await Analysis.create({
              analysisCode: `ANA${String(anaCount + 1).padStart(4, '0')}`,
              categoryId: category._id,
              categoryName: category.categoryName,
              symptomId: symptom._id,
              symptomName: symptom.symptomName,
              causeId: cause._id,
              causeName: cause.causeName,
              analysisName: r.analysis.trim(),
              legacyAnalysisId: r.analysisId || '',
              status: 'A',
              createdBy: 'Excel Importer',
            });
            importedAnalyses++;
          }
        }
      }
    }

    await AuditLog.create({
      action: 'IMPORT_EXCEL',
      module: 'SymptomCauseAnalysis',
      details: { importedSymptoms, importedCauses, importedAnalyses, totalRows: rows.length },
      performedBy: 'Super Admin',
    });

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${importedSymptoms} Symptom(s), ${importedCauses} Cause(s), and ${importedAnalyses} Analysis records.`,
      importedSymptoms,
      importedCauses,
      importedAnalyses,
    });
  } catch (error: any) {
    console.error('Error confirming symptom-cause-analysis import:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
