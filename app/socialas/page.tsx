"use client";

import { useState } from "react";
import Link from "next/link";
import AuthButton from "@/components/auth/AuthButton";

// ── 디자인 토큰 (컨텐츠 제작 - 더스티 블루)
const ACCENT    = "#3E5878";
const ACCENT_BG = "#E8EDF4";
const ACCENT_BD = "#A8B8CC";

const cardCls  = "bg-white rounded-[16px] border border-[#EAE7E2] shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-5 mb-4";
const labelCls = "text-[11px] font-bold tracking-wider mb-3" as const;
const inputCls = "w-full bg-[#F5F5F5] border border-[#EAE7E2] rounded-[10px] px-3 py-2.5 text-[13px] text-[#1A1A1A] font-[inherit] focus:outline-none focus:bg-white focus:border-[#1A1A1A] transition-colors placeholder:text-[#B0A99F]";

type ContentType = "video" | "text";
type PostStatus = "draft" | "scheduled" | "done";

type Brand = {
  id: string;
  name: string;
  accounts: Account[];
};

type Account = {
  platform: string;
  handle: string;
  url: string;
  type: "video" | "text";
  color: string;
  label: string;
};

type Post = {
  id: string;
  brand: string;
  title: string;
  date: string;
  status: PostStatus;
  platforms: string[];
};

const BRANDS: Brand[] = [
  {
    id: "oomfighter",
    name: "오염파이터",
    accounts: [
      { platform: "TikTok", handle: "@오염파이터", url: "https://tiktok.com", type: "video", color: "#FF0050", label: "T" },
      { platform: "Instagram", handle: "@오염파이터_official", url: "https://instagram.com", type: "video", color: "#E1306C", label: "I" },
      { platform: "YouTube", handle: "오염파이터TV", url: "https://youtube.com", type: "video", color: "#FF0000", label: "Y" },
      { platform: "Threads", handle: "@오염파이터", url: "https://threads.net", type: "text", color: "#101010", label: "Th" },
      { platform: "X", handle: "@oomfighter", url: "https://x.com", type: "text", color: "#000000", label: "X" },
    ],
  },
  {
    id: "eartholympics",
    name: "지구올림픽",
    accounts: [
      { platform: "Threads", handle: "@eartholympics", url: "https://threads.net", type: "text", color: "#101010", label: "Th" },
      { platform: "X", handle: "@eartholympics_kr", url: "https://x.com", type: "text", color: "#000000", label: "X" },
    ],
  },
  {
    id: "kongnamu",
    name: "콩나무",
    accounts: [
      { platform: "Threads", handle: "@kongnamu_official", url: "https://threads.net", type: "text", color: "#101010", label: "Th" },
      { platform: "X", handle: "@kongnamu_kr", url: "https://x.com", type: "text", color: "#000000", label: "X" },
    ],
  },
];

const INITIAL_POSTS: Post[] = [
  { id: "1", brand: "오염파이터", title: "오염파이터 런칭 영상", date: "4월 5일", status: "done", platforms: ["T", "I", "Y"] },
  { id: "2", brand: "오염파이터", title: "매트리스 청소 전후 비교 영상", date: "4월 12일 오후 6시", status: "scheduled", platforms: ["T", "I", "Y"] },
  { id: "3", brand: "지구올림픽", title: "지구올림픽 이번 주 랭킹 결과", date: "4월 14일 오전 9시", status: "scheduled", platforms: ["Th", "X"] },
  { id: "4", brand: "콩나무", title: "콩나무 신규 서비스 소개글", date: "미정", status: "draft", platforms: ["Th", "X"] },
];

const PLATFORM_COLORS: Record<string, string> = {
  T: "#FF0050", I: "#E1306C", Y: "#FF0000", Th: "#101010", X: "#000000",
};

const PLATFORM_GUIDES: Record<string, string> = {
  TikTok: "15초~3분 영상용. 훅 + 핵심 + CTA. 해시태그 5개 이내. 트렌디하고 짧게.",
  Instagram: "릴스 설명란. 첫 줄이 중요. 감성적. 해시태그 15~20개.",
  YouTube: "영상 설명란. SEO 키워드 포함. 타임스탬프 형식. CTA 포함. 길게 작성.",
  Threads: "대화체. 편안한 톤. 짧은 단락. 500자 이내.",
  X: "간결하게 280자 이내. 임팩트 있는 첫 문장. 해시태그 1~2개만.",
};

type NavPage = "dashboard" | "accounts" | "caption" | "schedule";

function PlatformPip({ label, color }: { label: string; color: string }) {
  return (
    <div
      className="w-[18px] h-[18px] rounded-[4px] flex items-center justify-center text-white"
      style={{ background: color, fontSize: "9px", fontWeight: 700 }}
    >
      {label}
    </div>
  );
}

function StatusDot({ status }: { status: PostStatus }) {
  const colors: Record<PostStatus, string> = {
    done: "#4A7362",
    scheduled: "#7A6040",
    draft: "#D1D5DB",
  };
  return <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: colors[status] }} />;
}

export default function SocialPostingPage() {
  const [activePage, setActivePage] = useState<NavPage>("dashboard");
  const [contentType, setContentType] = useState<ContentType>("video");
  const [contentInput, setContentInput] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Record<string, boolean>>({
    TikTok: true, Instagram: true, YouTube: true, Threads: true, X: true,
  });
  const [captions, setCaptions] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [posts] = useState<Post[]>(INITIAL_POSTS);

  const videoPlatforms = ["TikTok", "Instagram", "YouTube"];
  const textPlatforms = ["Threads", "X"];
  const currentPlatforms = contentType === "video" ? videoPlatforms : textPlatforms;

  const togglePlatform = (p: string) => {
    setSelectedPlatforms((prev) => ({ ...prev, [p]: !prev[p] }));
  };

  const generateCaptions = async () => {
    if (!contentInput.trim()) return;
    const active = currentPlatforms.filter((p) => selectedPlatforms[p]);
    if (!active.length) return;
    setLoading(true);
    setCaptions({});
    try {
      const guide = active.map((p) => `- ${p}: ${PLATFORM_GUIDES[p]}`).join("\n");
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1200,
          messages: [{
            role: "user",
            content: `SNS 마케터로서 아래 콘텐츠에 대한 플랫폼별 캡션을 작성해주세요.

콘텐츠: ${contentInput}
콘텐츠 유형: ${contentType === "video" ? "영상" : "텍스트"}

플랫폼별 가이드:
${guide}

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이:
{${active.map((p) => `"${p}":"..."`).join(",")}}`,
          }],
        }),
      });
      const data = await res.json();
      const text = data.content?.[0]?.text ?? "";
      const clean = text.replace(/```json|```/g, "").trim();
      setCaptions(JSON.parse(clean));
    } catch {
      alert("생성 실패. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const copy = async (text: string, btn: HTMLButtonElement) => {
    await navigator.clipboard.writeText(text).catch(() => {});
    btn.textContent = "복사됨!";
    setTimeout(() => (btn.textContent = "복사"), 1500);
  };

  const NAV_ITEMS = [
    { key: "dashboard" as NavPage, label: "대시보드",    desc: "현황 한눈에" },
    { key: "accounts"  as NavPage, label: "계정 관리",   desc: "브랜드 & 플랫폼" },
    { key: "caption"   as NavPage, label: "캡션 생성",   desc: "AI 자동 작성" },
    { key: "schedule"  as NavPage, label: "콘텐츠 일정", desc: "포스트 스케줄" },
  ];

  return (
    <div className="min-h-[100dvh]" style={{ background: "#FAF9F7" }}>

      {/* ── 네브바 ── */}
      <header
        className="h-[60px] sticky top-0 z-50 flex items-center"
        style={{
          background: "rgba(250,249,247,0.92)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid #E8E5E0",
        }}
      >
        <div
          className="w-full mx-auto px-6"
          style={{
            maxWidth: "1040px",
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
          }}
        >
          <div className="flex items-center">
            <Link href="/" className="text-[17px] font-bold tracking-tight" style={{ color: "#1A1A1A" }}>
              김민제
            </Link>
          </div>
          <div className="flex items-center justify-center">
            <Link href="/blog" className="text-[15px] font-medium" style={{ color: "#888888" }}>
              블로그
            </Link>
          </div>
          <div className="flex items-center justify-end">
            <AuthButton />
          </div>
        </div>
      </header>

      <main className="mx-auto px-6 py-8 pb-20" style={{ maxWidth: "1040px" }}>

        {/* ── 네비 카드 ── */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {NAV_ITEMS.map(n => (
            <button
              key={n.key}
              onClick={() => setActivePage(n.key)}
              className="text-center rounded-[16px] py-8 px-5 border-2 transition-all duration-200 hover:-translate-y-[2px]"
              style={{
                background:  activePage === n.key ? ACCENT_BG : "#fff",
                borderColor: activePage === n.key ? ACCENT    : "#EAE7E2",
                boxShadow:   activePage === n.key
                  ? "0 4px 16px rgba(62,88,120,0.12)"
                  : "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <div className="text-[15px] font-bold tracking-tight" style={{ color: "#1A1A1A" }}>
                {n.label}
              </div>
              <div className="text-[12px] mt-1.5" style={{ color: "#B0A99F" }}>
                {n.desc}
              </div>
            </button>
          ))}
        </div>

        {/* ── 대시보드 ── */}
        {activePage === "dashboard" && (
          <div>
            <h1 className="text-[20px] font-bold tracking-tight mb-5" style={{ color: "#1A1A1A" }}>대시보드</h1>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[{ label: "브랜드", value: 3 }, { label: "연결 계정", value: 13 }, { label: "예정 포스트", value: 4 }].map((s) => (
                <div key={s.label} className="rounded-[16px] p-5 text-center" style={{ background: "#fff", border: "1px solid #EAE7E2", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                  <div className="text-[28px] font-extrabold tracking-tight" style={{ color: ACCENT }}>{s.value}</div>
                  <div className="text-[11px] font-semibold mt-1" style={{ color: "#B0A99F" }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div className={cardCls}>
              <p className={labelCls} style={{ color: "#B0A99F" }}>예정된 콘텐츠</p>
              {posts.map((post) => (
                <div key={post.id} className="flex items-center gap-3 p-3 rounded-[12px] border mb-2" style={{ background: "#FAF9F7", borderColor: "#EAE7E2" }}>
                  <StatusDot status={post.status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate" style={{ color: "#1A1A1A" }}>{post.title}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: "#B0A99F" }}>{post.brand} · {post.date}</p>
                  </div>
                  <div className="flex gap-1">
                    {post.platforms.map((p) => <PlatformPip key={p} label={p} color={PLATFORM_COLORS[p] ?? "#888"} />)}
                  </div>
                </div>
              ))}
            </div>
            <div className={cardCls}>
              <p className={labelCls} style={{ color: "#B0A99F" }}>플랫폼 가이드</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[12px] p-4" style={{ background: "#F2EDE4" }}>
                  <p className="text-[11px] font-bold mb-2" style={{ color: "#7A6040" }}>영상 플랫폼</p>
                  <div className="flex gap-1 mb-2">
                    {[{l:"T",c:"#FF0050"},{l:"I",c:"#E1306C"},{l:"Y",c:"#FF0000"}].map(({l,c})=><PlatformPip key={l} label={l} color={c}/>)}
                  </div>
                  <p className="text-[10px]" style={{ color: "#B0A99F" }}>TikTok · Instagram · YouTube</p>
                </div>
                <div className="rounded-[12px] p-4" style={{ background: "#F5F5F5" }}>
                  <p className="text-[11px] font-bold mb-2" style={{ color: "#555" }}>텍스트 플랫폼</p>
                  <div className="flex gap-1 mb-2">
                    {[{l:"Th",c:"#101010"},{l:"X",c:"#000"}].map(({l,c})=><PlatformPip key={l} label={l} color={c}/>)}
                  </div>
                  <p className="text-[10px]" style={{ color: "#B0A99F" }}>Threads · X (Twitter)</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 계정 관리 ── */}
        {activePage === "accounts" && (
          <div>
            <h1 className="text-[20px] font-bold tracking-tight mb-5" style={{ color: "#1A1A1A" }}>계정 관리</h1>
            {BRANDS.map((brand) => (
              <div key={brand.id} className={cardCls}>
                <p className="text-[14px] font-bold mb-4" style={{ color: "#1A1A1A" }}>{brand.name}</p>
                {(["video", "text"] as const).map((type) => {
                  const accs = brand.accounts.filter((a) => a.type === type);
                  if (!accs.length) return null;
                  return (
                    <div key={type} className="mb-4 last:mb-0">
                      <p className="text-[10px] font-bold tracking-wider mb-2" style={{ color: "#B0A99F" }}>
                        {type === "video" ? "영상 플랫폼" : "텍스트 플랫폼"}
                      </p>
                      {accs.map((acc) => (
                        <div key={acc.platform} className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid #F0EDE8" }}>
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-[8px] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ background: acc.color }}>
                              {acc.label}
                            </div>
                            <div>
                              <p className="text-[13px] font-semibold" style={{ color: "#1A1A1A" }}>{acc.platform}</p>
                              <p className="text-[11px]" style={{ color: "#B0A99F" }}>{acc.handle}</p>
                            </div>
                          </div>
                          <a href={acc.url} target="_blank" rel="noopener noreferrer"
                            className="text-[11px] font-semibold px-3 py-1 rounded-full transition-colors"
                            style={{ background: ACCENT_BG, color: ACCENT, border: `1px solid ${ACCENT_BD}` }}>
                            바로가기
                          </a>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* ── 캡션 생성 ── */}
        {activePage === "caption" && (
          <div>
            <h1 className="text-[20px] font-bold tracking-tight mb-5" style={{ color: "#1A1A1A" }}>캡션 생성</h1>
            <div className={cardCls}>
              <p className={labelCls} style={{ color: "#B0A99F" }}>콘텐츠 유형</p>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {(["video", "text"] as const).map((type) => (
                  <button key={type} onClick={() => setContentType(type)}
                    className="py-2.5 px-3 rounded-[12px] text-[13px] font-semibold border-2 transition-all"
                    style={{
                      background:  contentType === type ? ACCENT_BG : "#fff",
                      borderColor: contentType === type ? ACCENT    : "#EAE7E2",
                      color:       contentType === type ? ACCENT    : "#888",
                    }}>
                    {type === "video" ? "영상 (TikTok · Instagram · YouTube)" : "텍스트 (Threads · X)"}
                  </button>
                ))}
              </div>

              <p className={labelCls} style={{ color: "#B0A99F" }}>내용 입력</p>
              <textarea value={contentInput} onChange={(e) => setContentInput(e.target.value)} rows={3}
                placeholder="콘텐츠 내용을 간단히 설명해주세요."
                className="w-full rounded-[12px] px-4 py-3 text-[13px] resize-none focus:outline-none transition-colors mb-5"
                style={{ background: "#F5F5F5", border: "1px solid #EAE7E2", color: "#1A1A1A", fontFamily: "inherit", lineHeight: 1.6 }}
              />

              <p className={labelCls} style={{ color: "#B0A99F" }}>플랫폼 선택</p>
              <div className="flex gap-2 flex-wrap mb-5">
                {currentPlatforms.map((p) => (
                  <button key={p} onClick={() => togglePlatform(p)}
                    className="text-[12px] font-semibold px-4 py-1.5 rounded-full border-2 transition-all"
                    style={{
                      background:  selectedPlatforms[p] ? ACCENT_BG : "#fff",
                      borderColor: selectedPlatforms[p] ? ACCENT    : "#EAE7E2",
                      color:       selectedPlatforms[p] ? ACCENT    : "#888",
                    }}>
                    {p}
                  </button>
                ))}
              </div>

              <button onClick={generateCaptions} disabled={loading || !contentInput.trim()}
                className="w-full py-3 rounded-[12px] text-[14px] font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.99]"
                style={{ background: ACCENT, fontFamily: "inherit" }}>
                {loading ? "생성 중..." : "AI 캡션 생성"}
              </button>
            </div>

            {Object.entries(captions).map(([platform, text]) => {
              const colorMap: Record<string, string> = { TikTok: "#FF0050", Instagram: "#E1306C", YouTube: "#FF0000", Threads: "#101010", X: "#000" };
              const labelMap: Record<string, string> = { TikTok: "T", Instagram: "I", YouTube: "Y", Threads: "Th", X: "X" };
              return (
                <div key={platform} className={cardCls}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-[20px] h-[20px] rounded-[5px] flex items-center justify-center text-white" style={{ background: colorMap[platform], fontSize: "9px", fontWeight: 700 }}>
                        {labelMap[platform]}
                      </div>
                      <span className="text-[12px] font-bold tracking-wider" style={{ color: "#B0A99F" }}>{platform} 캡션</span>
                    </div>
                    <button onClick={(e) => copy(text, e.currentTarget)}
                      className="text-[12px] font-semibold px-3 py-1 rounded-[8px] border transition-colors"
                      style={{ background: "#F5F5F5", borderColor: "#EAE7E2", color: "#888", fontFamily: "inherit" }}>
                      복사
                    </button>
                  </div>
                  <p className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: "#1A1A1A" }}>{text}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* ── 콘텐츠 일정 ── */}
        {activePage === "schedule" && (
          <div>
            <h1 className="text-[20px] font-bold tracking-tight mb-5" style={{ color: "#1A1A1A" }}>콘텐츠 일정</h1>
            <div className={cardCls}>
              <p className={labelCls} style={{ color: "#B0A99F" }}>새 포스트 등록</p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <select className={inputCls}>{BRANDS.map((b) => <option key={b.id}>{b.name}</option>)}</select>
                <select className={inputCls}><option>영상</option><option>텍스트</option></select>
              </div>
              <input type="text" placeholder="콘텐츠 제목" className={`${inputCls} mb-3`} />
              <div className="grid grid-cols-2 gap-2 mb-4">
                <input type="date" className={inputCls} defaultValue="2025-04-12" />
                <select className={inputCls}><option>초안</option><option>예약됨</option><option>완료</option></select>
              </div>
              <button className="w-full py-3 rounded-[12px] text-[14px] font-bold text-white"
                style={{ background: ACCENT, fontFamily: "inherit" }}>
                저장
              </button>
            </div>

            <div className={cardCls}>
              <p className={labelCls} style={{ color: "#B0A99F" }}>전체 일정</p>
              {posts.map((post) => (
                <div key={post.id} className="flex items-center gap-3 p-3 rounded-[12px] border mb-2 last:mb-0"
                  style={{ background: "#FAF9F7", borderColor: "#EAE7E2" }}>
                  <StatusDot status={post.status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate" style={{ color: "#1A1A1A" }}>{post.title}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: "#B0A99F" }}>
                      {post.brand} · {post.date} · {post.status === "done" ? "완료" : post.status === "scheduled" ? "예약됨" : "초안"}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {post.platforms.map((p) => <PlatformPip key={p} label={p} color={PLATFORM_COLORS[p] ?? "#888"} />)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}