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

    const query: any = {};

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
    if (action === 'reopen') {
      if (!reopenReason || !reopenReason.trim()) {
        return NextResponse.json(
          { success: false, message: 'Reopening Reason is required' },
          { status: 400 }
        );
      }
      const existingCall = await ServiceCall.findById(id);
      if (!existingCall) {
        return NextResponse.json({ success: false, message: 'Call not found' }, { status: 404 });
      }

      const updated = await ServiceCall.findByIdAndUpdate(
        id,
        {
          $set: { callStatus: 'REOPENED', daysPending: 0 },
          $push: {
            reopenHistory: {
              reopenedBy: reopenedBy || 'Authorized Officer',
              reopenedAt: new Date(),
              reason: reopenReason.trim(),
              previousStatus: existingCall.callStatus,
            },
          },
        },
        { new: true }
      );

      await AuditLog.create({
        action: 'REOPEN_CALL',
        module: 'callManagement',
        entityId: id,
        entityName: `Call #${existingCall.callNo}`,
        performedBy: reopenedBy || 'Authorized Officer',
        details: { reason: reopenReason },
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: `Call #${existingCall.callNo} reopened successfully!`,
      });
    }

    // Preserve Call ID integrity: Call ID must remain unchanged when editing an existing call
    delete updateData.callNo;

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
