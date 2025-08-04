import mongoose, { Schema, Document, Model } from "mongoose";
import { IPage } from "@/types/db";

interface PageDocument extends Omit<IPage, "_id">, Document {}

const PageSchema = new Schema<PageDocument>(
  {
    metaPageId: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    platform: { type: String, enum: ["facebook", "instagram"], required: true },
    accessToken: { type: String, required: true },
    picture: String,
    category: String,
    connected: { type: Boolean, default: true },
    instagramBusinessAccount: {
      id: String,
      name: String,
      username: String,
    },
    lastSyncAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
PageSchema.index({ userId: 1 });
PageSchema.index({ metaPageId: 1 });
PageSchema.index({ platform: 1 });

const Page: Model<PageDocument> =
  mongoose.models.Page || mongoose.model<PageDocument>("Page", PageSchema);

export default Page;
