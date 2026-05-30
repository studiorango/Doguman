"use client";

import { useState, useEffect, useCallback } from "react";

type Movie = {
  id: number;
  title: string;
  review: string;
  rating: number;
  post_no: string;
  post_title: string;
  date: string;
  source: string;
};

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

export default function DongiinPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [total, setTotal] = useState(0);
  const [distribution, setDistribution] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [rating, setRating] = useState("");
  const [sort, setSort] = useState("date_desc");

  const fetchMovies = useCallback(async (p: number, reset: boolean) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), sort });
    if (search) params.set("search", search);
    if (rating) params.set("rating", rating);

    const res = await fetch(`/api/dongiin-list?${params}`);
    const data = await res.json();

    if (data.ok) {
      setMovies((prev) => reset ? data.movies : [...prev, ...data.movies]);
      setTotal(data.total);
      setDistribution(data.distribution);
      setHasMore(data.movies.length === 50);
    }
    setLoading(false);
  }, [search, rating, sort]);

  useEffect(() => {
    setPage(1);
    fetchMovies(1, true);
  }, [fetchMovies]);

  function handleSearch() {
    setSearch(searchInput);
  }

  function loadMore() {
    const next = page + 1;
    setPage(next);
    fetchMovies(next, false);
  }

  const ratingOptions = [5.0, 4.5, 4.0, 3.5, 3.0, 2.5, 2.0, 1.5, 1.0, 0.5].filter(
    (r) => distribution[r.toString()]
  );

  return (
    <div className="min-h-[100dvh] bg-[#FAFAFA] flex flex-col">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-[12px] border-b border-[#E6E6E6] h-14 sticky top-0 z-50 flex items-center justify-between px-6">
        <span className="text-sm font-bold text-[#222222]">이동진 추적기</span>
        <span className="text-xs text-[#8B8B8B]">{total.toLocaleString()}편 수록</span>
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
            네이버 블로그 &apos;셀룰로이드 드림&apos; 전체 아카이브
          </p>
        </div>

        {/* 검색 */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="영화 제목, 한줄평 검색..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1 bg-white border border-[#E6E6E6] rounded-[12px] px-4 py-3 text-sm text-[#222222] placeholder:text-[#999999] focus:outline-none focus:border-[#222222] transition-colors shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
          />
          <button
            onClick={handleSearch}
            className="px-5 py-3 rounded-[12px] text-sm font-bold text-white transition-all hover:bg-[#5A6602]"
            style={{ background: "#7C8C03" }}
          >
            검색
          </button>
        </div>

        {/* 필터 */}
        <div className="bg-white rounded-[14px] border border-[#E6E6E6] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 flex flex-col gap-3">
          <div>
            <p className="text-xs font-semibold text-[#8B8B8B] mb-2">별점</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setRating("")}
                className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-all"
                style={{
                  background: rating === "" ? "#F4F6E0" : "#fff",
                  border: rating === "" ? "1px solid #CEDA80" : "1px solid #E6E6E6",
                  color: rating === "" ? "#7C8C03" : "#555555",
                }}
              >
                전체
              </button>
              {ratingOptions.map((r) => (
                <button
                  key={r}
                  onClick={() => setRating(rating === r.toString() ? "" : r.toString())}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-all"
                  style={{
                    background: rating === r.toString() ? "#F4F6E0" : "#fff",
                    border: rating === r.toString() ? "1px solid #CEDA80" : "1px solid #E6E6E6",
                    color: rating === r.toString() ? "#7C8C03" : "#555555",
                  }}
                >
                  {"★".repeat(Math.floor(r))}{r % 1 ? "½" : ""} {r.toFixed(1)}
                  <span className="ml-1 opacity-50 text-[10px]">{distribution[r.toString()]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 결과 헤더 */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[#222222]">
            {total.toLocaleString()}편
            {(search || rating) && <span className="text-[#8B8B8B] font-normal"> 검색됨</span>}
          </p>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="text-xs font-semibold text-[#555555] bg-white border border-[#E6E6E6] rounded-[8px] px-3 py-1.5 focus:outline-none"
          >
            <option value="date_desc">최신순</option>
            <option value="rating_desc">별점 높은순</option>
            <option value="rating_asc">별점 낮은순</option>
          </select>
        </div>

        {/* 영화 목록 */}
        <div className="flex flex-col gap-2">
          {movies.map((movie) => (
            <a
              key={movie.id}
              href={movie.source}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-[14px] border border-[#E6E6E6] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 flex items-start gap-4 transition-all duration-150 hover:-translate-y-[1px] hover:border-[#CEDA80] hover:shadow-[0_4px_12px_rgba(124,140,3,0.08)]"
            >
              <div
                className="flex-shrink-0 w-12 h-12 rounded-[10px] flex items-center justify-center font-extrabold text-base"
                style={{
                  background: movie.rating >= 4.0 ? "#F4F6E0" : "#F5F5F5",
                  color: movie.rating >= 4.0 ? "#7C8C03" : "#8B8B8B",
                }}
              >
                {movie.rating.toFixed(1)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold text-[#222222] break-keep leading-snug">{movie.title}</p>
                  <StarDisplay rating={movie.rating} />
                </div>
                {movie.review && (
                  <p className="text-xs text-[#8B8B8B] mt-1.5 leading-relaxed break-keep line-clamp-2">
                    {movie.review}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  {movie.date && <span className="text-[11px] text-[#BBBBBB]">{movie.date}</span>}
                  <span className="text-[11px] text-[#CEDA80]">↗ 원문</span>
                </div>
              </div>
            </a>
          ))}

          {loading && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 rounded-full border-2 border-[#CEDA80] border-t-[#7C8C03] animate-spin" />
            </div>
          )}

          {!loading && movies.length === 0 && (
            <div className="text-center py-16 text-sm text-[#BBBBBB]">
              {total === 0 ? "아직 데이터가 없어요. 관리자 페이지에서 수집을 시작하세요." : "검색 결과가 없어요"}
            </div>
          )}
        </div>

        {/* 더 보기 */}
        {hasMore && !loading && movies.length > 0 && (
          <button
            onClick={loadMore}
            className="w-full py-3 rounded-[12px] text-sm font-semibold bg-white border border-[#E6E6E6] text-[#555555] hover:bg-[#F5F5F5] transition-all"
          >
            더 보기
          </button>
        )}

        <p className="text-center text-xs text-[#BBBBBB] pb-4">
          네이버 블로그 &apos;셀룰로이드 드림&apos; 아카이브 · 카드 클릭 시 원문으로 이동
        </p>
      </main>
    </div>
  );
}
