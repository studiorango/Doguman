import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST: 채널 감시 등록
export async function POST(req: NextRequest) {
  const { channelId, channelName } = await req.json();
  if (!channelId || !channelName) return NextResponse.json({ error: "channelId, channelName 필요" }, { status: 400 });

  const { error } = await supabase
    .from("watched_channels")
    .upsert({ channel_id: channelId, channel_name: channelName }, { onConflict: "channel_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// GET: 감시 중인 채널 목록
export async function GET() {
  const { data, error } = await supabase.from("watched_channels").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, channels: data });
}

// DELETE: 채널 감시 해제
export async function DELETE(req: NextRequest) {
  const { channelId } = await req.json();
  const { error } = await supabase.from("watched_channels").delete().eq("channel_id", channelId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
