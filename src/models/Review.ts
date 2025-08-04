import mongoose, { Schema, Document, Model } from "mongoose";
import { IReview } from "@/types/db";

interface ReviewDocument extends Omit<IReview, "_id">, Document {}

const ReviewSchema = new Schema<ReviewDocument>(
  {
    pageId: { type: Schema.Types.ObjectId, ref: "Page", required: true },
    metaReviewId: { type: String, required: true, unique: true },
    reviewerName: { type: String, required: true },
    reviewerId: { type: String, required: true },
    message: String,
    rating: { type: Number, required: true, min: 1, max: 5 },
    sentiment: {
      type: String,
      enum: ["positive", "neutral", "negative"],
      default: "neutral",
    },
    recommendationType: {
      type: String,
      enum: ["positive", "negative", "no_recommendation"],
      default: "no_recommendation",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
ReviewSchema.index({ pageId: 1 });
ReviewSchema.index({ metaReviewId: 1 });
ReviewSchema.index({ sentiment: 1 });
ReviewSchema.index({ rating: 1 });
ReviewSchema.index({ createdAt: -1 });

const Review: Model<ReviewDocument> =
  mongoose.models.Review ||
  mongoose.model<ReviewDocument>("Review", ReviewSchema);

export default Review;
