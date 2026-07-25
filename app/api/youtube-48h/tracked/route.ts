import { NextRequest, NextResponse } from "next/server";
import { admin, fetchStats } from "@/lib/youtube-48h";

// GET: 추적 중인 영상 목록 + 각 영상의 스냅샷 (최근 48시간)
export async function GET() {
  const supabase = admin();
  const { data: videos, error } = await supabase
    .from("yt_tracked_videos")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const ids = (videos ?? []).map((v) => v.video_id);
  let snaps: { video_id: string; view_count: number; like_count: number; comment_count: number; captured_at: string }[] = [];
  if (ids.length > 0) {
    const { data } = await supabase
      .from("yt_view_snapshots")
      .select("video_id, view_count, like_count, comment_count, captured_at")
      .in("video_id", ids)
      .gte("captured_at", since)
      .order("captured_at", { ascending: true });
    snaps = data ?? [];
  }

  const byVideo: Record<string, typeof snaps> = {};
  for (const s of snaps) (byVideo[s.video_id] ??= []).push(s);

  const result = (videos ?? []).map((v) => ({
    ...v,
    snapshots: byVideo[v.video_id] ?? [],
  }));

  return NextResponse.json({ ok: true, videos: result });
}

// POST: 영상 추적 시작 (현재 통계로 첫 스냅샷 기록)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { videoId, channelId, channelTitle, title, thumbnail, publishedAt } = body;
  if (!videoId || !channelId) return NextResponse.json({ error: "videoId, channelId 필요" }, { status: 400 });

  const supabase = admin();
  const { error: upErr } = await supabase.from("yt_tracked_videos").upsert(
    {
      video_id: videoId,
      channel_id: channelId,
      channel_title: channelTitle ?? "",
      title: title ?? "",
      thumbnail: thumbnail ?? "",
      published_at: publishedAt ?? null,
    },
    { onConflict: "video_id" }
  );
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  // 첫 스냅샷 즉시 기록
  const stats = await fetchStats([videoId]);
  const st = stats[videoId];
  if (st) {
    await supabase.from("yt_view_snapshots").insert({
      video_id: videoId,
      view_count: st.view_count,
      like_count: st.like_count,
      comment_count: st.comment_count,
    });
  }

  return NextResponse.json({ ok: true });
}

// DELETE: 추적 해제
export async function DELETE(req: NextRequest) {
  const { videoId } = await req.json();
  if (!videoId) return NextResponse.json({ error: "videoId 필요" }, { status: 400 });
  const supabase = admin();
  const { error } = await supabase.from("yt_tracked_videos").delete().eq("video_id", videoId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
