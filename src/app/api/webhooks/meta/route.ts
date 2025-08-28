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

    // Check if this is a test request from Facebook Developer Tools (simple field test)
    if (
      !signature &&
      body.includes('"field"') &&
      body.includes('"value"') &&
      !body.includes('"entry"')
    ) {
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

    // Verify webhook signature for production webhooks (skip for local testing)
    if (!signature) {
      // For local testing, allow requests without signature if they contain "entry"
      if (body.includes('"entry"') && body.includes('"changes"')) {
        console.log(
          "⚠️  Processing test webhook without signature verification"
        );
        const payload: MetaWebhookPayload = JSON.parse(body);
        console.log("Webhook received:", JSON.stringify(payload, null, 2));

        await dbConnect();

        for (const entry of payload.entry) {
          for (const change of entry.changes) {
            await processWebhookChange(entry.id, change);
          }
        }

        return new Response("OK", { status: 200 });
      }

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
    // For testing purposes, handle messages even without a page in DB
    if (field === "messages") {
      console.log("\n🔥🔥🔥 MESSAGE WEBHOOK RECEIVED 🔥🔥🔥");
      console.log("Page ID:", pageId);
      console.log("Message data:", JSON.stringify(value, null, 2));

      await handleMessageChangeTest(pageId, value);
      return;
    }

    // For other webhook types, check if page exists in database
    const page: PageDocument | null = await Page.findOne({
      metaPageId: pageId,
    });
    if (!page) {
      console.log(`Page not found in database: ${pageId}`);
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
      case "messages":
        await handleMessageChange(page, user, value);
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

async function handleMessageChangeTest(
  pageId: string,
  value: Record<string, unknown>
) {
  console.log("\n🔥🔥🔥 MESSAGE WEBHOOK TEST HANDLER 🔥🔥🔥");
  console.log("Page ID:", pageId);
  console.log("Message data:", JSON.stringify(value, null, 2));

  // Handle incoming messages
  if (value.messaging) {
    const messagingEvents = value.messaging as Array<Record<string, unknown>>;

    for (const event of messagingEvents) {
      console.log(
        "📨 Processing message event:",
        JSON.stringify(event, null, 2)
      );

      // Handle regular messages
      if (event.message) {
        const message = event.message as Record<string, unknown>;
        const sender = event.sender as Record<string, unknown>;
        const recipient = event.recipient as Record<string, unknown>;

        console.log("✉️ New message received:");
        console.log("  From:", sender.id);
        console.log("  To:", recipient.id);
        console.log("  Text:", message.text);
        console.log("  Message ID:", message.mid);
        console.log("  Timestamp:", new Date(event.timestamp as number));
      }

      // Handle message delivery confirmations
      if (event.delivery) {
        const delivery = event.delivery as Record<string, unknown>;
        console.log("✅ Message delivered:", JSON.stringify(delivery, null, 2));
      }

      // Handle message read confirmations
      if (event.read) {
        const read = event.read as Record<string, unknown>;
        console.log("👀 Message read:", JSON.stringify(read, null, 2));
      }

      // Handle postbacks (from buttons, quick replies, etc.)
      if (event.postback) {
        const postback = event.postback as Record<string, unknown>;
        console.log("🔘 Postback received:", JSON.stringify(postback, null, 2));
      }
    }
  }

  console.log("🔥".repeat(20) + "\n");
}

async function handleMessageChange(
  page: PageDocument,
  user: UserDocument,
  value: Record<string, unknown>
) {
  console.log("\n🔥🔥🔥 MESSAGE WEBHOOK RECEIVED 🔥🔥🔥");
  console.log("Page:", page.name);
  console.log("Message data:", JSON.stringify(value, null, 2));

  // Handle incoming messages
  if (value.messaging) {
    const messagingEvents = value.messaging as Array<Record<string, unknown>>;

    for (const event of messagingEvents) {
      console.log("📨 Processing message event:", event);

      // Handle regular messages
      if (event.message) {
        const message = event.message as Record<string, unknown>;
        const sender = event.sender as Record<string, unknown>;
        const recipient = event.recipient as Record<string, unknown>;

        console.log("✉️ New message received:");
        console.log("  From:", sender.id);
        console.log("  To:", recipient.id);
        console.log("  Text:", message.text);
        console.log("  Timestamp:", new Date(event.timestamp as number));

        // Create notification
        await Notification.create({
          userId: user._id,
          type: "info",
          title: "New Message Received",
          message: `New message: "${message.text}" from ${sender.id}`,
          data: {
            pageId: page._id,
            senderId: sender.id,
            messageId: message.mid,
            text: message.text,
          },
        });

        // Here you can add auto-reply logic if needed
        // await sendReply(sender.id as string, "Thank you for your message!");
      }

      // Handle message delivery confirmations
      if (event.delivery) {
        const delivery = event.delivery as Record<string, unknown>;
        console.log("✅ Message delivered:", delivery);
      }

      // Handle message read confirmations
      if (event.read) {
        const read = event.read as Record<string, unknown>;
        console.log("👀 Message read:", read);
      }

      // Handle postbacks (from buttons, quick replies, etc.)
      if (event.postback) {
        const postback = event.postback as Record<string, unknown>;
        console.log("🔘 Postback received:", postback);
      }
    }
  }
}

// Helper function to send replies (optional)
async function sendReply(recipientId: string, messageText: string) {
  const pageAccessToken = process.env.META_PAGE_ACCESS_TOKEN;

  if (!pageAccessToken) {
    console.error("No page access token found");
    return;
  }

  const messageData = {
    recipient: { id: recipientId },
    message: { text: messageText },
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/v${
        process.env.META_GRAPH_API_VERSION || "v18.0"
      }/me/messages?access_token=${pageAccessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messageData),
      }
    );

    const result = await response.json();
    console.log("Reply sent:", result);
  } catch (error) {
    console.error("Error sending reply:", error);
  }
}
