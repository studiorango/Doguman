// app/racetogold/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Chart, registerables } from "chart.js";
import Link from "next/link";
import AuthButton from "@/components/auth/AuthButton";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
Chart.register(...registerables);

function fmt(v: number): string {
  if (v >= 100000000) return "₩" + (v / 100000000).toFixed(2) + "억";
  const m = Math.round(v / 10000);
  if (m >= 10000) return "₩" + (m / 10000).toFixed(1) + "억";
  return "₩" + m.toLocaleString() + "만";
}

function fmtGoal(w: number): string {
  if (w >= 10000) return "₩" + (w / 10000).toFixed(w % 10000 === 0 ? 0 : 1) + "억";
  return "₩" + w.toLocaleString() + "만";
}

function calcMonths(annualSave: number, rate: number, goal: number): number {
  const monthlyRate = Math.pow(1 + rate, 1 / 12) - 1;
  const monthlySave = annualSave / 12;
  let asset = 0;
  for (let m = 1; m <= 600; m++) {
    asset = (asset + monthlySave) * (1 + monthlyRate);
    if (asset >= goal) return m;
  }
  return 600;
}

interface YearData {
  y: number;
  asset: number;
  principal: number;
  profit: number;
}

const SERVICE_KEY = "racetogold";

export default function GoalCalculatorPage() {
  const [salary, setSalary] = useState(6000);
  const [expense, setExpense] = useState(3000);
  const [rate, setRate] = useState(5);
  const [goalW, setGoalW] = useState(10000);
  const [userId, setUserId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInst = useRef<Chart | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstLoad = useRef(true);

  // 로그인 상태 확인 + 저장된 값 불러오기
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
        const s = data.state as { salary?: number; expense?: number; rate?: number; goalW?: number };
        if (s.salary) setSalary(s.salary);
        if (s.expense) setExpense(s.expense);
        if (s.rate) setRate(s.rate);
        if (s.goalW) setGoalW(s.goalW);
      }
    };
    init();
  }, []);

  // 값 변경 시 Supabase에 debounce 저장
  const saveState = useCallback(async () => {
    if (!userId) return;
    await supabase
      .from("user_calculator_states")
      .upsert({
        user_id: userId,
        service_key: SERVICE_KEY,
        state: { salary, expense, rate, goalW },
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,service_key" });

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [userId, salary, expense, rate, goalW]);

  useEffect(() => {
    // 첫 로드 시엔 저장 안 함
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    if (!userId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(saveState, 800);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [salary, expense, rate, goalW, userId, saveState]);

  // 계산 로직
  const goal = goalW * 10000;
  const netIncome = salary * 10000 * 0.67;
  const annualSave = netIncome - expense * 10000;
  const saveRate = annualSave / netIncome * 100;
  const canSave = annualSave > 0;

  const totalMonths = canSave ? calcMonths(annualSave, rate / 100, goal) : 0;
  const yrs = Math.floor(totalMonths / 12);
  const mos = totalMonths % 12;
  const goalYear = Math.ceil(totalMonths / 12);

  const yrData: YearData[] = [];
  if (canSave) {
    let asset = 0;
    for (let y = 1; y <= 50; y++) {
      asset = (asset + annualSave) * (1 + rate / 100);
      yrData.push({ y, asset, principal: annualSave * y, profit: asset - annualSave * y });
    }
  }

  const gy = yrData[Math.min(goalYear, 50) - 1];
  const disp = yrData.slice(0, Math.min(Math.max(goalYear + 2, 7), 15));

  useEffect(() => {
    if (!chartRef.current || !canSave) return;
    if (chartInst.current) chartInst.current.destroy();
    chartInst.current = new Chart(chartRef.current, {
      type: "line",
      data: {
        labels: disp.map((d) => d.y + "년"),
        datasets: [
          {
            label: "복리 자산",
            data: disp.map((d) => Math.round(d.asset / 10000)),
            borderColor: "#4A7362",
            backgroundColor: "rgba(74,115,98,0.06)",
            fill: true,
            tension: 0.3,
            pointRadius: 3,
            pointBackgroundColor: "#4A7362",
            borderWidth: 2,
          },
          {
            label: "납입 원금",
            data: disp.map((d) => Math.round(d.principal / 10000)),
            borderColor: "#D1D5DB",
            borderDash: [4, 4],
            fill: false,
            tension: 0,
            pointRadius: 0,
            borderWidth: 1.5,
          },
          {
            label: "목표금액",
            data: disp.map(() => Math.round(goal / 10000)),
            borderColor: "#7A4A42",
            borderDash: [5, 4],
            fill: false,
            tension: 0,
            pointRadius: 0,
            borderWidth: 1.5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (c) => c.dataset.label + ": ₩" + (c.raw as number).toLocaleString() + "만" } },
        },
        scales: {
          x: { grid: { color: "rgba(0,0,0,0.04)" }, ticks: { font: { size: 11 }, color: "#B0A99F" } },
          y: {
            grid: { color: "rgba(0,0,0,0.04)" },
            ticks: {
              font: { size: 11 },
              color: "#B0A99F",
              callback: (v) => (Number(v) >= 10000 ? "₩" + (Number(v) / 10000).toFixed(0) + "억" : "₩" + Number(v).toLocaleString() + "만"),
            },
          },
        },
      },
    });
    return () => { chartInst.current?.destroy(); };
  }, [salary, expense, rate, goalW]);

  const badge =
    totalMonths <= 60
      ? { text: "빠른 달성 가능", color: "#4A7362", bg: "#ECF2EE" }
      : totalMonths <= 180
      ? { text: "꾸준히 하면 가능", color: "#3E5878", bg: "#E8EDF4" }
      : { text: "장기 플랜 필요", color: "#7A6040", bg: "#F2EDE4" };

  const card = "bg-white rounded-[16px] border border-[#EAE7E2] shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-6 mb-4";
  const sectionLabel = "text-[11px] font-semibold tracking-wider mb-5";

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
          <div className="flex items-center">
            <Link href="/" className="text-[17px] font-bold tracking-tight" style={{ color: "#1A1A1A" }}>
              김민제
            </Link>
          </div>
          <div className="flex items-center justify-center">
            <Link href="/blog" className="text-[15px] font-medium" style={{ color: "#888888" }}>
              블로그
            </Link>
          </div>
          <div className="flex items-center justify-end gap-3">
            {/* 자동저장 표시 */}
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
          <h1
            className="text-[32px] font-bold leading-tight tracking-tight break-keep mb-2"
            style={{ color: "#1A1A1A" }}
          >
            목표 금액 달성 계산기
          </h1>
          <p className="text-[14px] break-keep" style={{ color: "#999999" }}>
            연봉과 지출을 입력하면 목표 금액까지 걸리는 시간을 계산합니다.
          </p>
        </div>
      </div>

      <main className="mx-auto px-6 py-8 pb-20" style={{ maxWidth: "720px" }}>

        {/* 입력 조건 */}
        <div className={card}>
          <p className={sectionLabel} style={{ color: "#B0A99F" }}>입력 조건</p>
          <div className="flex flex-col gap-4">
            {[
              { label: "연봉 (세전)", val: `₩${salary.toLocaleString()}만`, min: 2000, max: 20000, step: 100, value: salary, onChange: setSalary },
              { label: "연간 지출", val: `₩${expense.toLocaleString()}만`, min: 500, max: 15000, step: 100, value: expense, onChange: setExpense },
              { label: "투자 수익률", val: `${rate.toFixed(1)}%`, min: 0, max: 20, step: 0.5, value: rate, onChange: setRate },
              { label: "목표 금액", val: fmtGoal(goalW), min: 1000, max: 100000, step: 1000, value: goalW, onChange: setGoalW },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-4">
                <span className="text-[13px] w-24 flex-shrink-0 break-keep" style={{ color: "#555555" }}>{s.label}</span>
                <input
                  type="range"
                  min={s.min} max={s.max} step={s.step} value={s.value}
                  onChange={(e) => s.onChange(+e.target.value)}
                  className="flex-1 cursor-pointer"
                  style={{ accentColor: "#1A1A1A" }}
                />
                <span className="text-[13px] font-semibold w-20 text-right flex-shrink-0" style={{ color: "#1A1A1A" }}>
                  {s.val}
                </span>
              </div>
            ))}
          </div>
          {!userId && (
            <p className="text-[11px] mt-5 text-center" style={{ color: "#C8C2BA" }}>
              로그인하면 입력값이 자동으로 저장돼요.
            </p>
          )}
        </div>

        {/* 결과 */}
        <div className={card}>
          <div className="text-center py-6">
            <div className="text-[56px] font-extrabold tracking-tight leading-none" style={{ color: "#1A1A1A" }}>
              {!canSave ? (
                <span className="text-[32px]">달성 불가</span>
              ) : totalMonths >= 600 ? (
                <span>50<span className="text-[24px] font-bold">년 이상</span></span>
              ) : yrs === 0 ? (
                <span>{mos}<span className="text-[24px] font-bold">개월</span></span>
              ) : mos === 0 ? (
                <span>{yrs}<span className="text-[24px] font-bold">년</span></span>
              ) : (
                <span>
                  {yrs}<span className="text-[24px] font-bold">년</span>
                  <span className="ml-1" style={{ color: "#999" }}>{mos}</span>
                  <span className="text-[18px] font-bold" style={{ color: "#999" }}>개월</span>
                </span>
              )}
            </div>
            <p className="text-[13px] mt-3 mb-4" style={{ color: "#999999" }}>
              목표 {fmtGoal(goalW)} 달성까지
            </p>
            <span
              className="inline-block text-[12px] font-semibold px-4 py-1.5 rounded-full"
              style={{ color: badge.color, background: badge.bg }}
            >
              {badge.text}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-2">
            {[
              { label: "연간 저축액", val: canSave ? fmt(annualSave) : "-", color: "#1A1A1A" },
              { label: "월 저축액", val: canSave ? fmt(annualSave / 12) : "-", color: "#1A1A1A" },
              { label: "저축률", val: canSave ? Math.max(0, saveRate).toFixed(1) + "%" : "-", color: "#7A6040" },
              { label: "총 납입 원금", val: gy ? fmt(gy.principal) : "-", color: "#1A1A1A" },
              { label: "투자 수익", val: gy ? fmt(gy.profit) : "-", color: "#4A7362" },
              { label: "수익 기여율", val: gy ? (gy.profit / gy.asset * 100).toFixed(1) + "%" : "-", color: "#7A6040" },
            ].map((s) => (
              <div key={s.label} className="rounded-[12px] p-4" style={{ background: "#F5F5F5" }}>
                <p className="text-[11px] mb-1" style={{ color: "#B0A99F" }}>{s.label}</p>
                <p className="text-[15px] font-bold" style={{ color: s.color }}>{s.val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 그래프 */}
        {canSave && (
          <div className={card}>
            <p className={sectionLabel} style={{ color: "#B0A99F" }}>자산 성장 그래프</p>
            <div className="relative w-full h-[220px]">
              <canvas ref={chartRef} />
            </div>
            <div className="flex gap-5 mt-4">
              {[
                { color: "#4A7362", label: "복리 자산" },
                { color: "#D1D5DB", label: "납입 원금" },
                { color: "#7A4A42", label: "목표금액" },
              ].map((l) => (
                <span key={l.label} className="flex items-center gap-1.5 text-[11px]" style={{ color: "#B0A99F" }}>
                  <span className="w-3 h-[2px] rounded inline-block" style={{ background: l.color }} />
                  {l.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 연도별 테이블 */}
        {canSave && disp.length > 0 && (
          <div className={card}>
            <p className={sectionLabel} style={{ color: "#B0A99F" }}>연도별 자산 현황</p>
            <div className="grid pb-2 mb-1" style={{ gridTemplateColumns: "44px 1fr 44px 76px 72px 68px", borderBottom: "1px solid #EAE7E2" }}>
              {["연차", "진행률", "", "자산", "원금", "수익"].map((h, i) => (
                <span key={i} className="text-[11px] font-semibold pb-2" style={{ color: "#B0A99F", textAlign: i >= 3 ? "right" : "left" }}>{h}</span>
              ))}
            </div>
            {disp.map((d) => {
              const pct = Math.min(100, Math.round(d.asset / goal * 100));
              const done = d.asset >= goal;
              const hl = d.y === goalYear;
              return (
                <div
                  key={d.y}
                  className="grid items-center gap-1.5 py-2.5 px-2 rounded-[10px]"
                  style={{
                    gridTemplateColumns: "44px 1fr 44px 76px 72px 68px",
                    background: hl ? "#ECF2EE" : "transparent",
                    borderBottom: "1px solid #F0EDE8",
                  }}
                >
                  <span className="text-[12px] font-semibold" style={{ color: hl ? "#4A7362" : "#1A1A1A" }}>{d.y}년</span>
                  <div className="h-[5px] rounded-full overflow-hidden" style={{ background: "#EAE7E2" }}>
                    <div className="h-full rounded-full" style={{ width: pct + "%", background: done ? "#4A7362" : "#A0C8B0" }} />
                  </div>
                  <span className="text-[11px] text-right" style={{ color: "#B0A99F" }}>{pct}%</span>
                  <span className="text-[12px] text-right" style={{ color: "#1A1A1A" }}>{fmt(d.asset)}</span>
                  <span className="text-[12px] text-right" style={{ color: "#1A1A1A" }}>{fmt(d.principal)}</span>
                  <span className="text-[12px] font-semibold text-right" style={{ color: "#4A7362" }}>{fmt(d.profit)}</span>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}