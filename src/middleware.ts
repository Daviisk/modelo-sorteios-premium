import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "rifa_admin_session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAdminRoute = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const isAdminApi = pathname.startsWith("/api/admin") && pathname !== "/api/admin/auth";

  if (pathname.startsWith("/api/admin") && !["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    const origin = req.headers.get("origin");
    if (!origin || origin !== req.nextUrl.origin) return NextResponse.json({ error: "Origem não autorizada.", code: "403" }, { status: 403 });
  }

  if (!isAdminRoute && !isAdminApi) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return redirectOrUnauthorized(req, isAdminApi);

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET ?? ""));
    if (payload.role !== "ADMIN") return redirectOrUnauthorized(req, isAdminApi);
    return NextResponse.next();
  } catch {
    return redirectOrUnauthorized(req, isAdminApi);
  }
}

function redirectOrUnauthorized(req: NextRequest, isApi: boolean) {
  if (isApi) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

