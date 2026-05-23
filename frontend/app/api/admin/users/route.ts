import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

/**
 * GET /api/admin/users
 * List all users (admin only)
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    // Verify admin role
    const adminUser = await User.findOne({ email: session.user.email });
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse query params
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const search = url.searchParams.get('search') || '';
    const plan = url.searchParams.get('plan') || '';
    const sort = url.searchParams.get('sort') || '-createdAt';

    // Build query
    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
      ];
    }
    if (plan) {
      query.plan = plan;
    }

    // Get total count
    const total = await User.countDocuments(query);

    // Get users
    const users = await User.find(query)
      .select('-password -twoFactorSecret -twoFactorBackupCodes -resetPasswordToken')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin users list error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/users
 * Update a user (admin only)
 */
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    // Verify admin role
    const adminUser = await User.findOne({ email: session.user.email });
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { userId, updates } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Allowed update fields
    const allowedFields = ['credits', 'plan', 'role', 'subscriptionStatus'];
    const sanitizedUpdates: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(updates || {})) {
      if (allowedFields.includes(key)) {
        sanitizedUpdates[key] = value;
      }
    }

    if (Object.keys(sanitizedUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { ...sanitizedUpdates, updatedAt: new Date() },
      { new: true }
    ).select('-password -twoFactorSecret');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log(`👑 Admin ${session.user.email} updated user ${user.email}:`, sanitizedUpdates);

    return NextResponse.json({
      message: 'User updated successfully',
      user,
    });
  } catch (error) {
    console.error('Admin user update error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/users
 * Delete a user (admin only)
 */
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const adminUser = await User.findOne({ email: session.user.email });
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId query parameter is required' }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.email === adminUser.email) {
      return NextResponse.json({ error: 'Cannot delete your own admin account' }, { status: 400 });
    }

    const deletedEmail = user.email;
    const deletedName = user.name;

    // Delete user's generations first
    const Generation = (await import('@/models/Generation')).default;
    const deletedGens = await Generation.deleteMany({ userId: user._id });

    // Delete the user
    await User.findByIdAndDelete(userId);

    console.log(`🗑️ Admin ${adminUser.email} deleted user ${deletedEmail} (${deletedName}) and ${deletedGens.deletedCount} generations`);

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedName || deletedEmail} and ${deletedGens.deletedCount} generations`,
    });
  } catch (error) {
    console.error('Admin user delete error:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
