import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { ServiceCall } from '@/models/ServiceCall';
import { AuditLog } from '@/models/AuditLog';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    await connectDB();

    const contentType = req.headers.get('content-type') || '';
    let callId = '';
    let updateData: any = {};
    let invoiceFileBlob: File | null = null;
    const defectiveImageBlobs: File[] = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      callId = (formData.get('callId') || formData.get('id')) as string;

      const rawData = formData.get('data') as string;
      if (rawData) {
        try {
          updateData = JSON.parse(rawData);
        } catch (e) {
          updateData = {};
        }
      }

      invoiceFileBlob = formData.get('invoice') as File | null;

      // Extract any defective image files
      for (const [key, value] of formData.entries()) {
        if ((key === 'defectiveImages' || key.startsWith('defectiveImage_') || key.startsWith('defectivePartImage')) && value instanceof File) {
          defectiveImageBlobs.push(value);
        }
      }
    } else {
      const json = await req.json();
      callId = json.callId || json.id;
      updateData = json;
    }

    if (!callId) {
      return NextResponse.json({ success: false, message: 'Call ID is required.' }, { status: 400 });
    }

    // Fetch existing call with attachments
    const existingCall = await ServiceCall.findById(callId).select('+invoiceFile.fileData +defectivePartImages.fileData');
    if (!existingCall) {
      return NextResponse.json({ success: false, message: 'Service Call not found.' }, { status: 404 });
    }

    // Determine target status
    const targetStatus = (
      updateData.presentStatus ||
      updateData.jobStatus ||
      updateData.callStatus ||
      existingCall.callStatus ||
      'OPEN'
    ).toUpperCase();

    // 1. MANDATORY PRODUCT SERIAL NUMBER VALIDATION
    const serialNo = (updateData.serialNo || existingCall.serialNo || updateData.unitSerialNumber || '').trim();
    if (!serialNo) {
      return NextResponse.json(
        {
          success: false,
          field: 'serialNo',
          message: 'Product Serial Number is mandatory for all call updates.',
        },
        { status: 400 }
      );
    }

    // Process new invoice file if uploaded
    let newInvoiceAttachment: any = null;
    if (invoiceFileBlob && invoiceFileBlob.size > 0) {
      const allowedExts = ['.pdf', '.jpg', '.jpeg', '.png'];
      const ext = path.extname(invoiceFileBlob.name).toLowerCase();
      if (!allowedExts.includes(ext)) {
        return NextResponse.json(
          {
            success: false,
            field: 'invoice',
            message: `Unsupported invoice format "${ext}". Supported formats: PDF, JPG, JPEG, PNG.`,
          },
          { status: 400 }
        );
      }
      const buffer = Buffer.from(await invoiceFileBlob.arrayBuffer());
      newInvoiceAttachment = {
        fileName: invoiceFileBlob.name,
        fileUrl: `/api/calls/attachments/serve?callId=${callId}&type=invoice`,
        fileData: buffer.toString('base64'),
        mimeType: invoiceFileBlob.type || ext,
        fileSize: invoiceFileBlob.size,
        uploadedAt: new Date(),
      };
    }

    // 2. MANDATORY PRODUCT INVOICE VALIDATION
    const hasInvoice = !!(newInvoiceAttachment || existingCall.invoiceFile?.fileName || existingCall.invoiceFile?.fileUrl);
    if (!hasInvoice) {
      return NextResponse.json(
        {
          success: false,
          field: 'invoice',
          message: 'Product Invoice copy is mandatory for all call updates.',
        },
        { status: 400 }
      );
    }

    // Process defective images if uploaded
    const newDefectiveAttachments: any[] = [];
    if (defectiveImageBlobs.length > 0) {
      const allowedImgExts = ['.jpg', '.jpeg', '.png'];
      for (const imgBlob of defectiveImageBlobs) {
        if (imgBlob && imgBlob.size > 0) {
          const ext = path.extname(imgBlob.name).toLowerCase();
          if (!allowedImgExts.includes(ext)) {
            return NextResponse.json(
              {
                success: false,
                field: 'defectiveImages',
                message: `Unsupported defective image format "${ext}". Supported formats: JPG, JPEG, PNG.`,
              },
              { status: 400 }
            );
          }
          const buffer = Buffer.from(await imgBlob.arrayBuffer());
          newDefectiveAttachments.push({
            fileName: imgBlob.name,
            fileUrl: `/api/calls/attachments/serve?callId=${callId}&type=defective&index=${newDefectiveAttachments.length}`,
            fileData: buffer.toString('base64'),
            mimeType: imgBlob.type || ext,
            fileSize: imgBlob.size,
            uploadedAt: new Date(),
          });
        }
      }
    }

    // 3. SPECIAL MANDATORY VALIDATIONS FOR PART_PENDING
    if (targetStatus === 'PART_PENDING') {
      // 3.1 Unit Set Serial Number
      const unitSerial = (
        updateData.unitSerialNumber ||
        existingCall.unitSerialNumber ||
        updateData.serialNo ||
        existingCall.serialNo ||
        ''
      ).trim();

      if (!unitSerial) {
        return NextResponse.json(
          {
            success: false,
            field: 'unitSerialNumber',
            message: 'Unit Set Serial Number is mandatory when status is PART_PENDING.',
          },
          { status: 400 }
        );
      }

      // 3.2 Invoice Copy
      if (!hasInvoice) {
        return NextResponse.json(
          {
            success: false,
            field: 'invoice',
            message: 'Product Purchase Invoice copy is mandatory when status is PART_PENDING.',
          },
          { status: 400 }
        );
      }

      // 3.3 Defective Parts Image
      const existingDefectiveCount = existingCall.defectivePartImages?.length || 0;
      const totalDefectiveCount = existingDefectiveCount + newDefectiveAttachments.length;
      if (totalDefectiveCount === 0) {
        return NextResponse.json(
          {
            success: false,
            field: 'defectiveImages',
            message: 'At least one Defective Part Image is mandatory when status is PART_PENDING.',
          },
          { status: 400 }
        );
      }
    }

    // Build update object
    const updatePayload: any = {};

    // Customer details
    if (updateData.customerName) updatePayload.customerName = updateData.customerName.trim();
    if (updateData.customerMobile) updatePayload.customerMobile = updateData.customerMobile.trim();
    if (updateData.customerAddress) updatePayload.customerAddress = updateData.customerAddress.trim();
    if (updateData.customerEmail !== undefined) updatePayload.customerEmail = updateData.customerEmail.trim();
    if (updateData.pincode) updatePayload.pincode = updateData.pincode.trim();
    if (updateData.locality !== undefined) updatePayload.locality = updateData.locality.trim();
    if (updateData.city) updatePayload.city = updateData.city.trim();
    if (updateData.district !== undefined) updatePayload.district = updateData.district.trim();
    if (updateData.state) updatePayload.state = updateData.state.trim();

    // Product details
    if (updateData.clientName) updatePayload.clientName = updateData.clientName;
    if (updateData.brandName) updatePayload.brandName = updateData.brandName;
    if (updateData.categoryName) updatePayload.categoryName = updateData.categoryName;
    if (updateData.productName) updatePayload.productName = updateData.productName;
    if (updateData.modelNo) updatePayload.modelNo = updateData.modelNo;
    updatePayload.serialNo = serialNo;
    if (updateData.unitSerialNumber || targetStatus === 'PART_PENDING') {
      updatePayload.unitSerialNumber = updateData.unitSerialNumber || serialNo;
    }
    if (updateData.productDOP !== undefined) updatePayload.productDOP = updateData.productDOP;
    if (updateData.warrantyStatus) updatePayload.warrantyStatus = updateData.warrantyStatus;
    if (updateData.invoiceNo !== undefined) updatePayload.invoiceNo = updateData.invoiceNo;

    // Attachments
    if (newInvoiceAttachment) {
      updatePayload.invoiceFile = newInvoiceAttachment;
    }
    if (newDefectiveAttachments.length > 0) {
      const mergedDefective = [...(existingCall.defectivePartImages || []), ...newDefectiveAttachments];
      updatePayload.defectivePartImages = mergedDefective;
    }

    // Work Done details
    if (updateData.jobDetails !== undefined) updatePayload.jobDetails = updateData.jobDetails;
    if (updateData.symptomRegistered !== undefined) updatePayload.symptomRegistered = updateData.symptomRegistered;
    if (updateData.symptomObserved !== undefined) updatePayload.symptomObserved = updateData.symptomObserved;
    if (updateData.cause !== undefined) updatePayload.cause = updateData.cause;
    if (updateData.analysis !== undefined) updatePayload.analysis = updateData.analysis;
    if (updateData.partRequired !== undefined) updatePayload.partRequired = updateData.partRequired;
    if (Array.isArray(updateData.requiredParts)) {
      updatePayload.requiredParts = updateData.requiredParts;
    }

    // Amount Collected details
    if (updateData.charges) {
      const c = updateData.charges;
      const spareCharge = Number(c.spareCharge) || 0;
      const spareTax = Number(c.spareTax) || 0;
      const labourCharge = Number(c.labourCharge) || 0;
      const labourTax = Number(c.labourTax) || 0;
      const transportCharge = Number(c.transportCharge) || 0;
      const otherCharge = Number(c.otherCharge) || 0;
      const totalAmount = spareCharge + spareTax + labourCharge + labourTax + transportCharge + otherCharge;

      updatePayload.charges = {
        spareCharge,
        spareTax,
        labourCharge,
        labourTax,
        transportCharge,
        otherCharge,
        totalAmount,
        tcrNo: c.tcrNo || '',
      };
    }

    // Visit details
    const visitDetailsObj: any = {
      engineerName: updateData.engineerName || updateData.technicianName || existingCall.technicianName || '',
      visitDate: updateData.visitDate ? new Date(updateData.visitDate) : new Date(),
      inTimeHour: updateData.inTimeHour || '10',
      inTimeMinute: updateData.inTimeMinute || '00',
      outTimeHour: updateData.outTimeHour || '11',
      outTimeMinute: updateData.outTimeMinute || '00',
      actionTaken: updateData.actionTaken || '',
      engineerRemark: updateData.engineerRemark || '',
      lastStatus: existingCall.callStatus,
      presentStatus: targetStatus,
      happyCode: updateData.happyCode || '',
      distanceFromSF: Number(updateData.distanceFromSF) || 0,
      updatedAt: new Date(),
    };

    updatePayload.visitDetails = visitDetailsObj;
    if (updateData.engineerName) {
      updatePayload.technicianName = updateData.engineerName;
    }
    if (updateData.appointmentDate) {
      updatePayload.appointmentDate = new Date(updateData.appointmentDate);
    }

    // Update overall call status
    updatePayload.callStatus = targetStatus;
    if (targetStatus === 'COMPLETED') {
      updatePayload.completedDate = new Date();
    }

    // Append to visit history and call history
    const historyItem = {
      action: targetStatus === 'PART_PENDING' ? 'Part Pending Update' : 'Call Update',
      remark: updateData.jobDetails || `Job Sheet updated with status: ${targetStatus}`,
      transactionDate: new Date(),
      ipAddress: req.headers.get('x-forwarded-for') || '',
      enteredBy: updateData.updatedBy || updateData.technicianName || 'Super Admin',
      complaintStatus: targetStatus,
      previousStatus: existingCall.callStatus,
    };

    // Work done record
    const workRecord = updateData.jobDetails
      ? {
          workDone: updateData.jobDetails,
          symptom: updateData.symptomObserved || updateData.symptomRegistered || '',
          cause: updateData.cause || '',
          analysis: updateData.analysis || '',
          recordedDate: new Date(),
          recordedBy: updateData.technicianName || updateData.updatedBy || 'Technician',
        }
      : null;

    // Pending parts mapping
    if (updateData.pendingParts) {
      updatePayload.pendingParts = updateData.pendingParts;
    } else if (targetStatus === 'PART_PENDING' && Array.isArray(updateData.requiredParts)) {
      updatePayload.pendingParts = updateData.requiredParts.map((p: any) => ({
        partName: p.partName,
        partCode: p.partCode || '',
        quantity: p.quantity || 1,
        unitSerialNumber: updateData.unitSerialNumber || serialNo,
        pendingReason: updateData.jobDetails || 'Awaiting part delivery',
        invoiceCopyUrl: newInvoiceAttachment?.fileUrl || existingCall.invoiceFile?.fileUrl,
        defectiveImageUrl: newDefectiveAttachments[0]?.fileUrl || existingCall.defectivePartImages?.[0]?.fileUrl,
        pendingDate: new Date(),
        pendingStatus: 'PART_PENDING',
      }));
    }

    // Consumed parts mapping
    if (updateData.consumedParts) {
      updatePayload.consumedParts = updateData.consumedParts;
    } else if (targetStatus === 'COMPLETED' && Array.isArray(updateData.requiredParts)) {
      updatePayload.consumedParts = updateData.requiredParts.map((p: any) => ({
        partName: p.partName,
        partCode: p.partCode || '',
        consumedQuantity: p.quantity || 1,
        partSerialNumber: serialNo,
        consumptionDate: new Date(),
        engineerName: updateData.engineerName || existingCall.technicianName || '',
        relatedCallId: existingCall.callNo,
      }));
    }

    const pushOps: any = {
      visitHistory: visitDetailsObj,
      callHistory: historyItem,
    };
    if (workRecord) {
      pushOps.workDoneRecords = workRecord;
    }

    const updated = await ServiceCall.findByIdAndUpdate(
      callId,
      {
        $set: updatePayload,
        $push: pushOps,
      },
      { new: true }
    );

    // Audit Log
    await AuditLog.create({
      action: 'CALL_UPDATE_JOB_SHEET',
      module: 'callManagement',
      entityId: callId,
      entityName: `Call #${existingCall.callNo}`,
      performedBy: updateData.updatedBy || updateData.technicianName || 'Super Admin',
      details: {
        previousStatus: existingCall.callStatus,
        newStatus: targetStatus,
        serialNo,
        hasInvoice: !!updated?.invoiceFile,
        defectiveImagesCount: updated?.defectivePartImages?.length || 0,
      },
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Call #${existingCall.callNo} updated successfully with status: ${targetStatus}!`,
    });
  } catch (error: any) {
    console.error('Error in call update:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

