import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getAuditStats } from '@/lib/audit';

/**
 * GET /api/admin/stats
 * Get platform statistics (admin only)
 */
export async function GET() {
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

    // Get user statistics
    const [
      totalUsers,
      newUsersToday,
      newUsersThisWeek,
      usersByPlan,
      totalGenerations,
      generationsToday,
      creditStats,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }),
      User.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
      User.aggregate([
        { $group: { _id: '$plan', count: { $sum: 1 } } },
      ]),
      User.aggregate([
        { $group: { _id: null, total: { $sum: '$totalGenerations' } } },
      ]),
      User.aggregate([
        {
          $match: {
            lastGenerationDate: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          },
        },
        { $group: { _id: null, total: { $sum: '$generationsThisMonth' } } },
      ]),
      User.aggregate([
        {
          $group: {
            _id: null,
            totalCredits: { $sum: '$credits' },
            avgCredits: { $avg: '$credits' },
          },
        },
      ]),
    ]);

    // Get audit stats
    let auditStats = { total: 0, byCategory: {}, byStatus: {} };
    try {
      auditStats = await getAuditStats(7);
    } catch (e) {
      console.error('Failed to get audit stats:', e);
    }

    return NextResponse.json({
      users: {
        total: totalUsers,
        newToday: newUsersToday,
        newThisWeek: newUsersThisWeek,
        byPlan: Object.fromEntries(usersByPlan.map(p => [p._id, p.count])),
      },
      generations: {
        total: totalGenerations[0]?.total || 0,
        today: generationsToday[0]?.total || 0,
      },
      credits: {
        total: creditStats[0]?.totalCredits || 0,
        average: Math.round(creditStats[0]?.avgCredits || 0),
      },
      audit: auditStats,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
