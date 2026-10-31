import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Client } from '@/models/Client';
import { Brand } from '@/models/Brand';
import { Category } from '@/models/Category';
import { Product } from '@/models/Product';
import { ModelMaster } from '@/models/ModelMaster';
import { SparePart } from '@/models/SparePart';
import { AuditLog } from '@/models/AuditLog';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { rows, clientId, brandId } = body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ success: false, message: 'No rows provided to import' }, { status: 400 });
    }

    // Default or provided Client & Brand
    let client = clientId ? await Client.findById(clientId) : await Client.findOne({ status: 'A' });
    let brand = brandId ? await Brand.findById(brandId) : await Brand.findOne({ status: 'A' });

    if (!client) {
      client = await Client.create({
        clientCode: 'CLT0001',
        clientName: 'Default Enterprise Client',
        contactPerson: 'Admin',
        mobileNumber: '9999999999',
        emailId: 'admin@quickserves.com',
        status: 'A',
      });
    }

    if (!brand) {
      brand = await Brand.create({
        brandCode: 'BRD0001',
        brandName: 'Default Brand',
        clientId: client._id,
        clientName: client.clientName,
        status: 'A',
      });
    }

    let importedModels = 0;
    let importedSpares = 0;
    const modelCache = new Map<string, any>();

    for (const r of rows) {
      if (!r.modelNo) continue;

      // 1. Ensure Category exists
      const catName = r.catName || 'Consumer Electronics';
      let category = await Category.findOne({ categoryName: catName });
      if (!category) {
        const catCount = await Category.countDocuments();
        category = await Category.create({
          categoryCode: `CAT${String(catCount + 1).padStart(3, '0')}`,
          categoryName: catName,
          status: 'A',
        });
      }

      // 2. Ensure Product exists
      const prodName = r.product || 'Standard Product';
      let product = await Product.findOne({
        clientId: client._id,
        brandId: brand._id,
        categoryId: category._id,
        productName: prodName,
      });

      if (!product) {
        const prodCount = await Product.countDocuments();
        product = await Product.create({
          productCode: r.productCode || `PRD${String(prodCount + 1).padStart(3, '0')}`,
          productName: prodName,
          clientId: client._id,
          clientName: client.clientName,
          brandId: brand._id,
          brandName: brand.brandName,
          categoryId: category._id,
          categoryName: category.categoryName,
          status: 'A',
        });
      }

      // 3. Upsert Model (avoid duplicates for repeated rows)
      const modelKey = `${client._id}_${brand._id}_${category._id}_${product._id}_${r.modelNo.trim()}`;
      let model = modelCache.get(modelKey);

      if (!model) {
        model = await ModelMaster.findOne({
          clientId: client._id,
          brandId: brand._id,
          categoryId: category._id,
          productId: product._id,
          modelNo: r.modelNo.trim(),
        });

        if (!model) {
          const mdlCount = await ModelMaster.countDocuments();
          model = await ModelMaster.create({
            modelCode: `MDL${String(mdlCount + 1).padStart(4, '0')}`,
            modelNo: r.modelNo.trim(),
            modelDescription: r.description || '',
            clientId: client._id,
            clientName: client.clientName,
            brandId: brand._id,
            brandName: brand.brandName,
            categoryId: category._id,
            categoryName: category.categoryName,
            productId: product._id,
            productName: product.productName,
            serialNumberLimitMin: r.serialLimit || 0,
            serialNumberLimitMax: r.serialMaxLimit || 99999999,
            legacyModelId: r.modelId || '',
            status: 'A',
            createdBy: 'Excel Importer',
          });
          importedModels++;
        }
        modelCache.set(modelKey, model);
      }

      // 4. Create Spare Part (if present and not blank)
      const partCode = r.partCode?.trim();
      const partDesc = r.partDescription?.trim();
      if (partCode || partDesc) {
        const spareName = partDesc || `Spare ${partCode}`;
        const codeToUse = partCode || `PRT${Date.now().toString().slice(-6)}`;

        const existingSpare = await SparePart.findOne({
          modelId: model._id,
          partCode: codeToUse,
        });

        if (!existingSpare) {
          await SparePart.create({
            partCode: codeToUse,
            spareName,
            partDescription: partDesc || '',
            clientId: client._id,
            clientName: client.clientName,
            brandId: brand._id,
            brandName: brand.brandName,
            categoryId: category._id,
            categoryName: category.categoryName,
            productId: product._id,
            productName: product.productName,
            modelId: model._id,
            modelNo: model.modelNo,
            customerPrice: Number(r.customerPrice) || 0,
            price: Number(r.customerPrice) ? Number(r.customerPrice) * 0.8 : 0,
            legacyPartId: r.partId || '',
            status: 'A',
            createdBy: 'Excel Importer',
          });
          importedSpares++;
        }
      }
    }

    await AuditLog.create({
      action: 'IMPORT_EXCEL',
      module: 'ModelData',
      details: { importedModels, importedSpares, totalRows: rows.length },
      performedBy: 'Super Admin',
    });

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${importedModels} new Model(s) and ${importedSpares} Spare Part(s).`,
      importedModels,
      importedSpares,
    });
  } catch (error: any) {
    console.error('Error confirming model data import:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
