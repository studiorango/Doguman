import { NextResponse } from "next/server";
import { admin, fetchStats } from "@/lib/youtube-48h";

export const maxDuration = 60;

// GET: 추적 중인 모든 영상의 현재 통계를 스냅샷으로 기록 (cron)
// 추적 시작 48시간이 지난 영상은 자동 정리
export async function GET() {
  const supabase = admin();

  // 48시간 지난 추적 영상 정리 (스냅샷은 cascade 삭제)
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  await supabase.from("yt_tracked_videos").delete().lt("created_at", cutoff);

  const { data: videos } = await supabase.from("yt_tracked_videos").select("video_id");
  const ids = (videos ?? []).map((v) => v.video_id);
  if (ids.length === 0) return NextResponse.json({ ok: true, captured: 0 });

  const stats = await fetchStats(ids);
  const rows = Object.entries(stats).map(([video_id, st]) => ({
    video_id,
    view_count: st.view_count,
    like_count: st.like_count,
    comment_count: st.comment_count,
  }));
  if (rows.length > 0) await supabase.from("yt_view_snapshots").insert(rows);

  return NextResponse.json({ ok: true, captured: rows.length });
}
