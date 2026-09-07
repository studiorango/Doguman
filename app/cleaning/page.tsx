// app/cleaning/page.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { Icon } from "@iconify/react";
import AuthButton from "@/components/auth/AuthButton";
import styles from "./cleaning.module.css";

const PHONE = "010-XXXX-XXXX";

const features = [
  "고압 집진 청소",
  "습식 딥클리닝 (얼룩·냄새 제거)",
  "항균·탈취 처리",
  "UV 살균 건조",
  "진드기 제거 보장",
];

const trustPoints = [
  { icon: "solar:tag-price-linear", label: "사이즈 무관 단일 요금" },
  { icon: "solar:clock-circle-linear", label: "당일 방문 · 당일 완료" },
  { icon: "solar:wallet-money-linear", label: "결과 확인 후 후불 결제" },
];

const steps = [
  { n: 1, title: "전화 또는 카카오 예약", desc: "전화 한 통으로 일정 조율. 방문 가능한 날짜와 시간을 함께 정합니다." },
  { n: 2, title: "방문 & 무료 점검", desc: "오염 상태를 직접 확인하고 최적의 방법과 가격을 안내합니다." },
  { n: 3, title: "전문 청소 진행", desc: "집진 → 습식 딥클리닝 → 항균·탈취 → UV 살균 건조 순으로 진행합니다." },
  { n: 4, title: "완료 확인 & 결제", desc: "결과를 함께 확인한 후 결제. 현금·카드·계좌이체 모두 가능합니다." },
];

// 이미지는 모두 더미(picsum). 실제 작업 사진 확보 후 교체 예정.
const cases = [
  {
    seed: "mattress-dust-extraction",
    tag: "집진 + 습식",
    title: "퀸 매트리스",
    desc: "표면 집진 후 습식 딥클리닝으로 눌어붙은 얼룩까지 처리합니다.",
  },
  {
    seed: "mattress-stain-removal",
    tag: "얼룩 · 냄새",
    title: "싱글 매트리스",
    desc: "생활 얼룩과 배어든 냄새를 전용 약제로 분해해 제거합니다.",
  },
  {
    seed: "mattress-uv-sanitizing",
    tag: "항균 · UV",
    title: "킹 매트리스",
    desc: "항균·탈취 처리 후 UV 살균 건조로 진드기까지 잡습니다.",
  },
];

export default function CleaningPage() {
  return (
    <div className={styles.page}>

      {/* ── 헤더 ── */}
      <header className={styles.header}>
        <div className={`${styles.shell} ${styles.headerInner}`}>
          <div>
            <Link href="/" className={styles.homeLink}>
              <Icon icon="solar:alt-arrow-left-linear" width={14} />
              김민제
            </Link>
          </div>

          <Link href="/cleaning" className={styles.brand}>
            <span className={styles.brandMark}>
              <Icon icon="solar:shield-check-bold" className={styles.brandIcon} />
              오염파이터
            </span>
            <span className={`${styles.brandSub} ${styles.eng}`}>Mattress Care</span>
          </Link>

          <div className={styles.headerRight}>
            <nav className={styles.navLinks}>
              <a href="#pricing" className={styles.navLink}>요금 안내</a>
              <a href="#process" className={styles.navLink}>관리 방식</a>
              <a href="#cases" className={styles.navLink}>작업 사례</a>
            </nav>
            <div className={styles.authSlot}><AuthButton /></div>
            <a href={`tel:${PHONE}`} className={styles.headerCta}>견적 상담</a>
          </div>
        </div>
      </header>

      {/* ── 히어로 ── */}
      <section className={styles.hero}>
        <div className={styles.heroPanel}>
          <div className={styles.heroPanelInner}>
            <p className={`${styles.heroEyebrow} ${styles.eng}`}>Mattress Hygiene Specialist</p>

            <h1 className={styles.heroH1}>
              매트리스 속<br />
              <em className={styles.heroEm}>보이지 않는 오염까지</em><br />
              잡아냅니다.
            </h1>

            <p className={styles.heroSub}>
              집진, 습식 딥클리닝, 항균·탈취, UV 살균 건조까지 전 과정을 방문해 처리합니다.
              김포·인천·경기 서부 지역은 당일 출장이 가능합니다.
            </p>

            <div className={styles.heroActions}>
              <a href={`tel:${PHONE}`} className={styles.btnSolid}>
                <Icon icon="solar:phone-calling-bold" width={18} />
                전화로 예약하기
              </a>
              <a href="#process" className={styles.btnGhost}>
                서비스 방식 보기
                <Icon icon="solar:arrow-right-linear" width={18} />
              </a>
            </div>

            <div className={styles.heroTrust}>
              {trustPoints.map(({ icon, label }) => (
                <span key={label} className={styles.heroTrustItem}>
                  <Icon icon={icon} className={styles.heroTrustIcon} />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.heroMedia}>
          {/* 더미 이미지 — 실제 작업 사진으로 교체 필요 */}
          <Image
            src="https://picsum.photos/seed/mattress-deep-cleaning-onsite/1200/1400"
            alt="매트리스 방문 청소 작업 현장"
            fill
            priority
            sizes="(max-width: 860px) 100vw, 50vw"
            className={styles.heroImg}
          />
          <span className={`${styles.heroPill} ${styles.eng}`}>Gimpo · Incheon · Gyeonggi</span>
          <div className={styles.heroCard}>
            <p className={`${styles.heroCardLabel} ${styles.eng}`}>Full Process</p>
            <p className={styles.heroCardText}>
              집진부터 UV 살균 건조까지<br />
              한 번 방문으로 완료
            </p>
          </div>
        </div>
      </section>

      {/* ── 요금 ── */}
      <section id="pricing" className={styles.section}>
        <div className={styles.shell}>
          <div className={styles.sectionHeader}>
            <span className={`${styles.sectionTag} ${styles.eng}`}>Pricing</span>
            <h2 className={styles.sectionTitle}>사이즈를 재지 않는 단일 요금제</h2>
            <p className={styles.sectionDesc}>
              싱글이든 킹이든 같은 가격, 같은 공정으로 진행합니다. 견적 때문에 고민할 필요가 없습니다.
            </p>
          </div>

          <div className={styles.priceCard}>
            <div className={styles.priceLeft}>
              <span className={styles.priceBadge}>싱글 · 더블 · 퀸 · 킹 동일</span>
              <p className={styles.priceName}>매트리스 청소</p>
              <p className={styles.priceAmount}>5<sub>만원</sub></p>
              <p className={styles.priceSizeNote}>사이즈 무관 · 전 과정 포함</p>
              <a href={`tel:${PHONE}`} className={styles.priceBtn}>
                <Icon icon="solar:phone-calling-bold" width={18} />
                예약 문의
              </a>
            </div>

            <div className={styles.priceRight}>
              <p className={`${styles.priceRightLabel} ${styles.eng}`}>Included</p>
              <ul className={styles.priceFeatures}>
                {features.map((feat) => (
                  <li key={feat} className={styles.priceFeature}>
                    <span className={styles.featCheck}>
                      <Icon icon="solar:check-read-linear" width={14} />
                    </span>
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className={styles.pricingNote}>
            ※ 심한 오염이나 특수 처리가 필요한 경우 추가 비용이 발생할 수 있습니다. 방문 점검 후 무료 견적으로 확정됩니다.
          </p>
        </div>
      </section>

      {/* ── 관리 방식 ── */}
      <section id="process" className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={styles.shell}>
          <div className={styles.sectionHeader}>
            <span className={`${styles.sectionTag} ${styles.eng}`}>How It Works</span>
            <h2 className={styles.sectionTitle}>예약부터 결제까지 4단계</h2>
            <p className={styles.sectionDesc}>
              전화 한 통이면 나머지는 방문해서 처리합니다. 결제는 결과를 직접 확인한 다음입니다.
            </p>
          </div>

          <div className={styles.processGrid}>
            {steps.map(({ n, title, desc }) => (
              <div key={n} className={styles.step}>
                <div className={`${styles.stepIndex} ${styles.eng}`}>{String(n).padStart(2, "0")}</div>
                <p className={styles.stepTitle}>{title}</p>
                <p className={styles.stepDesc}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 작업 사례 ── */}
      <section id="cases" className={styles.section}>
        <div className={styles.shell}>
          <div className={styles.sectionHeader}>
            <span className={`${styles.sectionTag} ${styles.eng}`}>Case Record</span>
            <h2 className={styles.sectionTitle}>이렇게 작업합니다</h2>
            <p className={styles.sectionDesc}>
              매트리스 상태에 따라 공정의 비중이 달라집니다. 방문 점검에서 어떤 순서로 진행할지 먼저 설명드립니다.
            </p>
          </div>

          <div className={styles.caseGrid}>
            {cases.map(({ seed, tag, title, desc }) => (
              <article key={seed} className={styles.caseCard}>
                <div className={styles.caseMedia}>
                  {/* 더미 이미지 — 실제 작업 사진으로 교체 필요 */}
                  <Image
                    src={`https://picsum.photos/seed/${seed}/800/600`}
                    alt={`${title} 청소 작업`}
                    fill
                    sizes="(max-width: 860px) 100vw, 33vw"
                    className={styles.caseImg}
                  />
                </div>
                <div className={styles.caseBody}>
                  <span className={styles.caseTag}>{tag}</span>
                  <p className={styles.caseTitle}>{title}</p>
                  <p className={styles.caseDesc}>{desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={styles.ctaSection}>
        <div className={styles.shell}>
          <div className={styles.ctaCard}>
            <div className={styles.ctaGlow} />
            <h2 className={styles.ctaTitle}>
              오늘 쓰는 매트리스,<br />
              마지막으로 청소한 게 언제였나요?
            </h2>
            <p className={styles.ctaDesc}>
              김포·인천·경기 서부 지역 당일 출장 가능합니다.<br />
              방문 점검과 견적은 무료이니 부담 없이 연락 주세요.
            </p>
            <div className={styles.ctaActions}>
              <a href={`tel:${PHONE}`} className={styles.btnSolid}>
                <Icon icon="solar:phone-calling-bold" width={18} />
                전화로 예약하기
              </a>
              <a href="#pricing" className={styles.btnGhost}>
                요금 다시 보기
                <Icon icon="solar:arrow-right-linear" width={18} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── 푸터 ── */}
      <footer className={styles.footer}>
        <div className={styles.shell}>
          <strong className={styles.footerBrand}>오염파이터</strong>
          경기도 김포시 구래동<br />
          대표번호 {PHONE} · 운영시간 평일·주말 09:00–19:00
          <div className={styles.footerDivider} />
          <Link href="/" className={styles.footerLink}>김민제</Link> 서비스 · © 2025 오염파이터
        </div>
      </footer>

    </div>
  );
}
