"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { EngagementChart } from "@/components/charts/EngagementChart";
import { SentimentChart } from "@/components/charts/SentimentChart";
import { TopPostsTable } from "@/components/dashboard/TopPostsTable";
import { PageSwitcher } from "@/components/dashboard/PageSwitcher";
import { IPage } from "@/types/db";

interface DashboardData {
  overview: {
    totalPages: number;
    totalPosts: number;
    totalReviews: number;
    avgRating: number;
    totalEngagement: number;
  };
  recentPosts: any[];
  sentimentAnalysis: {
    positive: number;
    negative: number;
    neutral: number;
  };
  engagementOverTime: Array<{
    date: string;
    engagement: number;
  }>;
  topPerformingPosts: any[];
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedPage, setSelectedPage] = useState<IPage | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAdvancedPermissions, setHasAdvancedPermissions] = useState(false);

  useEffect(() => {
    console.log(
      "Dashboard useEffect - status:",
      status,
      "NODE_ENV:",
      process.env.NODE_ENV
    );

    // Skip authentication check in development mode
    if (process.env.NODE_ENV === "development") {
      console.log("Development mode - skipping auth check");
      return;
    }

    if (status === "unauthenticated") {
      console.log("Unauthenticated - redirecting to signin");
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (selectedPage !== null) {
      fetchDashboardData();
    } else {
      fetchDashboardData();
    }
  }, [selectedPage]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (selectedPage) {
        params.append("pageId", selectedPage._id!.toString());
      }
      params.append("period", "30"); // Last 30 days

      const response = await fetch(`/api/analytics?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const data = await response.json();

      if (data.success) {
        setDashboardData(data.data);
      } else {
        throw new Error(data.error || "Failed to fetch dashboard data");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900">
            Error Loading Dashboard
          </h2>
          <p className="text-gray-600 mt-2">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {session.user?.name}
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <PageSwitcher onPageChange={setSelectedPage} />
        </div>
      </div>

      {/* Permissions Status Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-amber-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-amber-800">
              Basic Access Mode - Limited Functionality
            </h3>
            <div className="mt-2 text-sm text-amber-700">
              <p className="mb-2">
                You&apos;re currently using basic permissions. To unlock full
                social media management features:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-medium mb-1">✅ Currently Available:</p>
                  <ul className="list-disc list-inside text-xs space-y-1">
                    <li>Profile information</li>
                    <li>Basic authentication</li>
                    <li>Demo dashboard</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium mb-1">
                    🔒 Requires Business Verification:
                  </p>
                  <ul className="list-disc list-inside text-xs space-y-1">
                    <li>Facebook/Instagram pages access</li>
                    <li>Post creation & management</li>
                    <li>Analytics & insights</li>
                    <li>Review management</li>
                  </ul>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href="https://developers.facebook.com/docs/development/release/business-verification"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1 border border-amber-300 text-xs font-medium rounded-md text-amber-800 bg-amber-50 hover:bg-amber-100"
                >
                  Business Verification Guide
                  <svg
                    className="ml-1 w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
                <a
                  href="https://developers.facebook.com/docs/app-review"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1 border border-amber-300 text-xs font-medium rounded-md text-amber-800 bg-amber-50 hover:bg-amber-100"
                >
                  App Review Process
                  <svg
                    className="ml-1 w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {dashboardData && (
        <>
          {/* Overview Stats */}
          <DashboardStats stats={dashboardData.overview} />

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EngagementChart data={dashboardData.engagementOverTime} />
            <SentimentChart data={dashboardData.sentimentAnalysis} />
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentActivity posts={dashboardData.recentPosts} />
            <TopPostsTable posts={dashboardData.topPerformingPosts} />
          </div>
        </>
      )}
    </div>
  );
}
