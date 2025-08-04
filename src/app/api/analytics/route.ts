import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import Page from "@/models/Page";
import Post from "@/models/Post";
import Review from "@/models/Review";
import {
  handleError,
  createSuccessResponse,
  createErrorResponse,
  AuthenticationError,
} from "@/lib/error";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      throw new AuthenticationError();
    }

    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get("pageId");
    const period = searchParams.get("period") || "30"; // days

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      throw new AuthenticationError("User not found");
    }

    // Base filter for user's data
    const baseFilter = pageId
      ? { pageId }
      : { pageId: { $in: await getUserPageIds(user._id.toString()) } };

    // Date range filter
    const dateFilter = {
      createdAt: {
        $gte: new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000),
      },
    };

    // Get dashboard statistics
    const [
      totalPages,
      totalPosts,
      totalReviews,
      avgRating,
      totalEngagement,
      recentPosts,
      sentimentAnalysis,
      engagementOverTime,
      topPerformingPosts,
    ] = await Promise.all([
      getTotalPages(user._id.toString(), pageId),
      getTotalPosts(baseFilter, dateFilter),
      getTotalReviews(baseFilter, dateFilter),
      getAverageRating(baseFilter, dateFilter),
      getTotalEngagement(baseFilter, dateFilter),
      getRecentPosts(baseFilter, 5),
      getSentimentAnalysis(baseFilter, dateFilter),
      getEngagementOverTime(baseFilter, dateFilter, parseInt(period)),
      getTopPerformingPosts(baseFilter, dateFilter, 5),
    ]);

    const stats = {
      overview: {
        totalPages,
        totalPosts,
        totalReviews,
        avgRating: avgRating || 0,
        totalEngagement,
      },
      recentPosts,
      sentimentAnalysis,
      engagementOverTime,
      topPerformingPosts,
    };

    return NextResponse.json(createSuccessResponse(stats));
  } catch (error) {
    const appError = handleError(error);
    return NextResponse.json(createErrorResponse(appError), {
      status: appError.statusCode,
    });
  }
}

async function getUserPageIds(userId: string) {
  const pages = await Page.find({ userId }, "_id");
  return pages.map((page) => page._id);
}

async function getTotalPages(userId: string, pageId?: string | null) {
  if (pageId) return 1;
  return await Page.countDocuments({ userId });
}

async function getTotalPosts(
  baseFilter: Record<string, unknown>,
  dateFilter: Record<string, unknown>
) {
  return await Post.countDocuments({ ...baseFilter, ...dateFilter });
}

async function getTotalReviews(
  baseFilter: Record<string, unknown>,
  dateFilter: Record<string, unknown>
) {
  return await Review.countDocuments({ ...baseFilter, ...dateFilter });
}

async function getAverageRating(
  baseFilter: Record<string, unknown>,
  dateFilter: Record<string, unknown>
) {
  const result = await Review.aggregate([
    { $match: { ...baseFilter, ...dateFilter } },
    { $group: { _id: null, avgRating: { $avg: "$rating" } } },
  ]);
  return result[0]?.avgRating || 0;
}

async function getTotalEngagement(
  baseFilter: Record<string, unknown>,
  dateFilter: Record<string, unknown>
) {
  const result = await Post.aggregate([
    { $match: { ...baseFilter, ...dateFilter } },
    {
      $group: {
        _id: null,
        totalLikes: { $sum: "$engagement.likes" },
        totalComments: { $sum: "$engagement.comments" },
        totalShares: { $sum: "$engagement.shares" },
      },
    },
  ]);

  const totals = result[0];
  if (!totals) return 0;

  return totals.totalLikes + totals.totalComments + totals.totalShares;
}

async function getRecentPosts(
  baseFilter: Record<string, unknown>,
  limit: number
) {
  return await Post.find(baseFilter)
    .populate("pageId", "name platform")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

async function getSentimentAnalysis(
  baseFilter: Record<string, unknown>,
  dateFilter: Record<string, unknown>
) {
  const result = await Review.aggregate([
    { $match: { ...baseFilter, ...dateFilter } },
    {
      $group: {
        _id: "$sentiment",
        count: { $sum: 1 },
      },
    },
  ]);

  const analysis = { positive: 0, negative: 0, neutral: 0 };
  result.forEach((item) => {
    analysis[item._id as keyof typeof analysis] = item.count;
  });

  return analysis;
}

async function getEngagementOverTime(
  baseFilter: Record<string, unknown>,
  dateFilter: Record<string, unknown>,
  days: number
) {
  const result = await Post.aggregate([
    { $match: { ...baseFilter, ...dateFilter } },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        },
        totalEngagement: {
          $sum: {
            $add: [
              "$engagement.likes",
              "$engagement.comments",
              "$engagement.shares",
            ],
          },
        },
        date: { $first: "$createdAt" },
      },
    },
    { $sort: { date: 1 } },
  ]);

  // Fill in missing days with 0 engagement
  const engagementData = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    const existing = result.find(
      (item) =>
        item._id.year === date.getFullYear() &&
        item._id.month === date.getMonth() + 1 &&
        item._id.day === date.getDate()
    );

    engagementData.push({
      date: date.toISOString().split("T")[0],
      engagement: existing?.totalEngagement || 0,
    });
  }

  return engagementData;
}

async function getTopPerformingPosts(
  baseFilter: Record<string, unknown>,
  dateFilter: Record<string, unknown>,
  limit: number
) {
  return await Post.aggregate([
    { $match: { ...baseFilter, ...dateFilter } },
    {
      $addFields: {
        totalEngagement: {
          $add: [
            "$engagement.likes",
            "$engagement.comments",
            "$engagement.shares",
          ],
        },
      },
    },
    { $sort: { totalEngagement: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "pages",
        localField: "pageId",
        foreignField: "_id",
        as: "page",
      },
    },
    { $unwind: "$page" },
  ]);
}
