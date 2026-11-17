import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "van-christaan-local-secret-key-change-me"
);

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/service-catalog/public",
  "/robots.txt",
  "/sitemap.xml",
];

/** Sign-in pages a signed-in user has no reason to see. */
const SIGNED_OUT_ONLY = ["/login", "/register"];

/** Where each role lands after signing in. Keep in step with the login page. */
const homeFor = (role: string) => (role === "customer" ? "/portal" : "/dashboard");

/** The session's role, or null when there is no valid (unexpired, correctly signed) session. */
async function sessionRole(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get("vc_session")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (SIGNED_OUT_ONLY.some((p) => pathname === p || pathname === `${p}/`)) {
    const role = await sessionRole(request);
    return role
      ? NextResponse.redirect(new URL(homeFor(role), request.url))
      : NextResponse.next();
  }

  if (
    pathname === "/" ||
    PUBLIC_PATHS.slice(1).some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  const role = await sessionRole(request);
  if (!role) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Block customers from admin routes
  if (role === "customer") {
    const adminPaths = ["/dashboard", "/inventory", "/parts", "/sales", "/expenses", "/services", "/service-catalog", "/customers"];
    if (adminPaths.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL(homeFor(role), request.url));
    }
  }

  // Block admin/user from customer portal routes
  if (role !== "customer" && pathname.startsWith("/portal")) {
    return NextResponse.redirect(new URL(homeFor(role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
