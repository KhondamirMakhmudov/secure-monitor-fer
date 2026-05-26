import { NextResponse } from "next/server";

export function middleware(req) {
  // Single cookie name used for both dev and production (HTTP server)
  const cookieName = "next-auth.session-token.project4";
  const token = req.cookies.get(cookieName)?.value;

  const { pathname } = req.nextUrl;

  console.log("TOKEN:", !!token);
  console.log("Requested Path:", pathname);

  // Protected routes that require authentication
  const protectedRoutes = [
    "/late-comers",
    "/secure-section",
    "/secure-main",
    "/reports",
  ];

  const isProtectedPath = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  // If no token and trying to access protected route → redirect to login
  if (!token && isProtectedPath) {
    console.log("Unauthorized - Redirecting to login page");
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Allow all other access - don't force authenticated users away from home page
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/late-comers/:path*",
    "/secure-section/:path*",
    "/secure-main/:path*",
    "/reports/:path*",
    "/",
  ],
};
