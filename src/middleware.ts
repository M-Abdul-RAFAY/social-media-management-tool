import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Development bypass: allow direct access in development
    if (process.env.NODE_ENV === "development") {
      return NextResponse.next();
    }

    // Add custom middleware logic here
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Development bypass: allow all access in development
        if (process.env.NODE_ENV === "development") {
          return true;
        }

        // Protect dashboard routes
        if (req.nextUrl.pathname.startsWith("/dashboard")) {
          return !!token;
        }

        // Protect API routes
        if (req.nextUrl.pathname.startsWith("/api/meta")) {
          return !!token;
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/meta/:path*",
    "/api/analytics/:path*",
    "/api/notifications/:path*",
  ],
};
