"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";

type Video = {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
};

type Snapshot = {
  view_count: number;
  like_count: number;
  comment_count: number;
  captured_at: string;
};

type TrackedVideo = {
  video_id: string;
  channel_id: string;
  channel_title: string;
  title: string;
  thumbnail: string;
  published_at: string | null;
  created_at: string;
  snapshots: Snapshot[];
};

type ChannelInfo = { channelId: string; channelTitle: string; channelThumb: string; subCount: string };

// 47,200 형태 + 만/억 단위 병기
function fmt(n: number) {
  return n.toLocaleString("ko-KR");
}
function fmtShort(n: number) {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}만`;
  return fmt(n);
}
function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor(diff / 60_000);
  if (h >= 1) return `${h}시간 전`;
  if (m >= 1) return `${m}분 전`;
  return "방금 전";
}

// 스냅샷 → 미니 라인차트 (SVG)
function MiniChart({ snapshots }: { snapshots: Snapshot[] }) {
  const W = 260;
  const H = 64;
  const P = 4;
  if (snapshots.length < 2) {
    return (
      <div className="flex h-16 items-center justify-center text-xs text-[#BBBBBB] break-keep">
        데이터 수집 중 · 2시간마다 기록됩니다
      </div>
    );
  }
  const xs = snapshots.map((s) => new Date(s.captured_at).getTime());
  const ys = snapshots.map((s) => s.view_count);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  const pts = snapshots.map((s) => {
    const x = P + ((new Date(s.captured_at).getTime() - minX) / spanX) * (W - 2 * P);
    const y = H - P - ((s.view_count - minY) / spanY) * (H - 2 * P);
    return [x, y];
  });
  const line = pts.map((p) => p.join(",")).join(" ");
  const area = `${P},${H - P} ${line} ${W - P},${H - P}`;
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height: 64 }}>
      <polygon points={area} fill="#F4F6E0" />
      <polyline points={line} fill="none" stroke="#7C8C03" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r={3} fill="#7C8C03" />
    </svg>
  );
}

export default function Youtube48hPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [channel, setChannel] = useState<ChannelInfo | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [tracked, setTracked] = useState<TrackedVideo[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const loadTracked = useCallback(async () => {
    try {
      const res = await fetch("/api/youtube-48h/tracked");
      const data = await res.json();
      if (data.ok) setTracked(data.videos);
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    loadTracked();
  }, [loadTracked]);

  const trackedIds = new Set(tracked.map((t) => t.video_id));

  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/youtube-48h/recent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setChannel(null);
        setVideos([]);
      } else {
        setChannel({
          channelId: data.channelId,
          channelTitle: data.channelTitle,
          channelThumb: data.channelThumb,
          subCount: data.subCount,
        });
        setVideos(data.videos);
      }
    } catch {
      setError("검색 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function track(v: Video) {
    if (!channel) return;
    setBusy(v.id);
    try {
      await fetch("/api/youtube-48h/tracked", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: v.id,
          channelId: channel.channelId,
          channelTitle: channel.channelTitle,
          title: v.title,
          thumbnail: v.thumbnail,
          publishedAt: v.publishedAt,
        }),
      });
      await loadTracked();
    } finally {
      setBusy(null);
    }
  }

  async function untrack(videoId: string) {
    setBusy(videoId);
    try {
      await fetch("/api/youtube-48h/tracked", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
      });
      await loadTracked();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[#F5F7FA] text-[#222222]">
      {/* Sticky 헤더 */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-[#E6E6E6] bg-white/80 px-5 backdrop-blur-[12px]">
        <Link href="/hub" className="text-sm font-semibold break-keep text-[#222222]">
          ← 콩나무
        </Link>
        <span className="text-xs font-semibold text-[#8B8B8B] break-keep">48시간 조회수</span>
      </header>

      <main className="mx-auto max-w-[720px] px-5 pb-20">
        {/* Hero */}
        <section
          className="mt-6 overflow-hidden rounded-[20px] p-7 text-white"
          style={{ background: "linear-gradient(135deg, #7C8C03, #A0B020, #CEDA80)" }}
        >
          <p className="text-sm font-semibold text-white/70 break-keep">유튜브 조회수 추적</p>
          <h1 className="mt-1 text-3xl font-bold leading-tight tracking-tight break-keep md:text-4xl">
            48시간 조회수를 한눈에
          </h1>
          <p className="mt-3 max-w-[46ch] text-sm leading-relaxed text-white/80 break-keep">
            채널을 검색해 최근 48시간에 올라온 영상의 조회수를 확인하고, 관심 영상을 추적하면 조회수가 어떻게
            늘어나는지 시간대별로 기록합니다.
          </p>
        </section>

        {/* 검색바 */}
        <form onSubmit={search} className="mt-6 flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="유튜브 채널명을 입력하세요"
            className="w-full rounded-[10px] border border-[#E6E6E6] bg-[#F5F5F5] px-4 py-3 text-sm text-[#222222] placeholder:text-[#999999] transition-colors focus:border-[#222222] focus:bg-white focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex min-h-12 items-center gap-1.5 whitespace-nowrap rounded-[12px] bg-[#7C8C03] px-6 text-sm font-semibold text-white transition-all duration-150 hover:bg-[#5A6602] active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? (
              <Icon icon="solar:refresh-linear" className="animate-spin text-lg" />
            ) : (
              <Icon icon="solar:magnifer-linear" className="text-lg" />
            )}
            검색
          </button>
        </form>
        {error && <p className="mt-2 text-xs text-[#F94239] break-keep">{error}</p>}

        {/* 채널 정보 */}
        {channel && (
          <div className="mt-6 flex items-center gap-3 rounded-[14px] border border-[#E6E6E6] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            {channel.channelThumb && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={channel.channelThumb} alt="" className="h-11 w-11 rounded-full" />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-bold break-keep">{channel.channelTitle}</p>
              <p className="text-xs text-[#8B8B8B] break-keep">{channel.subCount}</p>
            </div>
          </div>
        )}

        {/* 최근 48시간 영상 */}
        {channel && (
          <section className="mt-6">
            <h2 className="mb-3 text-sm font-bold text-[#222222] break-keep">
              최근 48시간 업로드
              <span className="ml-1.5 font-semibold text-[#8B8B8B]">{videos.length}개</span>
            </h2>
            {videos.length === 0 ? (
              <div className="rounded-[14px] border border-[#E6E6E6] bg-white p-8 text-center text-sm text-[#8B8B8B] break-keep">
                최근 48시간 동안 올라온 영상이 없습니다.
              </div>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {videos.map((v, i) => {
                  const isTracked = trackedIds.has(v.id);
                  return (
                    <li
                      key={v.id}
                      className="flex gap-3 rounded-[13px] border border-[#E6E6E6] bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
                    >
                      <a
                        href={`https://youtube.com/watch?v=${v.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="relative shrink-0"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={v.thumbnail} alt="" className="h-[68px] w-[120px] rounded-[8px] object-cover" />
                        {i < 3 && (
                          <span className="absolute left-1 top-1 rounded-full bg-[#7C8C03] px-1.5 py-0.5 text-[10px] font-bold text-white">
                            #{i + 1}
                          </span>
                        )}
                      </a>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <a
                          href={`https://youtube.com/watch?v=${v.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="line-clamp-2 text-sm font-semibold leading-snug break-keep hover:text-[#7C8C03]"
                        >
                          {v.title}
                        </a>
                        <div className="mt-auto flex items-center gap-2 pt-1">
                          <span className="text-base font-extrabold tracking-tight text-[#7C8C03]">
                            {fmtShort(v.viewCount)}
                          </span>
                          <span className="text-[11px] text-[#8B8B8B]">회 · {relTime(v.publishedAt)}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-[#8B8B8B]">
                          <span className="flex items-center gap-0.5">
                            <Icon icon="solar:like-linear" /> {fmtShort(v.likeCount)}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Icon icon="solar:chat-round-linear" /> {fmtShort(v.commentCount)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => (isTracked ? untrack(v.id) : track(v))}
                        disabled={busy === v.id}
                        className={`shrink-0 self-center rounded-[10px] px-3 py-2 text-xs font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-60 ${
                          isTracked
                            ? "border border-[#CEDA80] bg-[#F4F6E0] text-[#7C8C03]"
                            : "bg-[#F5F5F5] text-[#222222] hover:bg-[#E6E6E6]"
                        }`}
                      >
                        {busy === v.id ? "…" : isTracked ? "추적 중" : "＋ 추적"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        {/* 추적 중인 영상 */}
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-bold text-[#222222] break-keep">
            추적 중인 영상
            <span className="ml-1.5 font-semibold text-[#8B8B8B]">{tracked.length}개</span>
          </h2>
          {tracked.length === 0 ? (
            <div className="rounded-[14px] border border-dashed border-[#DCDCDC] bg-white p-8 text-center text-sm text-[#8B8B8B] break-keep">
              위 목록에서 영상을 추적하면 여기에서 48시간 조회수 변화를 볼 수 있습니다.
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {tracked.map((t) => {
                const snaps = t.snapshots;
                const first = snaps[0];
                const last = snaps[snaps.length - 1];
                const delta = first && last ? last.view_count - first.view_count : 0;
                const current = last?.view_count ?? 0;
                const startedH = Math.max(1, Math.round((Date.now() - new Date(t.created_at).getTime()) / 3_600_000));
                return (
                  <li
                    key={t.video_id}
                    className="overflow-hidden rounded-[14px] border border-[#E6E6E6] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
                  >
                    <div className="flex gap-3 p-3">
                      <a href={`https://youtube.com/watch?v=${t.video_id}`} target="_blank" rel="noreferrer" className="shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={t.thumbnail} alt="" className="h-[54px] w-[96px] rounded-[8px] object-cover" />
                      </a>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-semibold leading-snug break-keep">{t.title}</p>
                        <p className="mt-0.5 text-[11px] text-[#8B8B8B] break-keep">{t.channel_title}</p>
                      </div>
                      <button
                        onClick={() => untrack(t.video_id)}
                        disabled={busy === t.video_id}
                        className="shrink-0 self-start rounded-[8px] p-1.5 text-[#BBBBBB] transition-colors hover:bg-[#FFF5F5] hover:text-[#F94239] disabled:opacity-60"
                        aria-label="추적 해제"
                      >
                        <Icon icon="solar:trash-bin-trash-linear" className="text-lg" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-px border-t border-[#F5F5F5] bg-[#F5F5F5] text-center">
                      <div className="bg-white py-2.5">
                        <p className="text-[17px] font-extrabold tracking-tight text-[#222222]">{fmtShort(current)}</p>
                        <p className="text-[10px] font-semibold text-[#8B8B8B]">현재 조회수</p>
                      </div>
                      <div className="bg-white py-2.5">
                        <p className="text-[17px] font-extrabold tracking-tight text-[#7C8C03]">+{fmtShort(delta)}</p>
                        <p className="text-[10px] font-semibold text-[#8B8B8B]">추적 후 증가</p>
                      </div>
                      <div className="bg-white py-2.5">
                        <p className="text-[17px] font-extrabold tracking-tight text-[#222222]">{startedH}h</p>
                        <p className="text-[10px] font-semibold text-[#8B8B8B]">추적 시간</p>
                      </div>
                    </div>

                    <div className="border-t border-[#F5F5F5] px-3 py-2">
                      <MiniChart snapshots={snaps} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <p className="mt-10 text-center text-xs text-[#BBBBBB] break-keep">
          조회수 스냅샷은 2시간마다 자동으로 기록되며, 추적 시작 48시간 후 정리됩니다.
        </p>
      </main>
    </div>
  );
}
