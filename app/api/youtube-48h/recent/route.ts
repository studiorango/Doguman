import { NextRequest, NextResponse } from "next/server";
import { YT_API, ytKey, decodeHtml, fetchStats } from "@/lib/youtube-48h";

// POST: 채널 검색어 또는 channelId → 최근 48시간 업로드 영상 + 현재 통계
export async function POST(req: NextRequest) {
  try {
    const { query, channelId: existingChannelId } = await req.json();
    const key = ytKey();

    let channelId: string = existingChannelId ?? "";
    let channelTitle = "";
    let channelThumb = "";
    let subCount = "";

    if (!channelId) {
      if (!query) return NextResponse.json({ error: "검색어가 필요합니다." }, { status: 400 });
      const searchRes = await fetch(
        `${YT_API}/search?part=snippet&type=channel&q=${encodeURIComponent(query)}&maxResults=1&key=${key}`
      );
      const searchData = await searchRes.json();
      channelId = searchData.items?.[0]?.snippet?.channelId ?? "";
      if (!channelId) return NextResponse.json({ error: "채널을 찾을 수 없습니다." }, { status: 404 });
    }

    // 채널 정보
    const chRes = await fetch(
      `${YT_API}/channels?part=statistics,snippet&id=${channelId}&key=${key}`
    );
    const chData = await chRes.json();
    const ch = chData.items?.[0];
    if (!ch) return NextResponse.json({ error: "채널을 찾을 수 없습니다." }, { status: 404 });
    channelTitle = ch.snippet?.title ?? "";
    channelThumb = ch.snippet?.thumbnails?.default?.url ?? "";
    const subs = Number(ch.statistics?.subscriberCount ?? 0);
    subCount = subs >= 10000 ? `구독자 ${(subs / 10000).toFixed(1)}만명` : `구독자 ${subs.toLocaleString()}명`;

    // 최근 48시간 영상
    const publishedAfter = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const vidRes = await fetch(
      `${YT_API}/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=25&publishedAfter=${publishedAfter}&key=${key}`
    );
    const vidData = await vidRes.json();
    const items = vidData.items ?? [];
    const ids: string[] = items.map((it: { id: { videoId: string } }) => it.id.videoId).filter(Boolean);

    const stats = await fetchStats(ids);

    const videos = items
      .map((it: { id: { videoId: string }; snippet: { title: string; publishedAt: string; thumbnails?: { medium?: { url: string } } } }) => {
        const id = it.id.videoId;
        const st = stats[id] ?? { view_count: 0, like_count: 0, comment_count: 0 };
        return {
          id,
          title: decodeHtml(it.snippet.title),
          thumbnail: it.snippet.thumbnails?.medium?.url ?? `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
          publishedAt: it.snippet.publishedAt,
          viewCount: st.view_count,
          likeCount: st.like_count,
          commentCount: st.comment_count,
        };
      })
      .sort((a: { viewCount: number }, b: { viewCount: number }) => b.viewCount - a.viewCount);

    return NextResponse.json({ channelId, channelTitle, channelThumb, subCount, videos });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
