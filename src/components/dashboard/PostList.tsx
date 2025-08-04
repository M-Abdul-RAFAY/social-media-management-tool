"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { IPost } from "@/types/db";

interface PostListProps {
  pageId?: string;
}

export function PostList({ pageId }: PostListProps) {
  const [posts, setPosts] = useState<IPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, [pageId]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      // For now, we'll fetch posts from all pages
      // In a real implementation, you'd have an endpoint that returns all user's posts
      const response = await fetch("/api/posts"); // This endpoint would need to be created

      if (!response.ok) {
        throw new Error("Failed to fetch posts");
      }

      const data = await response.json();

      if (data.success) {
        setPosts(data.data);
      } else {
        throw new Error(data.error || "Failed to fetch posts");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      published: "bg-green-100 text-green-800",
      scheduled: "bg-blue-100 text-blue-800",
      draft: "bg-gray-100 text-gray-800",
      failed: "bg-red-100 text-red-800",
    };

    return badges[status as keyof typeof badges] || badges.draft;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Posts</h3>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Posts</h3>
        <div className="text-center py-6">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchPosts}
            className="mt-2 text-sm text-indigo-600 hover:text-indigo-500"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Recent Posts</h3>
      </div>

      <div className="divide-y divide-gray-200">
        {posts.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No posts found
          </div>
        ) : (
          posts.slice(0, 10).map((post) => (
            <div key={post._id?.toString()} className="px-6 py-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 line-clamp-2">
                    {post.content}
                  </p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                    <span>
                      {formatDistanceToNow(new Date(post.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                    {post.engagement && (
                      <span>
                        {post.engagement.likes +
                          post.engagement.comments +
                          post.engagement.shares}{" "}
                        engagements
                      </span>
                    )}
                    {post.scheduledAt && (
                      <span>
                        Scheduled for{" "}
                        {new Date(post.scheduledAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0 ml-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                      post.status
                    )}`}
                  >
                    {post.status}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {posts.length > 10 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <button className="text-sm text-indigo-600 hover:text-indigo-500 font-medium">
            View all posts
          </button>
        </div>
      )}
    </div>
  );
}
