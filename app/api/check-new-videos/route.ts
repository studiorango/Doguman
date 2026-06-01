import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY!;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;

async function getTopComment(videoId: string): Promise<string> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&order=relevance&maxResults=5&key=${YOUTUBE_API_KEY}`
    );
    const data = await res.json();
    const comments: string[] = (data.items || []).map(
      (item: { snippet: { topLevelComment: { snippet: { textOriginal: string } } } }) =>
        item.snippet.topLevelComment.snippet.textOriginal
    );
    return comments.find((c) => c.includes("재료") || c.includes("g") || c.length > 200) ?? comments[0] ?? "";
  } catch { return ""; }
}

async function parseRecipeWithClaude(title: string, channelName: string, text: string) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: `아래 텍스트에서 레시피 정보를 추출해주세요.

영상 제목: ${title}
채널명: ${channelName}
내용:
${text.slice(0, 3000)}

반드시 아래 JSON 형식으로만 응답하세요. 레시피 정보가 없으면 null을 반환하세요:
{
  "name": "레시피 이름",
  "source": "출처",
  "time": 조리시간(숫자, 분 단위),
  "cuisine": "한식|일식|중식|이탈리안|프렌치|기타 양식|동남아|멕시칸|인도|기타 중 하나",
  "ingredients": ["재료1", "재료2"],
  "steps": [{"label": "단계명", "dur": 소요시간(분)}]
}`,
      }],
    }),
  });
  const data = await res.json();
  const text2 = data.content?.[0]?.text ?? "";
  try { return JSON.parse(text2.replace(/```json|```/g, "").trim()); } catch { return null; }
}

export async function GET() {
  const { data: channels } = await supabase.from("watched_channels").select("*");
  if (!channels || channels.length === 0) return NextResponse.json({ ok: true, checked: 0 });

  let added = 0;

  for (const ch of channels) {
    // 최신 영상 목록 가져오기
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${ch.channel_id}&order=date&maxResults=5&type=video&key=${YOUTUBE_API_KEY}`
    );
    const data = await res.json();
    const videos = data.items ?? [];

    for (const video of videos) {
      const videoId = video.id?.videoId;
      if (!videoId) continue;

      // 이미 처리된 영상인지 확인
      const { data: existing } = await supabase
        .from("pending_recipes")
        .select("id")
        .eq("video_id", videoId)
        .single();
      if (existing) continue;

      // 마지막 확인 영상보다 이전이면 스킵
      if (ch.last_video_id === videoId) break;

      const title = video.snippet?.title ?? "";
      const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

      // 댓글에서 레시피 텍스트 추출
      const commentText = await getTopComment(videoId);
      const recipeText = commentText || video.snippet?.description || "";

      let recipe = null;
      if (recipeText) {
        recipe = await parseRecipeWithClaude(title, ch.channel_name, recipeText);
      }

      // pending_recipes에 저장
      await supabase.from("pending_recipes").upsert({
        video_id: videoId,
        video_url: `https://youtube.com/watch?v=${videoId}`,
        title,
        thumbnail,
        channel_name: ch.channel_name,
        recipe,
        status: "pending",
      }, { onConflict: "video_id" });

      added++;
    }

    // 가장 최신 영상 ID 업데이트
    if (videos[0]?.id?.videoId) {
      await supabase.from("watched_channels")
        .update({ last_video_id: videos[0].id.videoId })
        .eq("channel_id", ch.channel_id);
    }
  }

  return NextResponse.json({ ok: true, checked: channels.length, added });
}
