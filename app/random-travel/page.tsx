"use client";

import { useState, useEffect, useRef } from "react";

// 한국 시군구 대표 좌표 (육지 보장)
const KOREA_DISTRICTS = [
  { name: "서울 종로구", lat: 37.5735, lng: 126.9790 },
  { name: "서울 마포구", lat: 37.5538, lng: 126.9087 },
  { name: "서울 강남구", lat: 37.5172, lng: 127.0473 },
  { name: "서울 송파구", lat: 37.5145, lng: 127.1059 },
  { name: "서울 노원구", lat: 37.6541, lng: 127.0568 },
  { name: "인천 미추홀구", lat: 37.4638, lng: 126.6506 },
  { name: "인천 강화군", lat: 37.7468, lng: 126.4877 },
  { name: "수원시", lat: 37.2636, lng: 127.0286 },
  { name: "성남시 분당구", lat: 37.3825, lng: 127.1175 },
  { name: "용인시 처인구", lat: 37.2341, lng: 127.2017 },
  { name: "고양시 일산동구", lat: 37.6583, lng: 126.7841 },
  { name: "부천시", lat: 37.5034, lng: 126.7660 },
  { name: "안산시 단원구", lat: 37.3219, lng: 126.8309 },
  { name: "평택시", lat: 36.9921, lng: 127.1127 },
  { name: "이천시", lat: 37.2723, lng: 127.4352 },
  { name: "가평군", lat: 37.8314, lng: 127.5097 },
  { name: "양평군", lat: 37.4913, lng: 127.4874 },
  { name: "연천군", lat: 38.0963, lng: 127.0748 },
  { name: "포천시", lat: 37.8949, lng: 127.2003 },
  { name: "춘천시", lat: 37.8813, lng: 127.7298 },
  { name: "원주시", lat: 37.3422, lng: 127.9202 },
  { name: "강릉시", lat: 37.7519, lng: 128.8761 },
  { name: "동해시", lat: 37.5245, lng: 129.1144 },
  { name: "태백시", lat: 37.1641, lng: 128.9857 },
  { name: "속초시", lat: 38.2070, lng: 128.5918 },
  { name: "홍천군", lat: 37.6966, lng: 127.8886 },
  { name: "횡성군", lat: 37.4916, lng: 127.9846 },
  { name: "정선군", lat: 37.3806, lng: 128.6604 },
  { name: "평창군", lat: 37.3703, lng: 128.3906 },
  { name: "인제군", lat: 38.0697, lng: 128.1703 },
  { name: "고성군(강원)", lat: 38.3799, lng: 128.4676 },
  { name: "양양군", lat: 38.0753, lng: 128.6191 },
  { name: "청주시 흥덕구", lat: 36.6358, lng: 127.4550 },
  { name: "충주시", lat: 36.9910, lng: 127.9259 },
  { name: "제천시", lat: 37.1325, lng: 128.1910 },
  { name: "보은군", lat: 36.4896, lng: 127.7295 },
  { name: "옥천군", lat: 36.3063, lng: 127.5708 },
  { name: "영동군", lat: 36.1750, lng: 127.7836 },
  { name: "증평군", lat: 36.7850, lng: 127.5814 },
  { name: "진천군", lat: 36.8554, lng: 127.4358 },
  { name: "괴산군", lat: 36.8153, lng: 127.7871 },
  { name: "음성군", lat: 36.9397, lng: 127.6901 },
  { name: "단양군", lat: 36.9846, lng: 128.3655 },
  { name: "천안시 동남구", lat: 36.8151, lng: 127.1139 },
  { name: "공주시", lat: 36.4465, lng: 127.1192 },
  { name: "보령시", lat: 36.3330, lng: 126.6128 },
  { name: "아산시", lat: 36.7897, lng: 127.0020 },
  { name: "서산시", lat: 36.7848, lng: 126.4503 },
  { name: "논산시", lat: 36.1872, lng: 127.0991 },
  { name: "계룡시", lat: 36.2742, lng: 127.2489 },
  { name: "당진시", lat: 36.8895, lng: 126.6458 },
  { name: "금산군", lat: 36.1090, lng: 127.4880 },
  { name: "부여군", lat: 36.2753, lng: 126.9098 },
  { name: "서천군", lat: 36.0800, lng: 126.6916 },
  { name: "청양군", lat: 36.4594, lng: 126.8024 },
  { name: "홍성군", lat: 36.6011, lng: 126.6608 },
  { name: "예산군", lat: 36.6800, lng: 126.8483 },
  { name: "태안군", lat: 36.7455, lng: 126.2978 },
  { name: "전주시 완산구", lat: 35.8242, lng: 127.1480 },
  { name: "군산시", lat: 35.9675, lng: 126.7370 },
  { name: "익산시", lat: 35.9483, lng: 126.9577 },
  { name: "정읍시", lat: 35.5699, lng: 126.8557 },
  { name: "남원시", lat: 35.4163, lng: 127.3900 },
  { name: "김제시", lat: 35.8033, lng: 126.8808 },
  { name: "완주군", lat: 35.9047, lng: 127.1624 },
  { name: "진안군", lat: 35.7916, lng: 127.4248 },
  { name: "무주군", lat: 35.9059, lng: 127.6606 },
  { name: "장수군", lat: 35.6475, lng: 127.5214 },
  { name: "임실군", lat: 35.6176, lng: 127.2891 },
  { name: "순창군", lat: 35.3745, lng: 127.1376 },
  { name: "고창군", lat: 35.4358, lng: 126.7021 },
  { name: "부안군", lat: 35.7319, lng: 126.7331 },
  { name: "목포시", lat: 34.8118, lng: 126.3922 },
  { name: "여수시", lat: 34.7604, lng: 127.6622 },
  { name: "순천시", lat: 34.9506, lng: 127.4872 },
  { name: "나주시", lat: 35.0160, lng: 126.7107 },
  { name: "광양시", lat: 34.9407, lng: 127.6956 },
  { name: "담양군", lat: 35.3218, lng: 126.9882 },
  { name: "곡성군", lat: 35.2818, lng: 127.2920 },
  { name: "구례군", lat: 35.2025, lng: 127.4627 },
  { name: "고흥군", lat: 34.6078, lng: 127.2754 },
  { name: "보성군", lat: 34.7713, lng: 127.0802 },
  { name: "화순군", lat: 35.0648, lng: 126.9866 },
  { name: "장흥군", lat: 34.6813, lng: 126.9073 },
  { name: "강진군", lat: 34.6424, lng: 126.7674 },
  { name: "해남군", lat: 34.5737, lng: 126.5990 },
  { name: "영암군", lat: 34.8002, lng: 126.6966 },
  { name: "무안군", lat: 34.9902, lng: 126.4818 },
  { name: "함평군", lat: 35.0648, lng: 126.5167 },
  { name: "영광군", lat: 35.2771, lng: 126.5120 },
  { name: "장성군", lat: 35.3020, lng: 126.7895 },
  { name: "완도군", lat: 34.3101, lng: 126.7553 },
  { name: "진도군", lat: 34.4867, lng: 126.2638 },
  { name: "신안군", lat: 34.8299, lng: 126.1068 },
  { name: "창원시 의창구", lat: 35.2280, lng: 128.6811 },
  { name: "진주시", lat: 35.1799, lng: 128.1076 },
  { name: "통영시", lat: 34.8544, lng: 128.4333 },
  { name: "사천시", lat: 35.0036, lng: 128.0645 },
  { name: "김해시", lat: 35.2285, lng: 128.8893 },
  { name: "밀양시", lat: 35.5036, lng: 128.7461 },
  { name: "거제시", lat: 34.8800, lng: 128.6211 },
  { name: "양산시", lat: 35.3350, lng: 129.0376 },
  { name: "의령군", lat: 35.3221, lng: 128.2620 },
  { name: "함안군", lat: 35.2726, lng: 128.4064 },
  { name: "창녕군", lat: 35.5445, lng: 128.4924 },
  { name: "고성군(경남)", lat: 34.9736, lng: 128.3227 },
  { name: "남해군", lat: 34.8374, lng: 127.8925 },
  { name: "하동군", lat: 35.0674, lng: 127.7513 },
  { name: "산청군", lat: 35.4150, lng: 127.8733 },
  { name: "함양군", lat: 35.5207, lng: 127.7257 },
  { name: "거창군", lat: 35.6867, lng: 127.9093 },
  { name: "합천군", lat: 35.5668, lng: 128.1657 },
  { name: "포항시 남구", lat: 35.9802, lng: 129.4007 },
  { name: "경주시", lat: 35.8562, lng: 129.2247 },
  { name: "김천시", lat: 36.1398, lng: 128.1136 },
  { name: "안동시", lat: 36.5684, lng: 128.7294 },
  { name: "구미시", lat: 36.1196, lng: 128.3446 },
  { name: "영주시", lat: 36.8059, lng: 128.6237 },
  { name: "영천시", lat: 35.9731, lng: 128.9383 },
  { name: "상주시", lat: 36.4108, lng: 128.1591 },
  { name: "문경시", lat: 36.5864, lng: 128.1864 },
  { name: "경산시", lat: 35.8251, lng: 128.7413 },
  { name: "군위군", lat: 36.2393, lng: 128.5725 },
  { name: "의성군", lat: 36.3526, lng: 128.6970 },
  { name: "청송군", lat: 36.4358, lng: 129.0572 },
  { name: "영양군", lat: 36.6668, lng: 129.1120 },
  { name: "영덕군", lat: 36.4153, lng: 129.3654 },
  { name: "청도군", lat: 35.6474, lng: 128.7349 },
  { name: "고령군", lat: 35.7274, lng: 128.2636 },
  { name: "성주군", lat: 35.9185, lng: 128.2832 },
  { name: "칠곡군", lat: 35.9956, lng: 128.4015 },
  { name: "예천군", lat: 36.6578, lng: 128.4536 },
  { name: "봉화군", lat: 36.8931, lng: 128.7320 },
  { name: "울진군", lat: 36.9932, lng: 129.4003 },
  { name: "울릉군", lat: 37.4844, lng: 130.9057 },
  { name: "제주시", lat: 33.4996, lng: 126.5312 },
  { name: "서귀포시", lat: 33.2541, lng: 126.5600 },
  { name: "부산 해운대구", lat: 35.1631, lng: 129.1637 },
  { name: "부산 사하구", lat: 35.1041, lng: 128.9746 },
  { name: "부산 북구", lat: 35.1974, lng: 128.9908 },
  { name: "대구 수성구", lat: 35.8588, lng: 128.6302 },
  { name: "대구 달서구", lat: 35.8297, lng: 128.5327 },
  { name: "광주 북구", lat: 35.1745, lng: 126.9118 },
  { name: "광주 광산구", lat: 35.1396, lng: 126.7936 },
  { name: "대전 유성구", lat: 36.3624, lng: 127.3563 },
  { name: "대전 서구", lat: 36.3553, lng: 127.3836 },
  { name: "울산 울주군", lat: 35.5229, lng: 129.0393 },
  { name: "세종시", lat: 36.4800, lng: 127.2890 },
];

const JITTER = 0.08; // 시군구 중심에서 최대 ±0.08도 오프셋

function randomLandCoord() {
  const district = KOREA_DISTRICTS[Math.floor(Math.random() * KOREA_DISTRICTS.length)];
  const lat = parseFloat((district.lat + (Math.random() - 0.5) * 2 * JITTER).toFixed(4));
  const lng = parseFloat((district.lng + (Math.random() - 0.5) * 2 * JITTER).toFixed(4));
  return { lat, lng };
}

function randomInRange(min: number, max: number, decimals = 4) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
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
        const { lat, lng } = randomLandCoord();
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
      {/* 슬롯 디스플레이 */}
      <div
        className="relative w-full bg-[#222222] rounded-[16px] px-6 py-6 flex items-center justify-center overflow-hidden"
        style={{ minHeight: 96 }}
      >
        {/* 스캔라인 효과 */}
        {spinning && (
          <div className="absolute inset-0 pointer-events-none"
            style={{
              background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.02) 2px, rgba(255,255,255,0.02) 4px)",
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

      {/* 스톱 버튼 */}
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
                transform: "scale(1)",
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

async function reverseGeocode(lat: number, lng: number): Promise<{ address: string }> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ko`,
      { headers: { "User-Agent": "random-travel-app" } }
    );
    const data = await res.json();
    if (data.error) return { address: "" };
    const a = data.address;
    const parts = [
      a.province || a.state,
      a.city || a.county || a.town || a.village || a.municipality,
      a.borough || a.city_district,
      a.suburb || a.quarter || a.neighbourhood,
      a.road,
      a.house_number,
    ].filter(Boolean);
    return { address: parts.join(" ") };
  } catch {
    return { address: "" };
  }
}

export default function RandomTravelPage() {
  const [phase, setPhase] = useState<"idle" | "lat" | "lng" | "done">("idle");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(false);

  function handleStart() {
    setLat(null);
    setLng(null);
    setAddress(null);
    setPhase("lat");
  }

  // 위도/경도를 같은 시군구에서 뽑아야 쌍이 맞으므로 한 번에 결정
  const pendingCoord = useRef<{ lat: number; lng: number } | null>(null);

  function handleStopLat() {
    const coord = randomLandCoord();
    pendingCoord.current = coord;
    setLat(coord.lat);
    setPhase("lng");
  }

  async function handleStopLng() {
    const coord = pendingCoord.current!;
    setLng(coord.lng);
    setPhase("done");
    setLoadingAddress(true);
    const result = await reverseGeocode(coord.lat, coord.lng);
    setAddress(result.address || "주소를 찾을 수 없어요");
    setLoadingAddress(false);
  }

  function handleReset() {
    setPhase("idle");
    setLat(null);
    setLng(null);
    setAddress(null);
  }

  const naverUrl = address
    ? `https://map.naver.com/v5/search/${encodeURIComponent(address)}`
    : lat !== null && lng !== null
    ? `https://map.naver.com/v5/?c=${lng},${lat},15,0,0,0,dh`
    : null;

  return (
    <div className="min-h-[100dvh] bg-[#FAFAFA] flex flex-col">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-[12px] border-b border-[#E6E6E6] h-14 sticky top-0 z-50 flex items-center px-6">
        <span className="text-sm font-bold text-[#222222]">랜덤 국내 여행</span>
        <a href="/random-travel/seoul" className="text-xs font-semibold text-[#7C8C03]">
          서울 버전 →
        </a>
      </header>

      <main className="flex-1 max-w-[480px] mx-auto w-full px-5 py-8 flex flex-col gap-6">
        {/* 히어로 */}
        <div
          className="rounded-[20px] p-7 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #7C8C03, #A0B020, #CEDA80)" }}
        >
          <p className="text-xs font-semibold text-white/70 tracking-widest mb-2">RANDOM TRAVEL</p>
          <h1 className="text-2xl font-extrabold text-white leading-tight break-keep">
            오늘의 여행지는<br />어디일까요?
          </h1>
          <p className="text-sm text-white/70 mt-2 break-keep">
            랜덤 좌표로 국내 어딘가로 떠나보세요
          </p>
        </div>

        {/* 슬롯 영역 */}
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
            <p className="text-xs font-semibold text-[#8B8B8B]">목적지</p>

            {/* 주소 */}
            <div className="flex items-center gap-2 min-h-[28px]">
              {loadingAddress ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-[#CEDA80] border-t-[#7C8C03] animate-spin" />
                  <span className="text-sm text-[#8B8B8B]">주소 찾는 중...</span>
                </div>
              ) : (
                <p className="text-xl font-extrabold text-[#222222] break-keep">
                  {address ?? "—"}
                </p>
              )}
            </div>

            {/* 좌표 */}
            <p className="font-mono text-sm text-[#8B8B8B]">
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
              🎲 좌표 뽑기 시작
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
          한국 육지 기준 좌표 · 바다가 나올 수도 있어요 😄
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
