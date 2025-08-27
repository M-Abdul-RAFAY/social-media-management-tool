import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import Notification from "@/models/Notification";
import {
  handleError,
  createSuccessResponse,
  createErrorResponse,
  AuthenticationError,
  NotFoundError,
} from "@/lib/error";

export async function GET(request: NextRequest) {
  try {
    // Development mode: return mock data
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json({
        success: true,
        data: {
          notifications: [
            {
              _id: "1",
              type: "success",
              title: "New Review",
              message: "You received a 5-star review from John Smith!",
              read: false,
              createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
              data: { pageId: "fb_page_123", reviewId: "review_1" },
            },
            {
              _id: "2",
              type: "info",
              title: "Post Performance",
              message: "Your recent Instagram post is performing well!",
              read: false,
              createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
              data: { pageId: "ig_page_456", postId: "ig_post_1" },
            },
            {
              _id: "3",
              type: "warning",
              title: "Engagement Drop",
              message: "Facebook engagement is down 15% this week",
              read: true,
              createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
              data: { pageId: "fb_page_123" },
            },
          ],
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalCount: 3,
            hasNext: false,
            hasPrev: false,
          },
          unreadCount: 2,
        },
      });
    }

    const session = await getServerSession();
    if (!session?.user?.email) {
      throw new AuthenticationError();
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const unreadOnly = searchParams.get("unread") === "true";

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      throw new AuthenticationError("User not found");
    }

    const filter: Record<string, unknown> = { userId: user._id };
    if (unreadOnly) {
      filter.read = false;
    }

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
    ]);

    const unreadCount = await Notification.countDocuments({
      userId: user._id,
      read: false,
    });

    return NextResponse.json(
      createSuccessResponse({
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        unreadCount,
      })
    );
  } catch (error) {
    const appError = handleError(error);
    return NextResponse.json(createErrorResponse(appError), {
      status: appError.statusCode,
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      throw new AuthenticationError();
    }

    const { notificationIds, markAsRead } = await request.json();

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      throw new AuthenticationError("User not found");
    }

    if (notificationIds && notificationIds.length > 0) {
      // Mark specific notifications
      await Notification.updateMany(
        {
          _id: { $in: notificationIds },
          userId: user._id,
        },
        { read: markAsRead }
      );
    } else {
      // Mark all notifications
      await Notification.updateMany({ userId: user._id }, { read: markAsRead });
    }

    return NextResponse.json(createSuccessResponse({ success: true }));
  } catch (error) {
    const appError = handleError(error);
    return NextResponse.json(createErrorResponse(appError), {
      status: appError.statusCode,
    });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      throw new AuthenticationError();
    }

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get("id");

    if (!notificationId) {
      throw new NotFoundError("Notification ID required");
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      throw new AuthenticationError("User not found");
    }

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId: user._id,
    });

    if (!notification) {
      throw new NotFoundError("Notification");
    }

    return NextResponse.json(createSuccessResponse({ success: true }));
  } catch (error) {
    const appError = handleError(error);
    return NextResponse.json(createErrorResponse(appError), {
      status: appError.statusCode,
    });
  }
}
