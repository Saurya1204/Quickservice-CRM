import mongoose from 'mongoose';
import { EscalationSequence } from '@/models/EscalationSequence';
import { EscalationCategory } from '@/models/EscalationCategory';
import { EscalationSubcategory } from '@/models/EscalationSubcategory';
import { EscalationAssignmentRule } from '@/models/EscalationAssignmentRule';
import { EscalationModuleMapping } from '@/models/EscalationModuleMapping';
import { User } from '@/models/User';
import { Notification } from '@/models/Notification';

/**
 * Generate next unique Escalation Number atomically: ESC-YYYY-XXXXX
 */
export async function generateNextEscalationNo(): Promise<string> {
  const currentYear = new Date().getFullYear();

  const seqDoc = await EscalationSequence.findOneAndUpdate(
    { year: currentYear },
    { $inc: { lastSequence: 1 } },
    { new: true, upsert: true }
  );

  const seqNum = seqDoc ? seqDoc.lastSequence : 1;
  const formattedSeq = String(seqNum).padStart(5, '0');
  return `ESC-${currentYear}-${formattedSeq}`;
}

/**
 * Dynamic Manager Resolver based on configured rules, subcategory, product and organizational scope
 */
export async function resolveAssignedManager(params: {
  categoryId: string;
  subcategoryId: string;
  productCategoryName?: string;
  productId?: string;
  productName?: string;
  brandName?: string;
  branch?: string;
  zone?: string;
  franchise?: string;
}): Promise<{
  managerId: mongoose.Types.ObjectId;
  managerName: string;
  backupManagerId?: mongoose.Types.ObjectId;
  backupManagerName?: string;
  slaHours: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  ruleId?: mongoose.Types.ObjectId;
}> {
  const {
    categoryId,
    subcategoryId,
    productCategoryName = '',
    productId,
    branch = '',
    zone = '',
  } = params;

  // 1. Check dynamic assignment rules in priority order
  const query: any = {
    status: 'ACTIVE',
    categoryId: new mongoose.Types.ObjectId(categoryId),
  };

  const rules = await EscalationAssignmentRule.find(query).sort({ rulePriority: 1, createdAt: 1 });

  for (const rule of rules) {
    // Check subcategory match (if rule specifies a subcategory)
    if (rule.subcategoryId && rule.subcategoryId.toString() !== subcategoryId) {
      continue;
    }

    // Check specific product match (if rule specifies a product)
    if (rule.productId && productId && rule.productId.toString() !== productId) {
      continue;
    }

    // Check product category match (if rule specifies a product category other than 'All')
    if (
      rule.productCategoryName &&
      rule.productCategoryName !== 'All' &&
      productCategoryName &&
      rule.productCategoryName.toLowerCase() !== productCategoryName.toLowerCase()
    ) {
      continue;
    }

    // Check branch match
    if (rule.branch && rule.branch !== 'All' && branch && rule.branch !== branch) {
      continue;
    }

    // Check zone match
    if (rule.zone && rule.zone !== 'All' && zone && rule.zone !== zone) {
      continue;
    }

    // Matching rule found!
    return {
      managerId: rule.managerUserId,
      managerName: rule.managerName,
      backupManagerId: rule.backupManagerId,
      backupManagerName: rule.backupManagerName,
      slaHours: rule.slaHours || 48,
      priority: rule.priority || 'HIGH',
      ruleId: rule._id as mongoose.Types.ObjectId,
    };
  }

  // 2. Check Subcategory Default Manager
  const subcat = await EscalationSubcategory.findById(subcategoryId);
  if (subcat && subcat.responsibleManagerId) {
    return {
      managerId: subcat.responsibleManagerId,
      managerName: subcat.responsibleManagerName || 'Designated Service Manager',
      backupManagerId: subcat.backupManagerId,
      backupManagerName: subcat.backupManagerName,
      slaHours: subcat.slaHours || 48,
      priority: subcat.priority || 'HIGH',
    };
  }

  // 3. Check Category Default Manager
  const cat = await EscalationCategory.findById(categoryId);
  if (cat && cat.defaultManagerId) {
    return {
      managerId: cat.defaultManagerId,
      managerName: cat.defaultManagerName || 'Technical Services Manager',
      slaHours: 48,
      priority: cat.priority || 'HIGH',
    };
  }

  // 4. Fallback to Super Admin or first available Admin user
  const adminUser = await User.findOne({
    $or: [{ role: 'Super Admin' }, { roleCode: 'SUPER_ADMIN' }, { username: 'admin' }],
  });

  if (adminUser) {
    return {
      managerId: adminUser._id as mongoose.Types.ObjectId,
      managerName: adminUser.fullName || adminUser.username,
      slaHours: 48,
      priority: 'HIGH',
    };
  }

  // Last resort synthetic ID (should not happen in configured system)
  return {
    managerId: new mongoose.Types.ObjectId(),
    managerName: 'Escalation Desk (Super Admin)',
    slaHours: 48,
    priority: 'HIGH',
  };
}

/**
 * Helper to dispatch in-app notifications
 */
export async function sendEscalationNotification(payload: {
  recipientUserId: mongoose.Types.ObjectId;
  recipientRole?: string;
  title: string;
  message: string;
  type: 'ESCALATION_ASSIGNED' | 'ESCALATION_APPROVED' | 'ESCALATION_REJECTED' | 'INFO_REQUESTED' | 'SLA_BREACH' | 'SYSTEM';
  escalationId?: mongoose.Types.ObjectId;
  escalationNo?: string;
  callId?: mongoose.Types.ObjectId;
  complaintNo?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}) {
  try {
    return await Notification.create({
      ...payload,
      isRead: false,
    });
  } catch (err) {
    console.error('Error sending escalation notification:', err);
    return null;
  }
}

/**
 * Seed initial categories, subcategories, module mappings & rules if not present
 */
export async function seedInitialEscalationData() {
  try {
    const catCount = await EscalationCategory.countDocuments();
    if (catCount > 0) return; // Already seeded

    // Find admin user for initial defaults
    const adminUser = await User.findOne({
      $or: [{ role: 'Super Admin' }, { roleCode: 'SUPER_ADMIN' }, { username: 'admin' }],
    });
    const adminId = adminUser?._id;
    const adminName = adminUser?.fullName || 'Super Admin';

    // 1. Initial Categories
    const categoriesData = [
      {
        name: 'Spare Parts Replacement',
        code: 'SPARE_PARTS_REPLACEMENT',
        description: 'Major component and appliance spare part replacement requiring managerial approval',
        department: 'Technical Services',
        associatedProductCategory: 'All',
        defaultManagerId: adminId,
        defaultManagerName: adminName,
        priority: 'HIGH',
        approvalRequired: true,
      },
      {
        name: 'Product Replacement',
        code: 'PRODUCT_REPLACEMENT',
        description: 'Unit level replacement / DOA / unrepairable appliance replacement requests',
        department: 'Operations',
        associatedProductCategory: 'All',
        defaultManagerId: adminId,
        defaultManagerName: adminName,
        priority: 'CRITICAL',
        approvalRequired: true,
      },
      {
        name: 'Product Damage',
        code: 'PRODUCT_DAMAGE',
        description: 'Transit damage, physical handling and transit transit insurance claims',
        department: 'Quality Assurance',
        associatedProductCategory: 'All',
        defaultManagerId: adminId,
        defaultManagerName: adminName,
        priority: 'HIGH',
        approvalRequired: true,
      },
      {
        name: 'Installation Escalation',
        code: 'INSTALLATION_ESCALATION',
        description: 'Complex installation approvals, civil work, non-standard accessories approval',
        department: 'Technical Services',
        associatedProductCategory: 'All',
        defaultManagerId: adminId,
        defaultManagerName: adminName,
        priority: 'MEDIUM',
        approvalRequired: true,
      },
      {
        name: 'Technician Performance',
        code: 'TECHNICIAN_PERFORMANCE',
        description: 'Quality audit escalations and customer dissatisfaction with engineer conduct',
        department: 'Service Operations',
        associatedProductCategory: 'All',
        defaultManagerId: adminId,
        defaultManagerName: adminName,
        priority: 'MEDIUM',
        approvalRequired: false,
      },
      {
        name: 'Service Delay',
        code: 'SERVICE_DELAY',
        description: 'Turnaround time breaches and spare parts procurement delay escalation',
        department: 'Service Operations',
        associatedProductCategory: 'All',
        defaultManagerId: adminId,
        defaultManagerName: adminName,
        priority: 'HIGH',
        approvalRequired: false,
      },
      {
        name: 'Customer Complaint Escalation',
        code: 'CUSTOMER_COMPLAINT_ESCALATION',
        description: 'High-severity customer complaints, social media & executive escalations',
        department: 'Customer Care',
        associatedProductCategory: 'All',
        defaultManagerId: adminId,
        defaultManagerName: adminName,
        priority: 'CRITICAL',
        approvalRequired: true,
      },
      {
        name: 'Warranty Approval',
        code: 'WARRANTY_APPROVAL',
        description: 'Special warranty concessions, expired warranty exception approvals',
        department: 'Service Operations',
        defaultManagerId: adminId,
        defaultManagerName: adminName,
        priority: 'HIGH',
        approvalRequired: true,
      },
      {
        name: 'Special Approval',
        code: 'SPECIAL_APPROVAL',
        description: 'Executive managerial exceptions, financial waivers and goodwill gesture approvals',
        department: 'Management',
        defaultManagerId: adminId,
        defaultManagerName: adminName,
        priority: 'CRITICAL',
        approvalRequired: true,
      },
    ];

    const createdCats = await EscalationCategory.insertMany(categoriesData);
    const sparePartsCat = createdCats.find((c) => c.code === 'SPARE_PARTS_REPLACEMENT');

    if (sparePartsCat) {
      // 2. Initial Subcategories under Spare Parts Replacement
      const subcategoriesData = [
        {
          name: 'Television Panel Replacement',
          code: 'TV_PANEL_REPLACEMENT',
          categoryId: sparePartsCat._id,
          categoryName: sparePartsCat.name,
          categoryCode: sparePartsCat.code,
          productCategoryName: 'Television',
          description: 'Approval for television display panel, open cell or OLED/LED panel replacement',
          responsibleManagerId: adminId,
          responsibleManagerName: adminName,
          priority: 'CRITICAL',
          slaHours: 48,
          requiredAttachments: [
            'Front Display On Screen Fault Photo',
            'Rear Panel Serial & Model Label Photo',
            'Customer Purchase Invoice Copy',
            'Close-up Defective Symptom Image',
          ],
          mandatoryFields: ['technicalDiagnosis', 'requestedPart', 'unitSerialNumber'],
          workflow: 'MANAGER_APPROVAL',
        },
        {
          name: 'Television Motherboard Replacement',
          code: 'TV_MAINBOARD_REPLACEMENT',
          categoryId: sparePartsCat._id,
          categoryName: sparePartsCat.name,
          categoryCode: sparePartsCat.code,
          productCategoryName: 'Television',
          description: 'Approval for main PCB board replacement',
          responsibleManagerId: adminId,
          responsibleManagerName: adminName,
          priority: 'HIGH',
          slaHours: 48,
          requiredAttachments: ['Mainboard Defect Photo', 'Invoice Copy'],
          mandatoryFields: ['technicalDiagnosis', 'requestedPart'],
          workflow: 'MANAGER_APPROVAL',
        },
        {
          name: 'Television Display Replacement',
          code: 'TV_DISPLAY_REPLACEMENT',
          categoryId: sparePartsCat._id,
          categoryName: sparePartsCat.name,
          categoryCode: sparePartsCat.code,
          productCategoryName: 'Television',
          description: 'Full display module replacement',
          responsibleManagerId: adminId,
          responsibleManagerName: adminName,
          priority: 'HIGH',
          slaHours: 48,
          requiredAttachments: ['Front Display Image'],
          mandatoryFields: ['technicalDiagnosis', 'requestedPart'],
        },
        {
          name: 'Television Power Supply Replacement',
          code: 'TV_SMPS_REPLACEMENT',
          categoryId: sparePartsCat._id,
          categoryName: sparePartsCat.name,
          categoryCode: sparePartsCat.code,
          productCategoryName: 'Television',
          description: 'Power supply board (SMPS) failure replacement',
          responsibleManagerId: adminId,
          responsibleManagerName: adminName,
          priority: 'MEDIUM',
          slaHours: 48,
        },
        {
          name: 'Refrigerator Compressor Replacement',
          code: 'REF_COMPRESSOR_REPLACEMENT',
          categoryId: sparePartsCat._id,
          categoryName: sparePartsCat.name,
          categoryCode: sparePartsCat.code,
          productCategoryName: 'Refrigerator',
          description: 'Sealed system compressor replacement approval',
          responsibleManagerId: adminId,
          responsibleManagerName: adminName,
          priority: 'CRITICAL',
          slaHours: 48,
          requiredAttachments: ['Compressor Label Image', 'Pressure Gauge Reading Photo'],
          mandatoryFields: ['technicalDiagnosis', 'requestedPart'],
        },
        {
          name: 'Refrigerator PCB Replacement',
          code: 'REF_PCB_REPLACEMENT',
          categoryId: sparePartsCat._id,
          categoryName: sparePartsCat.name,
          categoryCode: sparePartsCat.code,
          productCategoryName: 'Refrigerator',
          description: 'Inverter PCB or control module replacement',
          responsibleManagerId: adminId,
          responsibleManagerName: adminName,
          priority: 'HIGH',
          slaHours: 48,
        },
        {
          name: 'Washing Machine Motor Replacement',
          code: 'WM_MOTOR_REPLACEMENT',
          categoryId: sparePartsCat._id,
          categoryName: sparePartsCat.name,
          categoryCode: sparePartsCat.code,
          productCategoryName: 'Washing Machine',
          description: 'Direct drive / induction motor replacement',
          responsibleManagerId: adminId,
          responsibleManagerName: adminName,
          priority: 'HIGH',
          slaHours: 48,
        },
        {
          name: 'Washing Machine PCB Replacement',
          code: 'WM_PCB_REPLACEMENT',
          categoryId: sparePartsCat._id,
          categoryName: sparePartsCat.name,
          categoryCode: sparePartsCat.code,
          productCategoryName: 'Washing Machine',
          description: 'Controller PCB motherboard replacement',
          responsibleManagerId: adminId,
          responsibleManagerName: adminName,
          priority: 'HIGH',
          slaHours: 48,
        },
        {
          name: 'AC Compressor Replacement',
          code: 'AC_COMPRESSOR_REPLACEMENT',
          categoryId: sparePartsCat._id,
          categoryName: sparePartsCat.name,
          categoryCode: sparePartsCat.code,
          productCategoryName: 'Air Conditioner',
          description: 'Outdoor unit rotary/inverter compressor replacement',
          responsibleManagerId: adminId,
          responsibleManagerName: adminName,
          priority: 'CRITICAL',
          slaHours: 48,
          requiredAttachments: ['ODU Nameplate Photo', 'Ampere Meter Reading Photo'],
          mandatoryFields: ['technicalDiagnosis', 'requestedPart'],
        },
        {
          name: 'AC PCB Replacement',
          code: 'AC_PCB_REPLACEMENT',
          categoryId: sparePartsCat._id,
          categoryName: sparePartsCat.name,
          categoryCode: sparePartsCat.code,
          productCategoryName: 'Air Conditioner',
          description: 'Indoor / Outdoor inverter PCB board replacement',
          responsibleManagerId: adminId,
          responsibleManagerName: adminName,
          priority: 'HIGH',
          slaHours: 48,
        },
        {
          name: 'Other Spare Parts Replacement',
          code: 'OTHER_SPARES_REPLACEMENT',
          categoryId: sparePartsCat._id,
          categoryName: sparePartsCat.name,
          categoryCode: sparePartsCat.code,
          productCategoryName: 'All',
          description: 'General spare parts replacement exceeding threshold cost',
          responsibleManagerId: adminId,
          responsibleManagerName: adminName,
          priority: 'MEDIUM',
          slaHours: 72,
        },
      ];

      const createdSubcats = await EscalationSubcategory.insertMany(subcategoriesData);

      // 3. Initial Manager Assignment Rules (Example: TV Panel Replacement -> Admin / TV Service Manager)
      const tvPanelSub = createdSubcats.find((s) => s.code === 'TV_PANEL_REPLACEMENT');
      if (tvPanelSub && adminId) {
        await EscalationAssignmentRule.create({
          ruleName: 'Television Panel Approval Rule',
          categoryId: sparePartsCat._id,
          categoryName: sparePartsCat.name,
          subcategoryId: tvPanelSub._id,
          subcategoryName: tvPanelSub.name,
          productCategoryName: 'Television',
          managerUserId: adminId,
          managerName: adminName,
          branch: 'All',
          zone: 'All',
          priority: 'CRITICAL',
          slaHours: 48,
          rulePriority: 1,
          status: 'ACTIVE',
        });
      }
    }

    // 4. Initial Module Mappings
    const moduleMappingsData = [
      {
        moduleKey: 'callManagement',
        moduleName: 'Call Management / Call Registration',
        description: 'Raise escalations directly during complaint registration, review or lifecycle actions',
        enabled: true,
        allowedRoles: ['*'],
      },
      {
        moduleKey: 'callView',
        moduleName: 'Call View & Details',
        description: '1-click escalation raising from call inspection screen with pre-filled service data',
        enabled: true,
        allowedRoles: ['*'],
      },
      {
        moduleKey: 'callUpdate',
        moduleName: 'Job Sheet / Call Update',
        description: 'Raise spare part and technical escalations directly when technicians update job sheet',
        enabled: true,
        allowedRoles: ['*'],
      },
      {
        moduleKey: 'technicianMaster',
        moduleName: 'Technician & Field Engineer Hub',
        description: 'Engineers can request approval for high-cost parts and panel replacements from field app',
        enabled: true,
        allowedRoles: ['*'],
      },
      {
        moduleKey: 'sparePartsManagement',
        moduleName: 'Spare Parts Management',
        description: 'Direct escalation from inventory & spare parts demand when approval is needed',
        enabled: true,
        allowedRoles: ['*'],
      },
    ];

    await EscalationModuleMapping.insertMany(moduleMappingsData);
    console.log('Successfully seeded initial escalation categories, subcategories, and rules.');
  } catch (err) {
    console.error('Error seeding initial escalation data:', err);
  }
}

