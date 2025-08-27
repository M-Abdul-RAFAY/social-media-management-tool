"use client";

import { signIn, getSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SignIn() {
  const [loading, setLoading] = useState(false);
  const [creatingDummyData, setCreatingDummyData] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already signed in
    getSession().then((session) => {
      if (session) {
        router.push("/dashboard");
      }
    });
  }, [router]);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signIn("meta", {
        callbackUrl: "/dashboard",
        redirect: false,
      });

      if (result?.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error("Sign in error:", error);
    }
    setLoading(false);
  };

  const handleCreateDummyData = async () => {
    console.log("Development button clicked!");
    setCreatingDummyData(true);
    try {
      console.log("Redirecting to dashboard...");
      // Simply redirect to dashboard since middleware allows dev access
      router.push("/dashboard");
    } catch (error) {
      console.error("Error:", error);
    }
    setCreatingDummyData(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Social Media Dashboard
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Connect your Meta business accounts to get started
          </p>
        </div>

        {/* Permission Level Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Basic Access Mode
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>Currently using basic permissions for demo purposes:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>✅ Profile information access</li>
                  <li>
                    ❌ Facebook/Instagram pages (requires business verification)
                  </li>
                  <li>❌ Post management (requires app review)</li>
                  <li>❌ Analytics data (requires advanced permissions)</li>
                </ul>
                <p className="mt-2 text-xs">
                  For full functionality, complete{" "}
                  <a
                    href="https://developers.facebook.com/docs/development/release/business-verification"
                    target="_blank"
                    className="underline"
                  >
                    Meta Business Verification
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 space-y-6">
          <div>
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : null}
              Sign in with Meta Business
            </button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              By signing in, you agree to connect your Facebook and Instagram
              business pages
            </p>
          </div>

          {/* Development Mode - Bypass Button */}
          <div className="mt-8 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                DEVELOPMENT MODE
              </span>
            </div>
            <p className="text-sm text-red-700 mb-3 text-center">
              Skip OAuth and create dummy data for testing
            </p>
            <button
              onClick={handleCreateDummyData}
              disabled={creatingDummyData}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 font-medium text-sm"
            >
              {creatingDummyData
                ? "Creating Dummy Data..."
                : "🚀 Enter Dashboard (Dev Mode)"}
            </button>
            <p className="text-xs text-red-600 mt-2 text-center">
              Creates sample pages, posts, reviews & analytics
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
