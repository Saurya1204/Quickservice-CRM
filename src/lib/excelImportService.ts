import { connectDB } from '@/lib/db';
import { Category } from '@/models/Category';
import { Symptom } from '@/models/Symptom';
import { Cause } from '@/models/Cause';
import { Analysis } from '@/models/Analysis';
import { ModelMaster } from '@/models/ModelMaster';
import { SparePart } from '@/models/SparePart';
import { BulkImportHistory, IBulkImportError } from '@/models/BulkImportHistory';
import { NomenclatureService } from '@/lib/nomenclatureService';

export interface IValidationResult {
  batchId: string;
  excelOf: 'Symptom' | 'Cause' | 'Analysis' | 'Spare';
  fileName: string;
  totalRows: number;
  validRecords: number;
  duplicateRecords: number;
  invalidRecords: number;
  errors: IBulkImportError[];
  previewRows: Array<{
    rowNumber: number;
    status: 'Valid' | 'Duplicate' | 'Invalid';
    details: string;
    raw: any;
  }>;
}

export class ExcelImportService {
  /**
   * Helper to find key in object case-insensitively and ignoring whitespace/underscores
   */
  private static getField(row: any, ...aliases: string[]): string {
    const keys = Object.keys(row);
    for (const alias of aliases) {
      const cleanAlias = alias.toLowerCase().replace(/[\s_\-]/g, '');
      for (const k of keys) {
        const cleanK = k.toLowerCase().replace(/[\s_\-]/g, '');
        if (cleanK === cleanAlias && row[k] !== undefined && row[k] !== null) {
          return String(row[k]).trim();
        }
      }
    }
    return '';
  }

  /**
   * Validate and generate preview for an uploaded Excel dataset
   */
  static async validateAndPreview(
    excelOf: 'Symptom' | 'Cause' | 'Analysis' | 'Spare',
    fileName: string,
    rows: any[],
    uploadedBy = 'Super Admin'
  ): Promise<IValidationResult> {
    await connectDB();

    const errors: IBulkImportError[] = [];
    const previewRows: Array<{
      rowNumber: number;
      status: 'Valid' | 'Duplicate' | 'Invalid';
      details: string;
      raw: any;
    }> = [];

    let validCount = 0;
    let dupCount = 0;
    let invalidCount = 0;

    // Pre-fetch cache of relevant masters for ultra-fast validation
    const categories = await Category.find({}, { categoryName: 1, name: 1, _id: 1 });
    const catMap = new Map<string, any>();
    categories.forEach((c) => {
      const name = (c.categoryName || (c as any).name || '').trim();
      if (name) catMap.set(name.toLowerCase(), c);
    });

    if (excelOf === 'Symptom') {
      const symptoms = await Symptom.find({}, { categoryId: 1, symptomName: 1, legacySymptomId: 1 });
      const sympSet = new Set<string>();
      symptoms.forEach((s) => sympSet.add(`${s.categoryId.toString()}_${s.symptomName.toLowerCase().trim()}`));

      const inMemorySymp = new Set<string>();

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2; // 1-based header is row 1
        const catName = this.getField(row, 'Product Category', 'ProductCategory', 'Category', 'Cat_Name');
        const sympId = this.getField(row, 'Symptom ID', 'SymptomId', 'Symptom_ID');
        const sympName = this.getField(row, 'Symptom Name', 'SymptomName', 'Symptom');

        if (!catName || !sympName) {
          invalidCount++;
          errors.push({
            rowNumber: rowNum,
            column: !catName ? 'Product Category' : 'Symptom Name',
            value: !catName ? catName : sympName,
            reason: 'Mandatory field missing (Product Category and Symptom Name required)',
          });
          previewRows.push({ rowNumber: rowNum, status: 'Invalid', details: 'Missing mandatory fields', raw: row });
          continue;
        }

        const cat = catMap.get(catName.toLowerCase().trim());
        if (!cat) {
          invalidCount++;
          errors.push({
            rowNumber: rowNum,
            column: 'Product Category',
            value: catName,
            reason: `Product Category "${catName}" not found in Category Master`,
          });
          previewRows.push({ rowNumber: rowNum, status: 'Invalid', details: `Unresolved Category: ${catName}`, raw: row });
          continue;
        }

        const comboKey = `${cat._id.toString()}_${sympName.toLowerCase().trim()}`;
        if (sympSet.has(comboKey) || inMemorySymp.has(comboKey)) {
          dupCount++;
          errors.push({
            rowNumber: rowNum,
            column: 'Symptom Name',
            value: sympName,
            reason: `Duplicate Symptom "${sympName}" under category "${catName}"`,
          });
          previewRows.push({ rowNumber: rowNum, status: 'Duplicate', details: `Duplicate Symptom under ${catName}`, raw: row });
          continue;
        }

        inMemorySymp.add(comboKey);
        validCount++;
        previewRows.push({
          rowNumber: rowNum,
          status: 'Valid',
          details: `Category: ${cat.categoryName || cat.name} | Symptom: ${sympName} ${sympId ? `(ID: ${sympId})` : ''}`,
          raw: row,
        });
      }
    } else if (excelOf === 'Cause') {
      const symptoms = await Symptom.find({}, { categoryId: 1, symptomName: 1, legacySymptomId: 1, _id: 1 });
      const sympMap = new Map<string, any>();
      symptoms.forEach((s) => {
        sympMap.set(`${s.categoryId.toString()}_${s.symptomName.toLowerCase().trim()}`, s);
        if (s.legacySymptomId) sympMap.set(`id_${s.legacySymptomId.trim()}`, s);
      });

      const causes = await Cause.find({}, { symptomId: 1, causeName: 1 });
      const causeSet = new Set<string>();
      causes.forEach((c) => causeSet.add(`${c.symptomId.toString()}_${c.causeName.toLowerCase().trim()}`));
      const inMemoryCauses = new Set<string>();

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2;
        const catName = this.getField(row, 'Product Category', 'ProductCategory', 'Category');
        const sympId = this.getField(row, 'Symptom ID', 'SymptomId', 'Symptom_ID');
        const sympName = this.getField(row, 'Symptom Name', 'SymptomName', 'Symptom');
        const causeId = this.getField(row, 'Cause ID', 'CauseId', 'Cause_ID');
        const causeName = this.getField(row, 'Cause Name', 'CauseName', 'Cause');

        if (!catName || !sympName || !causeName) {
          invalidCount++;
          errors.push({
            rowNumber: rowNum,
            column: !catName ? 'Product Category' : !sympName ? 'Symptom Name' : 'Cause Name',
            value: '',
            reason: 'Product Category, Symptom Name, and Cause Name are required',
          });
          previewRows.push({ rowNumber: rowNum, status: 'Invalid', details: 'Missing mandatory fields', raw: row });
          continue;
        }

        const cat = catMap.get(catName.toLowerCase().trim());
        if (!cat) {
          invalidCount++;
          errors.push({
            rowNumber: rowNum,
            column: 'Product Category',
            value: catName,
            reason: `Product Category "${catName}" not found`,
          });
          previewRows.push({ rowNumber: rowNum, status: 'Invalid', details: `Unresolved Category: ${catName}`, raw: row });
          continue;
        }

        const symp =
          sympMap.get(`${cat._id.toString()}_${sympName.toLowerCase().trim()}`) ||
          (sympId ? sympMap.get(`id_${sympId.trim()}`) : null);

        if (!symp) {
          invalidCount++;
          errors.push({
            rowNumber: rowNum,
            column: 'Symptom Name',
            value: sympName,
            reason: `Parent Symptom "${sympName}" under Category "${catName}" does not exist in database`,
          });
          previewRows.push({ rowNumber: rowNum, status: 'Invalid', details: `Unresolved Symptom: ${sympName}`, raw: row });
          continue;
        }

        const causeKey = `${symp._id.toString()}_${causeName.toLowerCase().trim()}`;
        if (causeSet.has(causeKey) || inMemoryCauses.has(causeKey)) {
          dupCount++;
          errors.push({
            rowNumber: rowNum,
            column: 'Cause Name',
            value: causeName,
            reason: `Duplicate Cause "${causeName}" under Symptom "${sympName}"`,
          });
          previewRows.push({ rowNumber: rowNum, status: 'Duplicate', details: `Duplicate Cause under ${sympName}`, raw: row });
          continue;
        }

        inMemoryCauses.add(causeKey);
        validCount++;
        previewRows.push({
          rowNumber: rowNum,
          status: 'Valid',
          details: `Symptom: ${symp.symptomName} | Cause: ${causeName} ${causeId ? `(ID: ${causeId})` : ''}`,
          raw: row,
        });
      }
    } else if (excelOf === 'Analysis') {
      const symptoms = await Symptom.find({}, { categoryId: 1, symptomName: 1, _id: 1 });
      const sympMap = new Map<string, any>();
      symptoms.forEach((s) => sympMap.set(`${s.categoryId.toString()}_${s.symptomName.toLowerCase().trim()}`, s));

      const causes = await Cause.find({}, { symptomId: 1, causeName: 1, _id: 1 });
      const causeMap = new Map<string, any>();
      causes.forEach((c) => causeMap.set(`${c.symptomId.toString()}_${c.causeName.toLowerCase().trim()}`, c));

      const analyses = await Analysis.find({}, { causeId: 1, analysisName: 1 });
      const analysisSet = new Set<string>();
      analyses.forEach((a) => analysisSet.add(`${a.causeId.toString()}_${a.analysisName.toLowerCase().trim()}`));
      const inMemoryAnalysis = new Set<string>();

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2;
        const catName = this.getField(row, 'Product Category', 'ProductCategory', 'Category');
        const sympName = this.getField(row, 'Symptom Name', 'SymptomName', 'Symptom');
        const causeName = this.getField(row, 'Cause Name', 'CauseName', 'Cause');
        const analysisId = this.getField(row, 'Analysis ID', 'AnalysisId', 'Analysis_ID');
        const analysisName = this.getField(row, 'Analysis Name', 'AnalysisName', 'Analysis');

        if (!catName || !sympName || !causeName || !analysisName) {
          invalidCount++;
          errors.push({
            rowNumber: rowNum,
            column: 'Hierarchy',
            value: '',
            reason: 'Complete hierarchy required: Product Category, Symptom, Cause, Analysis Name',
          });
          previewRows.push({ rowNumber: rowNum, status: 'Invalid', details: 'Incomplete hierarchy fields', raw: row });
          continue;
        }

        const cat = catMap.get(catName.toLowerCase().trim());
        if (!cat) {
          invalidCount++;
          errors.push({ rowNumber: rowNum, column: 'Category', value: catName, reason: `Category "${catName}" not found` });
          previewRows.push({ rowNumber: rowNum, status: 'Invalid', details: `Unresolved Category: ${catName}`, raw: row });
          continue;
        }

        const symp = sympMap.get(`${cat._id.toString()}_${sympName.toLowerCase().trim()}`);
        if (!symp) {
          invalidCount++;
          errors.push({ rowNumber: rowNum, column: 'Symptom', value: sympName, reason: `Symptom "${sympName}" not found` });
          previewRows.push({ rowNumber: rowNum, status: 'Invalid', details: `Unresolved Symptom: ${sympName}`, raw: row });
          continue;
        }

        const cause = causeMap.get(`${symp._id.toString()}_${causeName.toLowerCase().trim()}`);
        if (!cause) {
          invalidCount++;
          errors.push({ rowNumber: rowNum, column: 'Cause', value: causeName, reason: `Cause "${causeName}" not found under Symptom` });
          previewRows.push({ rowNumber: rowNum, status: 'Invalid', details: `Unresolved Cause: ${causeName}`, raw: row });
          continue;
        }

        const analysisKey = `${cause._id.toString()}_${analysisName.toLowerCase().trim()}`;
        if (analysisSet.has(analysisKey) || inMemoryAnalysis.has(analysisKey)) {
          dupCount++;
          errors.push({
            rowNumber: rowNum,
            column: 'Analysis Name',
            value: analysisName,
            reason: `Duplicate Analysis "${analysisName}" under Cause "${causeName}"`,
          });
          previewRows.push({ rowNumber: rowNum, status: 'Duplicate', details: `Duplicate Analysis under ${causeName}`, raw: row });
          continue;
        }

        inMemoryAnalysis.add(analysisKey);
        validCount++;
        previewRows.push({
          rowNumber: rowNum,
          status: 'Valid',
          details: `Cause: ${cause.causeName} | Analysis: ${analysisName} ${analysisId ? `(ID: ${analysisId})` : ''}`,
          raw: row,
        });
      }
    } else if (excelOf === 'Spare') {
      // 14-Column Customer Data Excel:
      // ProductID, Product, ProductCode, Cat_ID, Cat_Name, ModelID, ModelNo, description, SerialLimit, SerialMaxLimit, PartID, PartCode, PartDescription, CustomerPrice
      const models = await ModelMaster.find({}, {
        modelNo: 1,
        clientId: 1,
        clientName: 1,
        brandId: 1,
        brandName: 1,
        categoryId: 1,
        categoryName: 1,
        productId: 1,
        productName: 1,
        _id: 1,
      });

      const modelMap = new Map<string, any>();
      models.forEach((m) => {
        modelMap.set(m.modelNo.toLowerCase().trim(), m);
      });

      const spares = await SparePart.find({}, { modelId: 1, partCode: 1 });
      const spareSet = new Set<string>();
      spares.forEach((sp) => spareSet.add(`${sp.modelId.toString()}_${sp.partCode.toLowerCase().trim()}`));
      const inMemorySpares = new Set<string>();

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2;
        const modelNo = this.getField(row, 'ModelNo', 'Model_No', 'Model Number', 'Model');
        const partCode = this.getField(row, 'PartCode', 'Part_Code', 'PartID', 'Part Code');
        const partDesc = this.getField(row, 'PartDescription', 'Part_Description', 'PartName', 'description', 'Description');
        const customerPrice = this.getField(row, 'CustomerPrice', 'Customer_Price', 'Price');

        if (!modelNo || !partCode) {
          invalidCount++;
          errors.push({
            rowNumber: rowNum,
            column: !modelNo ? 'ModelNo' : 'PartCode',
            value: !modelNo ? modelNo : partCode,
            reason: 'ModelNo and PartCode are mandatory',
          });
          previewRows.push({ rowNumber: rowNum, status: 'Invalid', details: 'Missing ModelNo or PartCode', raw: row });
          continue;
        }

        const model = modelMap.get(modelNo.toLowerCase().trim());
        if (!model) {
          invalidCount++;
          errors.push({
            rowNumber: rowNum,
            column: 'ModelNo',
            value: modelNo,
            reason: `Model "${modelNo}" not found in Model Master. Must resolve against existing Model Master.`,
          });
          previewRows.push({ rowNumber: rowNum, status: 'Invalid', details: `Unresolved Model No: ${modelNo}`, raw: row });
          continue;
        }

        const spareKey = `${model._id.toString()}_${partCode.toLowerCase().trim()}`;
        if (spareSet.has(spareKey) || inMemorySpares.has(spareKey)) {
          dupCount++;
          errors.push({
            rowNumber: rowNum,
            column: 'PartCode',
            value: partCode,
            reason: `Duplicate Spare Part "${partCode}" under Model "${modelNo}"`,
          });
          previewRows.push({ rowNumber: rowNum, status: 'Duplicate', details: `Duplicate Part ${partCode} under ${modelNo}`, raw: row });
          continue;
        }

        inMemorySpares.add(spareKey);
        validCount++;
        previewRows.push({
          rowNumber: rowNum,
          status: 'Valid',
          details: `Model: ${model.modelNo} | Part: ${partCode} - ${partDesc || 'Spare'} | Price: ₹${customerPrice || 0}`,
          raw: row,
        });
      }
    }

    // Persist preview batch in BulkImportHistory
    const history = await BulkImportHistory.create({
      excelOf,
      fileName,
      totalRows: rows.length,
      validRecords: validCount,
      duplicateRecords: dupCount,
      invalidRecords: invalidCount,
      importedRecords: 0,
      failedRecords: 0,
      status: 'Preview',
      validationErrors: errors,
      previewRows: previewRows.slice(0, 50),
      uploadedBy,
    });

    return {
      batchId: history._id.toString(),
      excelOf,
      fileName,
      totalRows: rows.length,
      validRecords: validCount,
      duplicateRecords: dupCount,
      invalidRecords: invalidCount,
      errors,
      previewRows,
    };
  }

  /**
   * Execute final database insertion for valid rows
   */
  static async executeImport(
    batchId: string,
    rows: any[],
    adminUser = 'Super Admin'
  ): Promise<{ importedCount: number; failedCount: number; message: string }> {
    await connectDB();
    const history = await BulkImportHistory.findById(batchId);
    if (!history) {
      throw new Error('Import batch history not found');
    }

    const excelOf = history.excelOf;
    let importedCount = 0;
    let failedCount = 0;

    const categories = await Category.find({}, { categoryName: 1, name: 1, _id: 1 });
    const catMap = new Map<string, any>();
    categories.forEach((c) => {
      const name = (c.categoryName || (c as any).name || '').trim();
      if (name) catMap.set(name.toLowerCase(), c);
    });

    if (excelOf === 'Symptom') {
      for (const row of rows) {
        try {
          const catName = this.getField(row, 'Product Category', 'ProductCategory', 'Category', 'Cat_Name');
          const sympId = this.getField(row, 'Symptom ID', 'SymptomId', 'Symptom_ID');
          const sympName = this.getField(row, 'Symptom Name', 'SymptomName', 'Symptom');
          const cat = catMap.get(catName.toLowerCase().trim());
          if (!cat || !sympName) continue;

          // Check if already exists in DB
          const existing = await Symptom.findOne({
            categoryId: cat._id,
            symptomName: new RegExp(`^${sympName.trim()}$`, 'i'),
          });

          if (existing) continue;

          const symptomCode = await NomenclatureService.getNextCode('Symptom');
          await Symptom.create({
            symptomCode,
            categoryId: cat._id,
            categoryName: cat.categoryName || cat.name,
            symptomName: sympName.trim(),
            legacySymptomId: sympId || '',
            status: 'A',
            createdBy: adminUser,
            updatedBy: adminUser,
          });
          importedCount++;
        } catch (e) {
          failedCount++;
        }
      }
    } else if (excelOf === 'Cause') {
      for (const row of rows) {
        try {
          const catName = this.getField(row, 'Product Category', 'ProductCategory', 'Category');
          const sympId = this.getField(row, 'Symptom ID', 'SymptomId', 'Symptom_ID');
          const sympName = this.getField(row, 'Symptom Name', 'SymptomName', 'Symptom');
          const causeId = this.getField(row, 'Cause ID', 'CauseId', 'Cause_ID');
          const causeName = this.getField(row, 'Cause Name', 'CauseName', 'Cause');
          const cat = catMap.get(catName.toLowerCase().trim());
          if (!cat || !sympName || !causeName) continue;

          let symp = await Symptom.findOne({
            categoryId: cat._id,
            symptomName: new RegExp(`^${sympName.trim()}$`, 'i'),
          });

          if (!symp && sympId) {
            symp = await Symptom.findOne({ legacySymptomId: sympId.trim() });
          }

          if (!symp) continue;

          const existingCause = await Cause.findOne({
            symptomId: symp._id,
            causeName: new RegExp(`^${causeName.trim()}$`, 'i'),
          });

          if (existingCause) continue;

          const causeCode = await NomenclatureService.getNextCode('Cause');
          await Cause.create({
            causeCode,
            categoryId: cat._id,
            categoryName: cat.categoryName || cat.name,
            symptomId: symp._id,
            symptomName: symp.symptomName,
            causeName: causeName.trim(),
            legacyCauseId: causeId || '',
            status: 'A',
            createdBy: adminUser,
            updatedBy: adminUser,
          });
          importedCount++;
        } catch (e) {
          failedCount++;
        }
      }
    } else if (excelOf === 'Analysis') {
      for (const row of rows) {
        try {
          const catName = this.getField(row, 'Product Category', 'ProductCategory', 'Category');
          const sympName = this.getField(row, 'Symptom Name', 'SymptomName', 'Symptom');
          const causeName = this.getField(row, 'Cause Name', 'CauseName', 'Cause');
          const analysisId = this.getField(row, 'Analysis ID', 'AnalysisId', 'Analysis_ID');
          const analysisName = this.getField(row, 'Analysis Name', 'AnalysisName', 'Analysis');
          const cat = catMap.get(catName.toLowerCase().trim());
          if (!cat || !sympName || !causeName || !analysisName) continue;

          const symp = await Symptom.findOne({
            categoryId: cat._id,
            symptomName: new RegExp(`^${sympName.trim()}$`, 'i'),
          });
          if (!symp) continue;

          const cause = await Cause.findOne({
            symptomId: symp._id,
            causeName: new RegExp(`^${causeName.trim()}$`, 'i'),
          });
          if (!cause) continue;

          const existingAnalysis = await Analysis.findOne({
            causeId: cause._id,
            analysisName: new RegExp(`^${analysisName.trim()}$`, 'i'),
          });
          if (existingAnalysis) continue;

          const analysisCode = await NomenclatureService.getNextCode('Analysis');
          await Analysis.create({
            analysisCode,
            categoryId: cat._id,
            categoryName: cat.categoryName || cat.name,
            symptomId: symp._id,
            symptomName: symp.symptomName,
            causeId: cause._id,
            causeName: cause.causeName,
            analysisName: analysisName.trim(),
            legacyAnalysisId: analysisId || '',
            status: 'A',
            createdBy: adminUser,
            updatedBy: adminUser,
          });
          importedCount++;
        } catch (e) {
          failedCount++;
        }
      }
    } else if (excelOf === 'Spare') {
      for (const row of rows) {
        try {
          const modelNo = this.getField(row, 'ModelNo', 'Model_No', 'Model Number', 'Model');
          const partCode = this.getField(row, 'PartCode', 'Part_Code', 'PartID', 'Part Code');
          const partDesc = this.getField(row, 'PartDescription', 'Part_Description', 'PartName', 'description', 'Description');
          const customerPrice = parseFloat(this.getField(row, 'CustomerPrice', 'Customer_Price', 'Price')) || 0;
          const partId = this.getField(row, 'PartID', 'Part_ID');

          if (!modelNo || !partCode) continue;

          const model = await ModelMaster.findOne({
            modelNo: new RegExp(`^${modelNo.trim()}$`, 'i'),
          });

          if (!model) continue;

          const existingSpare = await SparePart.findOne({
            modelId: model._id,
            partCode: partCode.trim().toUpperCase(),
          });

          if (existingSpare) continue;

          await SparePart.create({
            partCode: partCode.trim().toUpperCase(),
            spareName: (partDesc || partCode).trim(),
            partDescription: partDesc || '',
            modelId: model._id,
            modelNo: model.modelNo,
            productId: model.productId,
            productName: model.productName,
            categoryId: model.categoryId,
            categoryName: model.categoryName,
            brandId: model.brandId,
            brandName: model.brandName,
            clientId: model.clientId,
            clientName: model.clientName,
            customerPrice,
            price: Math.round(customerPrice * 0.7),
            legacyPartId: partId || '',
            status: 'A',
            createdBy: adminUser,
            updatedBy: adminUser,
          });
          importedCount++;
        } catch (e) {
          failedCount++;
        }
      }
    }

    history.status = 'Completed';
    history.importedRecords = importedCount;
    history.failedRecords = failedCount;
    await history.save();

    return {
      importedCount,
      failedCount,
      message: `Successfully imported ${importedCount} records into ${excelOf} Master. (${failedCount} failed/skipped).`,
    };
  }
}
