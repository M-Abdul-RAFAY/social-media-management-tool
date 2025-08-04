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

  useEffect(() => {
    if (status === "unauthenticated") {
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
