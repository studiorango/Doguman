import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "./lib/supabase/middleware";

// host 기반 rewrite — 도메인마다 다른 앱을 루트에서 보여줌
const WORKOUT_HOST = "more-workout.vercel.app";
// 지구의 아이들 전용 도메인 (Vercel에 이 도메인을 추가하세요. 다른 이름 쓰면 이 값만 변경)
const EARTHLINGS_HOST = "earthlings-baby.vercel.app";

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host");
  if (host === WORKOUT_HOST && request.nextUrl.pathname === "/") {
    return NextResponse.rewrite(new URL("/more-workout", request.url));
  }
  if (host === EARTHLINGS_HOST && request.nextUrl.pathname === "/") {
    return NextResponse.rewrite(new URL("/earthlings", request.url));
  }
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

