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

- **DESIGN_VARIANCE:** 8 (1=완벽한 대칭, 10=아티스틱 카오스)
- **MOTION_INTENSITY:** 6 (1=정적, 10=시네마틱)
- **VISUAL_DENSITY:** 3 (1=아트갤러리 여백, 10=데이터 밀집)

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
- **본문:** `text-base md:text-lg text-gray-600 leading-relaxed max-w-[65ch]`
- **영문 디스플레이:** `tracking-tighter leading-none`

---

## 4. 컬러 시스템

### 원칙
- 페이지당 **액센트 컬러 최대 1개**, 채도 80% 미만
- 웜 그레이 / 쿨 그레이 혼용 금지 — 하나로 통일
- **다크 모드 기본값:** `bg-zinc-950`, `bg-slate-950`

### 금지
- 보라/파랑 "AI 그라디언트" — 절대 금지
- 네온 글로우 효과 — 절대 금지
- 순수 블랙(`#000000`) — `zinc-950` 또는 `slate-950` 사용

### 추천 팔레트
- **베이스:** Zinc-900, Slate-950, Stone-100
- **액센트 옵션:** Emerald, Electric Blue, Warm Amber, Deep Rose 중 하나만

---

## 5. 레이아웃 규칙

### 컨테이너
```tsx
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
```

### 반응형
- 모바일 퍼스트 설계 (한국 웹 트래픽 70%+ 모바일)
- **전체 높이:** `min-h-[100dvh]` 사용 — `h-screen` 절대 금지 (iOS Safari 버그)
- **그리드 우선:** `grid grid-cols-1 md:grid-cols-3 gap-6` (복잡한 flex 퍼센트 계산 금지)

### 레이아웃 다양성 (DESIGN_VARIANCE 8 기준)
- 중앙 정렬 Hero 섹션 **금지** — 대신:
  - Split Screen (60/40 텍스트/비주얼)
  - 좌측 텍스트 / 우측 에셋
  - 비대칭 여백 + 드라마틱 네거티브 스페이스
- **인접한 섹션은 반드시 다른 레이아웃 패턴 사용**
- 3열 동일 카드 행 **금지** — Bento 그리드 또는 지그재그 사용

---

## 6. 컴포넌트 패턴

### 아이콘
- Iconify Solar 세트 전용 사용
```tsx
// npm install @iconify/react
import { Icon } from '@iconify/react'
<Icon icon="solar:arrow-right-linear" />
```

### 이미지
- Next.js `<Image>` 컴포넌트 항상 사용
- 플레이스홀더: `https://picsum.photos/seed/{descriptive_name}/{width}/{height}`
- 아바타: `https://i.pravatar.cc/150?u={unique_name}`
- Unsplash URL **절대 금지**

### 글래스 효과
```tsx
className="backdrop-blur-xl bg-white/5 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
```

### CTA 버튼
```tsx
className="px-8 py-4 text-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2"
// 최소 높이 48px (모바일 탭 타겟)
```

### 애니메이션 (MOTION_INTENSITY 6 기준)
```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(2rem); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
```
- `transform`, `opacity`만 애니메이션 — `top`, `left`, `width`, `height` 금지
- 스크롤 트리거: `IntersectionObserver` 사용 — `window.scroll` 이벤트 금지

---

## 7. 한국어 콘텐츠 규칙

### 글쓰기 원칙
- **번역체 금지:** "지금 시작하세요" O / "시작을 하세요 지금" X
- **경어체 통일:** 합니다/하세요체 유지, 반말/존댓말 혼용 금지
- **이모지 절대 금지:** Iconify Solar 아이콘으로 대체

### 금지 단어
- "혁신적인", "획기적인", "차세대", "게임 체인저", "원활한" — 모두 금지
- 구체적이고 명확한 언어 사용

### CTA 카피 예시
- "무료로 시작하기" / "3분만에 만들어보기" / "지금 바로 체험하기"

### 샘플 데이터
- **이름:** "하윤서", "박도현", "이서진" (김철수, John Doe 금지)
- **회사명:** "스텔라랩스", "베리파이", "루미너스" (넥서스, Acme 금지)
- **숫자:** `47,200+` O / `50,000+` X (둥근 숫자 금지)

---

## 8. 섹션 라이브러리

### Hero
- **Split Hero:** 60/40 텍스트/비주얼
- **Full-Bleed:** 전체화면 + 오버레이 텍스트
- **Minimal Statement:** 초대형 타이포그래피 + 극단적 여백

### Features
- **Bento Grid:** 비대칭 그리드 (2fr 1fr 1fr)
- **Zig-Zag:** 이미지좌/텍스트우 → 텍스트좌/이미지우 교대
- **Comparison:** Before vs After 또는 Us vs Them

### Social Proof
- **Logo Cloud:** 자동 스크롤 마키 + 호버시 컬러
- **Testimonial Masonry:** 스태거드 카드 높이
- **Metrics Bar:** 숫자 카운팅 애니메이션

### CTA
- **Full-Bleed:** 다크 배경 + 대형 텍스트 + 글로우 버튼
- **Sticky Bottom:** 스크롤 후 등장 고정 하단 바

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

- 파일명: `kebab-case` (컴포넌트도 동일)
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
