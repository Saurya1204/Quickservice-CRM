import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Notification } from '@/models/Notification';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: true, data: [], unreadCount: 0 });
    }

    const query: any = { recipientUserId: new mongoose.Types.ObjectId(userId) };

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const unreadCount = await Notification.countDocuments({ ...query, isRead: false });

    return NextResponse.json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { id, userId, markAll } = body;

    if (markAll && userId) {
      await Notification.updateMany(
        { recipientUserId: new mongoose.Types.ObjectId(userId), isRead: false },
        { isRead: true, readAt: new Date() }
      );
      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    if (id) {
      await Notification.findByIdAndUpdate(id, { isRead: true, readAt: new Date() });
      return NextResponse.json({ success: true, message: 'Notification marked as read' });
    }

    return NextResponse.json({ success: false, message: 'ID or userId required' }, { status: 400 });
  } catch (error: any) {
    console.error('Error marking notifications:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

