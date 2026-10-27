import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    await connectDB();
    const users = await User.find({}, '-passwordHash').sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: users });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const { username, password, fullName, role, branch, categoryClientRegion, address, mobile, email, status } = await req.json();

    if (!username || !password || !fullName) {
      return NextResponse.json(
        { success: false, message: 'Username, password and name are required' },
        { status: 400 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      username: username.trim(),
      passwordHash,
      fullName: fullName.trim(),
      role: role || 'Super Admin',
      branch: branch || '',
      categoryClientRegion: categoryClientRegion || '',
      address: address || '',
      mobile: mobile || '',
      email: email || '',
      status: status || 'ACTIVE',
    });

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      data: {
        _id: newUser._id,
        username: newUser.username,
        fullName: newUser.fullName,
        role: newUser.role,
        branch: newUser.branch,
        categoryClientRegion: newUser.categoryClientRegion,
        address: newUser.address,
        mobile: newUser.mobile,
        email: newUser.email,
        status: newUser.status,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const { id, fullName, role, branch, categoryClientRegion, address, mobile, email, status, password } = await req.json();

    if (!id) {
      return NextResponse.json({ success: false, message: 'User ID is required' }, { status: 400 });
    }

    const updateData: any = {
      fullName,
      role,
      branch,
      categoryClientRegion,
      address,
      mobile,
      email,
      status,
    };
    if (password && password.trim()) {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(password, salt);
    }

    const updated = await User.findByIdAndUpdate(id, updateData, { new: true }).select('-passwordHash');
    return NextResponse.json({ success: true, message: 'User updated successfully', data: updated });
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
      return NextResponse.json({ success: false, message: 'User ID is required' }, { status: 400 });
    }

    await User.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
