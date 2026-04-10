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
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.min.css" />
```

### 타이포그래피 스케일
- **한국어 헤드라인:** `text-4xl md:text-5xl lg:text-6xl tracking-tight leading-tight font-bold`
- **한국어 텍스트 필수:** `word-break: keep-all` (Tailwind: `break-keep`) 항상 적용
- **본문:** `text-base md:text-lg leading-relaxed max-w-[65ch]` + `Content/Secondary` 컬러
- **영문 디스플레이:** `tracking-tighter leading-none`

---

## 4. 컬러 시스템

### 원칙
- **라이트 모드 기본값** — 다크 모드 금지
- 채도 있는 색상의 불투명도 조정 금지 — NeutralLight / NeutralDark 계열만 허용
- 웜 그레이 / 쿨 그레이 혼용 금지
- 액센트 컬러는 KongnamuGreen 단일 사용

---

### 4-1. 팔레트 (Primitive Tokens)

#### KongnamuGreen (브랜드 Primary)
| Token | HEX |
|-------|-----|
| Green50 | `#F4F6E0` |
| Green100 | `#E6EBB8` |
| Green200 | `#CEDA80` |
| Green500 | `#A0B020` |
| Green800 | `#7C8C03` |
| Green900 | `#5A6602` |

#### Neutral
| Token | HEX |
|-------|-----|
| Neutral10 | `#FAFAFA` |
| Neutral50 | `#F5F5F5` |
| Neutral100 | `#E6E6E6` |
| Neutral200 | `#DCDCDC` |
| Neutral300 | `#BBBBBB` |
| Neutral400 | `#999999` |
| Neutral500 | `#8B8B8B` |
| Neutral600 | `#707070` |
| Neutral700 | `#5C5C5C` |
| Neutral800 | `#474747` |
| Neutral900 | `#222222` |

#### Common
| Token | HEX |
|-------|-----|
| Common100 | `#FFFFFF` |
| Common0 | `#000000` |

#### 지원 컬러
| Token | HEX | 용도 |
|-------|-----|------|
| Red50 | `#FFF5F5` | Critical Alt |
| Red800 | `#F94239` | Critical / Error |
| Red900 | `#EA2013` | Critical Hover |
| Yellow50 | `#FFF4D8` | Warning Alt |
| Yellow800 | `#FFC83B` | Rating / Warning |
| Yellow900 | `#FFB803` | Warning Hover |
| BenefitGreen50 | `#E7F7F3` | Benefit Alt |
| BenefitGreen800 | `#01A484` | Benefit (무료취소 등) |
| Navy10 | `#F5F7FA` | Background Secondary |
| Navy500 | `#49627A` | Neutral Info |

#### NeutralLight (투명도 계열, 밝은 배경 위)
```
NeutralLight88 = rgba(255,255,255,0.88)
NeutralLight72 = rgba(255,255,255,0.72)
NeutralLight48 = rgba(255,255,255,0.48)
NeutralLight24 = rgba(255,255,255,0.24)
NeutralLight16 = rgba(255,255,255,0.16)
NeutralLight8  = rgba(255,255,255,0.08)
NeutralLight0  = rgba(255,255,255,0)
```

#### NeutralDark (투명도 계열, 오버레이용)
```
NeutralDark80 = rgba(0,0,0,0.80)
NeutralDark64 = rgba(0,0,0,0.64)
NeutralDark48 = rgba(0,0,0,0.48)
NeutralDark32 = rgba(0,0,0,0.32)
NeutralDark16 = rgba(0,0,0,0.16)
NeutralDark8  = rgba(0,0,0,0.08)
NeutralDark0  = rgba(0,0,0,0)
```

---

### 4-2. 시멘틱 컬러 (Semantic Tokens)

컴포넌트 구현 시 팔레트 HEX 직접 사용 금지. 반드시 시멘틱 토큰 이름 기준으로 작성.

#### Content (텍스트 & 아이콘)
| Token | 참조 팔레트 | HEX | 용도 |
|-------|------------|-----|------|
| Content/Primary | Neutral900 | `#222222` | 기본 텍스트, 아이콘 |
| Content/Secondary | Neutral500 | `#8B8B8B` | 보조 텍스트 |
| Content/Tertiary | Neutral300 | `#BBBBBB` | 힌트 텍스트 |
| Content/Placeholder | Neutral400 | `#999999` | Placeholder |
| Content/Disabled | Neutral200 | `#DCDCDC` | Disabled |
| Content/InversePrimary | Common100 | `#FFFFFF` | 컬러 배경 위 기본 텍스트 |
| Content/InverseSecondary | NeutralLight72 | `rgba(255,255,255,0.72)` | 컬러 배경 위 보조 텍스트 |
| Content/Interactive | Green800 | `#7C8C03` | 인터랙티브 텍스트, 링크 |
| Content/Highlighted | Green800 | `#7C8C03` | 강조 텍스트 |
| Content/Critical | Red800 | `#F94239` | 에러, 경고 텍스트 |

#### Background (배경)
| Token | 참조 팔레트 | HEX | 용도 |
|-------|------------|-----|------|
| Background/Primary | Common100 | `#FFFFFF` | 페이지, 카드, 리스트 기본 |
| Background/Secondary | Navy10 | `#F5F7FA` | 페이지, 카드 Sub |
| Background/InversePrimary | Neutral900 | `#222222` | Snackbar, Tooltip |
| Background/TableHeader | Navy10 | `#F5F7FA` | 테이블 헤더 |
| Background/TableHover | Neutral10 | `#FAFAFA` | 테이블 hover |

#### Background/Input (입력 요소 배경)
| Token | 참조 팔레트 | HEX | 용도 |
|-------|------------|-----|------|
| Background/Input/Normal | Neutral50 | `#F5F5F5` | Input 기본 |
| Background/Input/Contrast | Common100 | `#FFFFFF` | Input White 타입 |
| Background/Input/Hover | Neutral100 | `#E6E6E6` | Input hover |
| Background/Input/Error | Red50 | `#FFF5F5` | Input 에러 배경 |
| Background/Input/ErrorHover | Red100 | `#FFEDEA` | Input 에러 hover |
| Background/Input/Disabled | Neutral10 | `#FAFAFA` | Input disabled |

#### Background/Overlay (오버레이)
| Token | 참조 팔레트 | 용도 |
|-------|------------|------|
| Background/Overlay/DarkPrimary | NeutralDark48 | Dialog 기본 딤 |
| Background/Overlay/DarkSecondary | NeutralDark64 | Dialog 강조 딤 |
| Background/Overlay/DarkTertiary | NeutralDark80 | Bottom sheet 딤 |
| Background/Overlay/LightPrimary | NeutralLight48 | 밝은 오버레이 |

#### Border (테두리)
| Token | 참조 팔레트 | HEX | 용도 |
|-------|------------|-----|------|
| Border/Primary | Neutral100 | `#E6E6E6` | Divider 기본 |
| Border/Secondary | Neutral200 | `#DCDCDC` | 강조 구분선, 카드 outline |
| Border/PrimaryActivated | Green800 | `#7C8C03` | 검색바 활성 outline |
| Border/SecondaryActivated | Neutral900 | `#222222` | Input 활성 outline |
| Border/Selected | Green200 | `#CEDA80` | Selected 카드 outline |
| Border/Disabled | NeutralLight88 | `rgba(255,255,255,0.88)` | Disabled outline |
| Border/Critical | Red800 | `#F94239` | 에러 outline |
| Border/InversePrimary | Common100 | `#FFFFFF` | 배경과 시각적 분리 |

#### Button (버튼)
| Token | 참조 팔레트 | HEX | 용도 |
|-------|------------|-----|------|
| Button/Primary | Green800 | `#7C8C03` | Primary 버튼 배경 |
| Button/PrimaryHover | Green900 | `#5A6602` | Primary hover |
| Button/Highlight | Common100 | `#FFFFFF` | Highlight 버튼 |
| Button/HighlightOutline | Green800 | `#7C8C03` | Highlight outline |
| Button/Secondary | Neutral50 | `#F5F5F5` | Secondary 버튼 |
| Button/SecondaryHover | Neutral100 | `#E6E6E6` | Secondary hover |
| Button/Destructive | Red800 | `#F94239` | 삭제/위험 버튼 |
| Button/DestructiveHover | Red900 | `#EA2013` | 삭제 hover |
| Button/Disabled | Neutral10 | `#FAFAFA` | Disabled 버튼 배경 |
| Button/Green | Green50 | `#F4F6E0` | Subtle Green 버튼 |
| Button/GreenOutline | Green200 | `#CEDA80` | Subtle Green outline |
| Button/GreenHover | Green100 | `#E6EBB8` | Subtle Green hover |

#### Support (상태/정보 컬러)
| Token | 참조 팔레트 | HEX | 용도 |
|-------|------------|-----|------|
| Support/Positive | Green800 | `#7C8C03` | 완료, 정보 강조 |
| Support/PositiveAlt | Green100 | `#E6EBB8` | 완료 배경 |
| Support/Warning | Yellow900 | `#FFB803` | 주의 정보 |
| Support/WarningAlt | Yellow50 | `#FFF4D8` | 주의 배경 |
| Support/Critical | Red800 | `#F94239` | 에러, 위험 |
| Support/CriticalAlt | Red50 | `#FFF5F5` | 에러 배경 |
| Support/Benefit | BenefitGreen800 | `#01A484` | 무료취소, 혜택 강조 |
| Support/BenefitAlt | BenefitGreen50 | `#E7F7F3` | 혜택 배경 |
| Support/Neutral | Navy500 | `#49627A` | 고정 정보 텍스트 |
| Support/NeutralAlt | Navy10 | `#F5F7FA` | 고정 정보 배경 |
| Support/Rating | Yellow800 | `#FFC83B` | 별점 아이콘 활성 |
| Support/RatingAlt | Neutral200 | `#DCDCDC` | 별점 아이콘 기본 |

#### Support/Skeleton (로딩)
| Token | 용도 |
|-------|------|
| Support/Skeleton/Base | Navy10 — 스켈레톤 기본 배경 |
| Support/Skeleton/Shade | Neutral50 → NeutralLight72 → Neutral50 그라디언트 |

---

### 4-3. 그라디언트
```css
/* Hero (딱 1곳만 허용) */
background: linear-gradient(135deg, #7C8C03, #A0B020, #CEDA80);

/* 다크 오버레이 */
background: linear-gradient(to bottom, rgba(0,0,0,0.48), rgba(0,0,0,0));

/* 스켈레톤 shimmer */
background: linear-gradient(90deg, #F5F5F5 0%, rgba(255,255,255,0.72) 50%, #F5F5F5 100%);
```

---

## 5. 레이아웃 규칙

### 컨테이너
```tsx
<div className="max-w-[720px] mx-auto px-5 pb-20">
```

### 반응형
- 모바일 퍼스트 설계 (한국 웹 트래픽 70%+ 모바일)
- **전체 높이:** `min-h-[100dvh]` — `h-screen` 절대 금지 (iOS Safari 버그)
- **그리드:** `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6`

### 레이아웃 원칙
- 섹션 간격: `mb-6` 기본
- 카드 모서리: `rounded-[14px]` 기본, Hero는 `rounded-[20px]`
- 중앙 정렬보다 좌측 정렬 우선
- 3열 동일 카드 — Bento 그리드 또는 `auto-fill minmax` 사용

---

## 6. 컴포넌트 패턴

컴포넌트 구현 시 시멘틱 토큰 주석을 함께 명시한다.

### 카드 (기본)
```tsx
// Background/Primary + Border/Primary
className="bg-white rounded-[14px] border border-[#E6E6E6] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4"
```

### 카드 (Selected)
```tsx
// Background/Primary + Border/Selected
className="bg-white rounded-[14px] border-2 border-[#CEDA80] shadow-[0_4px_12px_rgba(124,140,3,0.08)] p-4"
```

### Sticky 헤더
```tsx
// Background/Primary NeutralLight88 + Border/Primary
className="bg-white/80 backdrop-blur-[12px] border-b border-[#E6E6E6] h-14 sticky top-0 z-50 flex items-center justify-between px-6"
```

### Hero 카드
```tsx
// 그라디언트 (전체 페이지에서 딱 1곳)
className="rounded-[20px] p-7 relative overflow-hidden"
style={{ background: "linear-gradient(135deg, #7C8C03, #A0B020, #CEDA80)" }}
// 내부 텍스트: Content/InversePrimary = text-white
// 보조 텍스트: Content/InverseSecondary = text-white/70
```

### CTA 버튼 (Primary)
```tsx
// Button/Primary → Button/PrimaryHover
className="bg-[#7C8C03] text-white px-8 py-4 rounded-[12px] text-base font-semibold
           transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:bg-[#5A6602]"
// 최소 높이 48px (모바일 탭 타겟)
```

### 버튼 (Secondary)
```tsx
// Button/Secondary → Button/SecondaryHover
className="bg-[#F5F5F5] text-[#222222] px-6 py-3 rounded-[12px] text-sm font-semibold
           transition-all duration-150 hover:bg-[#E6E6E6] active:scale-[0.98]"
```

### 버튼 (Subtle Green)
```tsx
// Button/Green + Button/GreenOutline
className="bg-[#F4F6E0] text-[#7C8C03] border border-[#CEDA80] px-6 py-3 rounded-[12px]
           text-sm font-semibold transition-all duration-150 hover:bg-[#E6EBB8]"
```

### 버튼 (Destructive)
```tsx
// Button/Destructive → Button/DestructiveHover
className="bg-[#F94239] text-white px-6 py-3 rounded-[12px] text-sm font-semibold
           transition-all duration-150 hover:bg-[#EA2013] active:scale-[0.98]"
```

### Input (기본)
```tsx
// Background/Input/Normal + Border/Primary → Border/SecondaryActivated
className="w-full bg-[#F5F5F5] border border-[#E6E6E6] rounded-[10px] px-4 py-3 text-sm
           text-[#222222] placeholder:text-[#999999]
           focus:outline-none focus:bg-white focus:border-[#222222] transition-colors"
```

### Input (에러)
```tsx
// Background/Input/Error + Border/Critical
className="w-full bg-[#FFF5F5] border border-[#F94239] rounded-[10px] px-4 py-3 text-sm
           text-[#222222] placeholder:text-[#999999] focus:outline-none"
// 에러 메시지: Content/Critical = text-[#F94239] text-xs mt-1
```

### 배지/태그 (Positive)
```tsx
// Support/PositiveAlt + Support/Positive
className="text-xs font-semibold px-3 py-1 rounded-full bg-[#E6EBB8] text-[#7C8C03]"
```

### 배지/태그 (Warning)
```tsx
// Support/WarningAlt + Support/Warning
className="text-xs font-semibold px-3 py-1 rounded-full bg-[#FFF4D8] text-[#FFB803]"
```

### 배지/태그 (Critical)
```tsx
// Support/CriticalAlt + Support/Critical
className="text-xs font-semibold px-3 py-1 rounded-full bg-[#FFF5F5] text-[#F94239]"
```

### 배지/태그 (Benefit)
```tsx
// Support/BenefitAlt + Support/Benefit
className="text-xs font-semibold px-3 py-1 rounded-full bg-[#E7F7F3] text-[#01A484]"
```

### 배지/태그 (Neutral)
```tsx
// Support/NeutralAlt + Support/Neutral
className="text-xs font-semibold px-3 py-1 rounded-full bg-[#F5F7FA] text-[#49627A]"
```

### 통계 카드 (숫자)
```tsx
// Background/Primary + Border/Primary
className="bg-white rounded-[14px] p-4 text-center border border-[#E6E6E6] shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
// 숫자: text-[28px] font-extrabold tracking-tight text-[#7C8C03]
// 라벨: text-[11px] text-[#8B8B8B] font-semibold mt-1  (Content/Secondary)
```

### 리스트 아이템
```tsx
// Background/Primary + Border/Primary → Border/Selected
className="flex items-center gap-3 p-[13px_16px] rounded-[13px] bg-white border border-[#E6E6E6]
           cursor-pointer transition-all duration-150
           hover:-translate-y-[1px] hover:border-[#CEDA80] hover:shadow-[0_4px_12px_rgba(124,140,3,0.08)]"
// 완료 상태: bg-[#F4F6E0] border-[#CEDA80]  (Support/PositiveAlt + Border/Selected)
```

### 체크박스
```tsx
// 미완료: Border/Primary
className="w-5 h-5 rounded-[6px] border-2 border-[#E6E6E6] flex-shrink-0 transition-all duration-200"
// 완료: Support/Positive
className="w-5 h-5 rounded-[6px] border-2 border-[#7C8C03] bg-[#7C8C03] flex items-center justify-center flex-shrink-0"
```

### Divider
```tsx
// Border/Primary
<div className="h-px w-full bg-[#E6E6E6]" />
// Border/Secondary (강조)
<div className="h-px w-full bg-[#DCDCDC]" />
```

### Snackbar / Toast
```tsx
// Background/InversePrimary + Content/InversePrimary
className="bg-[#222222] text-white text-sm font-medium px-5 py-3 rounded-[12px]
           shadow-[0_4px_16px_rgba(0,0,0,0.16)]"
```

### 오버레이 (Dialog 딤)
```tsx
// Background/Overlay/DarkPrimary
className="fixed inset-0 bg-black/48 z-50"
```

### 진행바
```tsx
// 외부: Support/PositiveAlt 또는 white/20
className="h-[7px] rounded-full bg-[#E6EBB8] overflow-hidden"
// 내부: Support/Positive
className="h-full rounded-full bg-[#7C8C03] transition-all duration-700"
style={{ width: `${pct}%` }}
```

### 스켈레톤
```tsx
// Support/Skeleton/Base
className="bg-[#F5F7FA] rounded-[14px] animate-pulse"
// shimmer overlay는 별도 keyframe 사용
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
- Unsplash URL 절대 금지

### 애니메이션
```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(1rem); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes shimmer {
  from { transform: translateX(-100%); }
  to { transform: translateX(100%); }
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
[Sticky 헤더] h-14  — Background/Primary 80% + Border/Primary
[Hero 카드] rounded-[20px] 그라디언트
[통계 카드 3열]  — Background/Primary + Border/Primary
[필터/카테고리 배지]
[리스트 or 그리드]
[푸터 메시지]  — Content/Tertiary
```

### 통계 표시
- 3열 그리드: 전체 / 완료 / 남은 항목
- 숫자 `text-[28px] font-extrabold`, 라벨 `text-[11px]`
- 컬러: Positive(Green800) / Benefit(BenefitGreen800) / Warning(Yellow900)

### 카테고리 필터
```tsx
// 미선택: Button/Default + Button/DefaultOutline
className="bg-white border border-[#E6E6E6] text-[#222222] text-sm font-semibold px-4 py-2 rounded-full"
// 선택됨: Button/Green + Button/GreenOutline
className="bg-[#F4F6E0] border border-[#CEDA80] text-[#7C8C03] text-sm font-semibold px-4 py-2 rounded-full"
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
  (auth)/
  (dashboard)/
  api/
components/
  ui/
  [feature]/
lib/
  supabase.ts
  utils.ts
types/
  index.ts
```