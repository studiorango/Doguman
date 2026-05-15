// app/cleaning/page.tsx
"use client";

import Link from "next/link";
import AuthButton from "@/components/auth/AuthButton";
import styles from './cleaning.module.css'

const features = [
  '고압 집진 청소',
  '습식 딥클리닝 (얼룩·냄새 제거)',
  '항균·탈취 처리',
  'UV 살균 건조',
  '진드기 제거 보장',
]

const steps = [
  { n: 1, title: '전화 또는 카카오 예약', desc: '전화 한 통으로 일정 조율. 방문 가능한 날짜와 시간을 함께 정합니다.' },
  { n: 2, title: '방문 & 무료 점검', desc: '오염 상태를 직접 확인하고 최적의 방법과 가격을 안내합니다.' },
  { n: 3, title: '전문 청소 진행', desc: '집진 → 습식 딥클리닝 → 항균·탈취 → UV 살균 건조 순으로 진행합니다.' },
  { n: 4, title: '완료 확인 & 결제', desc: '결과를 함께 확인한 후 결제. 현금·카드·계좌이체 모두 가능합니다.' },
]

const CheckIcon = () => (
  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
    <path d="M1.5 4.5l2 2L7.5 2" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function CleaningPage() {
  return (
    <div className={styles.page}>

      {/* ── 네브바 ── */}
      <header
        style={{
          height: 60,
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(250,249,247,0.92)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid #E8E5E0",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            maxWidth: 1040,
            width: "100%",
            margin: "0 auto",
            padding: "0 24px",
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
          }}
        >
          {/* 왼쪽 — 로고 */}
          <div>
            <Link href="/" style={{ fontSize: 17, fontWeight: 700, color: "#1A1A1A", textDecoration: "none", letterSpacing: "-0.02em" }}>
              김민제
            </Link>
          </div>

          {/* 가운데 — 블로그 */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Link href="/blog" style={{ fontSize: 15, fontWeight: 500, color: "#888888", textDecoration: "none" }}>
              블로그
            </Link>
          </div>

          {/* 오른쪽 — AuthButton */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <AuthButton />
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroBadge}>
          <span className={styles.badgeDot} />
          김포 · 인천 · 경기 서부 전문 출장
        </div>
        <h1 className={styles.heroH1}>
          매트리스 속<br />
          보이지 않는 오염,<br />
          <em className={styles.heroEm}>완전히 잡습니다</em>
        </h1>
        <p className={styles.heroSub}>
          집진 → 습식청소 → 항균 → UV 살균 건조까지<br />
          당일 방문, 당일 완료. 후불 결제.
        </p>
        <div className={styles.videoCard}>
          <iframe
            src="https://www.youtube.com/embed/VIDEO_ID_HERE?rel=0&modestbranding=1"
            title="오염파이터 매트리스 청소 영상"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </section>

      {/* PRICING */}
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>요금 안내</span>
            <h2 className={styles.sectionTitle}>단일 요금제</h2>
            <p className={styles.sectionDesc}>사이즈 상관없이 동일한 가격, 동일한 서비스</p>
          </div>
          <div className={styles.pricingWrap}>
            <div className={styles.priceCard}>
              <div className={styles.badgeBest}>싱글 · 더블 · 퀸 · 킹 동일 요금</div>
              <p className={styles.priceName}>매트리스 청소</p>
              <p className={styles.priceAmount}>5<sub>만원</sub></p>
              <p className={styles.priceSizeNote}>사이즈 무관 · 전 과정 포함</p>
              <div className={styles.priceDivider} />
              <div className={styles.priceFeatures}>
                {features.map((feat) => (
                  <div key={feat} className={styles.priceFeature}>
                    <div className={styles.featCheck}><CheckIcon /></div>
                    {feat}
                  </div>
                ))}
              </div>
              <a href="tel:010-XXXX-XXXX" className={styles.priceBtn}>예약 문의</a>
            </div>
          </div>
          <p className={styles.pricingNote}>
            ※ 심한 오염·특수 처리 시 추가 비용이 발생할 수 있습니다. 무료 견적 후 확정됩니다.
          </p>
        </div>
      </section>

      {/* PROCESS */}
      <section className={`${styles.section} ${styles.processSection}`}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>이용 방법</span>
            <h2 className={styles.sectionTitle}>4단계면 끝납니다</h2>
            <p className={styles.sectionDesc}>예약부터 완료까지 빠르고 간단하게</p>
          </div>
          <div className={styles.processGrid}>
            {steps.map(({ n, title, desc }) => (
              <div key={n} className={styles.step}>
                <div className={styles.stepIndex}>{n}</div>
                <p className={styles.stepTitle}>{title}</p>
                <p className={styles.stepDesc}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaCard}>
          <h2>지금 바로 예약하세요</h2>
          <p>
            김포·인천·경기 서부 지역 당일 출장 가능<br />
            무료 견적 후 부담 없이 결정하세요
          </p>
          <a href="tel:010-XXXX-XXXX" className={styles.ctaBig}>전화로 예약하기</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <strong>오염파이터</strong> · 경기도 김포시 구래동<br />
        대표번호: 010-XXXX-XXXX · 운영시간: 평일·주말 09:00–19:00<br />
        <Link href="/" className={styles.footerLink}>김민제</Link> 서비스 · © 2025 오염파이터
      </footer>

    </div>
  )
}