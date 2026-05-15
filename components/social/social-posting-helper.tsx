"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Result = { twitter: string; threads: string };

export function SocialPostingHelper() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"x" | "th" | null>(null);

  const inputCount = input.length;
  const twitterCount = result?.twitter?.length ?? 0;
  const threadsCount = result?.threads?.length ?? 0;

  const convert = async () => {
    const text = input.trim();
    if (!text) return;

    setBusy(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/social/format", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: text }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "요청에 실패했습니다.");
      }

      const data = (await res.json()) as Result;
      setResult({
        twitter: data.twitter ?? "",
        threads: data.threads ?? "",
      });
    } catch {
      setError("변환 중 오류가 발생했어요. 다시 시도해주세요.");
    } finally {
      setBusy(false);
    }
  };

  const copy = async (which: "x" | "th") => {
    const text = which === "x" ? result?.twitter : result?.threads;
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(which);
    window.setTimeout(() => setCopied(null), 1500);
  };

  const cards = useMemo(
    () => [
      {
        key: "x" as const,
        title: "트위터 / X",
        limit: 280,
        value: result?.twitter ?? "",
      },
      {
        key: "th" as const,
        title: "스레드",
        limit: 500,
        value: result?.threads ?? "",
      },
    ],
    [result],
  );

  return (
    <div className="min-h-[100dvh] bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-sm border-b border-zinc-200/80">
        <div className="max-w-3xl mx-auto px-6 sm:px-8 h-14 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-emerald-700 break-keep">
              컨텐츠 제작
            </p>
            <h1 className="text-sm font-semibold tracking-tight break-keep">
              소셜 포스팅 도우미
            </h1>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/"
              className="text-sm text-zinc-500 hover:text-zinc-900 transition break-keep"
            >
              콩나무
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 sm:px-8 py-8 pb-16 space-y-6">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-sm">
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-widest break-keep">
            입력
          </p>
          <p className="mt-2 text-sm text-zinc-600 leading-relaxed break-keep">
            글을 한 번 쓰면 플랫폼별 길이에 맞춰 다듬어 드립니다.
          </p>

          <div className="mt-4">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="올리고 싶은 내용을 자유롭게 써주세요."
              rows={7}
              className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm leading-relaxed text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
            <div className="mt-2 flex justify-end">
              <span className="text-xs text-zinc-400 tabular-nums break-keep">
                {inputCount}자
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void convert()}
            disabled={busy || !input.trim()}
            className="mt-3 w-full min-h-12 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 disabled:opacity-50 disabled:pointer-events-none transition focus:outline-none focus:ring-2 focus:ring-emerald-500/40 break-keep"
          >
            {busy ? "변환 중…" : "변환하기"}
          </button>

          {error ? (
            <p className="mt-3 text-sm text-red-600 break-keep">{error}</p>
          ) : null}
        </section>

        <section className="grid grid-cols-1 gap-6">
          {cards.map((c) => {
            const count = c.key === "x" ? twitterCount : threadsCount;
            const over = count > c.limit;
            const canCopy = Boolean(c.value);
            return (
              <div
                key={c.key}
                className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-zinc-900 break-keep">
                    {c.title}
                  </p>
                  <button
                    type="button"
                    onClick={() => void copy(c.key)}
                    disabled={!canCopy}
                    className={[
                      "min-h-10 px-4 rounded-xl border text-sm font-semibold transition break-keep",
                      copied === c.key
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : "bg-white border-zinc-200 text-emerald-700 hover:bg-zinc-50",
                      !canCopy ? "opacity-40 pointer-events-none" : "",
                    ].join(" ")}
                  >
                    {copied === c.key ? "복사됨" : "복사"}
                  </button>
                </div>

                <div className="mt-4 rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm leading-relaxed text-zinc-900 whitespace-pre-wrap break-words min-h-[96px]">
                  {c.value || (
                    <span className="text-zinc-400 break-keep">
                      변환하면 여기에 표시됩니다.
                    </span>
                  )}
                </div>

                <div className="mt-2 flex justify-end">
                  <span
                    className={[
                      "text-xs tabular-nums break-keep",
                      over ? "text-red-600" : "text-zinc-400",
                    ].join(" ")}
                  >
                    {count}/{c.limit}자
                    {over ? " 초과" : ""}
                  </span>
                </div>
              </div>
            );
          })}
        </section>

        <p className="text-xs text-zinc-500 leading-relaxed break-keep">
          참고: 변환은 서버에서 처리됩니다. 설정이 되어 있지 않으면 오류가 표시될 수 있습니다.
        </p>
      </main>
    </div>
  );
}

