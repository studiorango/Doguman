"use client";

import { useState, useMemo } from "react";
import { MOVIES, Movie } from "./data";

const RATINGS = [5.0, 4.5, 4.0, 3.5, 3.0, 2.5, 2.0, 1.5, 1.0, 0.5];

const ALL_GENRES = Array.from(
  new Set(MOVIES.flatMap((m) => m.genre))
).sort();

const ALL_COUNTRIES = Array.from(
  new Set(MOVIES.map((m) => m.country))
).sort();

const YEAR_RANGES = [
  { label: "~1969", min: 0, max: 1969 },
  { label: "1970~1989", min: 1970, max: 1989 },
  { label: "1990~1999", min: 1990, max: 1999 },
  { label: "2000~2009", min: 2000, max: 2009 },
  { label: "2010~2019", min: 2010, max: 2019 },
  { label: "2020~", min: 2020, max: 9999 },
];

function StarDisplay({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span className="flex items-center gap-[2px]">
      {Array.from({ length: full }).map((_, i) => (
        <svg key={`f${i}`} width="14" height="14" viewBox="0 0 24 24" fill="#FFC83B">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
      {half && (
        <svg width="14" height="14" viewBox="0 0 24 24">
          <defs>
            <linearGradient id="half">
              <stop offset="50%" stopColor="#FFC83B" />
              <stop offset="50%" stopColor="#DCDCDC" />
            </linearGradient>
          </defs>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="url(#half)" />
        </svg>
      )}
      {Array.from({ length: empty }).map((_, i) => (
        <svg key={`e${i}`} width="14" height="14" viewBox="0 0 24 24" fill="#DCDCDC">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
      <span className="ml-1 text-xs font-bold text-[#FFC83B]">{rating.toFixed(1)}</span>
    </span>
  );
}

type Filters = {
  search: string;
  ratings: number[];
  genres: string[];
  countries: string[];
  yearRange: string | null;
};

export default function DongiinPage() {
  const [filters, setFilters] = useState<Filters>({
    search: "",
    ratings: [],
    genres: [],
    countries: [],
    yearRange: null,
  });
  const [sort, setSort] = useState<"rating_desc" | "rating_asc" | "year_desc" | "year_asc">("rating_desc");

  const filtered = useMemo(() => {
    let list = MOVIES;

    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.titleEn?.toLowerCase().includes(q) ||
          m.director.toLowerCase().includes(q)
      );
    }
    if (filters.ratings.length > 0) {
      list = list.filter((m) => filters.ratings.includes(m.rating));
    }
    if (filters.genres.length > 0) {
      list = list.filter((m) => filters.genres.some((g) => m.genre.includes(g)));
    }
    if (filters.countries.length > 0) {
      list = list.filter((m) => filters.countries.includes(m.country));
    }
    if (filters.yearRange) {
      const range = YEAR_RANGES.find((r) => r.label === filters.yearRange);
      if (range) list = list.filter((m) => m.year >= range.min && m.year <= range.max);
    }

    return [...list].sort((a, b) => {
      if (sort === "rating_desc") return b.rating - a.rating || b.year - a.year;
      if (sort === "rating_asc") return a.rating - b.rating || b.year - a.year;
      if (sort === "year_desc") return b.year - a.year;
      return a.year - b.year;
    });
  }, [filters, sort]);

  function toggleArr<T>(arr: T[], val: T): T[] {
    return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
  }

  const hasFilter =
    filters.ratings.length > 0 ||
    filters.genres.length > 0 ||
    filters.countries.length > 0 ||
    filters.yearRange !== null ||
    filters.search.trim() !== "";

  return (
    <div className="min-h-[100dvh] bg-[#FAFAFA] flex flex-col">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-[12px] border-b border-[#E6E6E6] h-14 sticky top-0 z-50 flex items-center justify-between px-6">
        <span className="text-sm font-bold text-[#222222]">이동진 추적기</span>
        <span className="text-xs text-[#BBBBBB]">{MOVIES.length}편 수록</span>
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
            별점 · 장르 · 연도 · 국가로 필터링해보세요
          </p>
        </div>

        {/* 검색 */}
        <input
          type="text"
          placeholder="영화 제목, 감독 검색..."
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          className="w-full bg-white border border-[#E6E6E6] rounded-[12px] px-4 py-3 text-sm text-[#222222] placeholder:text-[#999999] focus:outline-none focus:border-[#222222] transition-colors shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
        />

        {/* 필터 */}
        <div className="bg-white rounded-[14px] border border-[#E6E6E6] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 flex flex-col gap-4">
          {/* 별점 */}
          <div>
            <p className="text-xs font-semibold text-[#8B8B8B] mb-2">별점</p>
            <div className="flex flex-wrap gap-2">
              {[5.0, 4.5, 4.0, 3.5, 3.0].map((r) => {
                const active = filters.ratings.includes(r);
                return (
                  <button
                    key={r}
                    onClick={() => setFilters((f) => ({ ...f, ratings: toggleArr(f.ratings, r) }))}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-all duration-150"
                    style={{
                      background: active ? "#F4F6E0" : "#fff",
                      border: active ? "1px solid #CEDA80" : "1px solid #E6E6E6",
                      color: active ? "#7C8C03" : "#555555",
                    }}
                  >
                    {"★".repeat(Math.floor(r))}{r % 1 ? "½" : ""} {r.toFixed(1)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-[#E6E6E6]" />

          {/* 장르 */}
          <div>
            <p className="text-xs font-semibold text-[#8B8B8B] mb-2">장르</p>
            <div className="flex flex-wrap gap-2">
              {ALL_GENRES.map((g) => {
                const active = filters.genres.includes(g);
                return (
                  <button
                    key={g}
                    onClick={() => setFilters((f) => ({ ...f, genres: toggleArr(f.genres, g) }))}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-all duration-150"
                    style={{
                      background: active ? "#F4F6E0" : "#fff",
                      border: active ? "1px solid #CEDA80" : "1px solid #E6E6E6",
                      color: active ? "#7C8C03" : "#555555",
                    }}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-[#E6E6E6]" />

          {/* 개봉 연도 */}
          <div>
            <p className="text-xs font-semibold text-[#8B8B8B] mb-2">개봉 연도</p>
            <div className="flex flex-wrap gap-2">
              {YEAR_RANGES.map((r) => {
                const active = filters.yearRange === r.label;
                return (
                  <button
                    key={r.label}
                    onClick={() =>
                      setFilters((f) => ({ ...f, yearRange: active ? null : r.label }))
                    }
                    className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-all duration-150"
                    style={{
                      background: active ? "#F4F6E0" : "#fff",
                      border: active ? "1px solid #CEDA80" : "1px solid #E6E6E6",
                      color: active ? "#7C8C03" : "#555555",
                    }}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-[#E6E6E6]" />

          {/* 국가 */}
          <div>
            <p className="text-xs font-semibold text-[#8B8B8B] mb-2">국가</p>
            <div className="flex flex-wrap gap-2">
              {ALL_COUNTRIES.map((c) => {
                const active = filters.countries.includes(c);
                return (
                  <button
                    key={c}
                    onClick={() =>
                      setFilters((f) => ({ ...f, countries: toggleArr(f.countries, c) }))
                    }
                    className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-all duration-150"
                    style={{
                      background: active ? "#F4F6E0" : "#fff",
                      border: active ? "1px solid #CEDA80" : "1px solid #E6E6E6",
                      color: active ? "#7C8C03" : "#555555",
                    }}
                  >
                    {c}
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
            {hasFilter && <span className="text-[#8B8B8B] font-normal"> 검색됨</span>}
          </p>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="text-xs font-semibold text-[#555555] bg-white border border-[#E6E6E6] rounded-[8px] px-3 py-1.5 focus:outline-none"
          >
            <option value="rating_desc">별점 높은순</option>
            <option value="rating_asc">별점 낮은순</option>
            <option value="year_desc">최신순</option>
            <option value="year_asc">오래된순</option>
          </select>
        </div>

        {/* 영화 목록 */}
        <div className="flex flex-col gap-2">
          {filtered.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-16 text-sm text-[#BBBBBB]">
              검색 결과가 없어요
            </div>
          )}
        </div>

        <p className="text-center text-xs text-[#BBBBBB] break-keep pb-4">
          왓챠피디아 이동진 평론가 공개 별점 기준 · 오류가 있을 수 있어요
        </p>
      </main>
    </div>
  );
}

function MovieCard({ movie }: { movie: Movie }) {
  return (
    <div className="bg-white rounded-[14px] border border-[#E6E6E6] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 flex items-center gap-4 transition-all duration-150 hover:-translate-y-[1px] hover:border-[#CEDA80] hover:shadow-[0_4px_12px_rgba(124,140,3,0.08)]">
      {/* 별점 뱃지 */}
      <div
        className="flex-shrink-0 w-12 h-12 rounded-[10px] flex items-center justify-center font-extrabold text-lg"
        style={{
          background: movie.rating >= 5.0 ? "#F4F6E0" : movie.rating >= 4.0 ? "#F4F6E0" : "#F5F5F5",
          color: movie.rating >= 4.0 ? "#7C8C03" : "#8B8B8B",
        }}
      >
        {movie.rating.toFixed(1)}
      </div>

      {/* 영화 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-bold text-[#222222] break-keep leading-snug">{movie.title}</p>
            {movie.titleEn && (
              <p className="text-xs text-[#BBBBBB] mt-0.5 truncate">{movie.titleEn}</p>
            )}
          </div>
          <StarDisplay rating={movie.rating} />
        </div>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="text-xs text-[#8B8B8B]">{movie.director}</span>
          <span className="text-xs text-[#DCDCDC]">·</span>
          <span className="text-xs text-[#8B8B8B]">{movie.year}</span>
          <span className="text-xs text-[#DCDCDC]">·</span>
          <span className="text-xs text-[#8B8B8B]">{movie.country}</span>
        </div>
        <div className="flex gap-1 mt-2 flex-wrap">
          {movie.genre.map((g) => (
            <span key={g} className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#F5F7FA] text-[#49627A]">
              {g}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
