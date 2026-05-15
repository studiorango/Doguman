// app/api/search-channel/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { query, channelId: existingChannelId, pageToken } = await req.json();

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "YouTube API 키가 없습니다." }, { status: 500 });

    let channelId = existingChannelId;
    let channelTitle = "";
    let channelThumb = "";
    let subCount = "";

    // 새 검색일 때만 채널 정보 조회
    if (!channelId) {
      if (!query) return NextResponse.json({ error: "검색어가 필요합니다." }, { status: 400 });

      // 1. 채널 검색
      const searchRes = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(query)}&maxResults=1&key=${apiKey}`
      );
      const searchData = await searchRes.json();
      const channelItem = searchData.items?.[0];
      if (!channelItem) return NextResponse.json({ error: "채널을 찾을 수 없습니다." });

      channelId = channelItem.snippet.channelId;
      channelTitle = channelItem.snippet.title;
      channelThumb = channelItem.snippet.thumbnails?.default?.url ?? "";

      // 2. 구독자 수
      const channelRes = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${apiKey}`
      );
      const channelData = await channelRes.json();
      const ch = channelData.items?.[0];
      const stats = ch?.statistics;
      channelTitle = ch?.snippet?.title ?? channelTitle;
      channelThumb = ch?.snippet?.thumbnails?.default?.url ?? channelThumb;
      subCount = stats?.subscriberCount
        ? Number(stats.subscriberCount) >= 10000
          ? `구독자 ${(Number(stats.subscriberCount) / 10000).toFixed(0)}만명`
          : `구독자 ${Number(stats.subscriberCount).toLocaleString()}명`
        : "";
    }

    // 3. 영상 목록 (pageToken으로 페이지 이동)
    const pageParam = pageToken ? `&pageToken=${pageToken}` : "";
    const videosRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=20${pageParam}&key=${apiKey}`
    );
    const videosData = await videosRes.json();

    const videos = (videosData.items ?? []).map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails?.medium?.url ?? "",
      publishedAt: item.snippet.publishedAt?.slice(0, 7).replace("-", ".") ?? "",
    }));

    return NextResponse.json({
      channelId,
      channelTitle,
      channelThumb,
      subCount,
      videos,
      nextPageToken: videosData.nextPageToken ?? null,
      prevPageToken: videosData.prevPageToken ?? null,
      totalResults: videosData.pageInfo?.totalResults ?? 0,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}