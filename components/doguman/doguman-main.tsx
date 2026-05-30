"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import AuthButton from "@/components/auth/AuthButton";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Service = {
  name: string;
  href: string;
  description: string;
};

type Category = {
  key: string;
  title: string;
  services: Service[];
  color: string;
  bg: string;
};

const CATEGORIES: Category[] = [
  {
    key: "save",
    title: "돈 아끼기",
    color: "#4A7362",
    bg: "#ECF2EE",
    services: [
      { name: "목표 금액 달성 계산기", href: "/racetogold", description: "목표 금액까지 걸리는 시간을 계산합니다." },
      { name: "오염파이터", href: "/cleaning", description: "매트리스 청소 서비스. 당일 방문, 당일 완료." },
      { name: "레시피와 냉장고 관리", href: "/recipegerator", description: "냉장고 재고 기반 레시피 & 타임테이블 관리" },
      { name: "예상 지출 계산기", href: "/expense", description: "상황별 예상 지출을 항목으로 정리하고 합계를 계산합니다." },
    ],
  },
  {
    key: "earn",
    title: "돈 벌기",
    color: "#7A6040",
    bg: "#F2EDE4",
    services: [
      { name: "마케팅 서비스", href: "/hub", description: "샘플과 바이럴 영상으로 브랜드 노출을 늘립니다." },
      { name: "당근 판매대행", href: "/hub", description: "중고 판매를 자동화에 가깝게 도와드립니다." },
    ],
  },
  {
    key: "content",
    title: "컨텐츠 제작",
    color: "#3E5878",
    bg: "#E8EDF4",
    services: [
      { name: "소셜 포스팅 도우미", href: "/socialas", description: "원문을 플랫폼별로 짧고 임팩트 있게 다듬어 드립니다." },
    ],
  },
  {
    key: "mind",
    title: "멘탈 관리",
    color: "#6B5480",
    bg: "#EEE8F3",
    services: [
      { name: "버킷리스트 도구", href: "/bucket", description: "인생 목표를 버킷리스트로 만들고 달성률을 추적합니다." },
      { name: "10분 퀘스트", href: "/timechop", description: "하루를 10분으로 잘게 썰어 퀘스트로 꽉 채웁니다." },
      { name: "랜덤 국내 여행", href: "/random-travel", description: "랜덤 좌표로 국내 어딘가로 떠나보세요." },
      { name: "서울 랜덤 탐험", href: "/random-travel/seoul", description: "서울 80개 동네 중 랜덤으로 오늘의 동네를 뽑아드려요." },
      { name: "오버롤 측정기", href: "/hub", description: "나의 잠재력 수치를 간단히 측정합니다." },
    ],
  },
  {
    key: "body",
    title: "몸 관리",
    color: "#7A4A42",
    bg: "#F3ECEA",
    services: [
      { name: "지구올림픽", href: "/hub", description: "운동 게임화와 XP 기반 랭킹으로 꾸준함을 만듭니다." },
      { name: "러닝 코스 메이커", href: "/running", description: "집 근처 최적 러닝 코스를 자동으로 만들어드립니다." },
    ],
  },
];

const ALL_KEY = "all";

export function DogumanMain() {
  const [activeKey, setActiveKey] = useState(ALL_KEY);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email === "k1017im@naver.com") setIsAdmin(true);
    });
  }, []);

  const allVisible = CATEGORIES.flatMap((c) =>
    c.services
      .filter((s) => s.href !== "/hub")
      .map((s) => ({ ...s, categoryKey: c.key, categoryTitle: c.title, color: c.color, bg: c.bg }))
  );

  const visibleServices = allVisible.filter(
    (s) => activeKey === ALL_KEY || s.categoryKey === activeKey
  );

  const visibleKeys = new Set(allVisible.map((s) => s.categoryKey));
  const filterTabs = [
    { key: ALL_KEY, title: "전체" },
    ...CATEGORIES.filter((c) => visibleKeys.has(c.key)).map((c) => ({
      key: c.key,
      title: c.title,
    })),
  ];

  return (
    <div className="min-h-[100dvh]" style={{ background: "#FAF9F7" }}>

      {/* 헤더 */}
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
              도구맨
            </Link>
          </div>
          <div className="flex items-center justify-center">
            <Link href="/blog" className="text-[15px] font-medium transition-colors duration-150 hover:opacity-60" style={{ color: "#888888" }}>
              블로그
            </Link>
          </div>
          <div className="flex items-center justify-end">
            <AuthButton />
          </div>
        </div>
      </header>

      {/* 히어로 */}
      <div className="relative overflow-hidden" style={{ borderBottom: "1px solid #EAE7E2" }}>
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: "radial-gradient(circle, #A09890 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            opacity: 0.09,
          }}
        />
        <section className="relative z-10 mx-auto px-6 pt-[72px] pb-[64px]" style={{ maxWidth: "1040px" }}>
          <h1 className="text-[46px] font-bold leading-[1.2] tracking-tight break-keep mb-4" style={{ color: "#1A1A1A" }}>
            삶에 도움이 되는<br />다양한 도구를 만듭니다.
          </h1>
          <p className="text-[15px] leading-relaxed break-keep" style={{ color: "#999999" }}>
            매일 조금씩, 코드로 만들어가는 중입니다.
          </p>
        </section>
      </div>

      {/* 카테고리 필터 + 그리드 */}
      <div className="mx-auto px-6 pt-8 pb-20" style={{ maxWidth: "1040px" }}>

        {/* 필터 탭 */}
        <div className="flex items-center gap-2 flex-wrap justify-center mb-7">
          {filterTabs.map((tab) => {
            const isActive = activeKey === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveKey(tab.key)}
                className="text-[13px] font-semibold px-4 py-[7px] rounded-full transition-all duration-150 hover:scale-[1.03] active:scale-[0.97] break-keep"
                style={{
                  background: isActive ? "#1A1A1A" : "#FFFFFF",
                  border: isActive ? "1px solid #1A1A1A" : "1px solid #E2DED8",
                  color: isActive ? "#FFFFFF" : "#555555",
                }}
              >
                {tab.title}
              </button>
            );
          })}
        </div>

        {/* 서비스 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {visibleServices.map((s) => {
            const id = `${s.categoryKey}:${s.name}`;
            return (
              <Link
                key={id}
                href={s.href}
                className="block rounded-[16px] p-5 transition-all duration-200 hover:-translate-y-[3px]"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #EAE7E2",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.04)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.09)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.04)";
                }}
              >
                <h3 className="text-[15px] font-bold mb-1.5 break-keep leading-snug" style={{ color: "#1A1A1A" }}>
                  {s.name}
                </h3>
                <p className="text-xs leading-relaxed break-keep" style={{ color: "#999999" }}>
                  {s.description}
                </p>
              </Link>
            );
          })}

          {/* 관리자 전용 — 창업 RPG 카드 */}
          {isAdmin && activeKey === ALL_KEY && (
            <Link
              href="/marketingrpg"
              className="block rounded-[16px] p-5 transition-all duration-200 hover:-translate-y-[3px]"
              style={{
                background: "#F5EED8",
                border: "1px solid #D4AF6A",
                boxShadow: "0 2px 8px rgba(180,140,30,0.1)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(180,140,30,0.2)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(180,140,30,0.1)";
              }}
            >
              <h3 className="text-[15px] font-bold mb-1.5 break-keep leading-snug" style={{ color: "#7A5500" }}>
                창업 RPG
              </h3>
              <p className="text-xs leading-relaxed break-keep" style={{ color: "#A07830" }}>
                마케팅 회사 창업 — 월 순수익 3,000만원까지의 여정
              </p>
            </Link>
          )}
        </div>

        {visibleServices.length === 0 && (
          <div className="text-center py-20 text-sm" style={{ color: "#BBBBBB" }}>
            아직 출시된 서비스가 없어요.
          </div>
        )}
      </div>

      <footer className="text-center py-6">
        <p className="text-xs" style={{ color: "#CCCCCC" }}>© 2025 도구맨</p>
      </footer>
    </div>
  );
}