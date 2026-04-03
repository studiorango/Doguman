# CLAUDE.md — 민제 프로젝트 개발 지침

## 1. 기술 스택

- **Framework:** Next.js 15+ (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Database & Auth:** Supabase (RLS 활성화 기본)
- **Payments:** Toss Payments
- **Deployment:** Vercel
- **Package Manager:** npm

### 주요 패턴
- 서버 컴포넌트 우선, 클라이언트 컴포넌트는 `'use client'` 명시
- DB 접근은 항상 `lib/supabase.ts` 클라이언트 사용
- 환경변수는 `.env.local` 관리, `NEXT_PUBLIC_` prefix는 클라이언트 노출 변수만
- API Route는 `app/api/` 디렉토리 사용

---

## 2. 디자인 설정값

- **DESIGN_VARIANCE:** 6 (1=완벽한 대칭, 10=아티스틱 카오스)
- **MOTION_INTENSITY:** 4 (1=정적, 10=시네마틱)
- **VISUAL_DENSITY:** 5 (1=아트갤러리 여백, 10=데이터 밀집)

---

## 3. 타이포그래피 규칙

### 폰트
- **한국어 기본:** `Pretendard` — 절대 변경 불가
- **영문 디스플레이:** `Geist`, `Outfit`, `Cabinet Grotesk`, `Satoshi` 중 택일
- **금지 폰트:** `Inter`, `Noto Sans KR`, `Roboto`, `Arial`, `Open Sans` — 절대 사용 금지

### Next.js 폰트 로딩
```tsx
// app/layout.tsx
import localFont from 'next/font/local'

const pretendard = localFont({
  src: '../public/fonts/PretendardVariable.woff2',
  variable: '--font-pretendard',
  display: 'swap',
})
```
또는 CDN 방식:
```tsx
// app/layout.tsx <head>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.min.css" />
```

### 타이포그래피 스케일
- **한국어 헤드라인:** `text-4xl md:text-5xl lg:text-6xl tracking-tight leading-tight font-bold`
- **한국어 텍스트 필수:** `word-break: keep-all` (Tailwind: `break-keep`) 항상 적용
- **본문:** `text-base md:text-lg text-[#6B7280] leading-relaxed max-w-[65ch]`
- **영문 디스플레이:** `tracking-tighter leading-none`

---

## 4. 컬러 시스템

### 원칙
- **라이트 모드 기본값** — 다크 모드 금지
- 페이지 배경: `#F8F8FA`
- 카드 배경: `#FFFFFF`
- 액센트 컬러 최대 1개, 채도 80% 미만
- 웜 그레이 / 쿨 그레이 혼용 금지

### 금지
- 다크 배경(`bg-zinc-950`, `bg-slate-950`) 기본값 — 절대 금지
- 네온 글로우 효과 — 절대 금지
- 순수 블랙(`#000000`) — `#1F2937` 사용
- 보라/파랑 "AI 그라디언트" 남발 — Hero 카드 1곳에만 허용

### 팔레트
- **페이지 배경:** `#F8F8FA`
- **카드 배경:** `#FFFFFF`
- **테두리:** `#F0F0F2` (기본), `#E0E7FF` (호버)
- **텍스트 강조:** `#1F2937`
- **텍스트 보조:** `#6B7280`
- **텍스트 힌트:** `#9CA3AF`
- **액센트:** `#6366f1` (인디고) 또는 `#10b981` (에메랄드) 중 하나만
- **성공:** `#22c55e`
- **경고:** `#f59e0b`

### Hero 그라디언트 (딱 1곳만 허용)
```css
background: linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7);
```

---

## 5. 레이아웃 규칙

### 컨테이너
```tsx
<div className="max-w-[720px] mx-auto px-5 pb-20">
```

### 반응형
- 모바일 퍼스트 설계 (한국 웹 트래픽 70%+ 모바일)
- **전체 높이:** `min-h-[100dvh]` 사용 — `h-screen` 절대 금지 (iOS Safari 버그)
- **그리드:** `grid grid-cols-1 md:grid-cols-3 gap-6`

### 레이아웃 원칙
- 섹션 간격: `mb-6` 기본
- 카드 모서리: `rounded-[14px]` 기본, Hero는 `rounded-[20px]`
- 중앙 정렬보다 좌측 정렬 우선
- 3열 동일 카드 — Bento 그리드 또는 `auto-fill minmax` 사용

---

## 6. 컴포넌트 패턴

### 카드
```tsx
className="bg-white rounded-[14px] border border-[#F0F0F2] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4"
```

### Sticky 헤더
```tsx
className="bg-white/80 backdrop-blur-[12px] border-b border-[#EBEBEC] h-14 sticky top-0 z-50 flex items-center justify-between px-6"
```

### Hero 카드
```tsx
className="rounded-[20px] p-7 relative overflow-hidden"
style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)" }}
// 내부 텍스트: text-white
// 보조 텍스트: text-white/60
```

### 진행바
```tsx
// 외부
className="h-[7px] rounded-full bg-white/20 overflow-hidden"
// 내부
className="h-full rounded-full bg-white transition-all duration-700"
style={{ width: `${pct}%` }}
```

### 배지/태그
```tsx
className="text-xs font-semibold px-3 py-1 rounded-full"
// bg: 카테고리 파스텔 색상
// color: 카테고리 진한 색상
```

### 통계 카드 (숫자)
```tsx
className="bg-white rounded-[14px] p-4 text-center border border-[#F0F0F2] shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
// 숫자: text-[28px] font-extrabold tracking-tight (그라디언트 텍스트)
// 라벨: text-[11px] text-[#9CA3AF] font-semibold mt-1
```

### CTA 버튼 (Primary)
```tsx
className="bg-[#6366f1] text-white px-8 py-4 rounded-[12px] text-base font-semibold transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:bg-[#4f46e5]"
// 최소 높이 48px (모바일 탭 타겟)
```

### 리스트 아이템
```tsx
className="flex items-center gap-3 p-[13px_16px] rounded-[13px] bg-white border border-[#F0F0F2] cursor-pointer transition-all duration-150 hover:-translate-y-[1px] hover:border-[#E0E7FF] hover:shadow-[0_4px_12px_rgba(99,102,241,0.08)]"
// 완료 상태: bg-[#F0FDF4] border-[#BBF7D0]
```

### 체크박스
```tsx
// 미완료
className="w-5 h-5 rounded-[6px] border-2 border-[#D1D5DB] flex-shrink-0 transition-all duration-200"
// 완료
className="w-5 h-5 rounded-[6px] border-2 border-[#22c55e] bg-[#22c55e] flex items-center justify-center flex-shrink-0"
```

### 아이콘
- Iconify Solar 세트 전용 사용
```tsx
import { Icon } from '@iconify/react'
<Icon icon="solar:arrow-right-linear" />
```

### 이미지
- Next.js `<Image>` 컴포넌트 항상 사용
- 플레이스홀더: `https://picsum.photos/seed/{descriptive_name}/{width}/{height}`
- Unsplash URL **절대 금지**

### 애니메이션
```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(1rem); }
  to { opacity: 1; transform: translateY(0); }
}
```
- `transform`, `opacity`만 애니메이션 — `top`, `left`, `width`, `height` 금지
- 스크롤 트리거: `IntersectionObserver` 사용

---

## 7. 한국어 콘텐츠 규칙

### 글쓰기 원칙
- **번역체 금지:** "지금 시작하세요" O / "시작을 하세요 지금" X
- **경어체 통일:** 합니다/하세요체 유지
- **이모지:** 꼭 필요한 곳에만 최소한으로 사용 (Iconify 우선)

### 금지 단어
- "혁신적인", "획기적인", "차세대", "게임 체인저", "원활한" — 모두 금지
- 구체적이고 명확한 언어 사용

### 숫자 표기
- `47,200+` O / `50,000+` X (둥근 숫자 금지)
- `4.87` O / `5.0` X

### 샘플 데이터
- **이름:** "하윤서", "박도현", "이서진" (김철수, John Doe 금지)
- **회사명:** "스텔라랩스", "베리파이", "루미너스" (Acme 금지)

---

## 8. 페이지 구성 패턴

### 표준 페이지 구조
```
[Sticky 헤더] h-14
[Hero 카드] rounded-[20px] 그라디언트
[통계 카드 3열]
[필터/카테고리]
[리스트 or 그리드]
[푸터 메시지]
```

### 통계 표시
- 3열 그리드: 전체 / 완료 / 남은 항목
- 숫자는 크게 (28px+), 라벨은 작게 (11px)
- 각 숫자에 의미 있는 색상 (인디고, 에메랄드, 앰버)

### 카테고리 필터
```tsx
className="grid gap-2"
style={{ gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))" }}
// 선택된 카테고리: 카테고리 색상 배경 + 흰 텍스트 + shadow
// 미선택: 흰 배경 + 카테고리 색상 테두리
```

---

## 9. Supabase 패턴

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 서버 컴포넌트용
import { createServerClient } from '@supabase/ssr'
```

- RLS 항상 활성화
- 민감한 로직은 서버 컴포넌트 또는 API Route에서만 처리
- `service_role` 키는 절대 클라이언트에 노출 금지

---

## 10. 코딩 컨벤션

- 파일명: `kebab-case`
- 컴포넌트: `PascalCase`
- 함수/변수: `camelCase`
- 상수: `UPPER_SNAKE_CASE`
- 타입/인터페이스: `PascalCase`

### 폴더 구조
```
app/
  (auth)/        # 인증 관련 라우트 그룹
  (dashboard)/   # 대시보드 라우트 그룹
  api/           # API Routes
components/
  ui/            # 기본 UI 컴포넌트
  [feature]/     # 기능별 컴포넌트
lib/
  supabase.ts
  utils.ts
types/
  index.ts
```
