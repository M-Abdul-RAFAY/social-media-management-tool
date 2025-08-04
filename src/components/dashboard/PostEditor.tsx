"use client";

import { useState } from "react";
import { usePages } from "@/hooks/usePages";
import { useNotificationContext } from "@/components/providers/NotificationProvider";

interface PostEditorProps {
  onPostCreated?: () => void;
}

export function PostEditor({ onPostCreated }: PostEditorProps) {
  const { pages } = usePages();
  const { showNotification } = useNotificationContext();
  const [selectedPage, setSelectedPage] = useState<string>("");
  const [content, setContent] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  const handleSubmit = async (
    e: React.FormEvent,
    action: "draft" | "publish" | "schedule"
  ) => {
    e.preventDefault();

    if (!selectedPage) {
      showNotification("Please select a page", "error");
      return;
    }

    if (!content.trim()) {
      showNotification("Please enter post content", "error");
      return;
    }

    if (action === "schedule" && !scheduledAt) {
      showNotification("Please select a schedule time", "error");
      return;
    }

    setIsPublishing(true);

    try {
      const response = await fetch(`/api/meta/pages/${selectedPage}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          scheduledAt: action === "schedule" ? scheduledAt : undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        showNotification(
          action === "publish"
            ? "Post published successfully!"
            : action === "schedule"
            ? "Post scheduled successfully!"
            : "Post saved as draft!",
          "success"
        );

        // Reset form
        setContent("");
        setScheduledAt("");
        onPostCreated?.();
      } else {
        throw new Error(data.error || "Failed to create post");
      }
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : "Failed to create post",
        "error"
      );
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Create New Post
      </h3>

      <form className="space-y-4">
        {/* Page Selection */}
        <div>
          <label
            htmlFor="page"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Select Page
          </label>
          <select
            id="page"
            value={selectedPage}
            onChange={(e) => setSelectedPage(e.target.value)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          >
            <option value="">Choose a page...</option>
            {pages.map((page) => (
              <option key={page._id?.toString()} value={page._id?.toString()}>
                {page.name} ({page.platform})
              </option>
            ))}
          </select>
        </div>

        {/* Content */}
        <div>
          <label
            htmlFor="content"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Post Content
          </label>
          <textarea
            id="content"
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="What's happening?"
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            {content.length}/2200 characters
          </p>
        </div>

        {/* Schedule Time */}
        <div>
          <label
            htmlFor="scheduledAt"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Schedule Time (Optional)
          </label>
          <input
            type="datetime-local"
            id="scheduledAt"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={(e) => handleSubmit(e, "draft")}
            disabled={isPublishing}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            Save Draft
          </button>

          {scheduledAt ? (
            <button
              type="button"
              onClick={(e) => handleSubmit(e, "schedule")}
              disabled={isPublishing}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isPublishing ? "Scheduling..." : "Schedule Post"}
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => handleSubmit(e, "publish")}
              disabled={isPublishing}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
            >
              {isPublishing ? "Publishing..." : "Publish Now"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
