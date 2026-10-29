import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// service_role 키는 서버에서만 사용 — RLS 우회. 클라이언트에 절대 노출 금지.
function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

// 수정 시 클라이언트가 건드릴 수 있는 컬럼 — id, sort_order 등은 제외
const BABY_FIELDS = ["num", "parent1", "parent2", "name", "birthdate", "housewarming", "status", "gender", "prediction"];
const WAITING_FIELDS = ["parent1", "parent2", "housewarming", "prediction"];

function pickFields(row: Record<string, unknown>, allowed: string[]) {
  return Object.fromEntries(Object.entries(row ?? {}).filter(([k]) => allowed.includes(k)));
}

function isAuthed(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  const expected = process.env.EARTHLINGS_ADMIN_PASSWORD;
  return Boolean(expected) && secret === expected;
}

// 비밀번호 확인 + 쓰기(insert)
export async function POST(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: "비밀번호가 틀렸어요." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  // 로그인 검증 전용
  if (body.kind === "verify") {
    return NextResponse.json({ ok: true });
  }

  const supabase = adminClient();

  if (body.kind === "baby") {
    const { error } = await supabase.from("earthlings_babies").insert(body.row);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (body.kind === "waiting") {
    const { error } = await supabase.from("earthlings_waiting").insert(body.row);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "알 수 없는 요청이에요." }, { status: 400 });
}

// 수정(update)
export async function PATCH(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: "비밀번호가 틀렸어요." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { kind, id, row } = body;

  if (!id || (kind !== "baby" && kind !== "waiting") || !row) {
    return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }

  const patch = pickFields(row, kind === "baby" ? BABY_FIELDS : WAITING_FIELDS);
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "수정할 내용이 없어요." }, { status: 400 });
  }

  const table = kind === "baby" ? "earthlings_babies" : "earthlings_waiting";
  const supabase = adminClient();
  const { error } = await supabase.from(table).update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

// 삭제
export async function DELETE(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: "비밀번호가 틀렸어요." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const kind = searchParams.get("kind");
  const id = searchParams.get("id");

  if (!id || (kind !== "baby" && kind !== "waiting")) {
    return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }

  const table = kind === "baby" ? "earthlings_babies" : "earthlings_waiting";
  const supabase = adminClient();
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
