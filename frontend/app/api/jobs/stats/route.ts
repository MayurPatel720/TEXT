import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Job from "@/models/Job";

export const dynamic = 'force-dynamic';

/**
 * GET /api/jobs/stats
 * Get queue statistics for dashboard/monitoring
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Aggregate job stats
    const stats = await Job.aggregate([
      {
        $facet: {
          byStatus: [
            { $group: { _id: "$status", count: { $sum: 1 } } }
          ],
          recent: [
            { $match: { status: "completed" } },
            { $sort: { "execution.completedAt": -1 } },
            { $limit: 5 },
            { $project: { 
              _id: 1, 
              status: 1, 
              executionTime: "$execution.executionTime",
              completedAt: "$execution.completedAt"
            }}
          ],
          avgExecutionTime: [
            { $match: { status: "completed", "execution.executionTime": { $exists: true } } },
            { $group: { _id: null, avg: { $avg: "$execution.executionTime" } } }
          ],
          todayCount: [
            { 
              $match: { 
                createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)) } 
              } 
            },
            { $count: "count" }
          ]
        }
      }
    ]);

    const result = stats[0];
    
    // Format stats
    const statusCounts: Record<string, number> = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    };
    
    result.byStatus.forEach((s: { _id: string; count: number }) => {
      statusCounts[s._id] = s.count;
    });

    return NextResponse.json({
      success: true,
      stats: {
        pending: statusCounts.pending,
        processing: statusCounts.processing,
        completed: statusCounts.completed,
        failed: statusCounts.failed,
        total: Object.values(statusCounts).reduce((a, b) => a + b, 0),
        avgExecutionTime: result.avgExecutionTime[0]?.avg || 0,
        todayCount: result.todayCount[0]?.count || 0,
      },
      recentJobs: result.recent,
    });

  } catch (error) {
    console.error("Error fetching job stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
