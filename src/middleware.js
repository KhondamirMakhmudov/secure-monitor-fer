import { NextResponse } from "next/server";

export function middleware(req) {
  // Try to get token from both possible cookie names
  const productionCookieName = "__Secure-next-auth.session-token.project3";
  const developmentCookieName = "next-auth.session-token.project3";
  
  const token = 
    req.cookies.get(productionCookieName)?.value ||
    req.cookies.get(developmentCookieName)?.value;
  
  const { pathname } = req.nextUrl;

  console.log("TOKEN:", token);
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

  // If user has token and tries to access login page → redirect to secure-section
  if (token && pathname === "/") {
    console.log("Already authenticated - Redirecting to secure-section");
    return NextResponse.redirect(new URL("/secure-section", req.url));
  }

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
