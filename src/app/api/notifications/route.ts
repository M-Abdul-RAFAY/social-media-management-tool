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
