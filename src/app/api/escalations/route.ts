import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Escalation } from '@/models/Escalation';
import { EscalationCategory } from '@/models/EscalationCategory';
import { EscalationSubcategory } from '@/models/EscalationSubcategory';
import { ServiceCall } from '@/models/ServiceCall';
import { AuditLog } from '@/models/AuditLog';
import {
  generateNextEscalationNo,
  resolveAssignedManager,
  sendEscalationNotification,
  seedInitialEscalationData,
} from '@/lib/escalationService';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectDB();
    await seedInitialEscalationData();

    const { searchParams } = new URL(req.url);

    // Filtering & Tab parameters
    const filterTab = searchParams.get('filterTab') || 'all'; // all, my, pending, approved, rejected
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const categoryId = searchParams.get('categoryId');
    const subcategoryId = searchParams.get('subcategoryId');
    const productCategory = searchParams.get('productCategory');
    const branch = searchParams.get('branch');
    const zone = searchParams.get('zone');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Current user context for role-based scoping
    const currentUserId = searchParams.get('userId');
    const userRole = searchParams.get('userRole') || '';
    const userRoleCode = (searchParams.get('roleCode') || userRole).toUpperCase().replace(/\s+/g, '_');

    const isSuperAdmin = userRoleCode === 'SUPER_ADMIN' || userRole.toLowerCase() === 'super admin';
    const isManagerRole =
      ['ADMIN', 'HOD', 'ZSM', 'BSM', 'BRANCH_MANAGER', 'ZONE_MANAGER', 'FRANCHISE_MANAGER'].includes(userRoleCode);

    const query: any = {};

    // 1. Tab-based presets
    if (filterTab === 'pending') {
      query.status = { $in: ['PENDING_APPROVAL', 'UNDER_REVIEW'] };
      if (!isSuperAdmin && currentUserId) {
        query.assignedManagerId = new mongoose.Types.ObjectId(currentUserId);
      }
    } else if (filterTab === 'my') {
      if (currentUserId) {
        query.requesterUserId = new mongoose.Types.ObjectId(currentUserId);
      }
    } else if (filterTab === 'approved') {
      query.status = { $in: ['APPROVED', 'IN_PROGRESS', 'COMPLETED'] };
      if (!isSuperAdmin && isManagerRole && currentUserId) {
        query.$or = [
          { assignedManagerId: new mongoose.Types.ObjectId(currentUserId) },
          { requesterUserId: new mongoose.Types.ObjectId(currentUserId) },
        ];
      }
    } else if (filterTab === 'rejected') {
      query.status = 'REJECTED';
      if (!isSuperAdmin && isManagerRole && currentUserId) {
        query.$or = [
          { assignedManagerId: new mongoose.Types.ObjectId(currentUserId) },
          { requesterUserId: new mongoose.Types.ObjectId(currentUserId) },
        ];
      }
    } else {
      // 'all' tab: enforce non-superadmin scope
      if (!isSuperAdmin) {
        if (userRoleCode.includes('CLIENT') && currentUserId) {
          // Client users only see their own requests or client brand
          query.requesterUserId = new mongoose.Types.ObjectId(currentUserId);
        } else if (userRoleCode === 'TECHNICIAN' && currentUserId) {
          query.requesterUserId = new mongoose.Types.ObjectId(currentUserId);
        } else if (isManagerRole && currentUserId) {
          // Managers see their assigned queue, their raised escalations, or branch/zone matches
          const managerConditions: any[] = [
            { assignedManagerId: new mongoose.Types.ObjectId(currentUserId) },
            { requesterUserId: new mongoose.Types.ObjectId(currentUserId) },
          ];
          if (branch && branch !== 'All') {
            managerConditions.push({ branch });
          }
          query.$or = managerConditions;
        }
      }
    }

    // 2. Specific field filters
    if (status && status !== 'ALL') {
      query.status = status;
    }
    if (priority && priority !== 'ALL') {
      query.priority = priority;
    }
    if (categoryId && categoryId !== 'ALL') {
      query.categoryId = new mongoose.Types.ObjectId(categoryId);
    }
    if (subcategoryId && subcategoryId !== 'ALL') {
      query.subcategoryId = new mongoose.Types.ObjectId(subcategoryId);
    }
    if (productCategory && productCategory !== 'ALL' && productCategory !== 'All') {
      query.productCategory = { $regex: new RegExp(`^${productCategory.trim()}$`, 'i') };
    }
    if (branch && branch !== 'ALL' && branch !== 'All' && !query.$or) {
      query.branch = branch;
    }
    if (zone && zone !== 'ALL' && zone !== 'All') {
      query.zone = zone;
    }

    // 3. Date range filter
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const toD = new Date(dateTo);
        toD.setHours(23, 59, 59, 999);
        query.createdAt.$lte = toD;
      }
    }

    // 4. Free-text search
    if (search && search.trim()) {
      const s = search.trim();
      const sRegex = { $regex: new RegExp(s, 'i') };
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { escalationNo: sRegex },
          { complaintNo: sRegex },
          { callNo: sRegex },
          { customerName: sRegex },
          { customerMobile: sRegex },
          { unitSerialNumber: sRegex },
          { requestedPart: sRegex },
          { technicalDiagnosis: sRegex },
          { brandName: sRegex },
          { modelNo: sRegex },
          { assignedManagerName: sRegex },
          { requesterName: sRegex },
        ],
      });
    }

    // 5. Query execution with overdue status recalculation
    const escalations = await Escalation.find(query).sort({ createdAt: -1 }).limit(250).lean();

    // Check overdue flag on the fly
    const now = new Date();
    const processed = escalations.map((esc: any) => {
      const isOverdue =
        !['APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED'].includes(esc.status) &&
        esc.dueDate &&
        new Date(esc.dueDate) < now;
      return {
        ...esc,
        isOverdue,
      };
    });

    return NextResponse.json({
      success: true,
      data: processed,
      count: processed.length,
    });
  } catch (error: any) {
    console.error('Error fetching escalations:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const {
      callId,
      complaintNo,
      callNo,
      sourceModule = 'Call Management',

      // Customer Info
      customerId,
      customerName,
      customerMobile,
      customerEmail,
      customerAddress,
      city,
      state,
      pincode,

      // Product Coordinates
      productCategoryId,
      productCategory = 'General',
      productId,
      productName,
      brandId,
      brandName,
      modelId,
      modelNo,
      unitSerialNumber,
      warrantyStatus = 'Under Warranty',
      purchaseDate,
      invoiceNo,

      // Escalation Category & Subcategory
      categoryId,
      subcategoryId,
      priority: customPriority,

      // Technical & TV Panel Diagnosis
      requestedPart,
      reasonForReplacement,
      technicalDiagnosis,
      problemDescription,
      requestedReplacementDetails,
      technicianRemarks,
      estimatedPartCost,

      // Requester Info
      requesterUserId,
      requesterName,
      requesterRole,

      // Organizational scope
      branch,
      zone,
      franchise,

      // Attachments
      attachments = [],
    } = body;

    // Validations
    if (!categoryId || !subcategoryId) {
      return NextResponse.json(
        { success: false, message: 'Escalation Category and Subcategory are required.' },
        { status: 400 }
      );
    }
    if (!customerName || !customerMobile) {
      return NextResponse.json(
        { success: false, message: 'Customer Name and Mobile are required.' },
        { status: 400 }
      );
    }
    if (!technicalDiagnosis || !requestedPart || !reasonForReplacement) {
      return NextResponse.json(
        {
          success: false,
          message: 'Requested Part, Reason for Replacement, and Technical Diagnosis are mandatory.',
        },
        { status: 400 }
      );
    }

    const [catDoc, subcatDoc] = await Promise.all([
      EscalationCategory.findById(categoryId),
      EscalationSubcategory.findById(subcategoryId),
    ]);

    if (!catDoc || !subcatDoc) {
      return NextResponse.json(
        { success: false, message: 'Selected Category or Subcategory not found.' },
        { status: 404 }
      );
    }

    // Auto-fetch additional call details if callId or complaintNo provided
    let linkedCallDoc: any = null;
    if (callId) {
      linkedCallDoc = await ServiceCall.findById(callId);
    } else if (complaintNo) {
      linkedCallDoc = await ServiceCall.findOne({ complaintNo: complaintNo.trim() });
    }

    // Resolve Manager Assignment dynamically
    const routing = await resolveAssignedManager({
      categoryId: catDoc._id.toString(),
      subcategoryId: subcatDoc._id.toString(),
      productCategoryName: productCategory || subcatDoc.productCategoryName,
      productId: productId ? productId.toString() : undefined,
      productName,
      brandName,
      branch: branch || linkedCallDoc?.branch,
      zone: zone || linkedCallDoc?.region,
      franchise,
    });

    // Generate unique Escalation Number (e.g. ESC-2026-00001)
    const escalationNo = await generateNextEscalationNo();

    const slaHours = routing.slaHours || subcatDoc.slaHours || 48;
    const dueDate = new Date(Date.now() + slaHours * 3600 * 1000);
    const resolvedPriority = customPriority || routing.priority || subcatDoc.priority || 'HIGH';

    const newEscalation = await Escalation.create({
      escalationNo,
      sourceModule: sourceModule || 'Call Management',
      callId: linkedCallDoc?._id || (callId ? new mongoose.Types.ObjectId(callId) : undefined),
      callNo: callNo || linkedCallDoc?.callNo || '',
      complaintNo: complaintNo || linkedCallDoc?.complaintNo || '',

      // Customer
      customerId: customerId || linkedCallDoc?.customerId || '',
      customerName: customerName.trim(),
      customerMobile: customerMobile.trim(),
      customerEmail: customerEmail || linkedCallDoc?.customerEmail || '',
      customerAddress: customerAddress || linkedCallDoc?.customerAddress || '',
      city: city || linkedCallDoc?.city || '',
      state: state || linkedCallDoc?.state || '',
      pincode: pincode || linkedCallDoc?.pincode || '',

      // Product
      productCategoryId: productCategoryId || linkedCallDoc?.categoryId || subcatDoc.productCategoryId,
      productCategory: productCategory || linkedCallDoc?.categoryName || subcatDoc.productCategoryName || 'Television',
      productId: productId || linkedCallDoc?.productId || subcatDoc.productId,
      productName: productName || linkedCallDoc?.productName || subcatDoc.productName || '',
      brandId: brandId || linkedCallDoc?.brandId,
      brandName: brandName || linkedCallDoc?.brandName || '',
      modelId: modelId || linkedCallDoc?.modelId,
      modelNo: modelNo || linkedCallDoc?.modelNo || '',
      unitSerialNumber: unitSerialNumber || linkedCallDoc?.unitSerialNumber || linkedCallDoc?.serialNo || '',
      warrantyStatus: warrantyStatus || linkedCallDoc?.warrantyStatus || 'Under Warranty',
      purchaseDate: purchaseDate || linkedCallDoc?.productDOP || '',
      invoiceNo: invoiceNo || linkedCallDoc?.invoiceNo || '',

      // Classification
      categoryId: catDoc._id,
      categoryName: catDoc.name,
      categoryCode: catDoc.code,
      subcategoryId: subcatDoc._id,
      subcategoryName: subcatDoc.name,
      subcategoryCode: subcatDoc.code,
      priority: resolvedPriority,
      status: 'PENDING_APPROVAL',
      fulfilmentStatus: 'NOT_STARTED',

      // Technical Details
      requestedPart: requestedPart.trim(),
      reasonForReplacement: reasonForReplacement.trim(),
      technicalDiagnosis: technicalDiagnosis.trim(),
      problemDescription: problemDescription || '',
      requestedReplacementDetails: requestedReplacementDetails || '',
      technicianRemarks: technicianRemarks || '',
      estimatedPartCost: Number(estimatedPartCost) || 0,

      // Requester
      requesterUserId: requesterUserId
        ? new mongoose.Types.ObjectId(requesterUserId)
        : new mongoose.Types.ObjectId(),
      requesterName: requesterName || 'Service Technician',
      requesterRole: requesterRole || 'Technician',

      // Manager Assignment
      assignedManagerId: routing.managerId,
      assignedManagerName: routing.managerName,
      backupManagerId: routing.backupManagerId,
      backupManagerName: routing.backupManagerName,
      assignmentRuleId: routing.ruleId,

      // Scope
      branch: branch || linkedCallDoc?.branch || '',
      zone: zone || linkedCallDoc?.region || '',
      franchise: franchise || '',

      // SLA
      slaHours,
      dueDate,
      isOverdue: false,

      // Attachments
      attachments: Array.isArray(attachments) ? attachments : [],

      // Initial Timeline History
      history: [
        {
          action: 'ESCALATION_SUBMITTED',
          previousStatus: 'DRAFT',
          newStatus: 'PENDING_APPROVAL',
          performedBy: requesterName || 'Technician',
          performedById: requesterUserId ? new mongoose.Types.ObjectId(requesterUserId) : undefined,
          userRole: requesterRole || 'Technician',
          comments: `Escalation raised for ${subcatDoc.name} (${requestedPart}). Assigned to ${routing.managerName}.`,
          timestamp: new Date(),
        },
      ],
    });

    // Send in-app notification to the assigned manager
    await sendEscalationNotification({
      recipientUserId: routing.managerId,
      recipientRole: 'Manager',
      title: `New Escalation: ${newEscalation.escalationNo}`,
      message: `${newEscalation.requesterName} raised a ${newEscalation.subcategoryName} escalation for ${newEscalation.customerName} (${newEscalation.productCategory}). Awaiting your approval.`,
      type: 'ESCALATION_ASSIGNED',
      escalationId: newEscalation._id as mongoose.Types.ObjectId,
      escalationNo: newEscalation.escalationNo,
      callId: newEscalation.callId,
      complaintNo: newEscalation.complaintNo,
      actionUrl: `/escalations?id=${newEscalation._id.toString()}`,
    });

    // Audit Log
    await AuditLog.create({
      action: 'RAISE_ESCALATION',
      module: 'escalationManagement',
      entityId: newEscalation._id.toString(),
      entityName: `${newEscalation.escalationNo} - ${newEscalation.subcategoryName}`,
      performedBy: newEscalation.requesterName,
      details: {
        escalationNo: newEscalation.escalationNo,
        assignedManager: routing.managerName,
        customer: newEscalation.customerName,
        requestedPart: newEscalation.requestedPart,
      },
    });

    return NextResponse.json({
      success: true,
      data: newEscalation,
      message: `Escalation ${newEscalation.escalationNo} submitted and routed to ${routing.managerName} for approval.`,
    });
  } catch (error: any) {
    console.error('Error creating escalation:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

