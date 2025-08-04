"use client";

import { formatDistanceToNow } from "date-fns";

interface TopPostsTableProps {
  posts: Array<{
    _id: string;
    content: string;
    totalEngagement: number;
    engagement: {
      likes: number;
      comments: number;
      shares: number;
    };
    createdAt: string;
    page: {
      name: string;
      platform: string;
    };
  }>;
}

export function TopPostsTable({ posts }: TopPostsTableProps) {
  if (!posts || posts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Top Performing Posts
        </h3>
        <div className="text-center py-6 text-gray-500">No posts available</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          Top Performing Posts
        </h3>
      </div>

      <div className="overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Content
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Page
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Engagement
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {posts.slice(0, 5).map((post) => (
              <tr key={post._id}>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-xs">
                    <p className="line-clamp-2">
                      {post.content.length > 80
                        ? `${post.content.substring(0, 80)}...`
                        : post.content}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="text-sm font-medium text-gray-900">
                      {post.page.name}
                    </div>
                    <span
                      className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        post.page.platform === "facebook"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-pink-100 text-pink-800"
                      }`}
                    >
                      {post.page.platform === "facebook" ? "FB" : "IG"}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    <div className="font-medium">
                      {post.totalEngagement.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {post.engagement.likes}L · {post.engagement.comments}C ·{" "}
                      {post.engagement.shares}S
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDistanceToNow(new Date(post.createdAt), {
                    addSuffix: true,
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <button className="text-sm text-indigo-600 hover:text-indigo-500 font-medium">
          View all posts
        </button>
      </div>
    </div>
  );
}
