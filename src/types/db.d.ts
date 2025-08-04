import { ObjectId } from "mongodb";
import { Platform, PostStatus, NotificationType } from "./meta";

// Database Model Types
export interface IUser {
  _id?: ObjectId;
  name: string;
  email: string;
  image?: string;
  metaId: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpires: Date;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IPage {
  _id?: ObjectId;
  metaPageId: string;
  userId: ObjectId;
  name: string;
  platform: Platform;
  accessToken: string;
  picture?: string;
  category?: string;
  connected: boolean;
  instagramBusinessAccount?: {
    id: string;
    name: string;
    username: string;
  };
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReview {
  _id?: ObjectId;
  pageId: ObjectId;
  metaReviewId: string;
  reviewerName: string;
  reviewerId: string;
  message?: string;
  rating: number;
  sentiment: "positive" | "neutral" | "negative";
  recommendationType: "positive" | "negative" | "no_recommendation";
  createdAt: Date;
  updatedAt: Date;
}

export interface IPost {
  _id?: ObjectId;
  pageId: ObjectId;
  metaPostId?: string;
  content: string;
  mediaUrls?: string[];
  type: "status" | "photo" | "video" | "link";
  status: PostStatus;
  scheduledAt?: Date;
  publishedAt?: Date;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    reach?: number;
    impressions?: number;
  };
  permalink?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotification {
  _id?: ObjectId;
  userId: ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  data?: any;
  createdAt: Date;
}

export interface IWebhookEvent {
  _id?: ObjectId;
  userId: ObjectId;
  pageId?: ObjectId;
  eventType: string;
  field: string;
  data: any;
  processed: boolean;
  createdAt: Date;
}
