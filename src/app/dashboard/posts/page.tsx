"use client";

import { useState } from "react";
import { PostEditor } from "@/components/dashboard/PostEditor";
import { PostList } from "@/components/dashboard/PostList";

export default function PostsPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePostCreated = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Posts</h1>
        <p className="text-gray-600 mt-1">
          Create, schedule, and manage your social media posts
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PostEditor onPostCreated={handlePostCreated} />
        <PostList key={refreshKey} />
      </div>
    </div>
  );
}
