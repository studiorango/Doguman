"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import AuthButton from "@/components/auth/AuthButton";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── 디자인 토큰 (돈 아끼기 - 세이지 그린)
const ACCENT    = "#4A7362";
const ACCENT_BG = "#ECF2EE";
const ACCENT_BD = "#A8C9B8";

const cardCls  = "bg-white rounded-[16px] border border-[#EAE7E2] shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-5 mb-4";
const inputCls = "bg-[#F5F5F5] border border-[#EAE7E2] rounded-[10px] px-3 py-2.5 text-[13px] text-[#1A1A1A] font-[inherit] focus:outline-none focus:bg-white focus:border-[#1A1A1A] transition-colors placeholder:text-[#B0A99F]";

type Item = {
  id: string;
  label: string;
  cost: number | "";
};

const SERVICE_KEY = "expense-planner";

function newItem(): Item {
  return { id: crypto.randomUUID(), label: "", cost: "" };
}

function fmt(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

export default function ExpensePlannerPage() {
  const [title, setTitle] = useState("여행 경비 계획");
  const [items, setItems] = useState<Item[]>([newItem()]);
  const [userId, setUserId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirst = useRef(true);

  // 로그인 + 불러오기
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
        const s = data.state as { title?: string; items?: Item[] };
        if (s.title) setTitle(s.title);
        if (s.items?.length) setItems(s.items);
      }
    };
    init();
  }, []);

  // 자동 저장
  const saveState = useCallback(async (t: string, it: Item[]) => {
    if (!userId) return;
    await supabase.from("user_calculator_states").upsert({
      user_id: userId,
      service_key: SERVICE_KEY,
      state: { title: t, items: it },
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,service_key" });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [userId]);

  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return; }
    if (!userId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveState(title, items), 800);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [title, items, userId, saveState]);

  const total = items.reduce((sum, i) => sum + (Number(i.cost) || 0), 0);
  const filled = items.filter(i => i.label.trim() && i.cost !== "").length;

  const updateItem = (id: string, patch: Partial<Item>) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));

  const removeItem = (id: string) =>
    setItems(prev => prev.length === 1 ? [newItem()] : prev.filter(i => i.id !== id));

  const addItem = () => setItems(prev => [...prev, newItem()]);

  return (
    <div className="min-h-[100dvh]" style={{ background: "#FAF9F7" }}>

      {/* 네브바 */}
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
          <Link href="/" className="text-[17px] font-bold tracking-tight" style={{ color: "#1A1A1A" }}>
            김민제
          </Link>
          <Link href="/blog" className="text-[15px] font-medium" style={{ color: "#888888" }}>
            블로그
          </Link>
          <div className="flex items-center justify-end gap-3">
            {userId && (
              <span
                className="text-[11px] font-medium transition-opacity duration-300"
                style={{ color: "#B0A99F", opacity: saved ? 1 : 0 }}
              >
                저장됨
              </span>
            )}
            <AuthButton />
          </div>
        </div>
      </header>

      {/* 히어로 */}
      <div className="relative overflow-hidden" style={{ borderBottom: "1px solid #EAE7E2" }}>
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: "radial-gradient(circle, #A09890 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            opacity: 0.09,
          }}
        />
        <div className="relative z-10 mx-auto px-6 pt-10 pb-10" style={{ maxWidth: "720px" }}>
          <h1 className="text-[32px] font-bold leading-tight tracking-tight break-keep mb-2" style={{ color: "#1A1A1A" }}>
            예상 지출 계산기
          </h1>
          <p className="text-[14px] break-keep" style={{ color: "#999999" }}>
            해야 할 일을 적고 예상 비용을 입력하면 합계를 계산해드려요.
          </p>
        </div>
      </div>

      <main className="mx-auto px-6 py-8 pb-20" style={{ maxWidth: "720px" }}>

        {/* 플랜 제목 */}
        <div className={cardCls}>
          <p className="text-[11px] font-bold tracking-wider mb-3" style={{ color: "#B0A99F" }}>플랜 이름</p>
          <input
            className={`${inputCls} w-full text-[16px] font-bold`}
            placeholder="예: 제주도 여행, 출산 준비, 이사 비용..."
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        {/* 항목 목록 */}
        <div className={cardCls}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-bold tracking-wider" style={{ color: "#B0A99F" }}>
              항목 목록 · {filled}개 입력됨
            </p>
            <p className="text-[11px]" style={{ color: "#B0A99F" }}>비용 (원)</p>
          </div>

          <div className="flex flex-col gap-2 mb-4">
            {items.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-2">
                {/* 번호 */}
                <span className="text-[12px] font-bold w-5 text-right flex-shrink-0" style={{ color: "#C8C2BA" }}>
                  {idx + 1}
                </span>

                {/* 항목명 */}
                <input
                  className={`${inputCls} flex-1`}
                  placeholder="할 일을 입력하세요"
                  value={item.label}
                  onChange={e => updateItem(item.id, { label: e.target.value })}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addItem();
                    }
                  }}
                />

                {/* 비용 */}
                <input
                  className={`${inputCls} w-[120px] text-right`}
                  placeholder="0"
                  type="number"
                  min={0}
                  value={item.cost}
                  onChange={e => updateItem(item.id, { cost: e.target.value === "" ? "" : Number(e.target.value) })}
                />

                {/* 삭제 */}
                <button
                  onClick={() => removeItem(item.id)}
                  className="w-7 h-7 flex items-center justify-center rounded-full flex-shrink-0 transition-colors hover:bg-[#F3ECEA]"
                  style={{ color: "#C8C2BA" }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* 항목 추가 */}
          <button
            onClick={addItem}
            className="w-full py-2.5 rounded-[12px] text-[13px] font-semibold transition-colors"
            style={{ background: "#F5F5F5", border: "1px dashed #D0CCC8", color: "#B0A99F" }}
          >
            + 항목 추가
          </button>
        </div>

        {/* 합계 */}
        <div
          className="rounded-[16px] p-6"
          style={{ background: ACCENT_BG, border: `1.5px solid ${ACCENT_BD}` }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-semibold" style={{ color: ACCENT }}>총 예상 지출</p>
            {!userId && (
              <p className="text-[11px]" style={{ color: "#B0A99F" }}>로그인하면 자동 저장돼요</p>
            )}
          </div>
          <p className="text-[40px] font-extrabold tracking-tight" style={{ color: "#1A1A1A" }}>
            {fmt(total)}
          </p>

          {/* 항목별 소계 */}
          {items.filter(i => i.label.trim() && i.cost !== "").length > 0 && (
            <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${ACCENT_BD}` }}>
              {items.filter(i => i.label.trim() && i.cost !== "").map(i => (
                <div key={i.id} className="flex items-center justify-between py-1">
                  <span className="text-[13px]" style={{ color: "#555" }}>{i.label}</span>
                  <span className="text-[13px] font-semibold" style={{ color: "#1A1A1A" }}>
                    {fmt(Number(i.cost))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 초기화 */}
        <div className="text-center mt-4">
          <button
            onClick={() => { setTitle(""); setItems([newItem()]); }}
            className="text-[12px]"
            style={{ color: "#C8C2BA" }}
          >
            초기화
          </button>
        </div>

      </main>
    </div>
  );
}