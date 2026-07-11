import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkPublicReadLimit } from "@/lib/ratelimit";

const PAGE_SIZE = 24;

// user_id 등 민감 필드는 반환하지 않는다.
const PUBLIC_FIELDS =
  "id, name, source, link, youtube_url, ingredients, ingredient_items, steps, total_time, cuisine, pairing, category, carbs, protein, fat, rating, kid_friendly, created_at";

export async function GET(request: Request) {
  // 1) 로그인 필수 (#4) — 쿠키 세션 검증
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  // 2) rate limit (#2) — 계정 단위, Upstash 미설정 시 fail-open
  const allowed = await checkPublicReadLimit(user.id);
  if (!allowed) {
    return NextResponse.json(
      { error: "요청이 너무 많아요. 잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  // 3) 페이지네이션 (페이지당 고정 24개, 대량 수집 억제)
  const { searchParams } = new URL(request.url);
  const page = Math.max(0, parseInt(searchParams.get("page") ?? "0") || 0);
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // 4) service_role로 조회하되 반드시 is_public = true 필터 (#1)
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("fridge_recipes")
    .select(PUBLIC_FIELDS)
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: "불러오기에 실패했어요." }, { status: 500 });
  }

  return NextResponse.json({
    recipes: data ?? [],
    page,
    pageSize: PAGE_SIZE,
    hasMore: (data?.length ?? 0) === PAGE_SIZE,
  });
}
