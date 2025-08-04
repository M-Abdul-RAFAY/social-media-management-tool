"use client";

import { formatDistanceToNow } from "date-fns";
import { IPost } from "@/types/db";

interface RecentActivityProps {
  posts: IPost[];
}

export function RecentActivity({ posts }: RecentActivityProps) {
  if (!posts || posts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Recent Activity
        </h3>
        <div className="text-center py-6 text-gray-500">
          No recent posts available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Recent Activity
      </h3>

      <div className="space-y-4">
        {posts.slice(0, 5).map((post) => (
          <div
            key={post._id?.toString()}
            className="flex items-start space-x-3"
          >
            <div className="flex-shrink-0">
              <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2"></div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-900">
                <span className="font-medium">
                  {post.status === "published" ? "Published" : "Created"} post
                </span>
                <span className="text-gray-500 ml-1">
                  on {(post as any).page?.name || "Unknown Page"}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {post.content.length > 100
                  ? `${post.content.substring(0, 100)}...`
                  : post.content}
              </p>
              <div className="flex items-center mt-2 text-xs text-gray-500">
                <span>
                  {formatDistanceToNow(new Date(post.createdAt), {
                    addSuffix: true,
                  })}
                </span>
                {post.engagement && (
                  <span className="ml-4">
                    {post.engagement.likes +
                      post.engagement.comments +
                      post.engagement.shares}{" "}
                    engagements
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <button className="text-sm text-indigo-600 hover:text-indigo-500 font-medium">
          View all activity
        </button>
      </div>
    </div>
  );
}
