import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import Page from "@/models/Page";
import Review from "@/models/Review";
import { getPageReviews } from "@/lib/metaApi";
import { decryptToken } from "@/lib/token";
import { analyzeSentiment } from "@/lib/sentiment";
import {
  handleError,
  createSuccessResponse,
  createErrorResponse,
  AuthenticationError,
  NotFoundError,
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

    // Fetch reviews from Meta
    const metaReviews = await getPageReviews(page.metaPageId, accessToken);

    // Process and save reviews
    const reviews = [];
    for (const metaReview of metaReviews) {
      const sentimentResult = analyzeSentiment(metaReview.review_text || "");

      const review = await Review.findOneAndUpdate(
        { metaReviewId: metaReview.id },
        {
          pageId: page._id,
          reviewerName: metaReview.reviewer.name,
          reviewerId: metaReview.reviewer.id,
          message: metaReview.review_text,
          rating: metaReview.rating,
          sentiment: sentimentResult.sentiment,
          recommendationType: metaReview.recommendation_type,
        },
        { upsert: true, new: true }
      );
      reviews.push(review);
    }

    return NextResponse.json(createSuccessResponse(reviews));
  } catch (error) {
    const appError = handleError(error);
    return NextResponse.json(createErrorResponse(appError), {
      status: appError.statusCode,
    });
  }
}
