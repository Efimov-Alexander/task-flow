import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register";

  // Пропускаем все API маршруты
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Проверяем все возможные варианты cookie NextAuth
  const cookies = req.cookies.getAll();
  const sessionCookie = cookies.find(c =>
    c.name.includes("session-token") ||
    c.name.includes("next-auth")
  );

  const isLoggedIn = !!sessionCookie;

  if (!isLoggedIn && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};