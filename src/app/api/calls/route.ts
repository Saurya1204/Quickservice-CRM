import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { ServiceCall } from '@/models/ServiceCall';
import { AuditLog } from '@/models/AuditLog';
import { NomenclatureService } from '@/lib/nomenclatureService';
import { generateNextCallNo } from '@/lib/callNumberService';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const branch = searchParams.get('branch');
    const region = searchParams.get('region');
    const city = searchParams.get('city');

    // Call Registration specific search parameters
    const name = searchParams.get('name');
    const mobile = searchParams.get('mobile');
    const complaintNo = searchParams.get('complaintNo');
    const serialNo = searchParams.get('serialNo');
    const poNumber = searchParams.get('poNumber');
    const callId = searchParams.get('id');

    // Organizational Scoping
    const clientId = searchParams.get('clientId');
    const clientName = searchParams.get('clientName');
    const brand = searchParams.get('brand');
    const technician = searchParams.get('technician') || searchParams.get('technicianName');
    const franchise = searchParams.get('franchise');

    const query: any = {};

    if (clientId || clientName) {
      if (clientId && clientName) {
        query.$or = [{ clientId }, { clientName: { $regex: new RegExp(clientName.trim(), 'i') } }];
      } else if (clientId) {
        query.clientId = clientId;
      } else if (clientName) {
        query.clientName = { $regex: new RegExp(clientName.trim(), 'i') };
      }
    }

    if (brand && brand.trim() && brand !== 'All') {
      query.brandName = { $regex: new RegExp(brand.trim(), 'i') };
    }

    if (technician && technician.trim() && technician !== 'All') {
      query.technicianName = { $regex: new RegExp(technician.trim(), 'i') };
    }

    if (franchise && franchise.trim() && franchise !== 'All') {
      query.$or = [
        { ascName: { $regex: new RegExp(franchise.trim(), 'i') } },
        { serviceProviderName: { $regex: new RegExp(franchise.trim(), 'i') } },
      ];
    }

    if (callId) {
      const singleCall = await ServiceCall.findById(callId).lean();
      return NextResponse.json({ success: true, data: singleCall });
    }

    if (poNumber && poNumber.trim()) {
      query.poNumber = { $regex: poNumber.trim(), $options: 'i' };
    }

    if (status && status !== 'ALL') {
      if (status === 'ACTIVE') {
        query.callStatus = { $in: ['OPEN', 'APPOINTMENT', 'ALLOTED', 'PART_PENDING', 'REOPENED'] };
      } else if (status === 'CLOSED') {
        query.callStatus = { $in: ['COMPLETED', 'CANCEL'] };
      } else {
        query.callStatus = status;
      }
    }

    if (branch && branch !== 'All' && branch.trim()) {
      query.branch = branch;
    }
    if (region && region !== 'All' && region.trim()) {
      query.region = region;
    }
    if (city && city !== 'All' && city.trim()) {
      query.city = { $regex: new RegExp(`^${city}$`, 'i') };
    }

    // Specific Call Registration Search
    const searchConditions: any[] = [];

    if (name && name.trim()) {
      const nameRegex = { $regex: name.trim(), $options: 'i' };
      searchConditions.push({
        $or: [
          { customerName: nameRegex },
          { customerFirstName: nameRegex },
          { customerLastName: nameRegex },
          { contactPersonName: nameRegex },
        ],
      });
    }

    if (mobile && mobile.trim()) {
      const mobileRegex = { $regex: mobile.trim(), $options: 'i' };
      searchConditions.push({
        $or: [
          { customerMobile: mobileRegex },
          { contactPersonMobile: mobileRegex },
          { dealerMobile: mobileRegex },
        ],
      });
    }

    if (complaintNo && complaintNo.trim()) {
      const callNoRegex = { $regex: complaintNo.trim(), $options: 'i' };
      searchConditions.push({
        $or: [
          { callNo: callNoRegex },
          { lastComplaintNo: callNoRegex },
        ],
      });
    }

    if (serialNo && serialNo.trim()) {
      const snRegex = { $regex: serialNo.trim(), $options: 'i' };
      searchConditions.push({
        $or: [
          { serialNo: snRegex },
          { unitSerialNumber: snRegex },
        ],
      });
    }

    if (searchConditions.length > 0) {
      query.$and = searchConditions;
    } else if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      query.$or = [
        { callNo: searchRegex },
        { customerName: searchRegex },
        { customerMobile: searchRegex },
        { brandName: searchRegex },
        { city: searchRegex },
        { serialNo: searchRegex },
        { unitSerialNumber: searchRegex },
      ];
    }

    const calls = await ServiceCall.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json(
      { success: true, data: calls },
      { headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30' } }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    // Check if bulk insert
    if (Array.isArray(body)) {
      if (body.length === 0) {
        return NextResponse.json({ success: false, message: 'No records provided' }, { status: 400 });
      }

      const prepared: any[] = [];
      for (let idx = 0; idx < body.length; idx++) {
        const call = body[idx];
        const generatedCallNo =
          call.callNo ||
          (await generateNextCallNo({
            state: call.state,
            pincode: call.pincode,
          }));
        prepared.push({
          ...call,
          callNo: generatedCallNo,
          callStatus: call.callStatus || 'OPEN',
          daysPending: call.daysPending || 0,
        });
      }

      const inserted = await ServiceCall.insertMany(prepared);
      return NextResponse.json({
        success: true,
        data: inserted,
        message: `Successfully uploaded ${inserted.length} live calls to database!`,
      });
    }

    // Auto-compose customerName from first + last name if missing
    if (!body.customerName && body.customerFirstName) {
      const title = body.customerTitle ? `${body.customerTitle} ` : '';
      body.customerName = `${title}${body.customerFirstName} ${body.customerLastName || ''}`.trim();
    }

    // Auto-compose customerAddress from address1 + landmark if missing
    if (!body.customerAddress && body.customerAddress1) {
      body.customerAddress = `${body.customerAddress1}${body.landmark ? ', Landmark: ' + body.landmark : ''}`.trim();
    }

    // Auto-map complaintDescription to reportedFault
    if (!body.reportedFault && body.complaintDescription) {
      body.reportedFault = body.complaintDescription;
    }

    // Auto-map unitSerialNumber to serialNo
    if (!body.serialNo && body.unitSerialNumber) {
      body.serialNo = body.unitSerialNumber;
    }

    const customerMobile = body.customerMobile || body.mobile;
    const customerName = body.customerName || body.customerFirstName;

    if (!customerName || !customerMobile) {
      return NextResponse.json(
        { success: false, message: 'Customer Name and Mobile Number are mandatory' },
        { status: 400 }
      );
    }

    body.customerName = customerName;
    body.customerMobile = customerMobile;
    body.customerAddress = body.customerAddress || body.customerAddress1 || 'N/A';
    body.city = body.city || 'N/A';
    body.state = body.state || 'N/A';
    body.pincode = body.pincode || 'N/A';
    body.clientName = body.clientName || 'N/A';
    body.brandName = body.brandName || 'N/A';
    body.categoryName = body.categoryName || 'N/A';
    body.reportedFault = body.reportedFault || body.complaintDescription || 'General Service';

    // Atomic, state-wise, date-wise Call ID generation (YYMMDD + STATE_CODE + QS + SEQUENCE)
    // Eliminates E11000 duplicate key error and follows older CRM nomenclature
    if (!body.callNo) {
      body.callNo = await generateNextCallNo({
        state: body.state,
        pincode: body.pincode,
      });
    }

    // Initialize Call History
    if (!body.callHistory || body.callHistory.length === 0) {
      body.callHistory = [
        {
          action: 'Call Registration',
          remark: `Call registered with initial status ${body.callStatus || 'OPEN'}`,
          transactionDate: new Date(),
          enteredBy: body.registeredBy || body.createdBy || 'Call Coordinator',
          complaintStatus: body.callStatus || 'OPEN',
        },
      ];
    }

    let newCall;
    try {
      newCall = await ServiceCall.create(body);
    } catch (err: any) {
      // If a duplicate key collision occurs, safely retry with a new atomic sequence
      if (err.code === 11000 || (err.message && err.message.includes('E11000'))) {
        body.callNo = await generateNextCallNo({
          state: body.state,
          pincode: body.pincode,
        });
        newCall = await ServiceCall.create(body);
      } else {
        throw err;
      }
    }

    await AuditLog.create({
      action: 'CALL_CREATE',
      module: 'callManagement',
      entityId: newCall._id.toString(),
      entityName: `Call #${newCall.callNo}`,
      performedBy: body.registeredBy || body.createdBy || 'Call Coordinator',
    });

    return NextResponse.json({
      success: true,
      data: newCall,
      message: `Service Call registered successfully with Call No: ${newCall.callNo}`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { id, action, reopenReason, reopenedBy, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Call ID is required' }, { status: 400 });
    }

    // Support reopen in PUT directly
    const performedBy = body.performedBy || body.updatedBy || body.reopenedBy || 'Super Admin';
    const clientIp = req.headers.get('x-forwarded-for') || '';

    const existingCallForUpdate = await ServiceCall.findById(id).select('+invoiceFile.fileData +defectivePartImages.fileData');
    if (!existingCallForUpdate) {
      return NextResponse.json({ success: false, message: 'Call not found' }, { status: 404 });
    }

    if (action === 'reopen') {
      if (!reopenReason || !reopenReason.trim()) {
        return NextResponse.json(
          { success: false, message: 'Reopening Reason is required' },
          { status: 400 }
        );
      }

      const updated = await ServiceCall.findByIdAndUpdate(
        id,
        {
          $set: { callStatus: 'REOPENED', daysPending: 0 },
          $push: {
            reopenHistory: {
              reopenedBy: performedBy,
              reopenedAt: new Date(),
              reason: reopenReason.trim(),
              previousStatus: existingCallForUpdate.callStatus,
            },
            callHistory: {
              action: 'Call Reopen',
              remark: reopenReason.trim(),
              transactionDate: new Date(),
              ipAddress: clientIp,
              enteredBy: performedBy,
              complaintStatus: 'REOPENED',
              previousStatus: existingCallForUpdate.callStatus,
            },
          },
        },
        { new: true }
      );

      await AuditLog.create({
        action: 'REOPEN_CALL',
        module: 'callManagement',
        entityId: id,
        entityName: `Call #${existingCallForUpdate.callNo}`,
        performedBy,
        ipAddress: clientIp,
        details: { reason: reopenReason },
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: `Call #${existingCallForUpdate.callNo} reopened successfully!`,
      });
    }

    // Action: Appointment & Reschedule
    if (action === 'appointment' || action === 'reschedule') {
      const appDate = body.appointmentDate ? new Date(body.appointmentDate) : new Date();
      const appTime = body.appointmentTime || '10:00 AM';
      const remarks = body.remarks || (action === 'reschedule' ? 'Appointment rescheduled' : 'Appointment scheduled');
      const actionTitle = action === 'reschedule' ? 'Call Reschedule' : 'Call Appointment';

      const updated = await ServiceCall.findByIdAndUpdate(
        id,
        {
          $set: {
            appointmentDate: appDate,
            appointmentTime: appTime,
            callStatus: 'APPOINTMENT',
          },
          $push: {
            appointmentHistory: {
              appointmentDate: appDate,
              appointmentTime: appTime,
              remarks,
              scheduledBy: performedBy,
              scheduledAt: new Date(),
              status: 'APPOINTMENT',
            },
            callHistory: {
              action: actionTitle,
              remark: `${remarks} for ${appDate.toISOString().split('T')[0]} at ${appTime}`,
              transactionDate: new Date(),
              ipAddress: clientIp,
              enteredBy: performedBy,
              complaintStatus: 'APPOINTMENT',
              previousStatus: existingCallForUpdate.callStatus,
            },
          },
        },
        { new: true }
      );

      await AuditLog.create({
        action: actionTitle.toUpperCase().replace(/\s+/g, '_'),
        module: 'callManagement',
        entityId: id,
        entityName: `Call #${existingCallForUpdate.callNo}`,
        performedBy,
        ipAddress: clientIp,
        details: { appointmentDate: appDate, appointmentTime: appTime, remarks },
      }).catch(() => null);

      return NextResponse.json({ success: true, data: updated, message: `${actionTitle} saved successfully!` });
    }

    // Action: Allot To Engineer
    if (action === 'allot') {
      const technicianName = body.technicianName || body.actionInput;
      if (!technicianName) {
        return NextResponse.json({ success: false, message: 'Technician Name is required for allotment' }, { status: 400 });
      }

      const updated = await ServiceCall.findByIdAndUpdate(
        id,
        {
          $set: {
            technicianName,
            callStatus: 'ALLOTED',
          },
          $push: {
            callHistory: {
              action: 'Allot To Eng.',
              remark: body.remarks || `Call allotted to engineer ${technicianName}`,
              transactionDate: new Date(),
              ipAddress: clientIp,
              enteredBy: performedBy,
              complaintStatus: 'ALLOTED',
              previousStatus: existingCallForUpdate.callStatus,
            },
          },
        },
        { new: true }
      );

      await AuditLog.create({
        action: 'CALL_ALLOTMENT',
        module: 'callManagement',
        entityId: id,
        entityName: `Call #${existingCallForUpdate.callNo}`,
        performedBy,
        ipAddress: clientIp,
        details: { technicianName, remarks: body.remarks },
      }).catch(() => null);

      return NextResponse.json({ success: true, data: updated, message: `Call allotted to ${technicianName} successfully!` });
    }

    // Action: Transfer Call
    if (action === 'transfer') {
      const toEngineer = body.toEngineer || body.actionInput;
      const toBranch = body.toBranch || body.branch;
      const transferRemarks = body.remarks || body.transferRemarks || `Transferred to ${toEngineer}`;

      const updated = await ServiceCall.findByIdAndUpdate(
        id,
        {
          $set: {
            technicianName: toEngineer,
            ...(toBranch ? { branch: toBranch } : {}),
          },
          $push: {
            transferHistory: {
              fromEngineer: existingCallForUpdate.technicianName || '',
              toEngineer,
              fromTeam: existingCallForUpdate.branch || '',
              toTeam: toBranch || '',
              remarks: transferRemarks,
              transferredBy: performedBy,
              transferredAt: new Date(),
            },
            callHistory: {
              action: 'Call Transfer',
              remark: transferRemarks,
              transactionDate: new Date(),
              ipAddress: clientIp,
              enteredBy: performedBy,
              complaintStatus: existingCallForUpdate.callStatus,
              previousStatus: existingCallForUpdate.callStatus,
            },
          },
        },
        { new: true }
      );

      await AuditLog.create({
        action: 'CALL_TRANSFER',
        module: 'callManagement',
        entityId: id,
        entityName: `Call #${existingCallForUpdate.callNo}`,
        performedBy,
        ipAddress: clientIp,
        details: { from: existingCallForUpdate.technicianName, to: toEngineer, remarks: transferRemarks },
      }).catch(() => null);

      return NextResponse.json({ success: true, data: updated, message: `Call transferred to ${toEngineer} successfully!` });
    }

    // Action: Cancel & Direct Cancel
    if (action === 'cancel' || action === 'directCancel') {
      const reason = body.reason || body.remarks || body.cancellationReason || 'Direct Cancel';
      const actionName = action === 'directCancel' ? 'Direct Cancel' : 'Call Cancel';

      const updated = await ServiceCall.findByIdAndUpdate(
        id,
        {
          $set: {
            callStatus: 'CANCEL',
            cancelledDate: new Date(),
            cancellationReason: reason,
            cancelRemarks: reason,
            cancelledBy: performedBy,
          },
          $push: {
            callHistory: {
              action: actionName,
              remark: reason,
              transactionDate: new Date(),
              ipAddress: clientIp,
              enteredBy: performedBy,
              complaintStatus: 'CANCEL',
              previousStatus: existingCallForUpdate.callStatus,
            },
          },
        },
        { new: true }
      );

      await AuditLog.create({
        action: action === 'directCancel' ? 'DIRECT_CANCEL' : 'CALL_CANCEL',
        module: 'callManagement',
        entityId: id,
        entityName: `Call #${existingCallForUpdate.callNo}`,
        performedBy,
        ipAddress: clientIp,
        details: { reason },
      }).catch(() => null);

      return NextResponse.json({ success: true, data: updated, message: `Call #${existingCallForUpdate.callNo} cancelled successfully!` });
    }

    // Action: Direct Cancel PO
    if (action === 'directCancelPo') {
      const reason = body.reason || body.remarks || 'Purchase Order Cancelled';
      const updated = await ServiceCall.findByIdAndUpdate(
        id,
        {
          $set: {
            poStatus: 'CANCEL',
            poCancellationReason: reason,
            poCancelledBy: performedBy,
            poCancelledAt: new Date(),
          },
          $push: {
            callHistory: {
              action: 'Direct Cancel PO',
              remark: `PO #${existingCallForUpdate.poNumber || existingCallForUpdate.purchaseOrderNo || id} cancelled: ${reason}`,
              transactionDate: new Date(),
              ipAddress: clientIp,
              enteredBy: performedBy,
              complaintStatus: existingCallForUpdate.callStatus,
              previousStatus: existingCallForUpdate.callStatus,
            },
          },
        },
        { new: true }
      );

      await AuditLog.create({
        action: 'DIRECT_CANCEL_PO',
        module: 'callManagement',
        entityId: id,
        entityName: `Call #${existingCallForUpdate.callNo}`,
        performedBy,
        ipAddress: clientIp,
        details: { reason },
      }).catch(() => null);

      return NextResponse.json({ success: true, data: updated, message: `Purchase Order cancelled successfully!` });
    }

    // Action: Call Reminder
    if (action === 'reminder') {
      const remDate = body.reminderDate ? new Date(body.reminderDate) : new Date();
      const remTime = body.reminderTime || '10:00 AM';
      const remRemarks = body.remarks || 'Customer follow-up reminder';

      const updated = await ServiceCall.findByIdAndUpdate(
        id,
        {
          $push: {
            reminders: {
              reminderDate: remDate,
              reminderTime: remTime,
              remarks: remRemarks,
              scheduledBy: performedBy,
              scheduledAt: new Date(),
              status: 'PENDING',
            },
            callHistory: {
              action: 'Call Reminder',
              remark: `${remRemarks} (Scheduled for ${remDate.toISOString().split('T')[0]} ${remTime})`,
              transactionDate: new Date(),
              ipAddress: clientIp,
              enteredBy: performedBy,
              complaintStatus: existingCallForUpdate.callStatus,
              previousStatus: existingCallForUpdate.callStatus,
            },
          },
        },
        { new: true }
      );

      return NextResponse.json({ success: true, data: updated, message: `Reminder scheduled successfully!` });
    }

    // Action: Call Feedback
    if (action === 'feedback') {
      const rating = Number(body.rating) || 5;
      const feedbackRemarks = body.remarks || body.customerRemarks || 'Satisfactory service';

      const updated = await ServiceCall.findByIdAndUpdate(
        id,
        {
          $set: {
            feedback: {
              rating,
              customerRemarks: feedbackRemarks,
              collectedBy: performedBy,
              collectedAt: new Date(),
            },
            callStatus: 'COMPLETED',
          },
          $push: {
            callHistory: {
              action: 'Call Feedback',
              remark: `Rating: ${rating}/5. Remarks: ${feedbackRemarks}`,
              transactionDate: new Date(),
              ipAddress: clientIp,
              enteredBy: performedBy,
              complaintStatus: 'COMPLETED',
              previousStatus: existingCallForUpdate.callStatus,
            },
          },
        },
        { new: true }
      );

      return NextResponse.json({ success: true, data: updated, message: `Customer feedback recorded successfully!` });
    }

    // Action: Update Serial No.
    if (action === 'updateSerialNo') {
      const newSerialNo = (body.newSerialNo || body.serialNo || '').trim();
      if (!newSerialNo) {
        return NextResponse.json({ success: false, message: 'New Serial Number is required.' }, { status: 400 });
      }

      const oldSerialNo = existingCallForUpdate.serialNo || '';
      const remarks = body.remarks || `Serial number updated from "${oldSerialNo}" to "${newSerialNo}"`;

      const updated = await ServiceCall.findByIdAndUpdate(
        id,
        {
          $set: { serialNo: newSerialNo },
          $push: {
            serialNoHistory: {
              oldSerialNo,
              newSerialNo,
              changedBy: performedBy,
              changedAt: new Date(),
              remarks,
            },
            callHistory: {
              action: 'Serial Number Update',
              remark: remarks,
              transactionDate: new Date(),
              ipAddress: clientIp,
              enteredBy: performedBy,
              complaintStatus: existingCallForUpdate.callStatus,
              previousStatus: existingCallForUpdate.callStatus,
            },
          },
        },
        { new: true }
      );

      await AuditLog.create({
        action: 'UPDATE_SERIAL_NO',
        module: 'callManagement',
        entityId: id,
        entityName: `Call #${existingCallForUpdate.callNo}`,
        performedBy,
        ipAddress: clientIp,
        details: { oldSerialNo, newSerialNo, remarks },
      }).catch(() => null);

      return NextResponse.json({ success: true, data: updated, message: `Serial Number updated successfully to "${newSerialNo}"!` });
    }

    // Action: Call Edit
    if (action === 'edit') {
      const editRemarks = body.remarks || 'Customer / Product details updated';
      const updated = await ServiceCall.findByIdAndUpdate(
        id,
        {
          $set: updateData,
          $push: {
            callHistory: {
              action: 'Call Edit',
              remark: editRemarks,
              transactionDate: new Date(),
              ipAddress: clientIp,
              enteredBy: performedBy,
              complaintStatus: updateData.callStatus || existingCallForUpdate.callStatus,
              previousStatus: existingCallForUpdate.callStatus,
            },
          },
        },
        { new: true }
      );

      await AuditLog.create({
        action: 'CALL_EDIT',
        module: 'callManagement',
        entityId: id,
        entityName: `Call #${existingCallForUpdate.callNo}`,
        performedBy,
        ipAddress: clientIp,
        details: { changedFields: Object.keys(updateData) },
      }).catch(() => null);

      return NextResponse.json({ success: true, data: updated, message: 'Call details updated successfully!' });
    }

    // Preserve Call ID integrity: Call ID must remain unchanged when editing an existing call
    delete updateData.callNo;

    const targetStatus = (updateData.callStatus || updateData.presentStatus || existingCallForUpdate.callStatus || '').toUpperCase();

    if (updateData.isCallUpdate || targetStatus === 'PART_PENDING') {
      const serialNo = (updateData.serialNo || existingCallForUpdate.serialNo || updateData.unitSerialNumber || '').trim();
      if (!serialNo) {
        return NextResponse.json(
          { success: false, field: 'serialNo', message: 'Product Serial Number is mandatory for all call updates.' },
          { status: 400 }
        );
      }

      const hasInvoice = !!(updateData.invoiceFile || existingCallForUpdate.invoiceFile?.fileName || existingCallForUpdate.invoiceFile?.fileUrl);
      if (!hasInvoice) {
        return NextResponse.json(
          { success: false, field: 'invoice', message: 'Product Invoice copy is mandatory for all call updates.' },
          { status: 400 }
        );
      }

      if (targetStatus === 'PART_PENDING') {
        const unitSerial = (updateData.unitSerialNumber || existingCallForUpdate.unitSerialNumber || serialNo).trim();
        if (!unitSerial) {
          return NextResponse.json(
            { success: false, field: 'unitSerialNumber', message: 'Unit Set Serial Number is mandatory when status is PART_PENDING.' },
            { status: 400 }
          );
        }

        const defectiveCount = (existingCallForUpdate.defectivePartImages?.length || 0) + (updateData.defectivePartImages?.length || 0);
        if (defectiveCount === 0) {
          return NextResponse.json(
            { success: false, field: 'defectiveImages', message: 'At least one Defective Part Image is mandatory when status is PART_PENDING.' },
            { status: 400 }
          );
        }
      }
    }

    const updated = await ServiceCall.findByIdAndUpdate(id, updateData, { new: true });
    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Call updated successfully',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Call ID is required' }, { status: 400 });
    }

    await ServiceCall.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Call deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
