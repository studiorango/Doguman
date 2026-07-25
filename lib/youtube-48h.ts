// YouTube 48시간 조회수 추적 — 공통 헬퍼
import { createClient } from "@supabase/supabase-js";

export const YT_API = "https://www.googleapis.com/youtube/v3";

export function ytKey() {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY 없음");
  return key;
}

export function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export function decodeHtml(s: string) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export type VideoStat = {
  view_count: number;
  like_count: number;
  comment_count: number;
};

// videoId 목록의 통계를 한 번에 조회 (최대 50개)
export async function fetchStats(ids: string[]): Promise<Record<string, VideoStat>> {
  const out: Record<string, VideoStat> = {};
  if (ids.length === 0) return out;
  const key = ytKey();
  // 50개씩 청크
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    const res = await fetch(
      `${YT_API}/videos?part=statistics&id=${chunk.join(",")}&key=${key}`
    );
    const data = await res.json();
    for (const item of data.items ?? []) {
      const s = item.statistics ?? {};
      out[item.id] = {
        view_count: Number(s.viewCount ?? 0),
        like_count: Number(s.likeCount ?? 0),
        comment_count: Number(s.commentCount ?? 0),
      };
    }
  }
  return out;
}
