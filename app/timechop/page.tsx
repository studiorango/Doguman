"use client";

import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { ServiceHeader } from "@/components/doguman/service-header";

// ── Types ─────────────────────────────────────────
type Category = "작업" | "운동" | "학습" | "휴식" | "식사" | "창작" | "루틴";
type Status   = "done" | "active" | "past" | "pending";

interface Slot {
  id:       number;
  time:     string;
  minVal:   number;
  title:    string;
  category: Category;
  xp:       number;
  done:     boolean;
}

interface MemoTask {
  id:   number;
  text: string;
  done: boolean;
}

// ── Helpers ──────────────────────────────────────
const pad    = (n: number) => String(n).padStart(2, "0");
const toMin  = (hhmm: string) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
const toTime = (t: number) => `${pad(Math.floor(t / 60))}:${pad(t % 60)}`;
const getNow = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
const today  = () => new Date().toISOString().split("T")[0];

// ── 레벨 시스템 ──────────────────────────────────
const MAX_LEVEL    = 20;
const MAX_XP       = 2970;
const XP_PER_LEVEL = MAX_XP / MAX_LEVEL;

function getLevel(xp: number) {
  return Math.min(MAX_LEVEL, Math.floor(xp / XP_PER_LEVEL) + 1);
}
function getLevelProgress(xp: number) {
  const level = getLevel(xp);
  if (level === MAX_LEVEL) return 100;
  return Math.round(((xp - (level - 1) * XP_PER_LEVEL) / XP_PER_LEVEL) * 100);
}

// ── 카테고리 스타일 ───────────────────────────────
const CAT: Record<Category, { bg: string; text: string }> = {
  작업: { bg: "#F5F5F5", text: "#474747" },
  운동: { bg: "#F5F5F5", text: "#474747" },
  학습: { bg: "#F5F5F5", text: "#474747" },
  휴식: { bg: "#FFF4D8", text: "#8B6914" },
  식사: { bg: "#FFF4D8", text: "#8B6914" },
  창작: { bg: "#F5F5F5", text: "#474747" },
  루틴: { bg: "#F5F5F5", text: "#8B8B8B" },
};

// ── 퀘스트 룰 ────────────────────────────────────
interface QuestRule {
  from:   number;
  to:     number;
  quests: { title: string; category: Category; xp: number }[];
}

const QUEST_RULES: QuestRule[] = [
  { from: 5*60, to: 7*60, quests: [
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "하루 계획 세우기", category: "작업", xp: 20 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
  ]},
  { from: 7*60, to: 10*60, quests: [
    { title: "하루 계획 세우기", category: "작업", xp: 20 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
  ]},
  { from: 10*60, to: 12*60, quests: [
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
  ]},
  { from: 12*60, to: 14*60, quests: [
    { title: "점심 식사", category: "식사", xp: 10 },
    { title: "점심 식사", category: "식사", xp: 10 },
    { title: "점심 식사", category: "식사", xp: 10 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
  ]},
  { from: 14*60, to: 17*60, quests: [
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
  ]},
  { from: 17*60, to: 19*60, quests: [
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
  ]},
  { from: 19*60, to: 21*60, quests: [
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
  ]},
  { from: 21*60, to: 24*60, quests: [
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "주요 업무", category: "작업", xp: 50 },
    { title: "취침 준비", category: "루틴", xp: 10 },
    { title: "취침 준비", category: "루틴", xp: 10 },
    { title: "취침 준비", category: "루틴", xp: 10 },
  ]},
];

function getQuestForMin(min: number): { title: string; category: Category; xp: number } {
  for (const rule of QUEST_RULES) {
    if (min >= rule.from && min < rule.to) {
      const idx = Math.floor((min - rule.from) / 10);
      return rule.quests[Math.min(idx, rule.quests.length - 1)];
    }
  }
  return { title: "주요 업무", category: "작업", xp: 50 };
}

function buildSlots(startMin: number, endMin: number): Slot[] {
  const count = Math.floor((endMin - startMin) / 10);
  return Array.from({ length: count }, (_, i) => {
    const min = startMin + i * 10;
    const q   = getQuestForMin(min);
    return { id: i, time: toTime(min), minVal: min, title: q.title, category: q.category, xp: q.xp, done: false };
  });
}

// ── 프리셋 기본값 ─────────────────────────────────
const DEFAULT_PRESETS = [
  "도구맨 개발", "오염파이터", "영상 촬영", "영상 편집",
  "런닝", "독서", "블로그 작성", "소셜 포스팅",
  "고객 응대", "기획 & 아이디어", "회의", "공부",
];

const supabase = createClient();

// ── 메인 컴포넌트 ─────────────────────────────────
export default function TimeChop() {

  const [startTime,     setStartTime]     = useState<string>("07:00");
  const [endTime,       setEndTime]       = useState<string>("23:00");
  const [slots,         setSlots]         = useState<Slot[]>([]);
  const [phase,         setPhase]         = useState<"setup" | "timeline">("setup");
  const [nowMin,        setNowMin]        = useState<number>(getNow());
  const [editingId,     setEditingId]     = useState<number | null>(null);
  const [editText,      setEditText]      = useState<string>("");
  const [memoTasks,     setMemoTasks]     = useState<MemoTask[]>([]);
  const [memoInput,     setMemoInput]     = useState<string>("");
  const [presets,       setPresets]       = useState<string[]>(DEFAULT_PRESETS);
  const [presetInput,   setPresetInput]   = useState<string>("");
  const [editingPreset, setEditingPreset] = useState<boolean>(false);
  const [levelUp,       setLevelUp]       = useState<number | null>(null);
  const [userId,        setUserId]        = useState<string | null>(null);
  const prevLevelRef = useRef<number>(1);
  const activeRef    = useRef<HTMLDivElement>(null);

  // ── 유저 확인 ──
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  // ── 초기 데이터 로드 ──
  useEffect(() => {
    if (!userId) return;

    // 프리셋 로드
    supabase
      .from("timechop_presets")
      .select("presets")
      .eq("user_id", userId)
      .single()
      .then(({ data }) => {
        if (data?.presets?.length) setPresets(data.presets);
      });

    // 오늘 데이터 로드
    supabase
      .from("timechop_daily")
      .select("tasks, slots")
      .eq("user_id", userId)
      .eq("date", today())
      .single()
      .then(({ data }) => {
        if (!data) return;
        if (data.tasks) setMemoTasks(data.tasks);
        if (data.slots?.startTime && data.slots?.endTime) {
          const s = toMin(data.slots.startTime);
          const e = toMin(data.slots.endTime);
          setStartTime(data.slots.startTime);
          setEndTime(data.slots.endTime);
          const built = buildSlots(s, e).map((slot) => ({
            ...slot,
            done: (data.slots.completedIds as number[] ?? []).includes(slot.id),
          }));
          setSlots(built);
          setPhase("timeline");
        }
      });
  }, [userId]);

  // ── 프리셋 저장 ──
  useEffect(() => {
    if (!userId) return;
    supabase.from("timechop_presets").upsert({
      user_id: userId,
      presets,
      updated_at: new Date().toISOString(),
    });
  }, [presets, userId]);

  // ── 주요 업무 저장 ──
  useEffect(() => {
    if (!userId) return;
    supabase.from("timechop_daily").upsert({
      user_id: userId,
      date: today(),
      tasks: memoTasks,
    }, { onConflict: "user_id,date" });
  }, [memoTasks, userId]);

  // ── 슬롯 완료 상태 저장 ──
  useEffect(() => {
    if (!userId || !slots.length) return;
    supabase.from("timechop_daily").upsert({
      user_id: userId,
      date: today(),
      slots: {
        startTime,
        endTime,
        completedIds: slots.filter((s) => s.done).map((s) => s.id),
      },
    }, { onConflict: "user_id,date" });
  }, [slots, userId, startTime, endTime]);

  // ── 틱 ──
  useEffect(() => {
    const id = setInterval(() => setNowMin(getNow()), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (phase === "timeline")
      setTimeout(() => activeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 400);
  }, [phase]);

  // ── 파생값 ──
  const doneCount      = slots.filter((s) => s.done).length;
  const pct            = slots.length ? Math.round((doneCount / slots.length) * 100) : 0;
  const earnedXp       = slots.filter((s) => s.done).reduce((a, s) => a + s.xp, 0);
  const totalXp        = slots.reduce((a, s) => a + s.xp, 0);
  const currentLevel   = getLevel(earnedXp);
  const levelProgress  = getLevelProgress(earnedXp);
  const sMin           = toMin(startTime), eMin = toMin(endTime);
  const nowPct         = slots.length ? Math.min(100, Math.max(0, ((nowMin - sMin) / (eMin - sMin)) * 100)) : 0;

  // ── 레벨업 감지 ──
  useEffect(() => {
    if (currentLevel > prevLevelRef.current) {
      setLevelUp(currentLevel);
      setTimeout(() => setLevelUp(null), 2500);
    }
    prevLevelRef.current = currentLevel;
  }, [currentLevel]);

  // ── 핸들러 ──
  const handleStart = () => {
    const s = toMin(startTime), e = toMin(endTime);
    if (e - s < 20) return alert("최소 20분 이상 설정해주세요.");
    setSlots(buildSlots(s, e));
    setPhase("timeline");
  };

  const toggleSlot = (id: number) =>
    setSlots((p) => p.map((s) => s.id === id ? { ...s, done: !s.done } : s));

  const saveEdit = (id: number) => {
    setSlots((p) => p.map((s) => s.id === id ? { ...s, title: editText } : s));
    setEditingId(null);
  };

  const addMemo = () => {
    if (!memoInput.trim()) return;
    setMemoTasks((p) => [...p, { id: Date.now(), text: memoInput.trim(), done: false }]);
    setMemoInput("");
  };

  const toggleMemo = (id: number) =>
    setMemoTasks((p) => p.map((t) => t.id === id ? { ...t, done: !t.done } : t));

  const deleteMemo = (id: number) =>
    setMemoTasks((p) => p.filter((t) => t.id !== id));

  const getStatus = (s: Slot): Status => {
    if (s.done) return "done";
    if (nowMin >= s.minVal && nowMin < s.minVal + 10) return "active";
    if (nowMin > s.minVal + 10) return "past";
    return "pending";
  };

  return (
    <div style={{ fontFamily: "var(--font-pretendard), sans-serif", minHeight: "100dvh", background: "#FAF9F7", color: "#1A1A1A" }}>
      <style>{`
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #DCDCDC; border-radius: 4px; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes levelPop { 0% { opacity:0; transform:translate(-50%,-50%) scale(0.7); } 60% { transform:translate(-50%,-50%) scale(1.08); } 100% { opacity:1; transform:translate(-50%,-50%) scale(1); } }
        .slot { animation: fadeInUp 0.2s ease forwards; opacity: 0; }
        input[type=time]::-webkit-calendar-picker-indicator { opacity: 0.3; cursor: pointer; }
      `}</style>

      {/* 레벨업 모달 */}
      {levelUp !== null && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, pointerEvents: "none" }}>
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            background: "#1A1A1A", color: "#FFFFFF", borderRadius: 20,
            padding: "28px 48px", textAlign: "center",
            boxShadow: "0 24px 64px rgba(0,0,0,0.25)",
            animation: "levelPop 0.4s ease forwards",
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#8B8B8B", letterSpacing: "0.1em", marginBottom: 6 }}>LEVEL UP</div>
            <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: "-2px", lineHeight: 1 }}>Lv.{levelUp}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 8 }}>계속 달려요</div>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <ServiceHeader />

      {/* SETUP */}
      {phase === "setup" && (
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "52px 20px" }}>
          <div style={{ marginBottom: 40 }}>
            <h1 style={{ fontSize: 36, fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.8px", lineHeight: 1.2, wordBreak: "keep-all", marginBottom: 12 }}>
              하루를 10분으로<br />잘게 썰어보세요.
            </h1>
            <p style={{ fontSize: 14, color: "#999999", lineHeight: 1.65, wordBreak: "keep-all" }}>
              가용 시간을 설정하면 퀘스트가 자동으로 배치됩니다.
            </p>
          </div>

          <div style={{ background: "#FFFFFF", borderRadius: 16, border: "1px solid #EAE7E2", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {([["시작 시간", startTime, setStartTime], ["종료 시간", endTime, setEndTime]] as const).map(([label, val, set]) => (
                <div key={label}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#8B8B8B", marginBottom: 5 }}>{label}</label>
                  <input type="time" value={val}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => set(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", fontSize: 18, fontWeight: 700, color: "#1A1A1A", background: "#F5F5F5", border: "1px solid #E8E5E0", borderRadius: 10, fontFamily: "inherit", outline: "none" }} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F5F5F5", borderRadius: 10, padding: "9px 14px" }}>
              <span style={{ fontSize: 12, color: "#8B8B8B", fontWeight: 500 }}>총 가용 시간</span>
              <span style={{ fontSize: 13, color: "#1A1A1A", fontWeight: 700 }}>
                {Math.max(0, toMin(endTime) - toMin(startTime))}분
                <span style={{ color: "#BBBBBB", fontWeight: 400, marginLeft: 5 }}>({Math.max(0, Math.floor((toMin(endTime) - toMin(startTime)) / 10))}슬롯)</span>
              </span>
            </div>
            <button onClick={handleStart} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: "#1A1A1A", color: "#FFFFFF", fontSize: 14, fontWeight: 700, boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
              오늘 하루 썰기
            </button>
          </div>
        </div>
      )}

      {/* TIMELINE */}
      {phase === "timeline" && (
        <div style={{ maxWidth: 940, margin: "0 auto", padding: "24px 20px 80px", display: "grid", gridTemplateColumns: "220px 1fr", gap: 20, alignItems: "start" }}>

          {/* 왼쪽 사이드바 */}
          <div style={{ position: "sticky", top: 76, display: "flex", flexDirection: "column", gap: 12 }}>

            {/* 주요 업무 카드 */}
            <div style={{ background: "#FFFFFF", borderRadius: 14, border: "1px solid #EAE7E2", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", overflow: "hidden" }}>
              <div style={{ padding: "12px 14px", borderBottom: "1px solid #F0EDE8" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1A1A" }}>주요 업무</span>
              </div>

              {/* 추가된 업무 목록 */}
              <div style={{ padding: "6px 0" }}>
                {memoTasks.length === 0 && (
                  <div style={{ padding: "12px 14px", fontSize: 12, color: "#BBBBBB" }}>아래에서 업무를 선택하세요</div>
                )}
                {memoTasks.map((task) => (
                  <div key={task.id}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px" }}
                    onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => { (e.currentTarget as HTMLDivElement).style.background = "#FAFAF9"; }}
                    onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                  >
                    <button onClick={() => toggleMemo(task.id)} style={{ width: 16, height: 16, borderRadius: 5, flexShrink: 0, border: task.done ? "2px solid #1A1A1A" : "1.5px solid #DCDCDC", background: task.done ? "#1A1A1A" : "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                      {task.done && <span style={{ color: "#FFFFFF", fontSize: 9, fontWeight: 700, lineHeight: 1 }}>✓</span>}
                    </button>
                    <span style={{ fontSize: 12, color: task.done ? "#BBBBBB" : "#1A1A1A", textDecoration: task.done ? "line-through" : "none", flex: 1, lineHeight: 1.5, transition: "all 0.15s" }}>
                      {task.text}
                    </span>
                    <button onClick={() => deleteMemo(task.id)}
                      style={{ border: "none", background: "none", color: "#DCDCDC", fontSize: 14, lineHeight: 1, padding: "0 2px", flexShrink: 0 }}
                      onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget as HTMLButtonElement).style.color = "#8B8B8B"; }}
                      onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget as HTMLButtonElement).style.color = "#DCDCDC"; }}
                    >×</button>
                  </div>
                ))}
              </div>

              {/* 프리셋 영역 */}
              <div style={{ padding: "8px 14px", borderTop: "1px solid #F0EDE8" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#8B8B8B" }}>빠른 선택</span>
                  <button onClick={() => setEditingPreset((v) => !v)} style={{ fontSize: 11, fontWeight: 600, color: editingPreset ? "#1A1A1A" : "#8B8B8B", background: "none", border: "none", padding: 0 }}>
                    {editingPreset ? "완료" : "편집"}
                  </button>
                </div>

                {editingPreset ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {presets.map((p) => (
                      <div key={p} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 0" }}>
                        <span style={{ fontSize: 12, color: "#1A1A1A" }}>{p}</span>
                        <button onClick={() => setPresets((prev) => prev.filter((x) => x !== p))}
                          style={{ border: "none", background: "none", color: "#DCDCDC", fontSize: 14, lineHeight: 1, padding: "0 2px" }}
                          onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget as HTMLButtonElement).style.color = "#F94239"; }}
                          onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget as HTMLButtonElement).style.color = "#DCDCDC"; }}
                        >×</button>
                      </div>
                    ))}
                    <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                      <input value={presetInput}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPresetInput(e.target.value)}
                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter" && presetInput.trim()) { setPresets((p) => [...p, presetInput.trim()]); setPresetInput(""); } }}
                        placeholder="새 프리셋 추가..."
                        style={{ flex: 1, minWidth: 0, padding: "5px 8px", fontSize: 11, background: "#F5F5F5", border: "1px solid #E8E5E0", borderRadius: 7, color: "#1A1A1A", fontFamily: "inherit", outline: "none" }} />
                      <button onClick={() => { if (presetInput.trim()) { setPresets((p) => [...p, presetInput.trim()]); setPresetInput(""); } }}
                        disabled={!presetInput.trim()}
                        style={{ flexShrink: 0, padding: "5px 8px", borderRadius: 7, border: "none", background: presetInput.trim() ? "#1A1A1A" : "#F5F5F5", color: presetInput.trim() ? "#FFFFFF" : "#BBBBBB", fontSize: 11, fontWeight: 600 }}>추가</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {presets.filter((p) => !memoTasks.find((t) => t.text === p)).map((preset) => (
                      <button key={preset}
                        onClick={() => setMemoTasks((p) => [...p, { id: Date.now() + Math.random(), text: preset, done: false }])}
                        style={{ fontSize: 11, fontWeight: 500, color: "#474747", background: "#F5F5F5", border: "1px solid #E8E5E0", borderRadius: 99, padding: "3px 9px", transition: "all 0.15s" }}
                        onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget as HTMLButtonElement).style.background = "#EBEBEB"; }}
                        onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget as HTMLButtonElement).style.background = "#F5F5F5"; }}
                      >+ {preset}</button>
                    ))}
                    {presets.filter((p) => !memoTasks.find((t) => t.text === p)).length === 0 && (
                      <span style={{ fontSize: 11, color: "#BBBBBB" }}>모든 프리셋이 추가됐어요</span>
                    )}
                  </div>
                )}
              </div>

              {/* 직접 입력 */}
              <div style={{ padding: "6px 14px 12px", borderTop: "1px solid #F0EDE8" }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <input value={memoInput}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMemoInput(e.target.value)}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter" && memoInput.trim()) addMemo(); }}
                    placeholder="직접 입력..."
                    style={{ flex: 1, minWidth: 0, padding: "6px 10px", fontSize: 12, background: "#F5F5F5", border: "1px solid #E8E5E0", borderRadius: 8, color: "#1A1A1A", fontFamily: "inherit", outline: "none" }} />
                  <button onClick={addMemo} disabled={!memoInput.trim()}
                    style={{ flexShrink: 0, padding: "6px 10px", borderRadius: 8, border: "none", background: memoInput.trim() ? "#1A1A1A" : "#F5F5F5", color: memoInput.trim() ? "#FFFFFF" : "#BBBBBB", fontSize: 12, fontWeight: 600, transition: "all 0.15s" }}>추가</button>
                </div>
              </div>
            </div>

            {/* 레벨 & XP */}
            <div style={{ background: "#FFFFFF", borderRadius: 14, border: "1px solid #EAE7E2", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.5px" }}>Lv.{currentLevel}</span>
                <span style={{ fontSize: 11, color: "#8B8B8B" }}>{earnedXp} / {MAX_XP} XP</span>
              </div>
              <div style={{ height: 5, background: "#F5F5F5", borderRadius: 99, overflow: "hidden", border: "1px solid #E8E5E0", marginBottom: 5 }}>
                <div style={{ width: `${levelProgress}%`, height: "100%", background: "#1A1A1A", borderRadius: 99, transition: "width 0.6s" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#BBBBBB" }}>
                <span>Lv.{currentLevel}</span>
                <span>{currentLevel < MAX_LEVEL ? `Lv.${currentLevel + 1}까지 ${Math.round(currentLevel * XP_PER_LEVEL - earnedXp)} XP` : "MAX"}</span>
              </div>
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #F0EDE8" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 11, color: "#8B8B8B" }}>오늘 달성</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#1A1A1A" }}>{pct}%</span>
                </div>
                <div style={{ height: 4, background: "#F5F5F5", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: "#DCDCDC", borderRadius: 99, transition: "width 0.6s" }} />
                </div>
              </div>
              <button
                onClick={() => setPhase("setup")}
                style={{ marginTop: 12, width: "100%", padding: "8px", borderRadius: 8, border: "1px solid #E8E5E0", background: "#FFFFFF", color: "#8B8B8B", fontSize: 12, fontWeight: 600 }}
              >
                재설정
              </button>
            </div>
          </div>

          {/* 오른쪽 타임라인 */}
          <div>
            {/* 진행 바 */}
            <div style={{ background: "#FFFFFF", borderRadius: 14, border: "1px solid #EAE7E2", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", padding: "14px 16px", marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 500, color: "#8B8B8B", marginBottom: 7 }}>
                <span>{startTime}</span>
                <span style={{ color: "#1A1A1A", fontWeight: 700 }}>{toTime(nowMin)} 현재</span>
                <span>{endTime}</span>
              </div>
              <div style={{ position: "relative", height: 5, background: "#F5F5F5", borderRadius: 99, border: "1px solid #E8E5E0" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: "#1A1A1A", borderRadius: 99, transition: "width 0.6s" }} />
                <div style={{ position: "absolute", top: "50%", left: `${nowPct}%`, transform: "translate(-50%, -50%)", width: 10, height: 10, borderRadius: "50%", background: "#1A1A1A", border: "2px solid #FFFFFF", boxShadow: "0 0 0 2px #DCDCDC" }} />
              </div>
            </div>

            {/* 통계 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
              {([["전체", slots.length], ["완료", doneCount], ["획득 XP", earnedXp]] as const).map(([label, val]) => (
                <div key={label} style={{ background: "#FFFFFF", borderRadius: 14, border: "1px solid #EAE7E2", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", padding: "10px 0", textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.5px" }}>{val}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#8B8B8B", marginTop: 1 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* 슬롯 */}
            {slots.map((slot, i) => {
              const st       = getStatus(slot);
              const c        = CAT[slot.category] || CAT["루틴"];
              const isActive = st === "active";
              const isDone   = st === "done";
              const isPast   = st === "past";
              const cardBg     = isActive ? "#F5EED8" : isDone ? "#F5F5F5" : "#FFFFFF";
              const cardBorder = isActive ? "#D4AF6A" : isDone ? "#DCDCDC" : "#EAE7E2";

              return (
                <div key={slot.id} className="slot" ref={isActive ? activeRef : null}
                  style={{ display: "flex", alignItems: "stretch", marginBottom: 4, animationDelay: `${Math.min(i * 0.008, 0.3)}s` }}
                >
                  <div style={{ width: 46, paddingTop: 13, paddingRight: 10, textAlign: "right", fontSize: 11, fontWeight: isActive ? 700 : 400, color: isActive ? "#1A1A1A" : "#BBBBBB", flexShrink: 0 }}>
                    {slot.time}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginRight: 10, flexShrink: 0 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", marginTop: 18, flexShrink: 0, background: isDone || isActive ? "#1A1A1A" : isPast ? "#DCDCDC" : "#E6E6E6", transition: "all 0.2s" }} />
                    {i < slots.length - 1 && <div style={{ width: 1, flex: 1, minHeight: 10, marginTop: 2, background: isDone ? "#DCDCDC" : "#F0EDE8" }} />}
                  </div>
                  <div
                    style={{ flex: 1, borderRadius: 13, padding: "9px 12px", marginBottom: 2, background: cardBg, border: `1px solid ${cardBorder}`, boxShadow: "0 1px 3px rgba(0,0,0,0.03)", transition: "all 0.15s" }}
                    onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => { if (!isActive && !isDone) { (e.currentTarget).style.borderColor = "#BBBBBB"; (e.currentTarget).style.transform = "translateY(-1px)"; } }}
                    onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => { if (!isActive && !isDone) { (e.currentTarget).style.borderColor = "#EAE7E2"; (e.currentTarget).style.transform = "translateY(0)"; } }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {editingId === slot.id ? (
                          <div style={{ display: "flex", gap: 5 }}>
                            <input autoFocus value={editText}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditText(e.target.value)}
                              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") saveEdit(slot.id); if (e.key === "Escape") setEditingId(null); }}
                              style={{ flex: 1, padding: "3px 8px", borderRadius: 6, border: "1.5px solid #1A1A1A", outline: "none", fontSize: 12, fontFamily: "inherit", color: "#1A1A1A", background: "#FFFFFF" }} />
                            <button onClick={() => saveEdit(slot.id)} style={{ background: "#1A1A1A", border: "none", color: "#FFFFFF", borderRadius: 6, padding: "3px 9px", fontSize: 11, fontWeight: 600 }}>저장</button>
                          </div>
                        ) : (
                          <div onClick={() => !isDone && (setEditingId(slot.id), setEditText(slot.title))}
                            style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isDone ? "#8B8B8B" : isPast ? "#BBBBBB" : "#1A1A1A", textDecoration: isDone ? "line-through" : "none", cursor: isDone ? "default" : "text", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {slot.title}
                          </div>
                        )}
                        <div style={{ display: "flex", gap: 5, alignItems: "center", marginTop: 3 }}>
                          <span style={{ fontSize: 10, fontWeight: 600, color: c.text, background: c.bg, padding: "1px 7px", borderRadius: 99, border: "1px solid #E8E5E0" }}>{slot.category}</span>
                          <span style={{ fontSize: 10, fontWeight: 600, color: "#8B8B8B" }}>{slot.xp} XP</span>
                          {isActive && <span style={{ fontSize: 10, fontWeight: 700, color: "#FFFFFF", background: "#1A1A1A", padding: "1px 7px", borderRadius: 99 }}>지금</span>}
                        </div>
                      </div>
                      <button onClick={() => toggleSlot(slot.id)}
                        style={{ width: 26, height: 26, borderRadius: 7, border: isDone ? "2px solid #1A1A1A" : "1.5px solid #DCDCDC", background: isDone ? "#1A1A1A" : "#FFFFFF", color: isDone ? "#FFFFFF" : "#DCDCDC", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0, transition: "all 0.15s" }}>
                        ✓
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* 요약 */}
            <div style={{ marginTop: 16, background: pct === 100 ? "#1A1A1A" : "#FFFFFF", borderRadius: 16, border: "1px solid #EAE7E2", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", padding: "20px", textAlign: "center", transition: "background 0.4s" }}>
              <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4, color: pct === 100 ? "#FFFFFF" : "#1A1A1A" }}>
                {pct === 100 ? "오늘의 모든 퀘스트 완료!" : `${pct}% 달성 중`}
              </div>
              <div style={{ fontSize: 12, color: pct === 100 ? "rgba(255,255,255,0.5)" : "#8B8B8B" }}>
                획득 XP <span style={{ fontWeight: 700, color: pct === 100 ? "#FFFFFF" : "#1A1A1A" }}>{earnedXp}</span> / {totalXp}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}