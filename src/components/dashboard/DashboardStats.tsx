"use client";

import {
  UserGroupIcon,
  DocumentTextIcon,
  StarIcon,
  HeartIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

interface DashboardStatsProps {
  stats: {
    totalPages: number;
    totalPosts: number;
    totalReviews: number;
    avgRating: number;
    totalEngagement: number;
  };
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const statItems = [
    {
      name: "Connected Pages",
      value: stats.totalPages.toLocaleString(),
      icon: UserGroupIcon,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      name: "Total Posts",
      value: stats.totalPosts.toLocaleString(),
      icon: DocumentTextIcon,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      name: "Reviews",
      value: stats.totalReviews.toLocaleString(),
      icon: StarIcon,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      name: "Avg Rating",
      value: stats.avgRating.toFixed(1),
      icon: HeartIcon,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      name: "Total Engagement",
      value: stats.totalEngagement.toLocaleString(),
      icon: ChartBarIcon,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {statItems.map((item) => (
        <div
          key={item.name}
          className="bg-white rounded-lg shadow p-6 border border-gray-200"
        >
          <div className="flex items-center">
            <div className={`flex-shrink-0 p-3 rounded-md ${item.bgColor}`}>
              <item.icon
                className={`h-6 w-6 ${item.color}`}
                aria-hidden="true"
              />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">{item.name}</h3>
              <p className="text-2xl font-semibold text-gray-900">
                {item.value}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
