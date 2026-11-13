import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Escalation } from '@/models/Escalation';
import { User } from '@/models/User';
import { AuditLog } from '@/models/AuditLog';
import { sendEscalationNotification } from '@/lib/escalationService';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { escalationNo: id };

    const escalation = await Escalation.findOne(query).lean();
    if (!escalation) {
      return NextResponse.json({ success: false, message: 'Escalation not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: escalation });
  } catch (error: any) {
    console.error('Error fetching escalation details:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const {
      action, // 'APPROVE' | 'REJECT' | 'REQUEST_INFO' | 'RESUBMIT' | 'REASSIGN' | 'UPDATE_FULFILMENT' | 'REOPEN'
      comments,
      managerId,
      managerName,
      managerRole,
      newManagerId,
      fulfilmentStatus,
      newAttachments = [],
    } = body;

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { escalationNo: id };

    const escalation = await Escalation.findOne(query);
    if (!escalation) {
      return NextResponse.json({ success: false, message: 'Escalation not found' }, { status: 404 });
    }

    const previousStatus = escalation.status;
    const now = new Date();

    // 1. APPROVE REQUEST
    if (action === 'APPROVE') {
      if (!comments || !comments.trim()) {
        return NextResponse.json(
          { success: false, message: 'Manager Approval comments/remarks are strictly mandatory.' },
          { status: 400 }
        );
      }

      escalation.status = 'APPROVED';
      escalation.decisionDate = now;
      escalation.managerRemarks = comments.trim();
      escalation.approval = {
        decision: 'APPROVED',
        managerId: managerId ? new mongoose.Types.ObjectId(managerId) : escalation.assignedManagerId,
        managerName: managerName || escalation.assignedManagerName,
        managerRole: managerRole || 'Service Manager',
        comments: comments.trim(),
        decisionDate: now,
      };

      escalation.history.push({
        action: 'MANAGER_APPROVED',
        previousStatus,
        newStatus: 'APPROVED',
        performedBy: managerName || 'Manager',
        performedById: managerId ? new mongoose.Types.ObjectId(managerId) : undefined,
        userRole: managerRole || 'Manager',
        comments: comments.trim(),
        timestamp: now,
      });

      await escalation.save();

      // Notify the requester
      await sendEscalationNotification({
        recipientUserId: escalation.requesterUserId,
        recipientRole: escalation.requesterRole,
        title: `Escalation Approved: ${escalation.escalationNo}`,
        message: `${escalation.assignedManagerName} approved your ${escalation.subcategoryName} escalation. Remarks: "${comments.trim()}"`,
        type: 'ESCALATION_APPROVED',
        escalationId: escalation._id as mongoose.Types.ObjectId,
        escalationNo: escalation.escalationNo,
        complaintNo: escalation.complaintNo,
      });

      await AuditLog.create({
        action: 'APPROVE_ESCALATION',
        module: 'escalationManagement',
        entityId: escalation._id.toString(),
        entityName: escalation.escalationNo,
        performedBy: managerName || 'Manager',
        details: { comments, subcategory: escalation.subcategoryName },
      });

      return NextResponse.json({
        success: true,
        data: escalation,
        message: `Escalation ${escalation.escalationNo} approved successfully.`,
      });
    }

    // 2. REJECT REQUEST
    if (action === 'REJECT') {
      if (!comments || !comments.trim()) {
        return NextResponse.json(
          { success: false, message: 'Rejection Reason / Manager comments are strictly mandatory.' },
          { status: 400 }
        );
      }

      escalation.status = 'REJECTED';
      escalation.decisionDate = now;
      escalation.rejectionReason = comments.trim();
      escalation.managerRemarks = comments.trim();
      escalation.approval = {
        decision: 'REJECTED',
        managerId: managerId ? new mongoose.Types.ObjectId(managerId) : escalation.assignedManagerId,
        managerName: managerName || escalation.assignedManagerName,
        managerRole: managerRole || 'Service Manager',
        comments: comments.trim(),
        decisionDate: now,
      };

      escalation.history.push({
        action: 'MANAGER_REJECTED',
        previousStatus,
        newStatus: 'REJECTED',
        performedBy: managerName || 'Manager',
        performedById: managerId ? new mongoose.Types.ObjectId(managerId) : undefined,
        userRole: managerRole || 'Manager',
        comments: comments.trim(),
        timestamp: now,
      });

      await escalation.save();

      // Notify the requester
      await sendEscalationNotification({
        recipientUserId: escalation.requesterUserId,
        recipientRole: escalation.requesterRole,
        title: `Escalation Rejected: ${escalation.escalationNo}`,
        message: `${escalation.assignedManagerName} rejected your ${escalation.subcategoryName} escalation. Reason: "${comments.trim()}"`,
        type: 'ESCALATION_REJECTED',
        escalationId: escalation._id as mongoose.Types.ObjectId,
        escalationNo: escalation.escalationNo,
        complaintNo: escalation.complaintNo,
      });

      await AuditLog.create({
        action: 'REJECT_ESCALATION',
        module: 'escalationManagement',
        entityId: escalation._id.toString(),
        entityName: escalation.escalationNo,
        performedBy: managerName || 'Manager',
        details: { reason: comments, subcategory: escalation.subcategoryName },
      });

      return NextResponse.json({
        success: true,
        data: escalation,
        message: `Escalation ${escalation.escalationNo} rejected.`,
      });
    }

    // 3. REQUEST ADDITIONAL INFORMATION
    if (action === 'REQUEST_INFO') {
      if (!comments || !comments.trim()) {
        return NextResponse.json(
          { success: false, message: 'Please specify the additional information or photos required.' },
          { status: 400 }
        );
      }

      escalation.status = 'INFO_REQUIRED';
      escalation.history.push({
        action: 'INFO_REQUESTED',
        previousStatus,
        newStatus: 'INFO_REQUIRED',
        performedBy: managerName || 'Manager',
        performedById: managerId ? new mongoose.Types.ObjectId(managerId) : undefined,
        userRole: managerRole || 'Manager',
        comments: comments.trim(),
        timestamp: now,
      });

      await escalation.save();

      // Notify requester
      await sendEscalationNotification({
        recipientUserId: escalation.requesterUserId,
        recipientRole: escalation.requesterRole,
        title: `Information Required: ${escalation.escalationNo}`,
        message: `${escalation.assignedManagerName} requested additional details for ${escalation.subcategoryName}: "${comments.trim()}"`,
        type: 'INFO_REQUESTED',
        escalationId: escalation._id as mongoose.Types.ObjectId,
        escalationNo: escalation.escalationNo,
        complaintNo: escalation.complaintNo,
      });

      return NextResponse.json({
        success: true,
        data: escalation,
        message: 'Additional information requested from requester.',
      });
    }

    // 4. RESUBMIT INFORMATION
    if (action === 'RESUBMIT') {
      escalation.status = 'PENDING_APPROVAL';
      if (Array.isArray(newAttachments) && newAttachments.length > 0) {
        escalation.attachments.push(...newAttachments);
      }

      escalation.history.push({
        action: 'INFO_RESUBMITTED',
        previousStatus,
        newStatus: 'PENDING_APPROVAL',
        performedBy: managerName || 'Technician',
        userRole: managerRole || 'Technician',
        comments: comments || 'Additional technical info & photographs provided.',
        timestamp: now,
      });

      await escalation.save();

      // Notify manager
      await sendEscalationNotification({
        recipientUserId: escalation.assignedManagerId,
        recipientRole: 'Manager',
        title: `Escalation Resubmitted: ${escalation.escalationNo}`,
        message: `${escalation.requesterName} provided additional information for ${escalation.subcategoryName}. Ready for review.`,
        type: 'ESCALATION_ASSIGNED',
        escalationId: escalation._id as mongoose.Types.ObjectId,
        escalationNo: escalation.escalationNo,
        complaintNo: escalation.complaintNo,
      });

      return NextResponse.json({
        success: true,
        data: escalation,
        message: 'Escalation resubmitted for manager review.',
      });
    }

    // 5. REASSIGN TO NEW MANAGER
    if (action === 'REASSIGN') {
      if (!newManagerId) {
        return NextResponse.json({ success: false, message: 'New Manager ID is required.' }, { status: 400 });
      }

      const newMgr = await User.findById(newManagerId);
      if (!newMgr) {
        return NextResponse.json({ success: false, message: 'Target Manager User not found.' }, { status: 404 });
      }

      const prevMgrName = escalation.assignedManagerName;
      escalation.assignedManagerId = newMgr._id as mongoose.Types.ObjectId;
      escalation.assignedManagerName = newMgr.fullName || newMgr.username;

      escalation.history.push({
        action: 'REASSIGNED_MANAGER',
        previousStatus,
        newStatus: escalation.status,
        performedBy: managerName || 'Administrator',
        userRole: managerRole || 'Super Admin',
        comments: comments || `Reassigned from ${prevMgrName} to ${escalation.assignedManagerName}.`,
        timestamp: now,
      });

      await escalation.save();

      // Notify new manager
      await sendEscalationNotification({
        recipientUserId: newMgr._id as mongoose.Types.ObjectId,
        recipientRole: 'Manager',
        title: `Escalation Reassigned: ${escalation.escalationNo}`,
        message: `Escalation ${escalation.escalationNo} (${escalation.subcategoryName}) has been reassigned to you.`,
        type: 'ESCALATION_ASSIGNED',
        escalationId: escalation._id as mongoose.Types.ObjectId,
        escalationNo: escalation.escalationNo,
        complaintNo: escalation.complaintNo,
      });

      return NextResponse.json({
        success: true,
        data: escalation,
        message: `Escalation reassigned to ${escalation.assignedManagerName}.`,
      });
    }

    // 6. UPDATE FULFILMENT STATUS
    if (action === 'UPDATE_FULFILMENT') {
      if (fulfilmentStatus) {
        escalation.fulfilmentStatus = fulfilmentStatus;
        if (fulfilmentStatus === 'REPLACEMENT_COMPLETED') {
          escalation.status = 'COMPLETED';
        } else if (escalation.status === 'APPROVED') {
          escalation.status = 'IN_PROGRESS';
        }

        escalation.history.push({
          action: 'FULFILMENT_UPDATED',
          previousStatus,
          newStatus: escalation.status,
          performedBy: managerName || 'Staff',
          userRole: managerRole || 'Staff',
          comments: comments || `Fulfilment state updated to: ${fulfilmentStatus}`,
          timestamp: now,
        });

        await escalation.save();
      }

      return NextResponse.json({
        success: true,
        data: escalation,
        message: `Fulfilment status updated to ${escalation.fulfilmentStatus}`,
      });
    }

    // 7. REOPEN ESCALATION
    if (action === 'REOPEN') {
      if (!comments || !comments.trim()) {
        return NextResponse.json({ success: false, message: 'Reopen reason is mandatory.' }, { status: 400 });
      }

      escalation.status = 'REOPENED';
      escalation.history.push({
        action: 'ESCALATION_REOPENED',
        previousStatus,
        newStatus: 'REOPENED',
        performedBy: managerName || 'Admin',
        userRole: managerRole || 'Super Admin',
        comments: comments.trim(),
        timestamp: now,
      });

      await escalation.save();

      return NextResponse.json({
        success: true,
        data: escalation,
        message: `Escalation ${escalation.escalationNo} reopened.`,
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid or unsupported action.' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating escalation:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

