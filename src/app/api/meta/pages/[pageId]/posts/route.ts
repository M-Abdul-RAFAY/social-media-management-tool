import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import Page from "@/models/Page";
import Post from "@/models/Post";
import { getPagePosts, publishPost } from "@/lib/metaApi";
import { decryptToken } from "@/lib/token";
import {
  handleError,
  createSuccessResponse,
  createErrorResponse,
  AuthenticationError,
  NotFoundError,
  ValidationError,
} from "@/lib/error";

export async function GET(
  request: NextRequest,
  { params }: { params: { pageId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      throw new AuthenticationError();
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      throw new AuthenticationError("User not found");
    }

    const page = await Page.findOne({
      _id: params.pageId,
      userId: user._id,
    });

    if (!page) {
      throw new NotFoundError("Page");
    }

    const accessToken = decryptToken(page.accessToken);

    // Fetch posts from Meta
    const metaPosts = await getPagePosts(page.metaPageId, accessToken);

    // Process and save posts
    const posts = [];
    for (const metaPost of metaPosts) {
      const post = await Post.findOneAndUpdate(
        { metaPostId: metaPost.id },
        {
          pageId: page._id,
          content: metaPost.message || metaPost.story || "",
          type: metaPost.type,
          status: "published",
          publishedAt: new Date(metaPost.created_time),
          engagement: {
            likes: metaPost.likes?.summary?.total_count || 0,
            comments: metaPost.comments?.summary?.total_count || 0,
            shares: metaPost.shares?.count || 0,
          },
          permalink: metaPost.permalink_url,
        },
        { upsert: true, new: true }
      );
      posts.push(post);
    }

    return NextResponse.json(createSuccessResponse(posts));
  } catch (error) {
    const appError = handleError(error);
    return NextResponse.json(createErrorResponse(appError), {
      status: appError.statusCode,
    });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { pageId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      throw new AuthenticationError();
    }

    const body = await request.json();
    const { content, scheduledAt, mediaUrls } = body;

    if (!content) {
      throw new ValidationError("Content is required");
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      throw new AuthenticationError("User not found");
    }

    const page = await Page.findOne({
      _id: params.pageId,
      userId: user._id,
    });

    if (!page) {
      throw new NotFoundError("Page");
    }

    const accessToken = decryptToken(page.accessToken);

    // Create post in database first
    const post = new Post({
      pageId: page._id,
      content,
      mediaUrls,
      type: mediaUrls?.length > 0 ? "photo" : "status",
      status: scheduledAt ? "scheduled" : "draft",
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      engagement: {
        likes: 0,
        comments: 0,
        shares: 0,
      },
    });

    await post.save();

    // If not scheduled, publish immediately
    if (!scheduledAt) {
      const publishData = {
        message: content,
        ...(mediaUrls?.length > 0 && { picture: mediaUrls[0] }),
      };

      const publishResult = await publishPost(
        page.metaPageId,
        accessToken,
        publishData
      );

      post.metaPostId = publishResult.id;
      post.status = "published";
      post.publishedAt = new Date();
      await post.save();
    }

    return NextResponse.json(createSuccessResponse(post));
  } catch (error) {
    const appError = handleError(error);
    return NextResponse.json(createErrorResponse(appError), {
      status: appError.statusCode,
    });
  }
}
