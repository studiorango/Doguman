import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: 대기중인 레시피 목록
export async function GET() {
  const { data, error } = await supabase
    .from("pending_recipes")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, recipes: data });
}

// PATCH: 상태 변경 (approved / rejected)
export async function PATCH(req: NextRequest) {
  const { id, status, recipe } = await req.json();
  const update: Record<string, unknown> = { status };
  if (recipe) update.recipe = recipe;

  const { error } = await supabase.from("pending_recipes").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
