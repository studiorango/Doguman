// app/api/parse-recipe/route.ts
import { NextRequest, NextResponse } from "next/server";

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: "URL이 필요합니다." }, { status: 400 });

    const videoId = extractVideoId(url);
    if (!videoId) return NextResponse.json({ error: "유효한 유튜브 URL이 아닙니다." }, { status: 400 });

    const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    // YouTube Data API로 설명란 가져오기
    const ytApiKey = process.env.YOUTUBE_API_KEY;
    if (!ytApiKey) {
      return NextResponse.json({ thumbnail, videoId, description: null, error: "YouTube API 키 없음 — 썸네일만 사용합니다." });
    }

    const ytRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${ytApiKey}`
    );
    const ytData = await ytRes.json();
    const snippet = ytData.items?.[0]?.snippet;
    if (!snippet) return NextResponse.json({ thumbnail, videoId, description: null });

    const title = snippet.title ?? "";
    const description = snippet.description ?? "";
    const channelTitle = snippet.channelTitle ?? "";

    if (!description.trim()) {
      return NextResponse.json({ thumbnail, videoId, title, source: channelTitle, description: null });
    }

    // Claude API로 레시피 파싱
    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "messages-2023-12-15",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: `아래 유튜브 영상 설명란에서 레시피 정보를 추출해주세요.

영상 제목: ${title}
채널명: ${channelTitle}
설명란:
${description.slice(0, 3000)}

반드시 아래 JSON 형식으로만 응답하세요. 레시피 정보가 없으면 null을 반환하세요:
{
  "name": "레시피 이름",
  "source": "출처(채널명 또는 블로그명)",
  "time": 조리시간(숫자, 분 단위),
  "cuisine": "한식|일식|중식|이탈리안|프렌치|기타 양식|동남아|멕시칸|인도|기타 중 하나",
  "ingredients": ["재료1", "재료2", ...],
  "steps": [
    {"label": "단계명", "dur": 소요시간(분)},
    ...
  ]
}`,
          },
        ],
      }),
    });

    const claudeData = await claudeRes.json();
    const text = claudeData.content?.[0]?.text ?? "";
    const clean = text.replace(/```json|```/g, "").trim();

    let recipe = null;
    try {
      recipe = JSON.parse(clean);
    } catch {
      recipe = null;
    }

    return NextResponse.json({ thumbnail, videoId, title, source: channelTitle, recipe, _debug: { claudeStatus: claudeRes.status, claudeError: claudeData.error, textPreview: text.slice(0, 200) } });
  } catch (e) {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}