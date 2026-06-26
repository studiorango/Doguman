import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "./lib/supabase/middleware";

// more-workout.vercel.app 루트로 들어오면 운동 페이지를 보여줌 (host 기반 rewrite)
const WORKOUT_HOST = "more-workout.vercel.app";

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host");
  if (host === WORKOUT_HOST && request.nextUrl.pathname === "/") {
    return NextResponse.rewrite(new URL("/more-workout", request.url));
  }
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

