import { connectDB } from '@/lib/db';
import { NomenclatureConfig, INomenclatureConfig } from '@/models/NomenclatureConfig';
import { Client } from '@/models/Client';
import { Brand } from '@/models/Brand';
import { Product } from '@/models/Product';
import { ModelMaster } from '@/models/ModelMaster';
import { SparePart } from '@/models/SparePart';
import { ServiceCall } from '@/models/ServiceCall';
import { AuditLog } from '@/models/AuditLog';

export const DEFAULT_NOMENCLATURES = [
  {
    moduleName: 'Client Master',
    entityName: 'Client',
    prefix: 'QSCL',
    separator: '',
    startingSequence: 1,
    currentSequence: 0,
    numberPadding: 3,
    generatedCodeFormat: '{PREFIX}{NUMBER}',
    status: 'Active' as const,
  },
  {
    moduleName: 'Vendor Master',
    entityName: 'Vendor',
    prefix: 'VND',
    separator: '',
    startingSequence: 1,
    currentSequence: 0,
    numberPadding: 4,
    generatedCodeFormat: '{PREFIX}{NUMBER}',
    status: 'Active' as const,
  },
  {
    moduleName: 'Brand Master',
    entityName: 'Brand',
    prefix: 'BRD',
    separator: '',
    startingSequence: 1,
    currentSequence: 0,
    numberPadding: 4,
    generatedCodeFormat: '{PREFIX}{NUMBER}',
    status: 'Active' as const,
  },
  {
    moduleName: 'Product Category Master',
    entityName: 'Category',
    prefix: 'CAT',
    separator: '',
    startingSequence: 1,
    currentSequence: 0,
    numberPadding: 4,
    generatedCodeFormat: '{PREFIX}{NUMBER}',
    status: 'Active' as const,
  },
  {
    moduleName: 'Product Master',
    entityName: 'Product',
    prefix: 'PRD',
    separator: '',
    startingSequence: 1,
    currentSequence: 0,
    numberPadding: 4,
    generatedCodeFormat: '{PREFIX}{NUMBER}',
    status: 'Active' as const,
  },
  {
    moduleName: 'Model Master',
    entityName: 'Model',
    prefix: 'MDL',
    separator: '',
    startingSequence: 1,
    currentSequence: 0,
    numberPadding: 4,
    generatedCodeFormat: '{PREFIX}{NUMBER}',
    status: 'Active' as const,
  },
  {
    moduleName: 'Spares Master',
    entityName: 'Spare Part',
    prefix: 'PRT',
    separator: '',
    startingSequence: 1,
    currentSequence: 0,
    numberPadding: 4,
    generatedCodeFormat: '{PREFIX}{NUMBER}',
    status: 'Active' as const,
  },
  {
    moduleName: 'Symptom Master',
    entityName: 'Symptom',
    prefix: 'SYM',
    separator: '',
    startingSequence: 1,
    currentSequence: 0,
    numberPadding: 4,
    generatedCodeFormat: '{PREFIX}{NUMBER}',
    status: 'Active' as const,
  },
  {
    moduleName: 'Cause Master',
    entityName: 'Cause',
    prefix: 'CSE',
    separator: '',
    startingSequence: 1,
    currentSequence: 0,
    numberPadding: 4,
    generatedCodeFormat: '{PREFIX}{NUMBER}',
    status: 'Active' as const,
  },
  {
    moduleName: 'Analysis Master',
    entityName: 'Analysis',
    prefix: 'ANS',
    separator: '',
    startingSequence: 1,
    currentSequence: 0,
    numberPadding: 4,
    generatedCodeFormat: '{PREFIX}{NUMBER}',
    status: 'Active' as const,
  },
  {
    moduleName: 'Service Call Management',
    entityName: 'Service Call',
    prefix: 'QS-CALL',
    separator: '-',
    startingSequence: 1001,
    currentSequence: 1000,
    numberPadding: 4,
    generatedCodeFormat: '{PREFIX}-{NUMBER}',
    status: 'Active' as const,
  },
  {
    moduleName: 'Inventory Management',
    entityName: 'Stock Item',
    prefix: 'STK',
    separator: '',
    startingSequence: 1,
    currentSequence: 0,
    numberPadding: 4,
    generatedCodeFormat: '{PREFIX}{NUMBER}',
    status: 'Active' as const,
  },
  {
    moduleName: 'Purchase Orders',
    entityName: 'Purchase Order',
    prefix: 'PO',
    separator: '-',
    startingSequence: 1,
    currentSequence: 0,
    numberPadding: 5,
    generatedCodeFormat: '{PREFIX}-{NUMBER}',
    status: 'Active' as const,
  },
  {
    moduleName: 'Part Demand',
    entityName: 'Part Demand',
    prefix: 'DEM',
    separator: '-',
    startingSequence: 1,
    currentSequence: 0,
    numberPadding: 4,
    generatedCodeFormat: '{PREFIX}-{NUMBER}',
    status: 'Active' as const,
  },
  {
    moduleName: 'Part Consumption',
    entityName: 'Part Consumption',
    prefix: 'CON',
    separator: '-',
    startingSequence: 1,
    currentSequence: 0,
    numberPadding: 4,
    generatedCodeFormat: '{PREFIX}-{NUMBER}',
    status: 'Active' as const,
  },
  {
    moduleName: 'Replacement Records',
    entityName: 'Replacement',
    prefix: 'REP',
    separator: '-',
    startingSequence: 1,
    currentSequence: 0,
    numberPadding: 4,
    generatedCodeFormat: '{PREFIX}-{NUMBER}',
    status: 'Active' as const,
  },
  {
    moduleName: 'Vendor Documents',
    entityName: 'Vendor Document',
    prefix: 'VND-DOC',
    separator: '-',
    startingSequence: 1,
    currentSequence: 0,
    numberPadding: 4,
    generatedCodeFormat: '{PREFIX}-{NUMBER}',
    status: 'Active' as const,
  },
];

export class NomenclatureService {
  /**
   * Format code given components
   */
  static formatCode(
    prefix: string,
    separator: string,
    sequence: number,
    padding: number
  ): string {
    const numStr = String(sequence).padStart(padding, '0');
    return `${prefix}${separator || ''}${numStr}`;
  }

  /**
   * Seed default nomenclatures if not already present
   */
  static async seedDefaults(): Promise<void> {
    await connectDB();
    for (const item of DEFAULT_NOMENCLATURES) {
      const exists = await NomenclatureConfig.findOne({ entityName: item.entityName });
      if (!exists) {
        await NomenclatureConfig.create({
          ...item,
          currentSequence: item.startingSequence - 1,
          createdBy: 'Super Admin',
          updatedBy: 'Super Admin',
        });
      }
    }
  }

  /**
   * Atomic concurrency-safe next code generator
   */
  static async getNextCode(entityName: string): Promise<string> {
    await connectDB();
    let config = await NomenclatureConfig.findOne({ entityName, status: 'Active' });

    if (!config) {
      // Find default config
      const defaultDef = DEFAULT_NOMENCLATURES.find((d) => d.entityName === entityName);
      if (defaultDef) {
        config = await NomenclatureConfig.create({
          ...defaultDef,
          currentSequence: defaultDef.startingSequence - 1,
          createdBy: 'System',
          updatedBy: 'System',
        });
      } else {
        // Fallback default
        config = await NomenclatureConfig.create({
          moduleName: `${entityName} Master`,
          entityName,
          prefix: entityName.substring(0, 4).toUpperCase(),
          separator: '',
          startingSequence: 1,
          currentSequence: 0,
          numberPadding: 3,
          status: 'Active',
          createdBy: 'System',
          updatedBy: 'System',
        });
      }
    }

    // Atomic update
    const updated = await NomenclatureConfig.findOneAndUpdate(
      { _id: config._id },
      { $inc: { currentSequence: 1 }, $set: { updatedAt: new Date() } },
      { new: true }
    );

    const seq = updated ? updated.currentSequence : config.currentSequence + 1;
    return this.formatCode(config.prefix, config.separator, seq, config.numberPadding);
  }

  /**
   * Preview next code without incrementing
   */
  static async previewNextCode(entityName: string): Promise<string> {
    await connectDB();
    let config = await NomenclatureConfig.findOne({ entityName });
    if (!config) {
      const defaultDef = DEFAULT_NOMENCLATURES.find((d) => d.entityName === entityName);
      if (defaultDef) {
        return this.formatCode(
          defaultDef.prefix,
          defaultDef.separator,
          defaultDef.startingSequence,
          defaultDef.numberPadding
        );
      }
      return `${entityName.substring(0, 4).toUpperCase()}001`;
    }
    const nextSeq = Math.max(config.currentSequence + 1, config.startingSequence);
    return this.formatCode(config.prefix, config.separator, nextSeq, config.numberPadding);
  }

  /**
   * Safely migrate legacy client IDs (CDCL..., QSC...) to QSCL...
   * Preserves legacyClientCode for full historical audit and updates referenced models.
   */
  static async migrateLegacyClientIds(adminUser = 'Super Admin'): Promise<{
    migratedCount: number;
    mapping: Array<{ id: string; oldCode: string; newCode: string; clientName: string }>;
  }> {
    await connectDB();

    // Find all clients that have legacy or non-standard prefixes
    const legacyClients = await Client.find({
      $or: [
        { clientCode: { $regex: /^CDCL/i } },
        { clientCode: { $regex: /^QSC[0-9]/i } },
      ],
    }).sort({ createdAt: 1, _id: 1 });

    const mapping: Array<{ id: string; oldCode: string; newCode: string; clientName: string }> = [];

    // Ensure Client nomenclature config exists
    let clientConfig = await NomenclatureConfig.findOne({ entityName: 'Client' });
    if (!clientConfig) {
      clientConfig = await NomenclatureConfig.create({
        moduleName: 'Client Master',
        entityName: 'Client',
        prefix: 'QSCL',
        separator: '',
        startingSequence: 1,
        currentSequence: 0,
        numberPadding: 3,
        generatedCodeFormat: '{PREFIX}{NUMBER}',
        status: 'Active',
      });
    }

    let seq = clientConfig.currentSequence || 0;

    for (const client of legacyClients) {
      seq += 1;
      const newCode = this.formatCode(
        clientConfig.prefix || 'QSCL',
        clientConfig.separator || '',
        seq,
        clientConfig.numberPadding || 3
      );
      const oldCode = client.clientCode;

      // Update Client document: set clientCode to standardized QSCL and preserve legacyClientCode
      await Client.updateOne(
        { _id: client._id },
        {
          $set: {
            clientCode: newCode,
            legacyClientCode: oldCode,
            updatedBy: adminUser,
          },
        }
      );

      // Update Brand references if any
      await Brand.updateMany(
        { clientId: client._id },
        { $set: { clientCode: newCode } }
      ).catch(() => null);

      // Update ServiceCall references if any
      await ServiceCall.updateMany(
        { clientName: client.clientName },
        { $set: { clientCode: newCode } }
      ).catch(() => null);

      mapping.push({
        id: client._id.toString(),
        oldCode,
        newCode,
        clientName: client.clientName,
      });
    }

    // Update the sequence in NomenclatureConfig
    if (seq > (clientConfig.currentSequence || 0)) {
      clientConfig.currentSequence = seq;
      clientConfig.auditLogs.push({
        previousPrefix: clientConfig.prefix,
        newPrefix: clientConfig.prefix,
        previousSequence: clientConfig.currentSequence,
        newSequence: seq,
        changedBy: adminUser,
        changeDate: new Date(),
        reason: `Migrated ${mapping.length} legacy Client IDs (CDCL/QSC) to QSCL standard`,
        affectedModule: 'Client Master',
      });
      await clientConfig.save();
    }

    // Record audit log
    await AuditLog.create({
      action: 'MIGRATE_CLIENT_NOMENCLATURE',
      module: 'NOMENCLATURE_MANAGEMENT',
      performedBy: adminUser,
      details: `Standardized ${mapping.length} Client IDs to QSCL nomenclature: ${mapping.map((m) => `${m.oldCode}->${m.newCode}`).join(', ')}`,
    }).catch(() => null);

    return {
      migratedCount: mapping.length,
      mapping,
    };
  }
}
