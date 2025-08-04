// Meta Graph API Response Types
export interface MetaUser {
  id: string;
  name: string;
  email: string;
  picture?: {
    data: {
      url: string;
    };
  };
}

export interface MetaPage {
  id: string;
  name: string;
  access_token: string;
  category: string;
  category_list: Array<{
    id: string;
    name: string;
  }>;
  picture?: {
    data: {
      url: string;
    };
  };
  instagram_business_account?: {
    id: string;
    name: string;
    username: string;
  };
}

export interface MetaPost {
  id: string;
  message?: string;
  story?: string;
  created_time: string;
  type: "status" | "photo" | "video" | "link";
  likes?: {
    summary: {
      total_count: number;
    };
  };
  comments?: {
    summary: {
      total_count: number;
    };
  };
  shares?: {
    count: number;
  };
  permalink_url?: string;
  picture?: string;
  full_picture?: string;
}

export interface MetaReview {
  id: string;
  reviewer: {
    name: string;
    id: string;
  };
  rating: number;
  recommendation_type: "positive" | "negative" | "no_recommendation";
  review_text?: string;
  created_time: string;
  open_graph_story?: {
    id: string;
  };
}

export interface MetaInsight {
  name: string;
  period: string;
  values: Array<{
    value: number;
    end_time: string;
  }>;
  title: string;
  description: string;
}

export interface MetaWebhookEntry {
  id: string;
  time: number;
  changes: Array<{
    field: string;
    value: any;
  }>;
}

export interface MetaWebhookPayload {
  object: string;
  entry: MetaWebhookEntry[];
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Frontend Types
export interface DashboardStats {
  totalPages: number;
  totalPosts: number;
  totalReviews: number;
  avgRating: number;
  totalEngagement: number;
}

export interface EngagementMetrics {
  likes: number;
  comments: number;
  shares: number;
  reach?: number;
  impressions?: number;
}

export interface SentimentAnalysis {
  positive: number;
  negative: number;
  neutral: number;
}

export type Platform = "facebook" | "instagram";
export type PostStatus = "draft" | "scheduled" | "published" | "failed";
export type NotificationType = "info" | "success" | "warning" | "error";
