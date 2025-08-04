import mongoose, { Schema, Document, Model } from "mongoose";
import { IPost } from "@/types/db";

interface PostDocument extends Omit<IPost, "_id">, Document {}

const PostSchema = new Schema<PostDocument>(
  {
    pageId: { type: Schema.Types.ObjectId, ref: "Page", required: true },
    metaPostId: String,
    content: { type: String, required: true },
    mediaUrls: [String],
    type: {
      type: String,
      enum: ["status", "photo", "video", "link"],
      default: "status",
    },
    status: {
      type: String,
      enum: ["draft", "scheduled", "published", "failed"],
      default: "draft",
    },
    scheduledAt: Date,
    publishedAt: Date,
    engagement: {
      likes: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      reach: Number,
      impressions: Number,
    },
    permalink: String,
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
PostSchema.index({ pageId: 1 });
PostSchema.index({ metaPostId: 1 });
PostSchema.index({ status: 1 });
PostSchema.index({ scheduledAt: 1 });
PostSchema.index({ publishedAt: -1 });

const Post: Model<PostDocument> =
  mongoose.models.Post || mongoose.model<PostDocument>("Post", PostSchema);

export default Post;
