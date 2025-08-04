import {
  MetaUser,
  MetaPage,
  MetaPost,
  MetaReview,
  MetaInsight,
} from "@/types/meta";

const META_GRAPH_API_VERSION = process.env.META_GRAPH_API_VERSION || "v18.0";
const BASE_URL = `https://graph.facebook.com/${META_GRAPH_API_VERSION}`;

export class MetaApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = "MetaApiError";
  }
}

async function makeMetaRequest<T>(
  endpoint: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new MetaApiError(
      data.error?.message || "Meta API request failed",
      response.status,
      data.error?.code
    );
  }

  return data;
}

export async function getMetaUser(accessToken: string): Promise<MetaUser> {
  return makeMetaRequest<MetaUser>(
    "/me?fields=id,name,email,picture",
    accessToken
  );
}

export async function getUserPages(accessToken: string): Promise<MetaPage[]> {
  const response = await makeMetaRequest<{ data: MetaPage[] }>(
    "/me/accounts?fields=id,name,access_token,category,category_list,picture,instagram_business_account{id,name,username}",
    accessToken
  );
  return response.data;
}

export async function getPagePosts(
  pageId: string,
  accessToken: string,
  limit: number = 25
): Promise<MetaPost[]> {
  const response = await makeMetaRequest<{ data: MetaPost[] }>(
    `/${pageId}/posts?fields=id,message,story,created_time,type,likes.summary(true),comments.summary(true),shares,permalink_url,picture,full_picture&limit=${limit}`,
    accessToken
  );
  return response.data;
}

export async function getPageReviews(
  pageId: string,
  accessToken: string,
  limit: number = 25
): Promise<MetaReview[]> {
  const response = await makeMetaRequest<{ data: MetaReview[] }>(
    `/${pageId}/ratings?fields=reviewer{name,id},rating,recommendation_type,review_text,created_time,open_graph_story&limit=${limit}`,
    accessToken
  );
  return response.data;
}

export async function getPageInsights(
  pageId: string,
  accessToken: string,
  metrics: string[] = [
    "page_fans",
    "page_post_engagements",
    "page_impressions",
  ],
  period: "day" | "week" | "days_28" = "day"
): Promise<MetaInsight[]> {
  const metricsParam = metrics.join(",");
  const response = await makeMetaRequest<{ data: MetaInsight[] }>(
    `/${pageId}/insights?metric=${metricsParam}&period=${period}`,
    accessToken
  );
  return response.data;
}

export async function publishPost(
  pageId: string,
  accessToken: string,
  content: {
    message: string;
    link?: string;
    picture?: string;
    scheduled_publish_time?: number;
  }
): Promise<{ id: string }> {
  return makeMetaRequest<{ id: string }>(`/${pageId}/feed`, accessToken, {
    method: "POST",
    body: JSON.stringify(content),
  });
}

export async function deletePost(
  postId: string,
  accessToken: string
): Promise<{ success: boolean }> {
  return makeMetaRequest<{ success: boolean }>(`/${postId}`, accessToken, {
    method: "DELETE",
  });
}

export async function refreshLongLivedToken(
  accessToken: string,
  appId: string,
  appSecret: string
): Promise<{ access_token: string; expires_in: number }> {
  const url = `${BASE_URL}/oauth/access_token`;

  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: accessToken,
  });

  const tokenResponse = await fetch(`${url}?${params}`);
  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok) {
    throw new MetaApiError(
      tokenData.error?.message || "Token refresh failed",
      tokenResponse.status,
      tokenData.error?.code
    );
  }

  return tokenData;
}

export async function verifyWebhook(
  mode: string,
  token: string,
  challenge: string
): Promise<string | null> {
  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    return challenge;
  }

  return null;
}
