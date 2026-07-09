// app/page.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { Icon } from "@iconify/react";
import AuthButton from "@/components/auth/AuthButton";
import {
  supabase,
  fetchFridgeStock,
  addFridgeStockItem,
  removeFridgeStockItem,
  fetchMyRecipes,
  saveRecipe,
  updateRecipe,
  deleteRecipe,
  type FridgeStep,
} from "@/lib/fridge-db";

type Tab = "stock" | "recipe" | "search" | "timetable";
type Recipe = {
  id: string;
  name: string;
  source: string;
  ingredients: string[];
  steps: FridgeStep[];
  totalTime: number;
  youtubeUrl: string;
};
type IngRow = { text: string };
type StepRow = { label: string; unit: "min" | "sec"; value: number };
type Video = { id: string; title: string; thumbnail: string; publishedAt: string };
type YtChannel = {
  channelId: string;
  channelTitle: string;
  channelThumb: string;
  subCount: string;
  videos: Video[];
  nextPageToken: string | null;
  prevPageToken: string | null;
  totalResults: number;
};

const STEP_SHADES = ["#18181B", "#3F3F46", "#52525B", "#71717A", "#A1A1AA", "#D4D4D8"];
const YT_PRESETS = ["냉부해", "승우아빠", "은수저", "육식맨", "이원일", "정호영"];

const cardCls = "bg-white rounded-[14px] border border-zinc-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 mb-4";
const inputCls = "w-full bg-zinc-50 border border-zinc-200 rounded-[10px] px-3 py-2.5 text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900 transition-colors";
const btnPrimaryCls = "bg-zinc-900 text-white rounded-[10px] px-4 py-2.5 text-[13px] font-bold hover:bg-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed";
const btnSecondaryCls = "bg-white text-zinc-700 border border-zinc-200 rounded-[8px] px-3 py-1.5 text-[12px] font-semibold hover:border-zinc-400 transition-colors";
const btnDestructiveCls = "text-[11px] font-semibold text-zinc-400 hover:text-red-600 transition-colors";

function emptyIngRows(): IngRow[] {
  return [{ text: "" }];
}
function emptyStepRows(): StepRow[] {
  return [{ label: "", unit: "min", value: 1 }];
}
function videoUrl(id: string) {
  return `https://youtube.com/watch?v=${id}`;
}
function toggleStepUnit(row: StepRow): StepRow {
  if (row.unit === "min") return { ...row, unit: "sec", value: Math.round(row.value * 60) };
  return { ...row, unit: "min", value: Math.max(0, Math.round(row.value / 60)) };
}
function stepRowDurMinutes(row: StepRow): number {
  return row.unit === "min" ? row.value : row.value / 60;
}
function stepsToStepRows(steps: FridgeStep[]): StepRow[] {
  if (!steps.length) return emptyStepRows();
  return steps.map((s) => {
    const totalSeconds = Math.round(s.dur * 60);
    if (totalSeconds % 60 === 0) return { label: s.label, unit: "min" as const, value: totalSeconds / 60 };
    return { label: s.label, unit: "sec" as const, value: totalSeconds };
  });
}

function matchPct(recipe: Recipe, stockNames: Set<string>) {
  if (!recipe.ingredients.length) return 0;
  const matched = recipe.ingredients.filter((i) => stockNames.has(i)).length;
  return Math.round((matched / recipe.ingredients.length) * 100);
}

function PctBar({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-bold text-zinc-900 flex-shrink-0 min-w-[58px]">{pct}% 준비됨</span>
      <div className="flex-1 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
        <div className="h-full bg-zinc-900 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function FridgePage() {
  const [tab, setTab] = useState<Tab>("stock");
  const [userId, setUserId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const [stock, setStock] = useState<string[]>([]);
  const [stockInput, setStockInput] = useState("");

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formSource, setFormSource] = useState("");
  const [formYoutubeUrl, setFormYoutubeUrl] = useState("");
  const [ingRows, setIngRows] = useState<IngRow[]>(emptyIngRows());
  const [stepRows, setStepRows] = useState<StepRow[]>(emptyStepRows());
  const [focusedIngRow, setFocusedIngRow] = useState<number | null>(null);

  const [selectedTT, setSelectedTT] = useState<Set<string>>(new Set());

  const [ytQuery, setYtQuery] = useState("");
  const [ytLoading, setYtLoading] = useState(false);
  const [ytError, setYtError] = useState("");
  const [ytChannel, setYtChannel] = useState<YtChannel | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) { setUserId(data.user.id); loadAll(); }
      else setLoaded(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) { setUserId(session.user.id); loadAll(); }
      else { setUserId(null); setStock([]); setRecipes([]); setLoaded(true); }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const loadAll = async () => {
    const [stockData, recipeData] = await Promise.all([fetchFridgeStock(), fetchMyRecipes()]);
    setStock(stockData.map((s) => s.name));
    setRecipes(recipeData.map((r) => ({
      id: r.id, name: r.name, source: r.source ?? "", ingredients: r.ingredients ?? [],
      steps: r.steps ?? [], totalTime: r.total_time, youtubeUrl: r.youtube_url ?? "",
    })));
    setLoaded(true);
  };

  const stockNames = useMemo(() => new Set(stock), [stock]);
  const makeableCount = recipes.filter((r) => matchPct(r, stockNames) >= 80).length;
  const registeredUrls = useMemo(() => new Set(recipes.map((r) => r.youtubeUrl).filter(Boolean)), [recipes]);

  const addStock = async () => {
    const name = stockInput.trim();
    if (!userId || !name || stockNames.has(name)) return;
    setStock((prev) => [...prev, name]);
    setStockInput("");
    await addFridgeStockItem(name);
  };

  const removeStock = async (name: string) => {
    setStock((prev) => prev.filter((n) => n !== name));
    await removeFridgeStockItem(name);
  };

  const openNewForm = () => {
    setEditingId(null);
    setFormName(""); setFormSource(""); setFormYoutubeUrl("");
    setIngRows(emptyIngRows()); setStepRows(emptyStepRows());
    setShowForm(true);
  };

  const openEditForm = (r: Recipe) => {
    setEditingId(r.id);
    setFormName(r.name); setFormSource(r.source); setFormYoutubeUrl(r.youtubeUrl || "");
    setIngRows(r.ingredients.length ? r.ingredients.map((text) => ({ text })) : emptyIngRows());
    setStepRows(stepsToStepRows(r.steps));
    setShowForm(true);
  };

  const openFormFromVideo = (v: Video, channelTitle: string) => {
    setEditingId(null);
    setFormName(v.title); setFormSource(channelTitle); setFormYoutubeUrl(videoUrl(v.id));
    setIngRows(emptyIngRows()); setStepRows(emptyStepRows());
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditingId(null); setFocusedIngRow(null); };

  const submitForm = async () => {
    if (!userId || !formName.trim()) return;
    const ingredients = ingRows.map((r) => r.text.trim()).filter(Boolean);
    const steps: FridgeStep[] = stepRows
      .filter((r) => r.label.trim())
      .map((r) => ({ label: r.label.trim(), dur: stepRowDurMinutes(r) }));
    const totalTime = Math.round(steps.reduce((sum, s) => sum + s.dur, 0));
    const youtubeUrl = formYoutubeUrl.trim() || null;
    const payload = { name: formName.trim(), source: formSource.trim() || null, ingredients, steps, total_time: totalTime, youtube_url: youtubeUrl };

    if (editingId) {
      setRecipes((prev) => prev.map((r) => r.id === editingId
        ? { ...r, name: payload.name, source: payload.source ?? "", ingredients, steps, totalTime, youtubeUrl: youtubeUrl ?? "" }
        : r));
      await updateRecipe(editingId, payload);
    } else {
      const saved = await saveRecipe(payload);
      setRecipes((prev) => [{ id: saved.id, name: saved.name, source: saved.source ?? "", ingredients, steps, totalTime, youtubeUrl: saved.youtube_url ?? "" }, ...prev]);
    }
    closeForm();
  };

  const removeRecipe = async (id: string) => {
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    setSelectedTT((prev) => { const next = new Set(prev); next.delete(id); return next; });
    await deleteRecipe(id);
  };

  const toggleTT = (id: string) => {
    setSelectedTT((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const searchChannel = async () => {
    if (!ytQuery.trim()) return;
    setYtLoading(true); setYtError(""); setYtChannel(null);
    try {
      const res = await fetch("/api/search-channel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: ytQuery }) });
      const data = await res.json();
      if (data.error) setYtError(data.error);
      else setYtChannel(data);
    } catch {
      setYtError("검색 실패. 다시 시도해주세요.");
    } finally {
      setYtLoading(false);
    }
  };

  const pageChannel = async (pageToken: string | null) => {
    if (!pageToken || !ytChannel) return;
    setYtLoading(true);
    try {
      const res = await fetch("/api/search-channel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channelId: ytChannel.channelId, pageToken }) });
      const data = await res.json();
      if (!data.error) setYtChannel({ ...data, channelTitle: ytChannel.channelTitle, channelThumb: ytChannel.channelThumb, subCount: ytChannel.subCount });
    } finally {
      setYtLoading(false);
    }
  };

  const ttRecipes = recipes.filter((r) => selectedTT.has(r.id) && r.totalTime > 0);
  const maxTime = ttRecipes.length ? Math.max(...ttRecipes.map((r) => r.totalTime)) : 0;

  const tabDef: { key: Tab; label: string; desc: string }[] = [
    { key: "stock", label: "냉장고", desc: "재고 관리" },
    { key: "recipe", label: "레시피", desc: "등록 & 매칭" },
    { key: "search", label: "유튜버 검색", desc: "영상에서 등록" },
    { key: "timetable", label: "타임테이블", desc: "동시 완성 계획" },
  ];

  return (
    <div className="min-h-[100dvh] bg-zinc-50">
      <header
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-[12px] border-b border-zinc-200"
      >
        <div className="max-w-[720px] mx-auto px-5 h-14 flex items-center justify-between">
          <span className="text-[15px] font-bold tracking-tight text-zinc-900">냉장고 정리</span>
          <AuthButton />
        </div>
      </header>

      <main className="max-w-[720px] mx-auto px-5 pb-20 pt-6">
        <h1 className="text-[20px] font-extrabold tracking-tight text-zinc-900 break-keep mb-1">냉장고 레시피 관리</h1>
        <p className="text-[13px] text-zinc-500 break-keep mb-5">재고를 등록하고, 만들 수 있는 레시피를 확인하고, 동시에 완성할 타임테이블을 짜보세요.</p>

        {!userId && loaded && (
          <div className="mb-5 p-3 bg-zinc-100 border border-zinc-200 rounded-[10px] flex items-center gap-2">
            <Icon icon="solar:lock-keyhole-linear" className="text-zinc-500 flex-shrink-0" width={16} />
            <p className="text-[12px] font-semibold text-zinc-600 break-keep">로그인하면 냉장고와 레시피를 저장할 수 있어요.</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mb-6">
          {tabDef.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="text-center rounded-[14px] py-5 px-3 border-2 transition-all duration-150"
              style={{
                background: tab === t.key ? "#18181B" : "#fff",
                borderColor: tab === t.key ? "#18181B" : "#E4E4E7",
              }}
            >
              <div className="text-[14px] font-bold tracking-tight" style={{ color: tab === t.key ? "#fff" : "#18181B" }}>{t.label}</div>
              <div className="text-[11px] mt-1" style={{ color: tab === t.key ? "rgba(255,255,255,0.6)" : "#A1A1AA" }}>{t.desc}</div>
            </button>
          ))}
        </div>

        {tab === "stock" && (
          <div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white rounded-[14px] border border-zinc-200 p-4 text-center">
                <div className="text-[26px] font-extrabold text-zinc-900">{stock.length}</div>
                <div className="text-[11px] font-semibold text-zinc-400 mt-1">총 재료</div>
              </div>
              <div className="bg-white rounded-[14px] border border-zinc-200 p-4 text-center">
                <div className="text-[26px] font-extrabold text-zinc-900">{makeableCount}</div>
                <div className="text-[11px] font-semibold text-zinc-400 mt-1">만들 수 있는 레시피</div>
              </div>
            </div>
            <div className={cardCls}>
              <p className="text-[11px] font-bold text-zinc-400 tracking-wider mb-3">재료 추가</p>
              <div className="flex gap-2">
                <input
                  className={inputCls}
                  placeholder={userId ? "재료명 입력 후 Enter" : "로그인 후 사용 가능"}
                  disabled={!userId}
                  value={stockInput}
                  onChange={(e) => setStockInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addStock()}
                />
                <button onClick={addStock} disabled={!userId} className={btnPrimaryCls}>추가</button>
              </div>
            </div>
            <div className={cardCls}>
              <p className="text-[11px] font-bold text-zinc-400 tracking-wider mb-3">냉장고 목록 ({stock.length})</p>
              {stock.length === 0 ? (
                <p className="text-[12px] text-zinc-400 break-keep">아직 등록된 재료가 없어요.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {stock.map((name) => (
                    <div key={name} className="flex items-center gap-1 bg-zinc-100 border border-zinc-200 rounded-full pl-3 pr-1 py-1">
                      <span className="text-[12px] font-semibold text-zinc-900">{name}</span>
                      <button
                        onClick={() => removeStock(name)}
                        className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors"
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "recipe" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-extrabold text-zinc-900">내 레시피 ({recipes.length})</h2>
              <button onClick={openNewForm} disabled={!userId} className={btnPrimaryCls}>+ 레시피 등록</button>
            </div>

            {recipes.length === 0 ? (
              <div className="text-center py-16 text-[13px] text-zinc-400 break-keep">아직 등록된 레시피가 없어요.</div>
            ) : (
              <div className="flex flex-col gap-3">
                {recipes.map((r) => {
                  const pct = matchPct(r, stockNames);
                  return (
                    <div key={r.id} className={cardCls}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="text-[14px] font-bold text-zinc-900">{r.name}</p>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            {r.source ? `${r.source} · ` : ""}{r.totalTime > 0 ? `${r.totalTime}분` : "시간 미정"}
                          </p>
                          {r.youtubeUrl && (
                            <a href={r.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-zinc-400 hover:text-zinc-900 hover:underline">
                              영상 보기
                            </a>
                          )}
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button onClick={() => openEditForm(r)} className={btnSecondaryCls}>수정</button>
                          <button onClick={() => removeRecipe(r.id)} className={btnDestructiveCls}>삭제</button>
                        </div>
                      </div>
                      <PctBar pct={pct} />
                      {r.ingredients.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {r.ingredients.map((ing) => (
                            <span
                              key={ing}
                              className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                              style={stockNames.has(ing)
                                ? { background: "#18181B", color: "#fff" }
                                : { background: "#F4F4F5", color: "#A1A1AA" }}
                            >{ing}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === "search" && (
          <div>
            <div className={cardCls}>
              <p className="text-[11px] font-bold text-zinc-400 tracking-wider mb-3">유튜버 이름 검색</p>
              <div className="flex gap-2 mb-3">
                <input
                  className={inputCls}
                  placeholder="예: 육식맨, 백종원"
                  value={ytQuery}
                  onChange={(e) => setYtQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") searchChannel(); }}
                />
                <button onClick={searchChannel} disabled={ytLoading || !ytQuery.trim()} className={btnPrimaryCls}>
                  {ytLoading ? "검색 중..." : "검색"}
                </button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {YT_PRESETS.map((name) => (
                  <button
                    key={name}
                    onClick={() => setYtQuery(name)}
                    className="text-[11px] font-semibold px-3 py-1 rounded-full border border-zinc-200 bg-zinc-50 text-zinc-500 hover:border-zinc-400 hover:text-zinc-900 transition-colors"
                  >{name}</button>
                ))}
              </div>
              {ytError && <p className="mt-2 text-[11px] text-red-600">{ytError}</p>}
            </div>

            {ytChannel && (
              <div className={cardCls}>
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-zinc-100">
                  {ytChannel.channelThumb && <img src={ytChannel.channelThumb} alt="" className="w-10 h-10 rounded-full object-cover" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-zinc-900">{ytChannel.channelTitle}</p>
                    <p className="text-[11px] text-zinc-400">{ytChannel.subCount} · 최근 영상 {ytChannel.videos.length}개</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {ytChannel.videos.map((v) => {
                    const registered = registeredUrls.has(videoUrl(v.id));
                    return (
                      <div key={v.id} className="flex items-center gap-3 p-2 rounded-[10px] border border-zinc-200">
                        <img src={v.thumbnail} alt="" className="w-[100px] h-[56px] rounded-[6px] object-cover bg-zinc-100 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold text-zinc-900 leading-tight line-clamp-2 break-keep mb-1">{v.title}</p>
                          <p className="text-[11px] text-zinc-400 mb-0.5">{v.publishedAt}</p>
                          <a href={videoUrl(v.id)} target="_blank" rel="noopener noreferrer" className="text-[11px] text-zinc-500 hover:underline">
                            {videoUrl(v.id)}
                          </a>
                        </div>
                        {registered ? (
                          <span className="text-[11px] font-bold text-zinc-400 px-3 py-2 flex-shrink-0 whitespace-nowrap">이미 등록됨</span>
                        ) : (
                          <button
                            onClick={() => openFormFromVideo(v, ytChannel.channelTitle)}
                            disabled={!userId}
                            className={`${btnPrimaryCls} flex-shrink-0 text-[12px] py-2 whitespace-nowrap`}
                          >레시피 등록</button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-100">
                  <button disabled={!ytChannel.prevPageToken || ytLoading} onClick={() => pageChannel(ytChannel.prevPageToken)} className={`${btnSecondaryCls} disabled:opacity-30`}>← 이전</button>
                  <span className="text-[11px] font-semibold text-zinc-400">영상 총 {ytChannel.totalResults.toLocaleString()}개</span>
                  <button disabled={!ytChannel.nextPageToken || ytLoading} onClick={() => pageChannel(ytChannel.nextPageToken)} className={`${btnSecondaryCls} disabled:opacity-30`}>다음 →</button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "timetable" && (
          <div>
            <div className={cardCls}>
              <p className="text-[11px] font-bold text-zinc-400 tracking-wider mb-3">동시에 완성할 레시피 선택</p>
              {recipes.length === 0 ? (
                <p className="text-[12px] text-zinc-400 break-keep">먼저 레시피를 등록해주세요.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {recipes.map((r) => (
                    <label key={r.id} className="flex items-center gap-2.5 cursor-pointer">
                      <input type="checkbox" checked={selectedTT.has(r.id)} onChange={() => toggleTT(r.id)} className="w-4 h-4 accent-zinc-900" />
                      <span className="text-[13px] font-semibold text-zinc-900">{r.name}</span>
                      <span className="text-[11px] text-zinc-400">{r.totalTime > 0 ? `${r.totalTime}분` : "단계 없음"}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {ttRecipes.length > 0 && (
              <div className={cardCls}>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[11px] font-bold text-zinc-400 tracking-wider">타임테이블 (총 {maxTime}분에 동시 완성)</p>
                </div>
                <div className="flex flex-col gap-4">
                  {ttRecipes.map((r) => {
                    const offset = maxTime - r.totalTime;
                    let cursor = 0;
                    return (
                      <div key={r.id}>
                        <p className="text-[12px] font-bold text-zinc-900 mb-1.5">{r.name}</p>
                        <div className="relative h-6 bg-zinc-100 rounded-[6px] overflow-hidden">
                          {r.steps.map((s, i) => {
                            const left = ((offset + cursor) / maxTime) * 100;
                            const width = (s.dur / maxTime) * 100;
                            cursor += s.dur;
                            return (
                              <div
                                key={i}
                                title={`${s.label} (${s.dur}분)`}
                                className="absolute top-0 h-full flex items-center justify-center overflow-hidden"
                                style={{ left: `${left}%`, width: `${width}%`, background: STEP_SHADES[i % STEP_SHADES.length] }}
                              >
                                <span className="text-[9px] font-semibold text-white px-1 truncate">{s.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] text-zinc-400">0분 (지금 시작)</span>
                  <span className="text-[10px] text-zinc-400">{maxTime}분 (동시 완성)</span>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {showForm && (
        <div
          className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center bg-black/48 p-4 overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) closeForm(); }}
        >
          <div className="bg-white rounded-[16px] w-full max-w-[480px] my-8 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[15px] font-bold text-zinc-900">{editingId ? "레시피 수정" : "새 레시피"}</p>
              <button onClick={closeForm} className="text-zinc-400 hover:text-zinc-900 text-[18px] leading-none">✕</button>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-[11px] font-semibold text-zinc-500 mb-1">이름 *</p>
                <input className={inputCls} placeholder="예: 된장찌개" value={formName} onChange={(e) => setFormName(e.target.value)} />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-zinc-500 mb-1">출처 (선택)</p>
                <input className={inputCls} placeholder="예: 육식맨, 백종원" value={formSource} onChange={(e) => setFormSource(e.target.value)} />
              </div>
              {formYoutubeUrl && (
                <a href={formYoutubeUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-zinc-500 hover:underline break-all">
                  연결된 영상: {formYoutubeUrl}
                </a>
              )}
              <div>
                <p className="text-[11px] font-semibold text-zinc-500 mb-1">재료 (냉장고에 등록된 재료가 아래에 자동으로 추천돼요)</p>
                <div className="flex flex-col gap-2">
                  {ingRows.map((row, i) => {
                    const query = row.text.trim();
                    const suggestions = focusedIngRow === i && query
                      ? stock.filter((s) => s.includes(query) && s !== query)
                      : [];
                    return (
                      <div key={i} className="relative">
                        <div className="flex gap-2">
                          <input
                            className={inputCls}
                            placeholder="재료명"
                            value={row.text}
                            onFocus={() => setFocusedIngRow(i)}
                            onBlur={() => setTimeout(() => setFocusedIngRow((prev) => (prev === i ? null : prev)), 150)}
                            onChange={(e) => setIngRows((prev) => prev.map((r, idx) => idx === i ? { text: e.target.value } : r))}
                          />
                          <button
                            onClick={() => setIngRows((prev) => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev)}
                            className={btnDestructiveCls}
                          >삭제</button>
                        </div>
                        {suggestions.length > 0 && (
                          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-zinc-200 rounded-[8px] shadow-md z-10 max-h-[160px] overflow-y-auto">
                            {suggestions.map((s) => (
                              <button
                                key={s}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  setIngRows((prev) => prev.map((r, idx) => idx === i ? { text: s } : r));
                                  setFocusedIngRow(null);
                                }}
                                className="block w-full text-left px-3 py-2 text-[12px] text-zinc-900 hover:bg-zinc-100"
                              >{s}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <button onClick={() => setIngRows((prev) => [...prev, { text: "" }])} className={`${btnSecondaryCls} self-start`}>+ 재료 추가</button>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-zinc-500 mb-1">조리 단계</p>
                <div className="flex flex-col gap-2">
                  {stepRows.map((row, i) => (
                    <div key={i} className="flex flex-col gap-2 p-2.5 rounded-[10px] border border-zinc-200">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-zinc-100 border border-zinc-200 rounded-[8px] p-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => row.unit !== "min" && setStepRows((prev) => prev.map((r, idx) => idx === i ? toggleStepUnit(r) : r))}
                            className={`px-2 py-1 rounded-[6px] text-[11px] font-bold transition-colors ${row.unit === "min" ? "bg-zinc-900 text-white" : "text-zinc-500"}`}
                          >분</button>
                          <button
                            type="button"
                            onClick={() => row.unit !== "sec" && setStepRows((prev) => prev.map((r, idx) => idx === i ? toggleStepUnit(r) : r))}
                            className={`px-2 py-1 rounded-[6px] text-[11px] font-bold transition-colors ${row.unit === "sec" ? "bg-zinc-900 text-white" : "text-zinc-500"}`}
                          >초</button>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => setStepRows((prev) => prev.map((r, idx) => idx === i ? { ...r, value: Math.max(0, r.value - (r.unit === "min" ? 1 : 10)) } : r))}
                            className="w-7 h-7 rounded-full border border-zinc-200 text-zinc-600 text-[14px] font-bold hover:border-zinc-400 transition-colors"
                          >−</button>
                          <span className="text-[13px] font-bold text-zinc-900 w-[52px] text-center">{row.value}{row.unit === "min" ? "분" : "초"}</span>
                          <button
                            type="button"
                            onClick={() => setStepRows((prev) => prev.map((r, idx) => idx === i ? { ...r, value: r.value + (r.unit === "min" ? 1 : 10) } : r))}
                            className="w-7 h-7 rounded-full border border-zinc-200 text-zinc-600 text-[14px] font-bold hover:border-zinc-400 transition-colors"
                          >+</button>
                        </div>
                        <button
                          onClick={() => setStepRows((prev) => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev)}
                          className={`${btnDestructiveCls} ml-auto`}
                        >삭제</button>
                      </div>
                      <input
                        className={inputCls}
                        placeholder="조리 과정 (예: 재료 볶기)"
                        value={row.label}
                        onChange={(e) => setStepRows((prev) => prev.map((r, idx) => idx === i ? { ...r, label: e.target.value } : r))}
                      />
                    </div>
                  ))}
                  <button onClick={() => setStepRows((prev) => [...prev, { label: "", unit: "min", value: 1 }])} className={`${btnSecondaryCls} self-start`}>+ 단계 추가</button>
                </div>
              </div>
              <div className="flex gap-2 mt-1">
                <button onClick={submitForm} disabled={!formName.trim()} className={`${btnPrimaryCls} flex-1`}>{editingId ? "수정 저장" : "등록"}</button>
                <button onClick={closeForm} className={`${btnSecondaryCls} px-5`}>취소</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
