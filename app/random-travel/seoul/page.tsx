"use client";

import { useState, useEffect, useRef } from "react";

const SEOUL_DONGS = [
  { name: "종로구 청운동", lat: 37.5841, lng: 126.9700 },
  { name: "종로구 삼청동", lat: 37.5843, lng: 126.9816 },
  { name: "종로구 인사동", lat: 37.5745, lng: 126.9852 },
  { name: "종로구 혜화동", lat: 37.5826, lng: 127.0019 },
  { name: "종로구 창신동", lat: 37.5752, lng: 127.0142 },
  { name: "중구 명동", lat: 37.5636, lng: 126.9826 },
  { name: "중구 을지로", lat: 37.5660, lng: 126.9910 },
  { name: "중구 황학동", lat: 37.5697, lng: 127.0148 },
  { name: "중구 신당동", lat: 37.5598, lng: 127.0179 },
  { name: "용산구 이태원동", lat: 37.5347, lng: 126.9946 },
  { name: "용산구 한남동", lat: 37.5344, lng: 127.0046 },
  { name: "용산구 후암동", lat: 37.5457, lng: 126.9794 },
  { name: "용산구 효창동", lat: 37.5388, lng: 126.9635 },
  { name: "성동구 성수동", lat: 37.5443, lng: 127.0566 },
  { name: "성동구 왕십리동", lat: 37.5612, lng: 127.0372 },
  { name: "성동구 금호동", lat: 37.5531, lng: 127.0213 },
  { name: "광진구 건대입구", lat: 37.5403, lng: 127.0701 },
  { name: "광진구 구의동", lat: 37.5388, lng: 127.0911 },
  { name: "광진구 능동", lat: 37.5508, lng: 127.0827 },
  { name: "동대문구 회기동", lat: 37.5897, lng: 127.0504 },
  { name: "동대문구 전농동", lat: 37.5806, lng: 127.0430 },
  { name: "동대문구 답십리동", lat: 37.5689, lng: 127.0584 },
  { name: "중랑구 상봉동", lat: 37.6045, lng: 127.0862 },
  { name: "중랑구 면목동", lat: 37.5848, lng: 127.0849 },
  { name: "성북구 성북동", lat: 37.5927, lng: 126.9988 },
  { name: "성북구 정릉동", lat: 37.6074, lng: 127.0009 },
  { name: "성북구 길음동", lat: 37.6056, lng: 127.0254 },
  { name: "강북구 수유동", lat: 37.6382, lng: 127.0246 },
  { name: "강북구 미아동", lat: 37.6263, lng: 127.0291 },
  { name: "도봉구 쌍문동", lat: 37.6527, lng: 127.0322 },
  { name: "도봉구 방학동", lat: 37.6612, lng: 127.0446 },
  { name: "도봉구 창동", lat: 37.6526, lng: 127.0477 },
  { name: "노원구 공릉동", lat: 37.6244, lng: 127.0766 },
  { name: "노원구 하계동", lat: 37.6392, lng: 127.0670 },
  { name: "노원구 중계동", lat: 37.6458, lng: 127.0735 },
  { name: "노원구 상계동", lat: 37.6558, lng: 127.0629 },
  { name: "은평구 불광동", lat: 37.6136, lng: 126.9276 },
  { name: "은평구 응암동", lat: 37.6024, lng: 126.9178 },
  { name: "은평구 진관동", lat: 37.6378, lng: 126.9189 },
  { name: "서대문구 연희동", lat: 37.5712, lng: 126.9279 },
  { name: "서대문구 홍제동", lat: 37.5936, lng: 126.9415 },
  { name: "서대문구 북아현동", lat: 37.5588, lng: 126.9456 },
  { name: "마포구 합정동", lat: 37.5497, lng: 126.9131 },
  { name: "마포구 홍대입구", lat: 37.5572, lng: 126.9249 },
  { name: "마포구 망원동", lat: 37.5557, lng: 126.9049 },
  { name: "마포구 상암동", lat: 37.5789, lng: 126.8908 },
  { name: "마포구 연남동", lat: 37.5627, lng: 126.9219 },
  { name: "양천구 목동", lat: 37.5270, lng: 126.8749 },
  { name: "양천구 신정동", lat: 37.5213, lng: 126.8658 },
  { name: "강서구 화곡동", lat: 37.5484, lng: 126.8494 },
  { name: "강서구 마곡동", lat: 37.5597, lng: 126.8303 },
  { name: "강서구 방화동", lat: 37.5706, lng: 126.8089 },
  { name: "구로구 구로동", lat: 37.4954, lng: 126.8874 },
  { name: "구로구 신도림동", lat: 37.5083, lng: 126.8913 },
  { name: "구로구 개봉동", lat: 37.4985, lng: 126.8603 },
  { name: "금천구 독산동", lat: 37.4781, lng: 126.8946 },
  { name: "금천구 시흥동", lat: 37.4578, lng: 126.9000 },
  { name: "영등포구 여의도동", lat: 37.5219, lng: 126.9245 },
  { name: "영등포구 문래동", lat: 37.5186, lng: 126.9004 },
  { name: "영등포구 당산동", lat: 37.5339, lng: 126.9017 },
  { name: "동작구 사당동", lat: 37.4761, lng: 126.9814 },
  { name: "동작구 노량진동", lat: 37.5131, lng: 126.9426 },
  { name: "동작구 상도동", lat: 37.4992, lng: 126.9493 },
  { name: "관악구 신림동", lat: 37.4840, lng: 126.9296 },
  { name: "관악구 봉천동", lat: 37.4778, lng: 126.9521 },
  { name: "관악구 낙성대동", lat: 37.4783, lng: 126.9634 },
  { name: "서초구 서초동", lat: 37.4837, lng: 127.0324 },
  { name: "서초구 방배동", lat: 37.4812, lng: 126.9974 },
  { name: "서초구 반포동", lat: 37.5040, lng: 127.0050 },
  { name: "서초구 잠원동", lat: 37.5138, lng: 127.0074 },
  { name: "강남구 압구정동", lat: 37.5272, lng: 127.0286 },
  { name: "강남구 청담동", lat: 37.5243, lng: 127.0475 },
  { name: "강남구 삼성동", lat: 37.5140, lng: 127.0572 },
  { name: "강남구 역삼동", lat: 37.5006, lng: 127.0368 },
  { name: "강남구 개포동", lat: 37.4813, lng: 127.0503 },
  { name: "송파구 잠실동", lat: 37.5133, lng: 127.1014 },
  { name: "송파구 방이동", lat: 37.5118, lng: 127.1239 },
  { name: "송파구 가락동", lat: 37.4947, lng: 127.1175 },
  { name: "송파구 문정동", lat: 37.4851, lng: 127.1220 },
  { name: "강동구 천호동", lat: 37.5382, lng: 127.1245 },
  { name: "강동구 암사동", lat: 37.5524, lng: 127.1351 },
  { name: "강동구 길동", lat: 37.5338, lng: 127.1455 },
  { name: "강동구 고덕동", lat: 37.5531, lng: 127.1563 },
];

const JITTER = 0.004;

function randomSeoulCoord() {
  const dong = SEOUL_DONGS[Math.floor(Math.random() * SEOUL_DONGS.length)];
  const lat = parseFloat((dong.lat + (Math.random() - 0.5) * 2 * JITTER).toFixed(4));
  const lng = parseFloat((dong.lng + (Math.random() - 0.5) * 2 * JITTER).toFixed(4));
  return { lat, lng, dongName: dong.name };
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ko`,
      { headers: { "User-Agent": "random-travel-app" } }
    );
    const data = await res.json();
    if (data.error) return "";
    const a = data.address;
    // 서울시 구 동 도로명 번지 순으로 조합
    const parts = [
      a.city || a.county,
      a.borough || a.city_district,
      a.suburb || a.quarter || a.neighbourhood,
      a.road,
      a.house_number,
    ].filter(Boolean);
    return parts.join(" ");
  } catch {
    return "";
  }
}

function CoordSlot({
  label,
  unit,
  value,
  spinning,
  onStop,
}: {
  label: string;
  unit: string;
  value: number | null;
  spinning: boolean;
  onStop: () => void;
}) {
  const [display, setDisplay] = useState("---.----");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (spinning) {
      intervalRef.current = setInterval(() => {
        const { lat, lng } = randomSeoulCoord();
        setDisplay((label === "위도" ? lat : lng).toFixed(4));
      }, 60);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (value !== null) setDisplay(value.toFixed(4));
      else setDisplay("---.----");
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [spinning, value, label]);

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-xs font-semibold text-[#8B8B8B] tracking-widest uppercase">
        {label}
      </p>
      <div
        className="relative w-full bg-[#222222] rounded-[16px] px-6 py-6 flex items-center justify-center overflow-hidden"
        style={{ minHeight: 96 }}
      >
        {spinning && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.02) 2px, rgba(255,255,255,0.02) 4px)",
            }}
          />
        )}
        <span
          className="font-mono text-[36px] font-extrabold tracking-tight"
          style={{
            color: spinning ? "#A0B020" : value !== null ? "#CEDA80" : "#474747",
            textShadow: spinning
              ? "0 0 20px rgba(160,176,32,0.6)"
              : value !== null
              ? "0 0 12px rgba(206,218,128,0.4)"
              : "none",
            transition: spinning ? "none" : "color 0.3s, text-shadow 0.3s",
          }}
        >
          {display}
        </span>
        <span className="ml-2 text-[13px] font-semibold text-[#707070]">{unit}</span>
      </div>

      <button
        onClick={onStop}
        disabled={!spinning}
        className="w-full py-3 rounded-[12px] text-sm font-bold transition-all duration-150"
        style={
          spinning
            ? {
                background: "linear-gradient(135deg, #7C8C03, #A0B020)",
                color: "#fff",
                boxShadow: "0 4px 16px rgba(124,140,3,0.3)",
              }
            : {
                background: "#F5F5F5",
                color: "#BBBBBB",
                cursor: "not-allowed",
              }
        }
      >
        {spinning ? "STOP" : value !== null ? "완료" : "대기 중"}
      </button>
    </div>
  );
}

export default function SeoulRandomTravelPage() {
  const [phase, setPhase] = useState<"idle" | "lat" | "lng" | "done">("idle");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [dongName, setDongName] = useState<string | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const pendingCoord = useRef<{ lat: number; lng: number; dongName: string } | null>(null);

  function handleStart() {
    setLat(null);
    setLng(null);
    setAddress(null);
    setDongName(null);
    setPhase("lat");
  }

  function handleStopLat() {
    const coord = randomSeoulCoord();
    pendingCoord.current = coord;
    setLat(coord.lat);
    setPhase("lng");
  }

  async function handleStopLng() {
    const coord = pendingCoord.current!;
    setLng(coord.lng);
    setDongName(coord.dongName);
    setPhase("done");
    setLoadingAddress(true);
    const addr = await reverseGeocode(coord.lat, coord.lng);
    setAddress(addr || coord.dongName);
    setLoadingAddress(false);
  }

  function handleReset() {
    setPhase("idle");
    setLat(null);
    setLng(null);
    setAddress(null);
    setDongName(null);
  }

  const naverUrl = address
    ? `https://map.naver.com/v5/search/${encodeURIComponent(address)}`
    : lat !== null && lng !== null
    ? `https://map.naver.com/v5/?c=${lng},${lat},16,0,0,0,dh`
    : null;

  return (
    <div className="min-h-[100dvh] bg-[#FAFAFA] flex flex-col">
      <header className="bg-white/80 backdrop-blur-[12px] border-b border-[#E6E6E6] h-14 sticky top-0 z-50 flex items-center justify-between px-6">
        <span className="text-sm font-bold text-[#222222]">서울 랜덤 탐험</span>
        <a
          href="/random-travel"
          className="text-xs font-semibold text-[#7C8C03]"
        >
          전국 버전 →
        </a>
      </header>

      <main className="flex-1 max-w-[480px] mx-auto w-full px-5 py-8 flex flex-col gap-6">
        {/* 히어로 */}
        <div
          className="rounded-[20px] p-7 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #7C8C03, #A0B020, #CEDA80)" }}
        >
          <p className="text-xs font-semibold text-white/70 tracking-widest mb-2">SEOUL RANDOM</p>
          <h1 className="text-2xl font-extrabold text-white leading-tight break-keep">
            오늘 서울 어디로<br />가볼까요?
          </h1>
          <p className="text-sm text-white/70 mt-2 break-keep">
            서울 80개 동네 중 랜덤으로 뽑아드려요
          </p>
        </div>

        {/* 슬롯 */}
        <div className="bg-white rounded-[14px] border border-[#E6E6E6] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 flex flex-col gap-6">
          <CoordSlot
            label="위도"
            unit="°N"
            value={lat}
            spinning={phase === "lat"}
            onStop={handleStopLat}
          />
          <div className="h-px w-full bg-[#E6E6E6]" />
          <CoordSlot
            label="경도"
            unit="°E"
            value={lng}
            spinning={phase === "lng"}
            onStop={handleStopLng}
          />
        </div>

        {/* 결과 카드 */}
        {phase === "done" && lat !== null && lng !== null && (
          <div
            className="bg-white rounded-[14px] border-2 border-[#CEDA80] shadow-[0_4px_12px_rgba(124,140,3,0.08)] p-5 flex flex-col gap-3"
            style={{ animation: "fadeInUp 0.4s ease both" }}
          >
            <p className="text-xs font-semibold text-[#8B8B8B]">오늘의 동네</p>

            {/* 동 이름 (빠르게 표시) */}
            <p className="text-xl font-extrabold text-[#222222] break-keep">
              {dongName}
            </p>

            {/* 세부 주소 */}
            <div className="min-h-[20px]">
              {loadingAddress ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border-2 border-[#CEDA80] border-t-[#7C8C03] animate-spin" />
                  <span className="text-xs text-[#8B8B8B]">상세 주소 확인 중...</span>
                </div>
              ) : address && address !== dongName ? (
                <p className="text-sm text-[#8B8B8B] break-keep">{address}</p>
              ) : null}
            </div>

            <p className="font-mono text-xs text-[#BBBBBB]">
              {lat.toFixed(4)}°N, {lng.toFixed(4)}°E
            </p>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex flex-col gap-3">
          {phase === "idle" && (
            <button
              onClick={handleStart}
              className="bg-[#7C8C03] text-white px-8 py-4 rounded-[12px] text-base font-semibold transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:bg-[#5A6602]"
            >
              🎲 동네 뽑기 시작
            </button>
          )}

          {phase === "done" && naverUrl && (
            <>
              <a
                href={naverUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#7C8C03] text-white px-8 py-4 rounded-[12px] text-base font-semibold text-center transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:bg-[#5A6602]"
              >
                네이버맵에서 보기
              </a>
              <button
                onClick={handleReset}
                className="bg-[#F5F5F5] text-[#222222] px-6 py-3 rounded-[12px] text-sm font-semibold transition-all duration-150 hover:bg-[#E6E6E6] active:scale-[0.98]"
              >
                다시 뽑기
              </button>
            </>
          )}
        </div>

        <p className="text-center text-xs text-[#BBBBBB] break-keep">
          서울 25개 구 · 80개 동네 수록
        </p>
      </main>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(1rem); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
