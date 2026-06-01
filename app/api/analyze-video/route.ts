import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getRecipeText(videoId: string): Promise<string> {
  const apiKey = process.env.YOUTUBE_API_KEY!;

  // 영상 설명란
  const videoRes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`
  );
  const videoData = await videoRes.json();
  const description: string = videoData.items?.[0]?.snippet?.description ?? "";

  // 댓글에서 레시피 찾기 (고정 댓글 포함 상위 10개)
  try {
    const commentRes = await fetch(
      `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&order=relevance&maxResults=10&key=${apiKey}`
    );
    const commentData = await commentRes.json();
    const comments: string[] = (commentData.items || []).map(
      (item: { snippet: { topLevelComment: { snippet: { textOriginal: string } } } }) =>
        item.snippet.topLevelComment.snippet.textOriginal
    );
    // 레시피가 있을 것 같은 댓글 우선, 없으면 가장 긴 댓글
    const recipeComment =
      comments.find((c) => c.includes("재료") || c.includes("레시피")) ??
      comments.find((c) => c.length > 300) ??
      "";
    if (recipeComment) return recipeComment;
  } catch { /* 댓글 없으면 설명란 사용 */ }

  return description;
}

async function parseRecipe(title: string, channelName: string, text: string) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
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

export async function POST(req: NextRequest) {
  const { videoId, title, thumbnail, channelName } = await req.json();
  if (!videoId) return NextResponse.json({ error: "videoId 필요" }, { status: 400 });

  // 이미 있고 recipe가 있으면 기존 반환, recipe가 null이면 재분석
  const { data: existing } = await supabase
    .from("pending_recipes")
    .select("*")
    .eq("video_id", videoId)
    .single();
  if (existing?.recipe) return NextResponse.json({ ok: true, item: existing, alreadyExists: true });

  const recipeText = await getRecipeText(videoId);
  const recipe = recipeText ? await parseRecipe(title, channelName, recipeText) : null;

  const item = {
    video_id: videoId,
    video_url: `https://youtube.com/watch?v=${videoId}`,
    title,
    thumbnail,
    channel_name: channelName,
    recipe,
    status: "pending",
  };

  const { data, error } = await supabase
    .from("pending_recipes")
    .upsert(item, { onConflict: "video_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, item: data });
}
