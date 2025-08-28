import { NextRequest } from "next/server";
import crypto from "crypto";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import Page from "@/models/Page";
import Review from "@/models/Review";
import Post from "@/models/Post";
import Notification from "@/models/Notification";
import { analyzeSentiment } from "@/lib/sentiment";
import { MetaWebhookPayload } from "@/types/meta";

interface WebhookChange {
  field: string;
  value: Record<string, unknown>;
}

interface PageDocument {
  _id: string;
  metaPageId: string;
  userId: string;
  name: string;
}

interface UserDocument {
  _id: string;
  name: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;

  console.log("Webhook verification request:", { mode, token, verifyToken });

  if (mode === "subscribe" && token === verifyToken) {
    console.log("WEBHOOK_VERIFIED");
    return new Response(challenge, { status: 200 });
  }

  console.log("Webhook verification failed");
  return new Response("Forbidden", { status: 403 });
}

export async function POST(request: NextRequest) {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 WEBHOOK POST REQUEST RECEIVED");
  console.log("=".repeat(60));
  console.log("⏰ Time:", new Date().toISOString());
  console.log("🌐 URL:", request.url);
  console.log("📋 Headers:", Object.fromEntries(request.headers.entries()));
  console.log("=".repeat(60));

  try {
    const signature = request.headers.get("x-hub-signature-256");
    const body = await request.text();

    console.log("📦 Raw body:", body);
    console.log("🔐 Signature:", signature || "No signature");

    // Check if this is a test request from Facebook Developer Tools
    if (!signature && body.includes('"field"')) {
      console.log("\n" + "🧪".repeat(20));
      console.log("🧪 FACEBOOK TEST REQUEST DETECTED 🧪");
      console.log("🧪".repeat(20));
      try {
        const testPayload = JSON.parse(body);
        console.log(
          "✅ Test payload received:",
          JSON.stringify(testPayload, null, 2)
        );
        console.log("🧪".repeat(20) + "\n");
        return new Response("Test received successfully", { status: 200 });
      } catch (parseError) {
        console.log("❌ Failed to parse test payload:", parseError);
        console.log("🧪".repeat(20) + "\n");
        return new Response("Invalid test payload", { status: 400 });
      }
    }

    // Verify webhook signature for production webhooks
    if (!signature) {
      console.log("No signature found - rejecting request");
      return new Response("No signature", { status: 401 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.META_WEBHOOK_SECRET!)
      .update(body)
      .digest("hex");

    const signatureHash = signature.replace("sha256=", "");

    if (signatureHash !== expectedSignature) {
      console.log("Invalid signature");
      return new Response("Invalid signature", { status: 403 });
    }

    const payload: MetaWebhookPayload = JSON.parse(body);
    console.log("Webhook received:", JSON.stringify(payload, null, 2));

    await dbConnect();

    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        await processWebhookChange(entry.id, change);
      }
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

async function processWebhookChange(pageId: string, change: WebhookChange) {
  const { field, value } = change;

  try {
    const page: PageDocument | null = await Page.findOne({
      metaPageId: pageId,
    });
    if (!page) {
      console.log(`Page not found: ${pageId}`);
      return;
    }

    const user: UserDocument | null = await User.findById(page.userId);
    if (!user) {
      console.log(`User not found for page: ${pageId}`);
      return;
    }

    switch (field) {
      case "ratings":
        await handleRatingChange(page, user, value);
        break;
      case "feed":
        await handleFeedChange(page, user, value);
        break;
      case "conversations":
        await handleConversationChange(page, user, value);
        break;
      default:
        console.log(`Unhandled webhook field: ${field}`);
    }
  } catch (error) {
    console.error(`Error processing webhook change for page ${pageId}:`, error);
  }
}

async function handleRatingChange(
  page: PageDocument,
  user: UserDocument,
  value: Record<string, unknown>
) {
  if (value.verb === "add") {
    const reviewData = value.rating as Record<string, unknown>;
    const sentimentResult = analyzeSentiment(
      (reviewData.review_text as string) || ""
    );

    await Review.findOneAndUpdate(
      { metaReviewId: reviewData.id as string },
      {
        pageId: page._id,
        reviewerName: reviewData.reviewer_name as string,
        reviewerId: reviewData.reviewer_id as string,
        message: reviewData.review_text as string,
        rating: reviewData.rating as number,
        sentiment: sentimentResult.sentiment,
        recommendationType: reviewData.recommendation_type as string,
      },
      { upsert: true, new: true }
    );

    // Create notification
    await Notification.create({
      userId: user._id,
      type: (reviewData.rating as number) >= 4 ? "success" : "warning",
      title: "New Review",
      message: `New ${reviewData.rating}-star review on ${page.name}`,
      data: { pageId: page._id, reviewId: reviewData.id },
    });
  }
}

async function handleFeedChange(
  page: PageDocument,
  user: UserDocument,
  value: Record<string, unknown>
) {
  if (value.verb === "add") {
    const postData = value.post as Record<string, unknown>;

    await Post.findOneAndUpdate(
      { metaPostId: postData.id as string },
      {
        pageId: page._id,
        content:
          (postData.message as string) || (postData.story as string) || "",
        type: postData.type as string,
        status: "published",
        publishedAt: new Date(postData.created_time as string),
        engagement: {
          likes: 0,
          comments: 0,
          shares: 0,
        },
        permalink: postData.permalink_url as string,
      },
      { upsert: true, new: true }
    );

    // Create notification
    await Notification.create({
      userId: user._id,
      type: "info",
      title: "New Post Published",
      message: `Post published on ${page.name}`,
      data: { pageId: page._id, postId: postData.id },
    });
  }
}

async function handleConversationChange(
  page: PageDocument,
  user: UserDocument,
  value: Record<string, unknown>
) {
  // Handle messages and comments
  if (value.verb === "add") {
    // Create notification for new messages/comments
    await Notification.create({
      userId: user._id,
      type: "info",
      title: "New Message",
      message: `New message on ${page.name}`,
      data: { pageId: page._id, conversationId: value.conversation_id },
    });
  }
}
