import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import CustomerFeedback from '@/models/CustomerFeedback';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const search = searchParams.get('search')?.trim();
    const complaintNo = searchParams.get('complaintNo')?.trim();
    const customerName = searchParams.get('customerName')?.trim();
    const mobile = searchParams.get('mobile')?.trim();
    const engineerName = searchParams.get('engineerName')?.trim();
    const product = searchParams.get('product')?.trim();
    const overallExperience = searchParams.get('overallExperience')?.trim();
    const status = searchParams.get('status')?.trim();
    const startDate = searchParams.get('startDate')?.trim();
    const endDate = searchParams.get('endDate')?.trim();

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '50', 10)));
    const skip = (page - 1) * limit;

    const query: any = {};

    if (complaintNo) {
      query.complaintNo = { $regex: complaintNo, $options: 'i' };
    }
    if (customerName) {
      query.customerName = { $regex: customerName, $options: 'i' };
    }
    if (mobile) {
      query.customerMobile = { $regex: mobile, $options: 'i' };
    }
    if (engineerName) {
      query.engineerName = { $regex: engineerName, $options: 'i' };
    }
    if (product) {
      query.$or = [
        { brandName: { $regex: product, $options: 'i' } },
        { categoryName: { $regex: product, $options: 'i' } },
        { productName: { $regex: product, $options: 'i' } },
      ];
    }
    if (overallExperience && overallExperience !== 'ALL') {
      query.overallExperience = overallExperience;
    }
    if (status && status !== 'ALL') {
      query.feedbackStatus = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    if (search) {
      const regex = { $regex: search, $options: 'i' };
      query.$or = [
        { complaintNo: regex },
        { customerName: regex },
        { customerMobile: regex },
        { engineerName: regex },
        { brandName: regex },
        { categoryName: regex },
      ];
    }

    const [total, feedbacks] = await Promise.all([
      CustomerFeedback.countDocuments(query),
      CustomerFeedback.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return NextResponse.json({
      success: true,
      data: feedbacks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/feedback:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
