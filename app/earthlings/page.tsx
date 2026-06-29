"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";

declare global {
  interface Window {
    html2canvas: (element: HTMLElement, options?: object) => Promise<HTMLCanvasElement>;
  }
}

type Baby = {
  id: number;
  num: string;
  parent1: string;
  parent2: string;
  name: string;
  birthdate: string;
  housewarming: number;
  status: "born" | "incoming";
  gender: "m" | "f";
};

type WaitingFamily = {
  id: number;
  parent1: string;
  parent2: string;
  housewarming: boolean;
};

function getAge(birthdate: string) {
  const today = new Date();
  const birth = new Date(birthdate);
  const diffDays = Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const months = Math.floor(diffDays / 30.44);
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  if (years > 0) return { label: `${years}년 ${remMonths}개월`, days: diffDays };
  return { label: `${months}개월`, days: diffDays };
}

function getDday(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getNextBirthday(birthdate: string) {
  const today = new Date();
  const birth = new Date(birthdate);
  const next = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  if (next < today) next.setFullYear(today.getFullYear() + 1);
  return Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

const IconGrid = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor">
    <rect x="1" y="1" width="5.5" height="5.5" rx="1.2" />
    <rect x="8.5" y="1" width="5.5" height="5.5" rx="1.2" />
    <rect x="1" y="8.5" width="5.5" height="5.5" rx="1.2" />
    <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1.2" />
  </svg>
);

const IconTable = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor">
    <rect x="1" y="1.5" width="13" height="2.5" rx="1" />
    <rect x="1" y="6.25" width="13" height="2.5" rx="1" />
    <rect x="1" y="11" width="13" height="2.5" rx="1" />
  </svg>
);

const emptyForm = {
  type: "baby" as "baby" | "waiting",
  name: "",
  parent1: "",
  parent2: "",
  birthdate: "",
  gender: "m" as "m" | "f",
  status: "born" as "born" | "incoming",
  housewarming: 0,
  waitingHousewarming: false,
};

export default function EarthlingsPage() {
  const [babies, setBabies] = useState<Baby[]>([]);
  const [waitingList, setWaitingList] = useState<WaitingFamily[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "incoming" | "birthday">("all");
  const [viewMode, setViewMode] = useState<"card" | "table">("table");
  const [capturing, setCapturing] = useState(false);
  const [manageMode, setManageMode] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [b, w] = await Promise.all([
      supabase.from("earthlings_babies").select("*").order("sort_order"),
      supabase.from("earthlings_waiting").select("*").order("sort_order"),
    ]);
    setBabies((b.data as Baby[]) ?? []);
    setWaitingList((w.data as WaitingFamily[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
    document.head.appendChild(script);
  }, []);

  const handleCapture = async () => {
    if (!captureRef.current || !window.html2canvas) return;
    setManageMode(false);
    setCapturing(true);
    await new Promise((r) => setTimeout(r, 100));
    const canvas = await window.html2canvas(captureRef.current, {
      backgroundColor: "#F8F8FA",
      scale: 2,
      useCORS: true,
    });
    const link = document.createElement("a");
    link.download = "지구의아이들.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
    setCapturing(false);
  };

  const nextNum = () => {
    const max = babies.reduce((m, b) => {
      const n = parseInt(b.num.replace(/[^0-9]/g, ""), 10);
      return isNaN(n) ? m : Math.max(m, n);
    }, 0);
    return `${max + 1}호`;
  };

  const handleSave = async () => {
    if (saving) return;
    const supabase = createClient();
    if (form.type === "baby") {
      if (!form.name.trim() || !form.parent1.trim() || !form.birthdate) {
        alert("이름, 엄마/아빠, 생년월일(예정일)은 필수예요.");
        return;
      }
      setSaving(true);
      const { error } = await supabase.from("earthlings_babies").insert({
        num: nextNum(),
        parent1: form.parent1.trim(),
        parent2: form.parent2.trim(),
        name: form.name.trim(),
        birthdate: form.birthdate,
        housewarming: form.housewarming,
        status: form.status,
        gender: form.gender,
        sort_order: babies.length + 1,
      });
      setSaving(false);
      if (error) {
        alert("저장 오류: " + error.message);
        return;
      }
    } else {
      if (!form.parent1.trim()) {
        alert("이름은 필수예요.");
        return;
      }
      setSaving(true);
      const { error } = await supabase.from("earthlings_waiting").insert({
        parent1: form.parent1.trim(),
        parent2: form.parent2.trim(),
        housewarming: form.waitingHousewarming,
        sort_order: waitingList.length + 1,
      });
      setSaving(false);
      if (error) {
        alert("저장 오류: " + error.message);
        return;
      }
    }
    setForm(emptyForm);
    setShowAdd(false);
    load();
  };

  const handleDeleteBaby = async (id: number, name: string) => {
    if (!confirm(`${name} 기록을 삭제할까요?`)) return;
    const supabase = createClient();
    await supabase.from("earthlings_babies").delete().eq("id", id);
    load();
  };

  const handleDeleteWaiting = async (id: number, name: string) => {
    if (!confirm(`${name} 대기 기록을 삭제할까요?`)) return;
    const supabase = createClient();
    await supabase.from("earthlings_waiting").delete().eq("id", id);
    load();
  };

  const filtered =
    filter === "incoming"
      ? babies.filter((b) => b.status === "incoming")
      : filter === "birthday"
      ? [...babies.filter((b) => b.status === "born")]
          .sort((a, b) => getNextBirthday(a.birthdate) - getNextBirthday(b.birthdate))
          .slice(0, 5)
      : babies;

  const bornFiltered = filtered.filter((b) => b.status === "born");
  const bornCount = babies.filter((b) => b.status === "born").length;
  const incomingCount = babies.filter((b) => b.status === "incoming").length;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8F8FA", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 32, height: 32, border: "3px solid #6366f1", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif", background: "#F8F8FA", minHeight: "100vh" }}>
      {/* 헤더 */}
      <div style={{ background: "#fff", borderBottom: "1px solid #EEEEF2", padding: "20px 24px 0" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "#18181B", margin: 0 }}>지구의 아이들 👶</h1>
              <p style={{ fontSize: 13, color: "#71717A", margin: "4px 0 0" }}>
                {bornCount}명 태어남 · 예정 {incomingCount}명 · 대기 {waitingList.length}팀
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
              {/* 뷰 토글 */}
              <div style={{ display: "flex", background: "#F4F4F6", borderRadius: 10, padding: 3 }}>
                {([{ key: "card", icon: <IconGrid /> }, { key: "table", icon: <IconTable /> }] as const).map((v) => (
                  <button
                    key={v.key}
                    onClick={() => setViewMode(v.key)}
                    style={{
                      background: viewMode === v.key ? "#fff" : "transparent",
                      border: "none", borderRadius: 7, padding: "6px 10px", cursor: "pointer",
                      color: viewMode === v.key ? "#6366f1" : "#A1A1AA",
                      boxShadow: viewMode === v.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                      display: "flex", alignItems: "center", transition: "all .15s",
                    }}
                  >
                    {v.icon}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setManageMode((m) => !m)}
                style={{ background: manageMode ? "#FEE2E2" : "#F4F4F6", color: manageMode ? "#DC2626" : "#71717A", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                {manageMode ? "완료" : "관리"}
              </button>
              <button
                onClick={() => { setForm(emptyForm); setShowAdd(true); }}
                style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                + 추가
              </button>
              <button
                onClick={handleCapture}
                disabled={capturing}
                style={{ background: capturing ? "#E4E4E7" : "#18181B", color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                {capturing ? "캡쳐 중..." : "📸 캡쳐"}
              </button>
            </div>
          </div>

          {/* 필터 탭 */}
          <div style={{ display: "flex", gap: 2, marginTop: 16 }}>
            {([
              { key: "all", label: `전체 ${babies.length}` },
              { key: "incoming", label: `출산예정 ${incomingCount}` },
              { key: "birthday", label: "생일 임박" },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                style={{
                  background: "none", border: "none", padding: "8px 14px",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                  color: filter === tab.key ? "#6366f1" : "#71717A",
                  borderBottom: filter === tab.key ? "2px solid #6366f1" : "2px solid transparent",
                  marginBottom: -1,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div ref={captureRef} style={{ maxWidth: 720, margin: "0 auto", padding: "20px 24px" }}>
        {/* 출산예정 배너 */}
        {babies.filter((b) => b.status === "incoming").map((baby) => (
          <div
            key={baby.id}
            style={{
              background: baby.gender === "m"
                ? "linear-gradient(135deg,#3B82F6,#6366f1)"
                : "linear-gradient(135deg,#EC4899,#f472b6)",
              borderRadius: 16, padding: "16px 20px", marginBottom: 12,
              display: "flex", alignItems: "center", justifyContent: "space-between", color: "#fff",
            }}
          >
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.8 }}>출산예정</div>
              <div style={{ fontSize: 17, fontWeight: 700, marginTop: 2 }}>
                {baby.parent1} · {baby.parent2} <span style={{ opacity: 0.85 }}>의 {baby.name}</span>
              </div>
              <div style={{ fontSize: 12, opacity: 0.75, marginTop: 3 }}>{baby.birthdate}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1 }}>D-{getDday(baby.birthdate)}</div>
                <div style={{ fontSize: 11, opacity: 0.75, marginTop: 2 }}>일 남음</div>
              </div>
              {manageMode && (
                <button onClick={() => handleDeleteBaby(baby.id, baby.name)} style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "none", borderRadius: 8, width: 28, height: 28, cursor: "pointer", fontSize: 14, fontWeight: 700 }}>✕</button>
              )}
            </div>
          </div>
        ))}

        {/* 카드 뷰 */}
        {viewMode === "card" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {bornFiltered.map((baby) => {
              const age = getAge(baby.birthdate);
              const bday = getNextBirthday(baby.birthdate);
              const isBdaySoon = bday <= 30;
              return (
                <div key={baby.id} style={{ background: "#fff", borderRadius: 16, padding: "16px", border: isBdaySoon ? "2px solid #f97316" : "1px solid #EEEEF2", position: "relative" }}>
                  {manageMode && (
                    <button onClick={() => handleDeleteBaby(baby.id, baby.name)} style={{ position: "absolute", top: 10, right: 10, background: "#FEE2E2", color: "#DC2626", border: "none", borderRadius: 8, width: 24, height: 24, cursor: "pointer", fontSize: 12, fontWeight: 700, zIndex: 2 }}>✕</button>
                  )}
                  {!manageMode && isBdaySoon && (
                    <div style={{ position: "absolute", top: 10, right: 10, background: "#f97316", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 20, padding: "2px 8px" }}>
                      🎂 D-{bday}
                    </div>
                  )}
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: baby.gender === "m" ? "#DBEAFE" : "#FCE7F3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, marginBottom: 10, color: baby.gender === "m" ? "#3B82F6" : "#EC4899" }}>
                    {baby.num}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#18181B" }}>{baby.name}</div>
                  <div style={{ fontSize: 12, color: "#71717A", marginTop: 2 }}>{baby.parent1} · {baby.parent2}</div>
                  <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ background: "#F4F4F6", borderRadius: 8, padding: "3px 8px", fontSize: 11, fontWeight: 600, color: "#3f3f46" }}>{age.label}</span>
                    <span style={{ background: "#F4F4F6", borderRadius: 8, padding: "3px 8px", fontSize: 11, fontWeight: 600, color: "#3f3f46" }}>{age.days.toLocaleString()}일</span>
                    {baby.housewarming > 0 && (
                      <span style={{ background: "#EEF2FF", borderRadius: 8, padding: "3px 8px", fontSize: 10, fontWeight: 600, color: "#6366f1" }}>
                        {"🎖️".repeat(baby.housewarming)}
                      </span>
                    )}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 11, color: "#A1A1AA" }}>{baby.birthdate}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* 테이블 뷰 */}
        {viewMode === "table" && (
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #EEEEF2", overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #EEEEF2" }}>
                  {["이름", "부모", "생년월일 · 생일", "나이 / 일수", "집들이"].map((h) => (
                    <th key={h} style={{ padding: "11px 12px", textAlign: "center", background: "#F8F8FA", fontSize: 11, fontWeight: 700, color: "#71717A", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                  {manageMode && <th style={{ background: "#F8F8FA", width: 40 }} />}
                </tr>
              </thead>
              <tbody>
                {filtered.map((baby, i) => {
                  const age = baby.status === "born" ? getAge(baby.birthdate) : null;
                  const bday = baby.status === "born" ? getNextBirthday(baby.birthdate) : null;
                  const isIncoming = baby.status === "incoming";
                  const isBdaySoon = bday !== null && bday <= 30;
                  const bdShort = baby.birthdate.slice(2).replace(/-/g, ".");
                  return (
                    <tr key={baby.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #F4F4F6" : "none", background: isIncoming ? "#F5F3FF" : i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                      <td style={{ padding: "10px 12px", whiteSpace: "nowrap", textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: "#A1A1AA", fontWeight: 600, marginBottom: 1 }}>{baby.num}</div>
                        <div style={{ fontWeight: 700, color: baby.gender === "m" ? "#3B82F6" : "#EC4899" }}>{baby.name}</div>
                      </td>
                      <td style={{ padding: "10px 12px", color: "#3f3f46", whiteSpace: "nowrap", fontSize: 12, textAlign: "center" }}>
                        {baby.parent1}<br /><span style={{ color: "#71717A" }}>{baby.parent2}</span>
                      </td>
                      <td style={{ padding: "10px 12px", whiteSpace: "nowrap", fontSize: 12, fontVariantNumeric: "tabular-nums", textAlign: "center" }}>
                        <div style={{ color: "#71717A" }}>{bdShort}</div>
                        {!isIncoming && (
                          <div style={{ fontSize: 11, color: isBdaySoon ? "#f97316" : "#A1A1AA", fontWeight: isBdaySoon ? 700 : 400, marginTop: 2 }}>
                            {isBdaySoon ? `🎂 D-${bday}` : `D-${bday}`}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "10px 12px", whiteSpace: "nowrap", textAlign: "center" }}>
                        {isIncoming ? (
                          <span style={{ color: "#8b5cf6", fontWeight: 700 }}>D-{getDday(baby.birthdate)}</span>
                        ) : (
                          <>
                            <div style={{ color: "#3f3f46", fontWeight: 600, fontSize: 12 }}>{age!.label}</div>
                            <div style={{ color: "#A1A1AA", fontSize: 11 }}>{age!.days.toLocaleString()}일</div>
                          </>
                        )}
                      </td>
                      <td style={{ padding: "10px 12px", whiteSpace: "nowrap", textAlign: "center" }}>
                        {baby.housewarming > 0 ? (
                          <span style={{ fontSize: 11, letterSpacing: "-2px" }}>{"🎖️".repeat(baby.housewarming)}</span>
                        ) : (
                          <span style={{ color: "#D4D4D8" }}></span>
                        )}
                      </td>
                      {manageMode && (
                        <td style={{ padding: "10px 8px", textAlign: "center" }}>
                          <button onClick={() => handleDeleteBaby(baby.id, baby.name)} style={{ background: "#FEE2E2", color: "#DC2626", border: "none", borderRadius: 7, width: 24, height: 24, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>✕</button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 대기 명단 */}
        <div style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#3f3f46", marginBottom: 12 }}>대기 중 ({waitingList.length}팀)</h2>
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #EEEEF2", overflow: "hidden" }}>
            {waitingList.map((w, i) => (
              <div key={w.id} style={{ padding: "12px 16px", borderBottom: i < waitingList.length - 1 ? "1px solid #F4F4F6" : "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#18181B" }}>{w.parent1}</span>
                  {w.parent2 && <span style={{ fontSize: 14, color: "#71717A" }}> · {w.parent2}</span>}
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {w.housewarming && <span style={{ fontSize: 11, color: "#6366f1", background: "#EEF2FF", borderRadius: 6, padding: "2px 7px", fontWeight: 600 }}>🎖️</span>}
                  <span style={{ fontSize: 11, color: "#A1A1AA", background: "#F4F4F6", borderRadius: 6, padding: "2px 7px", fontWeight: 600 }}>대기</span>
                  {manageMode && (
                    <button onClick={() => handleDeleteWaiting(w.id, w.parent1)} style={{ background: "#FEE2E2", color: "#DC2626", border: "none", borderRadius: 7, width: 24, height: 24, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>✕</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 통계 */}
        <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[
            { label: "총 아이", value: bornCount + "명" },
            { label: "출산예정", value: incomingCount + "명" },
            { label: "대기팀", value: waitingList.length + "팀" },
          ].map((stat, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 14, padding: "14px 12px", border: "1px solid #EEEEF2", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#6366f1" }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: "#71717A", marginTop: 2, fontWeight: 500 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <p style={{ textAlign: "center", fontSize: 11, color: "#C4C4CC", marginTop: 24 }}>
          생일 D-30, D-7, D-Day · 카카오톡 알림
        </p>
      </div>

      {/* 추가 모달 */}
      {showAdd && (
        <div
          onClick={() => setShowAdd(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.48)", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, padding: "24px 24px 32px", fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "#18181B", margin: 0 }}>추가하기</h3>
              <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", fontSize: 20, color: "#A1A1AA", cursor: "pointer" }}>✕</button>
            </div>

            {/* 타입 토글 */}
            <div style={{ display: "flex", background: "#F4F4F6", borderRadius: 10, padding: 3, marginBottom: 18 }}>
              {([{ key: "baby", label: "아이" }, { key: "waiting", label: "대기" }] as const).map((t) => (
                <button
                  key={t.key}
                  onClick={() => setForm((f) => ({ ...f, type: t.key }))}
                  style={{
                    flex: 1, border: "none", borderRadius: 8, padding: "9px 0", fontSize: 13, fontWeight: 600, cursor: "pointer",
                    background: form.type === t.key ? "#fff" : "transparent",
                    color: form.type === t.key ? "#6366f1" : "#A1A1AA",
                    boxShadow: form.type === t.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {form.type === "baby" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Field label="아이 이름 (태명)">
                  <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="예: 김아린 / 꼬부기" style={inputStyle} />
                </Field>
                <div style={{ display: "flex", gap: 10 }}>
                  <Field label="엄마/아빠">
                    <input value={form.parent1} onChange={(e) => setForm((f) => ({ ...f, parent1: e.target.value }))} placeholder="하윤서" style={inputStyle} />
                  </Field>
                  <Field label="아빠/엄마">
                    <input value={form.parent2} onChange={(e) => setForm((f) => ({ ...f, parent2: e.target.value }))} placeholder="박도현" style={inputStyle} />
                  </Field>
                </div>
                <Field label="생년월일 / 출산예정일">
                  <input type="date" value={form.birthdate} onChange={(e) => setForm((f) => ({ ...f, birthdate: e.target.value }))} style={inputStyle} />
                </Field>
                <div style={{ display: "flex", gap: 10 }}>
                  <Field label="성별">
                    <div style={{ display: "flex", gap: 8 }}>
                      {([{ k: "m", l: "남아", c: "#3B82F6" }, { k: "f", l: "여아", c: "#EC4899" }] as const).map((g) => (
                        <button key={g.k} onClick={() => setForm((f) => ({ ...f, gender: g.k }))}
                          style={{ flex: 1, padding: "10px 0", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer",
                            border: form.gender === g.k ? `2px solid ${g.c}` : "1px solid #E4E4E7",
                            background: form.gender === g.k ? g.c + "12" : "#fff", color: form.gender === g.k ? g.c : "#71717A" }}>
                          {g.l}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label="상태">
                    <div style={{ display: "flex", gap: 8 }}>
                      {([{ k: "born", l: "태어남" }, { k: "incoming", l: "예정" }] as const).map((s) => (
                        <button key={s.k} onClick={() => setForm((f) => ({ ...f, status: s.k }))}
                          style={{ flex: 1, padding: "10px 0", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer",
                            border: form.status === s.k ? "2px solid #6366f1" : "1px solid #E4E4E7",
                            background: form.status === s.k ? "#EEF2FF" : "#fff", color: form.status === s.k ? "#6366f1" : "#71717A" }}>
                          {s.l}
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>
                <Field label={`집들이 횟수 ${"🎖️".repeat(form.housewarming)}`}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button onClick={() => setForm((f) => ({ ...f, housewarming: Math.max(0, f.housewarming - 1) }))} style={stepperStyle}>−</button>
                    <span style={{ fontSize: 16, fontWeight: 700, color: "#18181B", minWidth: 20, textAlign: "center" }}>{form.housewarming}</span>
                    <button onClick={() => setForm((f) => ({ ...f, housewarming: f.housewarming + 1 }))} style={stepperStyle}>+</button>
                  </div>
                </Field>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", gap: 10 }}>
                  <Field label="이름">
                    <input value={form.parent1} onChange={(e) => setForm((f) => ({ ...f, parent1: e.target.value }))} placeholder="정해영" style={inputStyle} />
                  </Field>
                  <Field label="배우자 (선택)">
                    <input value={form.parent2} onChange={(e) => setForm((f) => ({ ...f, parent2: e.target.value }))} placeholder="김영진" style={inputStyle} />
                  </Field>
                </div>
                <Field label="집들이 완료">
                  <button onClick={() => setForm((f) => ({ ...f, waitingHousewarming: !f.waitingHousewarming }))}
                    style={{ padding: "10px 14px", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "left",
                      border: form.waitingHousewarming ? "2px solid #6366f1" : "1px solid #E4E4E7",
                      background: form.waitingHousewarming ? "#EEF2FF" : "#fff", color: form.waitingHousewarming ? "#6366f1" : "#71717A" }}>
                    {form.waitingHousewarming ? "🎖️ 완료" : "미완료"}
                  </button>
                </Field>
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              style={{ width: "100%", marginTop: 22, background: saving ? "#A5B4FC" : "#6366f1", color: "#fff", border: "none", borderRadius: 12, padding: "14px 0", fontSize: 15, fontWeight: 700, cursor: "pointer" }}
            >
              {saving ? "저장 중..." : "저장하기"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", background: "#F5F5F5", border: "1px solid #E4E4E7",
  borderRadius: 10, padding: "11px 13px", fontSize: 14, color: "#18181B", outline: "none",
};

const stepperStyle: React.CSSProperties = {
  width: 38, height: 38, borderRadius: 10, border: "1px solid #E4E4E7", background: "#fff",
  fontSize: 18, fontWeight: 700, color: "#6366f1", cursor: "pointer",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ flex: 1, display: "block" }}>
      <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#71717A", marginBottom: 6 }}>{label}</span>
      {children}
    </label>
  );
}
