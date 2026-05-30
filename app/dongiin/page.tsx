"use client";

import { useState, useMemo, useEffect } from "react";
import type { ScrapedMovie } from "../api/dongiin-scrape/route";

const ALL_GENRES_STATIC = ["액션", "드라마", "스릴러", "코미디", "SF", "공포", "로맨스", "애니메이션", "다큐멘터리", "역사", "범죄", "미스터리", "전쟁", "뮤지컬", "판타지"];

const YEAR_RANGES = [
  { label: "~1969", min: 0, max: 1969 },
  { label: "1970~1989", min: 1970, max: 1989 },
  { label: "1990~1999", min: 1990, max: 1999 },
  { label: "2000~2009", min: 2000, max: 2009 },
  { label: "2010~2019", min: 2010, max: 2019 },
  { label: "2020~", min: 2020, max: 9999 },
];

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-[2px]">
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = rating >= i ? "full" : rating >= i - 0.5 ? "half" : "empty";
        return (
          <svg key={i} width="13" height="13" viewBox="0 0 24 24">
            {filled === "half" && (
              <defs>
                <linearGradient id={`h${i}`}>
                  <stop offset="50%" stopColor="#FFC83B" />
                  <stop offset="50%" stopColor="#DCDCDC" />
                </linearGradient>
              </defs>
            )}
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill={filled === "full" ? "#FFC83B" : filled === "half" ? `url(#h${i})` : "#DCDCDC"}
            />
          </svg>
        );
      })}
      <span className="ml-1 text-xs font-bold text-[#FFC83B]">{rating.toFixed(1)}</span>
    </span>
  );
}

type Filters = {
  search: string;
  ratings: number[];
  yearRange: string | null;
};

export default function DongiinPage() {
  const [movies, setMovies] = useState<ScrapedMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadPages, setLoadPages] = useState(10);
  const [filters, setFilters] = useState<Filters>({ search: "", ratings: [], yearRange: null });
  const [sort, setSort] = useState<"rating_desc" | "rating_asc" | "date_desc">("date_desc");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dongiin-scrape?pages=${loadPages}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setMovies(data.movies);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [loadPages]);

  function toggleRating(r: number) {
    setFilters((f) => ({
      ...f,
      ratings: f.ratings.includes(r) ? f.ratings.filter((x) => x !== r) : [...f.ratings, r],
    }));
  }

  const filtered = useMemo(() => {
    let list = movies;
    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      list = list.filter((m) => m.title.toLowerCase().includes(q) || m.review.toLowerCase().includes(q));
    }
    if (filters.ratings.length > 0) {
      list = list.filter((m) => filters.ratings.includes(m.rating));
    }
    if (filters.yearRange) {
      const range = YEAR_RANGES.find((r) => r.label === filters.yearRange);
      if (range) list = list.filter((m) => {
        const year = parseInt(m.date?.slice(0, 4) || "0");
        return year >= range.min && year <= range.max;
      });
    }
    return [...list].sort((a, b) => {
      if (sort === "rating_desc") return b.rating - a.rating;
      if (sort === "rating_asc") return a.rating - b.rating;
      return (b.date || "").localeCompare(a.date || "");
    });
  }, [movies, filters, sort]);

  const ratingGroups = useMemo(() => {
    const groups: Record<number, number> = {};
    movies.forEach((m) => { groups[m.rating] = (groups[m.rating] || 0) + 1; });
    return groups;
  }, [movies]);

  return (
    <div className="min-h-[100dvh] bg-[#FAFAFA] flex flex-col">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-[12px] border-b border-[#E6E6E6] h-14 sticky top-0 z-50 flex items-center justify-between px-6">
        <span className="text-sm font-bold text-[#222222]">이동진 추적기</span>
        {!loading && (
          <span className="text-xs text-[#8B8B8B]">
            {movies.length}편 수록 (최근 {loadPages * 5}개 포스팅)
          </span>
        )}
      </header>

      <main className="flex-1 max-w-[720px] mx-auto w-full px-5 py-6 flex flex-col gap-5">
        {/* 히어로 */}
        <div
          className="rounded-[20px] p-7 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #7C8C03, #A0B020, #CEDA80)" }}
        >
          <p className="text-xs font-semibold text-white/70 tracking-widest mb-2">FILM CRITIC</p>
          <h1 className="text-2xl font-extrabold text-white leading-tight break-keep">
            이동진이 별점을<br />매긴 영화들
          </h1>
          <p className="text-sm text-white/70 mt-2 break-keep">
            네이버 블로그 &apos;셀룰로이드 드림&apos; 실시간 연동
          </p>
        </div>

        {/* 로딩 */}
        {loading && (
          <div className="bg-white rounded-[14px] border border-[#E6E6E6] p-8 flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-3 border-[#CEDA80] border-t-[#7C8C03] animate-spin" style={{ borderWidth: 3 }} />
            <p className="text-sm text-[#8B8B8B]">블로그에서 별점 가져오는 중...</p>
          </div>
        )}

        {!loading && (
          <>
            {/* 검색 */}
            <input
              type="text"
              placeholder="영화 제목, 한줄평 검색..."
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              className="w-full bg-white border border-[#E6E6E6] rounded-[12px] px-4 py-3 text-sm text-[#222222] placeholder:text-[#999999] focus:outline-none focus:border-[#222222] transition-colors shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
            />

            {/* 필터 */}
            <div className="bg-white rounded-[14px] border border-[#E6E6E6] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 flex flex-col gap-4">
              {/* 별점 필터 */}
              <div>
                <p className="text-xs font-semibold text-[#8B8B8B] mb-2">별점</p>
                <div className="flex flex-wrap gap-2">
                  {[5.0, 4.5, 4.0, 3.5, 3.0, 2.5, 2.0, 1.5, 1.0].map((r) => {
                    const active = filters.ratings.includes(r);
                    const count = ratingGroups[r] || 0;
                    if (count === 0) return null;
                    return (
                      <button
                        key={r}
                        onClick={() => toggleRating(r)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-all duration-150"
                        style={{
                          background: active ? "#F4F6E0" : "#fff",
                          border: active ? "1px solid #CEDA80" : "1px solid #E6E6E6",
                          color: active ? "#7C8C03" : "#555555",
                        }}
                      >
                        {"★".repeat(Math.floor(r))}{r % 1 ? "½" : ""} {r.toFixed(1)}
                        <span className="ml-1 text-[10px] opacity-60">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 결과 헤더 */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#222222]">
                {filtered.length}편
                {(filters.ratings.length > 0 || filters.search) && (
                  <span className="text-[#8B8B8B] font-normal"> 검색됨</span>
                )}
              </p>
              <div className="flex items-center gap-2">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as typeof sort)}
                  className="text-xs font-semibold text-[#555555] bg-white border border-[#E6E6E6] rounded-[8px] px-3 py-1.5 focus:outline-none"
                >
                  <option value="date_desc">최신순</option>
                  <option value="rating_desc">별점 높은순</option>
                  <option value="rating_asc">별점 낮은순</option>
                </select>
              </div>
            </div>

            {/* 영화 목록 */}
            <div className="flex flex-col gap-2">
              {filtered.map((movie, i) => (
                <a
                  key={i}
                  href={movie.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white rounded-[14px] border border-[#E6E6E6] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 flex items-start gap-4 transition-all duration-150 hover:-translate-y-[1px] hover:border-[#CEDA80] hover:shadow-[0_4px_12px_rgba(124,140,3,0.08)]"
                >
                  {/* 별점 뱃지 */}
                  <div
                    className="flex-shrink-0 w-12 h-12 rounded-[10px] flex items-center justify-center font-extrabold text-base"
                    style={{
                      background: movie.rating >= 4.0 ? "#F4F6E0" : "#F5F5F5",
                      color: movie.rating >= 4.0 ? "#7C8C03" : "#8B8B8B",
                    }}
                  >
                    {movie.rating.toFixed(1)}
                  </div>

                  {/* 영화 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold text-[#222222] break-keep leading-snug">
                        {movie.title}
                      </p>
                      <StarDisplay rating={movie.rating} />
                    </div>
                    {movie.review && (
                      <p className="text-xs text-[#8B8B8B] mt-1.5 leading-relaxed break-keep line-clamp-2">
                        {movie.review}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {movie.date && (
                        <span className="text-[11px] text-[#BBBBBB]">{movie.date}</span>
                      )}
                      <span className="text-[11px] text-[#CEDA80]">↗ 원문</span>
                    </div>
                  </div>
                </a>
              ))}

              {filtered.length === 0 && (
                <div className="text-center py-16 text-sm text-[#BBBBBB]">
                  검색 결과가 없어요
                </div>
              )}
            </div>

            {/* 더 불러오기 */}
            <button
              onClick={() => setLoadPages((p) => p + 10)}
              className="w-full py-3 rounded-[12px] text-sm font-semibold bg-white border border-[#E6E6E6] text-[#555555] hover:bg-[#F5F5F5] transition-all"
            >
              더 불러오기 (+50개 포스팅)
            </button>

            <p className="text-center text-xs text-[#BBBBBB] break-keep pb-4">
              네이버 블로그 &apos;셀룰로이드 드림&apos; 실시간 연동 · 카드 클릭 시 원문으로 이동
            </p>
          </>
        )}
      </main>
    </div>
  );
}
