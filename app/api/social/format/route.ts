import { NextResponse } from "next/server";

type Body = { input?: string };

function buildPrompt(input: string) {
  return `당신은 소셜 미디어 콘텐츠 전문가입니다.

규칙:
- 트위터/X: 반드시 280자 이내. 핵심만, 임팩트 있게. 해시태그 1~2개 선택적으로.
- 스레드: 500자 이내. 자연스럽고 대화체. 이모지는 사용하지 않습니다.
- 원본의 핵심 메시지 반드시 유지. 한국어로 작성합니다.

반드시 아래 JSON만 응답하세요. 다른 말 없이:
{"twitter":"트위터용 글","threads":"스레드용 글"}

다음 글을 변환해 주세요:

${input}`;
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new NextResponse("ANTHROPIC_API_KEY가 설정되지 않았습니다.", {
      status: 500,
    });
  }

  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    return new NextResponse("요청이 올바르지 않습니다.", { status: 400 });
  }

  const input = (body.input ?? "").trim();
  if (!input) {
    return new NextResponse("input이 필요합니다.", { status: 400 });
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      system: "출력은 반드시 JSON만 반환합니다.",
      messages: [{ role: "user", content: buildPrompt(input) }],
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    return new NextResponse(t || "업스트림 요청 실패", { status: 502 });
  }

  const data = (await res.json()) as {
    content?: Array<{ text?: string }>;
  };

  const raw = (data.content?.[0]?.text ?? "").trim().replace(/```json|```/g, "").trim();
  try {
    const parsed = JSON.parse(raw) as { twitter?: string; threads?: string };
    return NextResponse.json({
      twitter: parsed.twitter ?? "",
      threads: parsed.threads ?? "",
    });
  } catch {
    return new NextResponse("모델 응답 파싱에 실패했습니다.", { status: 500 });
  }
}

