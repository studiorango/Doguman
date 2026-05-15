import Link from "next/link";

export default function BlogPage() {
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
          {/* 왼쪽 — 로고 */}
          <div className="flex items-center">
            <Link
              href="/"
              className="text-[17px] font-bold tracking-tight"
              style={{ color: "#1A1A1A" }}
            >
              김민제
            </Link>
          </div>

          {/* 가운데 — 블로그 (현재 페이지라 진하게) */}
          <div className="flex items-center justify-center">
            <Link
              href="/blog"
              className="text-[15px] font-semibold"
              style={{ color: "#1A1A1A" }}
            >
              블로그
            </Link>
          </div>

          {/* 오른쪽 — 비워둠 */}
          <div />
        </div>
      </header>

      <main className="mx-auto px-6 pt-16 pb-20" style={{ maxWidth: "1040px" }}>
        <h1
          className="text-[36px] font-bold tracking-tight break-keep mb-3"
          style={{ color: "#1A1A1A" }}
        >
          블로그
        </h1>
        <p className="text-[15px] mb-12 break-keep" style={{ color: "#999999" }}>
          만들면서 배운 것들을 기록합니다.
        </p>

        {/* 글 목록 — 나중에 실제 데이터로 교체 */}
        <div className="flex flex-col">
          {[
            { title: "첫 번째 글 제목", date: "2025. 1. 1", description: "글 요약이 여기에 들어갑니다." },
            { title: "두 번째 글 제목", date: "2025. 1. 8", description: "글 요약이 여기에 들어갑니다." },
            { title: "세 번째 글 제목", date: "2025. 1. 15", description: "글 요약이 여기에 들어갑니다." },
          ].map((post, i) => (
            <Link
              key={i}
              href="#"
              className="flex items-start justify-between py-6 transition-opacity duration-150 hover:opacity-60"
              style={{ borderBottom: "1px solid #EAE7E2" }}
            >
              <div>
                <h2 className="text-[16px] font-bold mb-1 break-keep" style={{ color: "#1A1A1A" }}>
                  {post.title}
                </h2>
                <p className="text-[13px] break-keep" style={{ color: "#999999" }}>
                  {post.description}
                </p>
              </div>
              <span className="text-[12px] flex-shrink-0 ml-8 mt-0.5" style={{ color: "#BBBBBB" }}>
                {post.date}
              </span>
            </Link>
          ))}
        </div>
      </main>

      <footer className="text-center py-6">
        <p className="text-xs" style={{ color: "#CCCCCC" }}>© 2025 김민제</p>
      </footer>
    </div>
  );
}