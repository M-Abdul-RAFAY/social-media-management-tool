import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import Page from "@/models/Page";
import { getUserPages } from "@/lib/metaApi";
import { decryptToken, refreshTokenIfNeeded, encryptToken } from "@/lib/token";
import {
  handleError,
  createSuccessResponse,
  createErrorResponse,
  AuthenticationError,
} from "@/lib/error";

export async function GET() {
  try {
    // Development mode: return mock data
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json({
        success: true,
        data: [
          {
            _id: "fb_page_123",
            metaPageId: "fb_page_123",
            name: "My Awesome Business",
            category: "Business",
            platform: "facebook",
            isActive: true,
            followers: 1250,
            profilePicture: "https://via.placeholder.com/300",
            about: "A sample business page for testing the dashboard",
            website: "https://myawesomebusiness.com",
            stats: {
              posts: 15,
              engagement: 342,
              reviews: 12,
              avgRating: 4.5,
            },
          },
          {
            _id: "ig_page_456",
            metaPageId: "ig_page_456",
            name: "My Awesome Business",
            category: "Business",
            platform: "instagram",
            isActive: true,
            followers: 892,
            profilePicture: "https://via.placeholder.com/300",
            about: "Official Instagram account",
            website: "https://myawesomebusiness.com",
            stats: {
              posts: 28,
              engagement: 587,
              reviews: 8,
              avgRating: 4.2,
            },
          },
        ],
      });
    }

    const session = await getServerSession();
    if (!session?.user?.email) {
      throw new AuthenticationError();
    }

    await dbConnect();

    // Get user with decrypted token
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      throw new AuthenticationError("User not found");
    }

    let accessToken = decryptToken(user.accessToken);

    // Check if token needs refresh
    const refreshResult = await refreshTokenIfNeeded(
      accessToken,
      user.tokenExpires,
      process.env.META_CLIENT_ID!,
      process.env.META_CLIENT_SECRET!
    );

    if (refreshResult) {
      accessToken = refreshResult.token;
      user.accessToken = encryptToken(accessToken);
      user.tokenExpires = refreshResult.expiresAt;
      await user.save();
    }

    // Fetch pages from Meta
    const metaPages = await getUserPages(accessToken);

    // Update or create pages in database
    const pages = [];
    for (const metaPage of metaPages) {
      const page = await Page.findOneAndUpdate(
        { metaPageId: metaPage.id },
        {
          userId: user._id,
          name: metaPage.name,
          platform: metaPage.instagram_business_account
            ? "instagram"
            : "facebook",
          accessToken: encryptToken(metaPage.access_token),
          picture: metaPage.picture?.data?.url,
          category: metaPage.category,
          connected: true,
          instagramBusinessAccount: metaPage.instagram_business_account,
          lastSyncAt: new Date(),
        },
        { upsert: true, new: true }
      );
      pages.push(page);
    }

    return NextResponse.json(createSuccessResponse(pages));
  } catch (error) {
    const appError = handleError(error);
    return NextResponse.json(createErrorResponse(appError), {
      status: appError.statusCode,
    });
  }
}
