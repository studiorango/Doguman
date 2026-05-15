"use client";

import { LOCAL_STORAGE_KEY } from "@/types/bucket";
import { BUCKET_TEMPLATE } from "./bucket-template-data";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { ServiceHeader } from "@/components/doguman/service-header";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type BucketItem = {
  id: string;
  category: string;
  text: string;
  done: boolean;
  custom?: boolean;
};

type AiItem = {
  category: string;
  text: string;
};

const EMOJI_REGEX = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu;

function sanitizeText(input: string) {
  return input.replace(EMOJI_REGEX, "").replace(/\s+/g, " ").trim();
}

function buildTemplateItems(): BucketItem[] {
  const items: BucketItem[] = [];
  for (const [category, templateItems] of Object.entries(BUCKET_TEMPLATE)) {
    templateItems.forEach((t, index) => {
      items.push({
        id: `${category}-${index}`,
        category,
        text: sanitizeText(t.text),
        done: Boolean(t.done),
      });
    });
  }
  return items;
}

const TEMPLATE_ITEMS = buildTemplateItems();
const CUSTOM_STORAGE_KEY = `${LOCAL_STORAGE_KEY}_custom`;

function loadDoneMap(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      const map: Record<string, boolean> = {};
      for (const row of parsed as Array<unknown>) {
        if (!row || typeof row !== "object") continue;
        const r = row as { id?: unknown; done?: unknown };
        if (typeof r.id === "string") map[r.id] = Boolean(r.done);
      }
      return map;
    }
    if (parsed && typeof parsed === "object") return parsed as Record<string, boolean>;
    return {};
  } catch { return {}; }
}

function loadCustomItems(): BucketItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as BucketItem[];
  } catch { return []; }
}

const SERVICE_KEY = "bucket";
const ACCENT = "#6B5480";
const ACCENT_BG = "#EEE8F3";

export function BucketApp() {
  const [items, setItems] = useState<BucketItem[]>(() => {
    const doneMap = typeof window === "undefined" ? {} : loadDoneMap();
    const template = TEMPLATE_ITEMS.map((item) => ({ ...item, done: doneMap[item.id] ?? item.done }));
    const custom = typeof window === "undefined" ? [] : loadCustomItems();
    return [...template, ...custom];
  });

  const categories = useMemo(() => Object.keys(BUCKET_TEMPLATE), []);
  const [filter, setFilter] = useState<string>("전체");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstLoad = useRef(true);

  const [aiOpen, setAiOpen] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResults, setAiResults] = useState<AiItem[]>([]);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [aiError, setAiError] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase
        .from("user_calculator_states")
        .select("state")
        .eq("user_id", user.id)
        .eq("service_key", SERVICE_KEY)
        .single();
      if (data?.state) {
        const s = data.state as { doneMap?: Record<string, boolean>; customItems?: BucketItem[] };
        setItems([
          ...TEMPLATE_ITEMS.map((item) => ({ ...item, done: (s.doneMap ?? {})[item.id] ?? item.done })),
          ...(s.customItems ?? []),
        ]);
      }
    };
    init();
  }, []);

  const saveState = useCallback(async (currentItems: BucketItem[]) => {
    if (!userId) return;
    const doneMap: Record<string, boolean> = {};
    const customItems: BucketItem[] = [];
    for (const item of currentItems) {
      doneMap[item.id] = item.done;
      if (item.custom) customItems.push(item);
    }
    await supabase.from("user_calculator_states").upsert({
      user_id: userId, service_key: SERVICE_KEY,
      state: { doneMap, customItems }, updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,service_key" });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [userId]);

  useEffect(() => {
    const doneMap: Record<string, boolean> = {};
    const customItems: BucketItem[] = [];
    for (const item of items) {
      doneMap[item.id] = item.done;
      if (item.custom) customItems.push(item);
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(doneMap));
    localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(customItems));
    if (isFirstLoad.current) { isFirstLoad.current = false; return; }
    if (!userId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveState(items), 800);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [items, userId, saveState]);

  const filtered = useMemo(() => filter === "전체" ? items : items.filter((i) => i.category === filter), [filter, items]);
  const doneCount = useMemo(() => items.filter((i) => i.done).length, [items]);
  const pct = useMemo(() => items.length === 0 ? 0 : Math.round((doneCount / items.length) * 100), [doneCount, items.length]);
  const catStats = useMemo(() => {
    const result: Record<string, { total: number; done: number }> = {};
    for (const cat of categories) {
      const catItems = items.filter((i) => i.category === cat);
      result[cat] = { total: catItems.length, done: catItems.filter((i) => i.done).length };
    }
    return result;
  }, [categories, items]);

  const toggle = (id: string) => setItems((prev) => prev.map((i) => i.id === id ? { ...i, done: !i.done } : i));

  const addFromAi = (aiItem: AiItem, key: string) => {
    const newItem: BucketItem = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      category: aiItem.category, text: sanitizeText(aiItem.text), done: false, custom: true,
    };
    setItems((prev) => [...prev, newItem]);
    setAddedIds((prev) => new Set(prev).add(key));
  };

  const fetchAiRecommendations = async () => {
    if (!aiInput.trim()) return;
    setAiLoading(true); setAiError(""); setAiResults([]);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          messages: [{ role: "user", content: `당신은 버킷리스트 전문 코치입니다.\n사용자 정보: ${aiInput}\n카테고리: ${categories.join(", ")}\n12개 추천. JSON만 반환: [{"category":"카테고리명","text":"항목"},...]\n이모지 금지, 한국어, 구체적으로.` }],
        }),
      });
      const data = await res.json();
      setAiResults(JSON.parse((data.content?.[0]?.text ?? "[]").replace(/```json|```/g, "").trim()) as AiItem[]);
    } catch { setAiError("추천을 불러오는 데 실패했어요. 다시 시도해주세요."); }
    finally { setAiLoading(false); }
  };

  const card = "bg-white rounded-[16px] border border-[#EAE7E2] shadow-[0_2px_8px_rgba(0,0,0,0.05)]";

  return (
    <div className="min-h-[100dvh]" style={{ background: "#FAF9F7" }}>

      <ServiceHeader />

      {/* 히어로 */}
      <div className="relative overflow-hidden" style={{ borderBottom: "1px solid #EAE7E2" }}>
        <div className="absolute inset-0 pointer-events-none z-0" style={{ backgroundImage: "radial-gradient(circle, #A09890 1px, transparent 1px)", backgroundSize: "22px 22px", opacity: 0.09 }} />
        <div className="relative z-10 mx-auto px-6 pt-10 pb-10" style={{ maxWidth: "1040px" }}>
          <h1 className="text-[32px] font-bold leading-tight tracking-tight break-keep mb-2" style={{ color: "#1A1A1A" }}>버킷리스트</h1>
          <p className="text-[14px] break-keep" style={{ color: "#999999" }}>죽기 전에 꼭 해볼 것들을 기록하고 달성해보세요.</p>
        </div>
      </div>

      <main className="mx-auto px-6 py-8 pb-24" style={{ maxWidth: "1040px" }}>
        <div className={`${card} p-6 mb-4`}>
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[{ label: "전체 목표", value: items.length }, { label: "달성 완료", value: doneCount }, { label: "남은 항목", value: items.length - doneCount }].map((s) => (
              <div key={s.label} className="rounded-[12px] p-4 text-center" style={{ background: "#F5F5F5" }}>
                <div className="text-[28px] font-extrabold tracking-tight" style={{ color: ACCENT }}>{s.value}</div>
                <div className="text-[11px] font-semibold mt-0.5 break-keep" style={{ color: "#B0A99F" }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div className="h-[7px] rounded-full overflow-hidden mb-2" style={{ background: "#EAE7E2" }}>
            <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: ACCENT }} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[12px]" style={{ color: "#999" }}>전체 달성률</span>
            <span className="text-[15px] font-extrabold" style={{ color: "#1A1A1A" }}>{pct}%</span>
          </div>
        </div>

        <button onClick={() => { setAiOpen(!aiOpen); setTimeout(() => inputRef.current?.focus(), 100); }}
          className="w-full mb-4 flex items-center justify-center gap-3 py-4 rounded-[16px] text-[15px] font-bold transition-all hover:opacity-80 active:scale-[0.99]"
          style={{ background: "#1A1A1A", color: "#fff" }}>
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="8" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>
            <path d="M6 9.5C6.5 8 7.5 7 9 7C10.5 7 11.5 8 11.5 9.5C11.5 10.8 10.5 11.5 9 12" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
            <circle cx="9" cy="14.5" r="0.9" fill="white"/>
          </svg>
          {aiOpen ? "AI 추천 닫기" : "AI가 나만의 버킷리스트를 추천해드려요"}
        </button>

        {aiOpen && (
          <div className={`${card} p-6 mb-4`}>
            <p className="text-[14px] font-semibold mb-1" style={{ color: "#1A1A1A" }}>나를 소개해주세요</p>
            <p className="text-[12px] mb-3 break-keep" style={{ color: "#999" }}>나이, 관심사, 상황 등을 간단히 적어주시면 맞춤 추천을 드려요.</p>
            <textarea ref={inputRef} value={aiInput} onChange={(e) => setAiInput(e.target.value)}
              placeholder="예: 30대 직장인, 여행과 요리를 좋아함."
              className="w-full rounded-[10px] px-4 py-3 text-[13px] resize-none focus:outline-none"
              style={{ background: "#F5F5F5", border: "1px solid #E6E6E6", color: "#1A1A1A" }}
              rows={3} onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) fetchAiRecommendations(); }} />
            <button onClick={fetchAiRecommendations} disabled={aiLoading || !aiInput.trim()}
              className="mt-3 w-full py-3 rounded-[12px] text-[13px] font-semibold text-white disabled:opacity-40"
              style={{ background: "#1A1A1A" }}>
              {aiLoading ? "추천 생성 중..." : "추천받기"}
            </button>
            {aiError && <p className="mt-2 text-[12px]" style={{ color: "#7A4A42" }}>{aiError}</p>}
            {aiResults.length > 0 && (
              <div className="mt-5">
                <p className="text-[11px] font-semibold tracking-wider mb-3" style={{ color: "#B0A99F" }}>추천 목록 · {aiResults.length}개</p>
                <div className="flex flex-col gap-2">
                  {aiResults.map((item, i) => {
                    const key = `${item.category}-${item.text}`;
                    const added = addedIds.has(key);
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-[12px] border"
                        style={{ background: added ? ACCENT_BG : "#F5F5F5", borderColor: added ? ACCENT : "#EAE7E2" }}>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold break-keep" style={{ color: "#1A1A1A" }}>{item.text}</p>
                          <span className="inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: ACCENT_BG, color: ACCENT }}>{item.category}</span>
                        </div>
                        <button onClick={() => !added && addFromAi(item, key)} disabled={added}
                          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                          style={{ background: added ? ACCENT : "#fff", color: added ? "#fff" : ACCENT, border: added ? "none" : `1px solid ${ACCENT}` }}>
                          {added ? "✓" : "+"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <section className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {categories.map((cat) => {
            const stat = catStats[cat] ?? { total: 0, done: 0 };
            const catPct = stat.total === 0 ? 0 : Math.round((stat.done / stat.total) * 100);
            const active = filter === cat;
            return (
              <button key={cat} onClick={() => setFilter(active ? "전체" : cat)}
                className="text-left rounded-[14px] border p-4 transition-all duration-150 hover:-translate-y-[1px]"
                style={{ background: active ? ACCENT_BG : "#fff", borderColor: active ? ACCENT : "#EAE7E2", boxShadow: active ? `0 4px 12px rgba(107,84,128,0.08)` : "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[13px] font-bold break-keep" style={{ color: "#1A1A1A" }}>{cat}</span>
                  <span className="text-[12px] font-semibold" style={{ color: ACCENT }}>{stat.done}/{stat.total}</span>
                </div>
                <div className="text-[11px] mb-2" style={{ color: "#B0A99F" }}>{catPct}% 달성</div>
                <div className="h-[5px] rounded-full overflow-hidden" style={{ background: "#EAE7E2" }}>
                  <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${catPct}%`, background: ACCENT }} />
                </div>
              </button>
            );
          })}
        </section>

        {filter !== "전체" && (
          <button onClick={() => setFilter("전체")} className="mb-4 inline-flex items-center gap-2 h-9 px-4 rounded-full text-[13px] font-semibold"
            style={{ border: "1px solid #EAE7E2", background: "#fff", color: "#888" }}>← 전체 보기</button>
        )}

        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold tracking-wider" style={{ color: "#B0A99F" }}>{filter} · {filtered.length}개</span>
          {!userId && <span className="text-[11px]" style={{ color: "#C8C2BA" }}>로그인하면 자동 저장돼요</span>}
        </div>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {filtered.length === 0 ? (
            <div className={`col-span-2 ${card} p-6 text-[13px] text-center`} style={{ color: "#B0A99F" }}>항목이 없습니다.</div>
          ) : (
            filtered.map((item) => (
              <button key={item.id} onClick={() => toggle(item.id)}
                onMouseEnter={() => setHoveredId(item.id)} onMouseLeave={() => setHoveredId(null)}
                className="w-full text-left rounded-[13px] border px-4 py-3 transition-all duration-150 hover:-translate-y-[1px]"
                style={{
                  background: item.done ? ACCENT_BG : "#fff",
                  borderColor: item.done ? ACCENT : hoveredId === item.id ? ACCENT : "#EAE7E2",
                  boxShadow: hoveredId === item.id && !item.done ? "0 4px 12px rgba(107,84,128,0.08)" : "0 1px 3px rgba(0,0,0,0.04)",
                }}>
                <div className="flex items-start gap-3">
                  <span className="pt-1 text-[11px] font-extrabold tabular-nums min-w-[28px] text-right" style={{ color: "#C8C2BA" }}>
                    {String(items.findIndex((x) => x.id === item.id) + 1).padStart(3, "0")}
                  </span>
                  <div className="h-6 w-6 rounded-[6px] flex items-center justify-center flex-shrink-0 border-2 transition-all mt-0.5"
                    style={{ background: item.done ? ACCENT : "#fff", borderColor: item.done ? ACCENT : "#D1D5DB" }}>
                    {item.done && <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2.5 7.2L5.8 10.5L11.7 3.9" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold break-keep" style={{ color: item.done ? ACCENT : "#1A1A1A", textDecoration: item.done ? "line-through" : "none" }}>
                      {item.text || "-"}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ background: ACCENT_BG, color: ACCENT }}>{item.category}</span>
                      {item.custom && <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ background: "#F5F5F5", color: "#B0A99F", border: "1px solid #EAE7E2" }}>AI 추천</span>}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </section>
      </main>
    </div>
  );
}