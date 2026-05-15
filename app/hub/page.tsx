import Link from "next/link";

export default function HubPage() {
  return (
    <div className="min-h-[100dvh] bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200/80 bg-white/70 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-6">
          <Link href="/" className="text-sm font-semibold break-keep">
            ← 콩나무
          </Link>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <p className="text-sm text-emerald-700 font-medium break-keep">
          콩나무
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight break-keep">
          통합 허브
        </h1>
        <p className="mt-4 text-base text-zinc-600 leading-relaxed break-keep">
          지금은 버킷리스트 도구 페이지만 연결되어 있습니다.
        </p>
        <Link
          href="/bucket"
          className="inline-flex mt-8 min-h-12 items-center justify-center px-6 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 transition break-keep"
        >
          버킷리스트 도구로 이동
        </Link>
      </main>
    </div>
  );
}

