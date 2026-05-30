"use client";

import { useState, useEffect } from "react";
import React from "react";

const BATCH_SIZE = 20; // 한 번에 20페이지씩

export default function DongiinAdminPage() {
  const [status, setStatus] = useState<"idle" | "running" | "done">("idle");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalStored, setTotalStored] = useState<number | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    fetch("/api/dongiin-list?page=1&limit=1")
      .then((r) => r.json())
      .then((d) => { if (d.ok) setTotalStored(d.total); });
  }, []);

  function addLog(msg: string) {
    setLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  }

  const runningRef = React.useRef(false);

  async function runBatch(startPage: number): Promise<{ finished: boolean; nextPage: number }> {
    addLog(`페이지 ${startPage}~${startPage + BATCH_SIZE - 1} 스크래핑 중...`);
    try {
      const res = await fetch("/api/dongiin-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startPage, endPage: startPage + BATCH_SIZE - 1 }),
      });
      const data = await res.json();
      if (data.ok) {
        setTotalStored(data.totalStored);
        addLog(`✅ ${data.totalMovies}편 파싱 · ${data.saved}편 저장 · 누적 ${data.totalStored?.toLocaleString()}편`);
        if (data.totalMovies === 0) return { finished: true, nextPage: startPage };
        return { finished: false, nextPage: startPage + BATCH_SIZE };
      } else {
        addLog(`❌ 오류: ${data.error}`);
        return { finished: true, nextPage: startPage };
      }
    } catch (e) {
      addLog(`❌ 네트워크 오류: ${e}`);
      return { finished: true, nextPage: startPage };
    }
  }

  async function runAll() {
    runningRef.current = true;
    setStatus("running");
    setIsFinished(false);
    setLog([]);
    setCurrentPage(1);
    let page = 1;
    while (runningRef.current) {
      const { finished, nextPage } = await runBatch(page);
      setCurrentPage(nextPage);
      if (finished) {
        addLog("🎉 전체 수집 완료!");
        setIsFinished(true);
        setStatus("done");
        break;
      }
      page = nextPage;
    }
    runningRef.current = false;
  }

  async function continueAll() {
    runningRef.current = true;
    setStatus("running");
    let page = currentPage;
    while (runningRef.current) {
      const { finished, nextPage } = await runBatch(page);
      setCurrentPage(nextPage);
      if (finished) {
        addLog("🎉 전체 수집 완료!");
        setIsFinished(true);
        setStatus("done");
        break;
      }
      page = nextPage;
    }
    runningRef.current = false;
  }

  function stopAll() {
    runningRef.current = false;
    setStatus("idle");
    addLog("⏹ 중단됨");
  }

  async function updateNew() {
    setStatus("running");
    addLog("새 포스팅 확인 중...");
    try {
      const res = await fetch("/api/dongiin-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startPage: 1, endPage: 3 }), // 최근 3페이지만
      });
      const data = await res.json();
      setTotalStored(data.totalStored);
      addLog(`✅ 업데이트 완료: ${data.saved}편 추가됨 (누적 ${data.totalStored}편)`);
      setStatus("idle");
    } catch (e) {
      addLog(`❌ 오류: ${e}`);
      setStatus("idle");
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[#FAFAFA] flex flex-col">
      <header className="bg-white/80 backdrop-blur-[12px] border-b border-[#E6E6E6] h-14 sticky top-0 z-50 flex items-center justify-between px-6">
        <span className="text-sm font-bold text-[#222222]">이동진 추적기 — 관리자</span>
        <a href="/dongiin" className="text-xs font-semibold text-[#7C8C03]">← 서비스로</a>
      </header>

      <main className="max-w-[600px] mx-auto w-full px-5 py-8 flex flex-col gap-5">
        {/* 현황 */}
        <div className="bg-white rounded-[14px] border border-[#E6E6E6] p-6 flex flex-col gap-2">
          <p className="text-xs font-semibold text-[#8B8B8B]">현재 저장된 영화</p>
          <p className="text-[40px] font-extrabold text-[#7C8C03] tracking-tight">
            {totalStored?.toLocaleString() ?? "—"}
            <span className="text-base font-semibold text-[#8B8B8B] ml-1">편</span>
          </p>
          <p className="text-xs text-[#BBBBBB]">블로그 전체 포스팅 약 1,616개 · 포스팅당 평균 5~10편</p>
        </div>

        {/* 진행 상태 */}
        {status === "running" && (
          <div className="bg-[#F4F6E0] border border-[#CEDA80] rounded-[14px] p-4 flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-[#CEDA80] border-t-[#7C8C03] animate-spin flex-shrink-0" />
            <p className="text-sm font-semibold text-[#7C8C03]">스크래핑 중... (30~60초 소요)</p>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex flex-col gap-3">
          {/* 새 포스팅 업데이트 */}
          <button
            onClick={updateNew}
            disabled={status === "running"}
            className="w-full py-4 rounded-[12px] text-sm font-bold transition-all duration-150 disabled:opacity-50"
            style={{ background: "#7C8C03", color: "#fff" }}
          >
            🔄 새 포스팅만 업데이트 (최근 3페이지)
          </button>

          <div className="h-px bg-[#E6E6E6]" />

          {/* 전체 긁기 */}
          <div className="bg-white rounded-[14px] border border-[#E6E6E6] p-4 flex flex-col gap-3">
            <p className="text-xs font-semibold text-[#8B8B8B]">전체 초기 수집 (1,616개 포스팅)</p>
            <p className="text-xs text-[#BBBBBB] break-keep">
              한 번 누르면 끝날 때까지 자동으로 전체 수집해요.
              <br />현재 진행: <strong className="text-[#222222]">{currentPage - 1}페이지까지 완료</strong>
            </p>
            <div className="flex gap-2">
              <button
                onClick={runAll}
                disabled={status === "running"}
                className="flex-1 py-3 rounded-[12px] text-sm font-bold border border-[#E6E6E6] bg-[#F5F5F5] text-[#222222] disabled:opacity-50 transition-all"
              >
                처음부터 자동 수집
              </button>
              <button
                onClick={status === "running" ? stopAll : continueAll}
                disabled={isFinished && status !== "running"}
                className="flex-1 py-3 rounded-[12px] text-sm font-bold transition-all disabled:opacity-50"
                style={{
                  background: status === "running" ? "#F94239" : "#7C8C03",
                  color: "#fff",
                }}
              >
                {status === "running" ? "⏹ 중단" : "▶ 이어서 수집"}
              </button>
            </div>
          </div>
        </div>

        {/* 로그 */}
        {log.length > 0 && (
          <div className="bg-[#222222] rounded-[14px] p-4 flex flex-col gap-1 max-h-[300px] overflow-y-auto">
            {log.map((l, i) => (
              <p key={i} className="text-xs font-mono text-[#A0B020]">{l}</p>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-[#BBBBBB]">
          관리자 전용 페이지 · <a href="/dongiin" className="text-[#7C8C03]">서비스 바로가기</a>
        </p>
      </main>
    </div>
  );
}
