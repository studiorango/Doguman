"use client";

import { useState, useEffect, useMemo, useRef } from "react";

// ── 모노톤 디자인 토큰 ─────────────────────────────
const INK = "#18181b"; // zinc-900
const SUB = "#71717a"; // zinc-500
const HINT = "#a1a1aa"; // zinc-400
const LINE = "#e4e4e7"; // zinc-200
const FIELD = "#f4f4f5"; // zinc-100

const cardCls =
  "bg-white rounded-[16px] border border-[#e4e4e7] shadow-[0_1px_3px_rgba(0,0,0,0.04)]";
const inputCls =
  "w-full bg-[#f4f4f5] border border-[#e4e4e7] rounded-[10px] px-3 py-2.5 text-[14px] text-[#18181b] font-[inherit] placeholder:text-[#a1a1aa] focus:outline-none focus:bg-white focus:border-[#18181b] transition-colors";

// ── 타입 ───────────────────────────────────────────
type ScheduleItem = { id: string; time: string; title: string; memo: string };
type Day = { id: string; date: string; items: ScheduleItem[] };
type Todo = { id: string; text: string; done: boolean };
type PackItem = { id: string; text: string; done: boolean; cat: string };
type Expense = { id: string; label: string; cat: string; amount: number | "" };

type TripData = {
  title: string;
  startDate: string;
  endDate: string;
  budget: number | "";
  days: Day[];
  todos: Todo[];
  packing: PackItem[];
  expenses: Expense[];
};

const STORAGE_KEY = "travel-planner-v1";

const PACK_CATS = ["필수", "의류", "세면/위생", "전자기기", "기타"];
const EXPENSE_CATS = ["교통", "숙소", "식비", "관광", "쇼핑", "기타"];

const uid = () => crypto.randomUUID();

function defaultData(): TripData {
  return {
    title: "제주도 3박 4일",
    startDate: "",
    endDate: "",
    budget: "",
    days: [{ id: uid(), date: "", items: [] }],
    todos: [],
    packing: [],
    expenses: [],
  };
}

function fmt(n: number) {
  return n.toLocaleString("ko-KR");
}

// D-day 계산
function calcDday(start: string): { label: string; sub: string } {
  if (!start) return { label: "D-?", sub: "출발일 미정" };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const s = new Date(start + "T00:00:00");
  const diff = Math.round((s.getTime() - today.getTime()) / 86400000);
  if (diff > 0) return { label: `D-${diff}`, sub: "출발까지" };
  if (diff === 0) return { label: "D-DAY", sub: "오늘 출발" };
  return { label: `D+${-diff}`, sub: "여행 중/완료" };
}

type Tab = "schedule" | "todo" | "packing" | "expense";

export default function TravelPlannerPage() {
  const [data, setData] = useState<TripData | null>(null);
  const [tab, setTab] = useState<Tab>("schedule");
  const loaded = useRef(false);

  // 불러오기
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setData(raw ? { ...defaultData(), ...JSON.parse(raw) } : defaultData());
    } catch {
      setData(defaultData());
    }
    loaded.current = true;
  }, []);

  // 저장
  useEffect(() => {
    if (!loaded.current || !data) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const patch = (p: Partial<TripData>) =>
    setData((d) => (d ? { ...d, ...p } : d));

  // ── 통계 ──
  const stats = useMemo(() => {
    if (!data)
      return { dday: { label: "", sub: "" }, spent: 0, todoPct: 0, packPct: 0 };
    const spent = data.expenses.reduce(
      (a, e) => a + (typeof e.amount === "number" ? e.amount : 0),
      0
    );
    const todoDone = data.todos.filter((t) => t.done).length;
    const packDone = data.packing.filter((p) => p.done).length;
    return {
      dday: calcDday(data.startDate),
      spent,
      todoPct: data.todos.length
        ? Math.round((todoDone / data.todos.length) * 100)
        : 0,
      packPct: data.packing.length
        ? Math.round((packDone / data.packing.length) * 100)
        : 0,
    };
  }, [data]);

  if (!data) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center text-[#a1a1aa] text-sm">
        불러오는 중…
      </div>
    );
  }

  const budget = typeof data.budget === "number" ? data.budget : 0;
  const remain = budget - stats.spent;

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "schedule", label: "일정", icon: "ti-calendar-event" },
    { key: "todo", label: "할일", icon: "ti-checklist" },
    { key: "packing", label: "준비물", icon: "ti-briefcase" },
    { key: "expense", label: "경비", icon: "ti-wallet" },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#fafafa]">
      {/* Sticky 헤더 */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-[12px] border-b border-[#e4e4e7]">
        <div className="max-w-[720px] mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#18181b]">
            <i className="ti ti-plane-tilt text-[20px]" />
            <span className="font-bold tracking-tight">여행 플래너</span>
          </div>
          <span className="text-[12px] text-[#a1a1aa]">자동 저장됨</span>
        </div>
      </header>

      <main className="max-w-[720px] mx-auto px-5 pb-24">
        {/* Hero — 여행 기본 정보 */}
        <section
          className="rounded-[20px] p-6 mt-5 mb-5 text-white relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #27272a, #3f3f46, #52525b)" }}
        >
          <input
            value={data.title}
            onChange={(e) => patch({ title: e.target.value })}
            placeholder="여행 제목"
            className="w-full bg-transparent text-2xl md:text-3xl font-bold tracking-tight placeholder:text-white/40 focus:outline-none mb-4"
          />
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[11px] text-white/60 font-semibold">출발일</span>
              <input
                type="date"
                value={data.startDate}
                onChange={(e) => patch({ startDate: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-[10px] px-3 py-2 text-[13px] text-white mt-1 focus:outline-none focus:border-white/60 [color-scheme:dark]"
              />
            </label>
            <label className="block">
              <span className="text-[11px] text-white/60 font-semibold">도착일</span>
              <input
                type="date"
                value={data.endDate}
                onChange={(e) => patch({ endDate: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-[10px] px-3 py-2 text-[13px] text-white mt-1 focus:outline-none focus:border-white/60 [color-scheme:dark]"
              />
            </label>
          </div>
        </section>

        {/* 통계 카드 4열 */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard big={stats.dday.label} label={stats.dday.sub} />
          <StatCard big={`${fmt(stats.spent)}원`} label="지출 합계" small />
          <StatCard big={`${stats.todoPct}%`} label="할일 완료" />
          <StatCard big={`${stats.packPct}%`} label="준비물 완료" />
        </section>

        {/* 탭 */}
        <nav className="flex gap-2 mb-5">
          {tabs.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[12px] text-[13px] font-semibold transition-all ${
                  active
                    ? "bg-[#18181b] text-white"
                    : "bg-white text-[#71717a] border border-[#e4e4e7] hover:border-[#a1a1aa]"
                }`}
              >
                <i className={`ti ${t.icon} text-[16px]`} />
                {t.label}
              </button>
            );
          })}
        </nav>

        {tab === "schedule" && (
          <ScheduleTab days={data.days} onChange={(days) => patch({ days })} />
        )}
        {tab === "todo" && (
          <TodoTab todos={data.todos} onChange={(todos) => patch({ todos })} />
        )}
        {tab === "packing" && (
          <PackingTab
            packing={data.packing}
            onChange={(packing) => patch({ packing })}
          />
        )}
        {tab === "expense" && (
          <ExpenseTab
            expenses={data.expenses}
            budget={data.budget}
            remain={remain}
            spent={stats.spent}
            onChange={(expenses) => patch({ expenses })}
            onBudget={(budget) => patch({ budget })}
          />
        )}

        <p className="text-center text-[12px] text-[#a1a1aa] mt-10">
          데이터는 이 브라우저에 저장됩니다.
        </p>
      </main>
    </div>
  );
}

// ── 통계 카드 ───────────────────────────────────────
function StatCard({
  big,
  label,
  small,
}: {
  big: string;
  label: string;
  small?: boolean;
}) {
  return (
    <div className={`${cardCls} p-4 text-center`}>
      <div
        className={`${
          small ? "text-[18px]" : "text-[24px]"
        } font-extrabold tracking-tight text-[#18181b] leading-none`}
      >
        {big}
      </div>
      <div className="text-[11px] text-[#71717a] font-semibold mt-1.5">
        {label}
      </div>
    </div>
  );
}

// ── 일정 탭 ─────────────────────────────────────────
function ScheduleTab({
  days,
  onChange,
}: {
  days: Day[];
  onChange: (d: Day[]) => void;
}) {
  const addDay = () =>
    onChange([...days, { id: uid(), date: "", items: [] }]);
  const removeDay = (id: string) => onChange(days.filter((d) => d.id !== id));
  const patchDay = (id: string, p: Partial<Day>) =>
    onChange(days.map((d) => (d.id === id ? { ...d, ...p } : d)));

  const addItem = (dayId: string) => {
    const day = days.find((d) => d.id === dayId);
    if (!day) return;
    patchDay(dayId, {
      items: [...day.items, { id: uid(), time: "", title: "", memo: "" }],
    });
  };
  const patchItem = (dayId: string, itemId: string, p: Partial<ScheduleItem>) => {
    const day = days.find((d) => d.id === dayId);
    if (!day) return;
    patchDay(dayId, {
      items: day.items.map((it) => (it.id === itemId ? { ...it, ...p } : it)),
    });
  };
  const removeItem = (dayId: string, itemId: string) => {
    const day = days.find((d) => d.id === dayId);
    if (!day) return;
    patchDay(dayId, { items: day.items.filter((it) => it.id !== itemId) });
  };

  return (
    <div className="space-y-4">
      {days.map((day, i) => (
        <div key={day.id} className={`${cardCls} p-5`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#18181b] text-white text-[13px] font-bold">
                {i + 1}
              </span>
              <input
                type="date"
                value={day.date}
                onChange={(e) => patchDay(day.id, { date: e.target.value })}
                className="bg-[#f4f4f5] border border-[#e4e4e7] rounded-[8px] px-2.5 py-1.5 text-[13px] text-[#18181b] focus:outline-none focus:border-[#18181b]"
              />
            </div>
            {days.length > 1 && (
              <button
                onClick={() => removeDay(day.id)}
                className="text-[#a1a1aa] hover:text-[#18181b] transition-colors"
                aria-label="날짜 삭제"
              >
                <i className="ti ti-trash text-[18px]" />
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {day.items.map((it) => (
              <div
                key={it.id}
                className="flex gap-2 items-start bg-[#fafafa] rounded-[12px] p-2.5 border border-[#f4f4f5]"
              >
                <input
                  type="time"
                  value={it.time}
                  onChange={(e) =>
                    patchItem(day.id, it.id, { time: e.target.value })
                  }
                  className="bg-white border border-[#e4e4e7] rounded-[8px] px-2 py-2 text-[12px] text-[#18181b] focus:outline-none focus:border-[#18181b] shrink-0"
                />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <input
                    value={it.title}
                    onChange={(e) =>
                      patchItem(day.id, it.id, { title: e.target.value })
                    }
                    placeholder="장소 · 활동"
                    className="w-full bg-white border border-[#e4e4e7] rounded-[8px] px-2.5 py-2 text-[13px] font-medium text-[#18181b] placeholder:text-[#a1a1aa] focus:outline-none focus:border-[#18181b]"
                  />
                  <input
                    value={it.memo}
                    onChange={(e) =>
                      patchItem(day.id, it.id, { memo: e.target.value })
                    }
                    placeholder="메모 (선택)"
                    className="w-full bg-transparent px-1 text-[12px] text-[#71717a] placeholder:text-[#a1a1aa] focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => removeItem(day.id, it.id)}
                  className="text-[#a1a1aa] hover:text-[#18181b] transition-colors shrink-0 mt-1.5"
                  aria-label="일정 삭제"
                >
                  <i className="ti ti-x text-[16px]" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={() => addItem(day.id)}
            className="w-full mt-3 py-2.5 rounded-[10px] border border-dashed border-[#d4d4d8] text-[13px] font-semibold text-[#71717a] hover:border-[#18181b] hover:text-[#18181b] transition-colors flex items-center justify-center gap-1.5"
          >
            <i className="ti ti-plus text-[15px]" />
            일정 추가
          </button>
        </div>
      ))}

      <button
        onClick={addDay}
        className="w-full py-3.5 rounded-[14px] bg-[#18181b] text-white text-[14px] font-semibold hover:bg-[#3f3f46] transition-colors flex items-center justify-center gap-1.5"
      >
        <i className="ti ti-calendar-plus text-[17px]" />
        날짜 추가
      </button>
    </div>
  );
}

// ── 할일 탭 ─────────────────────────────────────────
function TodoTab({
  todos,
  onChange,
}: {
  todos: Todo[];
  onChange: (t: Todo[]) => void;
}) {
  const [text, setText] = useState("");
  const add = () => {
    const v = text.trim();
    if (!v) return;
    onChange([...todos, { id: uid(), text: v, done: false }]);
    setText("");
  };
  const toggle = (id: string) =>
    onChange(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const remove = (id: string) => onChange(todos.filter((t) => t.id !== id));

  const done = todos.filter((t) => t.done).length;

  return (
    <div className={`${cardCls} p-5`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[15px] font-bold text-[#18181b]">출발 전 할일</h2>
        <span className="text-[12px] text-[#71717a] font-semibold">
          {done} / {todos.length}
        </span>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="예: 항공권 예약, 환전, 유심 구매"
          className={inputCls}
        />
        <button
          onClick={add}
          className="shrink-0 px-4 rounded-[10px] bg-[#18181b] text-white text-[13px] font-semibold hover:bg-[#3f3f46] transition-colors"
        >
          추가
        </button>
      </div>

      {todos.length === 0 ? (
        <EmptyState icon="ti-checklist" text="할일을 추가해보세요." />
      ) : (
        <ul className="space-y-2">
          {todos.map((t) => (
            <li
              key={t.id}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-[12px] border transition-colors ${
                t.done
                  ? "bg-[#fafafa] border-[#f4f4f5]"
                  : "bg-white border-[#e4e4e7]"
              }`}
            >
              <button
                onClick={() => toggle(t.id)}
                className={`w-5 h-5 rounded-[6px] border-2 flex items-center justify-center shrink-0 transition-all ${
                  t.done
                    ? "bg-[#18181b] border-[#18181b]"
                    : "border-[#d4d4d8]"
                }`}
                aria-label="완료 토글"
              >
                {t.done && <i className="ti ti-check text-white text-[13px]" />}
              </button>
              <span
                className={`flex-1 text-[14px] ${
                  t.done
                    ? "text-[#a1a1aa] line-through"
                    : "text-[#18181b]"
                }`}
              >
                {t.text}
              </span>
              <button
                onClick={() => remove(t.id)}
                className="text-[#a1a1aa] hover:text-[#18181b] transition-colors shrink-0"
                aria-label="삭제"
              >
                <i className="ti ti-x text-[16px]" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── 준비물 탭 ───────────────────────────────────────
function PackingTab({
  packing,
  onChange,
}: {
  packing: PackItem[];
  onChange: (p: PackItem[]) => void;
}) {
  const [text, setText] = useState("");
  const [cat, setCat] = useState(PACK_CATS[0]);

  const add = () => {
    const v = text.trim();
    if (!v) return;
    onChange([...packing, { id: uid(), text: v, done: false, cat }]);
    setText("");
  };
  const toggle = (id: string) =>
    onChange(packing.map((p) => (p.id === id ? { ...p, done: !p.done } : p)));
  const remove = (id: string) => onChange(packing.filter((p) => p.id !== id));

  const done = packing.filter((p) => p.done).length;

  return (
    <div className={`${cardCls} p-5`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[15px] font-bold text-[#18181b]">준비물 체크리스트</h2>
        <span className="text-[12px] text-[#71717a] font-semibold">
          {done} / {packing.length}
        </span>
      </div>

      <div className="flex gap-2 mb-2">
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className="shrink-0 bg-[#f4f4f5] border border-[#e4e4e7] rounded-[10px] px-2.5 py-2.5 text-[13px] text-[#18181b] focus:outline-none focus:border-[#18181b]"
        >
          {PACK_CATS.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="예: 여권, 보조배터리, 상비약"
          className={inputCls}
        />
        <button
          onClick={add}
          className="shrink-0 px-4 rounded-[10px] bg-[#18181b] text-white text-[13px] font-semibold hover:bg-[#3f3f46] transition-colors"
        >
          추가
        </button>
      </div>

      {packing.length === 0 ? (
        <EmptyState icon="ti-briefcase" text="준비물을 추가해보세요." />
      ) : (
        <div className="space-y-4 mt-4">
          {PACK_CATS.filter((c) => packing.some((p) => p.cat === c)).map((c) => (
            <div key={c}>
              <div className="text-[12px] font-bold text-[#71717a] mb-2 flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-[#a1a1aa]" />
                {c}
              </div>
              <ul className="space-y-2">
                {packing
                  .filter((p) => p.cat === c)
                  .map((p) => (
                    <li
                      key={p.id}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-[12px] border transition-colors ${
                        p.done
                          ? "bg-[#fafafa] border-[#f4f4f5]"
                          : "bg-white border-[#e4e4e7]"
                      }`}
                    >
                      <button
                        onClick={() => toggle(p.id)}
                        className={`w-5 h-5 rounded-[6px] border-2 flex items-center justify-center shrink-0 transition-all ${
                          p.done
                            ? "bg-[#18181b] border-[#18181b]"
                            : "border-[#d4d4d8]"
                        }`}
                        aria-label="완료 토글"
                      >
                        {p.done && (
                          <i className="ti ti-check text-white text-[13px]" />
                        )}
                      </button>
                      <span
                        className={`flex-1 text-[14px] ${
                          p.done
                            ? "text-[#a1a1aa] line-through"
                            : "text-[#18181b]"
                        }`}
                      >
                        {p.text}
                      </span>
                      <button
                        onClick={() => remove(p.id)}
                        className="text-[#a1a1aa] hover:text-[#18181b] transition-colors shrink-0"
                        aria-label="삭제"
                      >
                        <i className="ti ti-x text-[16px]" />
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 경비 탭 ─────────────────────────────────────────
function ExpenseTab({
  expenses,
  budget,
  spent,
  remain,
  onChange,
  onBudget,
}: {
  expenses: Expense[];
  budget: number | "";
  spent: number;
  remain: number;
  onChange: (e: Expense[]) => void;
  onBudget: (b: number | "") => void;
}) {
  const [label, setLabel] = useState("");
  const [cat, setCat] = useState(EXPENSE_CATS[0]);
  const [amount, setAmount] = useState("");

  const add = () => {
    const v = label.trim();
    const n = parseInt(amount.replace(/[^0-9]/g, ""), 10);
    if (!v || isNaN(n)) return;
    onChange([...expenses, { id: uid(), label: v, cat, amount: n }]);
    setLabel("");
    setAmount("");
  };
  const remove = (id: string) => onChange(expenses.filter((e) => e.id !== id));

  const budgetNum = typeof budget === "number" ? budget : 0;
  const pct = budgetNum > 0 ? Math.min(100, Math.round((spent / budgetNum) * 100)) : 0;
  const over = budgetNum > 0 && remain < 0;

  // 카테고리별 합계
  const byCat = useMemo(() => {
    const m: Record<string, number> = {};
    for (const e of expenses) {
      const a = typeof e.amount === "number" ? e.amount : 0;
      m[e.cat] = (m[e.cat] || 0) + a;
    }
    return EXPENSE_CATS.filter((c) => m[c]).map((c) => ({ cat: c, sum: m[c] }));
  }, [expenses]);

  return (
    <div className="space-y-4">
      {/* 예산 요약 */}
      <div className={`${cardCls} p-5`}>
        <label className="block mb-4">
          <span className="text-[12px] font-semibold text-[#71717a]">
            총 예산
          </span>
          <div className="flex items-center gap-2 mt-1.5">
            <input
              inputMode="numeric"
              value={budget === "" ? "" : fmt(budget)}
              onChange={(e) => {
                const n = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10);
                onBudget(isNaN(n) ? "" : n);
              }}
              placeholder="0"
              className={inputCls}
            />
            <span className="text-[14px] text-[#71717a] font-semibold shrink-0">
              원
            </span>
          </div>
        </label>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-[#fafafa] rounded-[12px] p-3 text-center">
            <div className="text-[18px] font-extrabold text-[#18181b] leading-none">
              {fmt(spent)}원
            </div>
            <div className="text-[11px] text-[#71717a] font-semibold mt-1.5">
              지출
            </div>
          </div>
          <div className="bg-[#fafafa] rounded-[12px] p-3 text-center">
            <div
              className={`text-[18px] font-extrabold leading-none ${
                over ? "text-[#dc2626]" : "text-[#18181b]"
              }`}
            >
              {fmt(remain)}원
            </div>
            <div className="text-[11px] text-[#71717a] font-semibold mt-1.5">
              {over ? "예산 초과" : "남은 예산"}
            </div>
          </div>
        </div>

        {budgetNum > 0 && (
          <div className="h-[7px] rounded-full bg-[#e4e4e7] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                over ? "bg-[#dc2626]" : "bg-[#18181b]"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>

      {/* 입력 */}
      <div className={`${cardCls} p-5`}>
        <div className="flex gap-2 mb-2">
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="shrink-0 bg-[#f4f4f5] border border-[#e4e4e7] rounded-[10px] px-2.5 py-2.5 text-[13px] text-[#18181b] focus:outline-none focus:border-[#18181b]"
          >
            {EXPENSE_CATS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="항목"
            className={inputCls}
          />
        </div>
        <div className="flex gap-2">
          <input
            inputMode="numeric"
            value={amount ? fmt(parseInt(amount.replace(/[^0-9]/g, ""), 10) || 0) : ""}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="금액 (원)"
            className={inputCls}
          />
          <button
            onClick={add}
            className="shrink-0 px-5 rounded-[10px] bg-[#18181b] text-white text-[13px] font-semibold hover:bg-[#3f3f46] transition-colors"
          >
            추가
          </button>
        </div>
      </div>

      {/* 목록 */}
      <div className={`${cardCls} p-5`}>
        {expenses.length === 0 ? (
          <EmptyState icon="ti-wallet" text="지출 내역을 추가해보세요." />
        ) : (
          <>
            <ul className="space-y-2">
              {expenses.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-[12px] bg-white border border-[#e4e4e7]"
                >
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#f4f4f5] text-[#52525b] shrink-0">
                    {e.cat}
                  </span>
                  <span className="flex-1 text-[14px] text-[#18181b] truncate">
                    {e.label}
                  </span>
                  <span className="text-[14px] font-bold text-[#18181b] shrink-0">
                    {fmt(typeof e.amount === "number" ? e.amount : 0)}원
                  </span>
                  <button
                    onClick={() => remove(e.id)}
                    className="text-[#a1a1aa] hover:text-[#18181b] transition-colors shrink-0"
                    aria-label="삭제"
                  >
                    <i className="ti ti-x text-[16px]" />
                  </button>
                </li>
              ))}
            </ul>

            {byCat.length > 0 && (
              <div className="mt-5 pt-4 border-t border-[#e4e4e7]">
                <div className="text-[12px] font-bold text-[#71717a] mb-2.5">
                  카테고리별
                </div>
                <div className="space-y-1.5">
                  {byCat.map((b) => (
                    <div
                      key={b.cat}
                      className="flex items-center justify-between text-[13px]"
                    >
                      <span className="text-[#71717a]">{b.cat}</span>
                      <span className="font-semibold text-[#18181b]">
                        {fmt(b.sum)}원
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── 빈 상태 ─────────────────────────────────────────
function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="py-10 text-center">
      <i className={`ti ${icon} text-[32px] text-[#d4d4d8]`} />
      <p className="text-[13px] text-[#a1a1aa] mt-2">{text}</p>
    </div>
  );
}
