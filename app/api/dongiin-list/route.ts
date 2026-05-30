import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const rating = searchParams.get("rating");
  const sort = searchParams.get("sort") || "date_desc";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 50;

  let query = supabase.from("dongiin_movies").select("*", { count: "exact" });

  if (search) {
    query = query.or(`title.ilike.%${search}%,review.ilike.%${search}%`);
  }
  if (rating) {
    query = query.eq("rating", parseFloat(rating));
  }

  if (sort === "rating_desc") query = query.order("rating", { ascending: false }).order("date", { ascending: false });
  else if (sort === "rating_asc") query = query.order("rating", { ascending: true }).order("date", { ascending: false });
  else query = query.order("date", { ascending: false });

  query = query.range((page - 1) * limit, page * limit - 1);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  // 별점 분포
  const { data: dist } = await supabase
    .from("dongiin_movies")
    .select("rating");

  const distribution: Record<string, number> = {};
  (dist || []).forEach((r: { rating: number }) => {
    const key = r.rating.toString();
    distribution[key] = (distribution[key] || 0) + 1;
  });

  return NextResponse.json({ ok: true, movies: data, total: count, distribution, page, limit });
}
