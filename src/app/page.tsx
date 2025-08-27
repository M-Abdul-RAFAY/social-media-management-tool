"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pt-20 pb-16 text-center lg:pt-32">
          <h1 className="mx-auto max-w-4xl font-display text-5xl font-medium tracking-tight text-slate-900 sm:text-7xl">
            Social Media{" "}
            <span className="relative whitespace-nowrap text-indigo-600">
              <span className="relative">Dashboard</span>
            </span>{" "}
            for Meta Platforms
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg tracking-tight text-slate-700">
            Centralize your Facebook and Instagram management. Track engagement,
            analyze reviews, schedule posts, and get real-time insights all in
            one powerful dashboard.
          </p>
          <div className="mt-10 flex justify-center gap-x-6">
            <Link
              href="/auth/signin"
              className="group inline-flex items-center justify-center rounded-full py-2 px-4 text-sm font-semibold focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-800 focus-visible:outline-indigo-600"
            >
              Get Started
            </Link>
            <button className="group inline-flex ring-1 items-center justify-center rounded-full py-2 px-4 text-sm focus:outline-none ring-slate-200 text-slate-700 hover:text-slate-900 hover:ring-slate-300 active:bg-slate-100 active:text-slate-600 focus-visible:outline-indigo-600 focus-visible:ring-slate-300">
              Learn More
            </button>
          </div>
        </div>

        <div className="mt-20 lg:mt-44">
          <p className="font-display text-base text-slate-900">Features</p>
          <ul className="mt-8 grid grid-cols-1 gap-4 text-sm leading-6 text-slate-700 sm:grid-cols-2 lg:grid-cols-3">
            <li>📊 Unified analytics dashboard</li>
            <li>📝 Content management & scheduling</li>
            <li>⭐ Review sentiment analysis</li>
            <li>🔔 Real-time notifications</li>
            <li>📈 Engagement tracking</li>
            <li>🔗 Multi-page management</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
