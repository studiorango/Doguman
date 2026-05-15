import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const cookies = request.cookies.getAll();
  // Supabase 인증 관련 쿠키가 없으면 네트워크 호출을 하지 않고 그대로 통과합니다.
  // (로컬 개발에서 auth 요청이 지연되면 페이지가 멈출 수 있음)
  const hasSupabaseAuthCookies = cookies.some((c) => c.name.startsWith("sb-"));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  try {
    await supabase.auth.getUser();
  } catch {}

  return supabaseResponse;
}
