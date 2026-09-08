// app/cleaning/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import AuthButton from "@/components/auth/AuthButton";
import styles from "./cleaning.module.css";

const PHONE = "010-XXXX-XXXX";
const PHONE_RAW = PHONE.replace(/-/g, "");

const trustPoints = [
  { icon: "solar:clipboard-check-linear", label: "방문 점검 · 견적 무료" },
  { icon: "solar:clock-circle-linear", label: "당일 방문 · 당일 완료" },
  { icon: "solar:wallet-money-linear", label: "결과 확인 후 후불 결제" },
];

const promises = [
  "매트리스 상태를 먼저 확인합니다.",
  "작업 방식을 미리 설명합니다.",
  "결과를 확인한 뒤 결제합니다.",
];

// 사진 자리는 회색 블록. 실제 작업 사진 확보 후 교체 예정.
const services = [
  {
    id: "stain",
    chip: "Stain Care",
    title: "땀 · 피지 얼룩",
    desc: "매일 몸이 닿는 상판에 가장 먼저 쌓입니다. 눌어붙은 정도에 따라 전처리 범위를 나눠 잡습니다.",
    points: ["상판·측면 얼룩 범위 확인", "부위별 전처리 후 습식 딥클리닝", "오염수 추출까지 함께 확인"],
  },
  {
    id: "dust",
    chip: "Dust Care",
    title: "진드기 · 집먼지",
    desc: "눈에 보이지 않는 미세 오염입니다. 고압 집진으로 표면과 봉제선 틈새부터 걷어냅니다.",
    points: ["고압 집진으로 입자성 오염 제거", "봉제선·테두리 집중 작업", "UV 살균 건조로 마무리"],
  },
  {
    id: "odor",
    chip: "Odor Care",
    title: "냄새 · 습기",
    desc: "습기가 남으면 냄새는 다시 올라옵니다. 항균·탈취 처리와 건조 상태까지 확인합니다.",
    points: ["항균·탈취 처리", "UV 살균 건조", "사용 가능 시점 안내"],
  },
];

const methodSteps = [
  { n: "01", title: "상태 확인", desc: "사이즈와 얼룩 범위, 손상 여부를 먼저 살핍니다." },
  { n: "02", title: "고압 집진", desc: "표면과 봉제선 틈새에 쌓인 먼지와 입자성 오염을 걷어냅니다." },
  { n: "03", title: "얼룩 전처리", desc: "눈에 띄는 생활 얼룩을 구분하고 부위별로 전처리합니다." },
  { n: "04", title: "습식 세척 · 추출", desc: "전용 장비로 세척하고 오염수를 남기지 않고 뽑아냅니다." },
  { n: "05", title: "항균 · UV 건조", desc: "항균·탈취 처리 후 UV 살균 건조하고 사용 시점을 안내합니다." },
];

const features = [
  "고압 집진 청소",
  "습식 딥클리닝 (얼룩·냄새 제거)",
  "항균·탈취 처리",
  "UV 살균 건조",
  "진드기 제거 보장",
];

const carePoints = [
  {
    n: "01",
    name: "땀 · 피지 얼룩",
    eng: "Stain",
    first: "상판과 측면의 얼룩 위치, 번진 범위, 고착 정도",
    focus: "피부 접촉면, 머리·다리 쪽 국소 오염, 눌어붙은 자국",
    last: "추출한 오염수와 남은 자국 상태, 필요한 건조 시간",
  },
  {
    n: "02",
    name: "진드기 · 집먼지",
    eng: "Dust",
    first: "사용 기간과 봉제선·테두리에 쌓인 먼지 양",
    focus: "봉제선, 테두리, 매트리스 측면 틈새",
    last: "집진 결과와 커버·침구 세탁 권장 주기",
  },
  {
    n: "03",
    name: "냄새 · 습기",
    eng: "Odor",
    first: "냄새가 나는 부위와 습기가 남는 위치, 사용 환경",
    focus: "습기가 고이는 하단면과 벽면 접촉부",
    last: "항균·탈취 처리 범위와 환기·건조 방법",
  },
];

const payFlow = [
  { n: "01", text: "전화 또는\n사진 상담" },
  { n: "02", text: "상태 확인 후\n비용 안내" },
  { n: "03", text: "예약일 방문\n전문 청소" },
  { n: "04", text: "결과 확인 후\n후불 결제" },
];

// 자리 배치용 더미 12장. 실제 작업 사진으로 교체 예정.
const records = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));

const faqs = [
  {
    q: "얼룩이 전부 지워지나요?",
    a: "오염 종류와 고착 정도에 따라 다릅니다. 오래 눌어붙은 얼룩이나 변색은 옅어지는 선까지가 한계일 수 있습니다. 방문 점검에서 어디까지 가능한지 먼저 말씀드린 뒤 진행합니다.",
  },
  {
    q: "청소 후 바로 사용할 수 있나요?",
    a: "UV 살균 건조까지 마치면 대부분 당일 사용이 가능합니다. 오염이 심해 습식 작업 범위가 넓었던 경우에는 필요한 환기 시간을 함께 안내해 드립니다.",
  },
  {
    q: "비용은 어떻게 확인하나요?",
    a: "매트리스 사이즈와 오염 상태에 따라 필요한 작업 범위가 달라집니다. 전화나 문자로 사진을 보내주시면 상태를 먼저 확인해 안내드리고, 방문 점검에서 확정한 뒤 작업을 시작합니다.",
  },
  {
    q: "어느 지역까지 방문하나요?",
    a: "김포와 인천, 경기 서부는 당일 출장이 가능합니다. 그 밖의 지역은 일정에 따라 조율이 필요하니 전화로 문의해 주세요.",
  },
];

const askItems = [
  { n: "01", title: "매트리스 사이즈", desc: "싱글 · 더블 · 퀸 · 킹" },
  { n: "02", title: "사용 기간", desc: "구입 시기와 관리 이력" },
  { n: "03", title: "지역", desc: "시·구와 방문 희망일" },
  { n: "04", title: "현재 사진", desc: "전체와 오염 부위" },
];

const SIZES = ["싱글", "더블", "퀸", "킹", "잘 모르겠어요"];

export default function CleaningPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [size, setSize] = useState("");
  const [agree, setAgree] = useState(false);

  const canSubmit = name.trim() !== "" && contact.trim() !== "" && agree;

  // 백엔드 없이 문자 앱으로 내용을 넘깁니다.
  const handleEstimate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const body = [
      "[오염파이터 간편견적]",
      `성함: ${name.trim()}`,
      `연락처: ${contact.trim()}`,
      `매트리스: ${size || "미선택"}`,
    ].join("\n");
    window.location.href = `sms:${PHONE_RAW}?body=${encodeURIComponent(body)}`;
  };

  return (
    <div className={styles.page}>

      {/* ── 헤더 ── */}
      <header className={styles.header}>
        <div className={`${styles.shell} ${styles.headerInner}`}>
          <Link href="/cleaning" className={styles.brand}>
            <span className={styles.brandMark}>
              <Icon icon="solar:shield-check-bold" className={styles.brandIcon} />
              오염파이터
            </span>
            <span className={`${styles.brandSub} ${styles.eng}`}>Mattress Care</span>
          </Link>

          <div className={styles.headerBottom}>
            <nav className={styles.navLinks}>
              <a href="#service" className={styles.navLink}>주력 서비스</a>
              <a href="#method" className={styles.navLink}>관리 방식</a>
              <a href="#record" className={styles.navLink}>작업 사례</a>
            </nav>
            <div className={styles.authSlot}><AuthButton /></div>
            <a href="#estimate" className={styles.headerCta}>견적 상담</a>
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
              <a href="#method" className={styles.btnGhost}>
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

        {/* 사진 자리 — 실제 작업 사진으로 교체 필요 */}
        <div className={styles.heroMedia}>
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

      {/* ── 약속 스트립 ── */}
      <section className={styles.promiseStrip}>
        <div className={`${styles.shell} ${styles.promiseInner}`}>
          {promises.map((text, i) => (
            <div key={text} className={styles.promiseItem}>
              <span className={`${styles.promiseNum} ${styles.eng}`}>{String(i + 1).padStart(2, "0")}</span>
              <p className={styles.promiseText}>{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 주력 서비스 ── */}
      <section id="service" className={styles.section}>
        <div className={styles.shell}>
          <div className={styles.splitHeader}>
            <div>
              <span className={`${styles.splitTag} ${styles.eng}`}>Main Service</span>
              <h2 className={styles.splitTitle}>
                같은 얼룩처럼 보여도<br />
                오염마다<br />
                방법이 다릅니다.
              </h2>
            </div>
            <p className={styles.splitDesc}>
              땀과 피지, 진드기와 집먼지, 배어든 냄새는 각각 다른 방식으로 접근해야 합니다.
              오염파이터는 어떤 오염을 어떤 순서로 잡는지 먼저 구분해 안내합니다.
            </p>
          </div>

          <div className={styles.serviceGrid}>
            {services.map(({ id, chip, title, desc, points }, i) => (
              <article
                key={id}
                className={`${styles.serviceCard} ${i === 0 ? styles.serviceWide : ""}`}
              >
                {/* 사진 자리 — 실제 작업 사진으로 교체 필요 */}
                <div className={styles.serviceMedia}>
                  <span className={`${styles.serviceChip} ${styles.eng}`}>{chip}</span>
                </div>
                <div className={styles.serviceBody}>
                  <span className={`${styles.serviceIndex} ${styles.eng}`}>{String(i + 1).padStart(2, "0")}</span>
                  <h3 className={styles.serviceTitle}>{title}</h3>
                  <p className={styles.serviceDesc}>{desc}</p>
                  <div className={styles.serviceRule} />
                  <ul className={styles.serviceList}>
                    {points.map((p) => <li key={p}>{p}</li>)}
                  </ul>
                  <a href="#method" className={styles.serviceLink}>
                    관리 방식 보기
                    <Icon icon="solar:arrow-right-up-linear" width={15} />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── 관리 원칙 밴드 ── */}
      <section id="method" className={styles.methodBand}>
        <div className={`${styles.shell} ${styles.methodInner}`}>
          <div>
            <span className={`${styles.methodTag} ${styles.eng}`}>Cleaning Method</span>
            <h2 className={styles.methodTitle}>
              표면만 훑지 않고<br />
              속에 있는 오염까지<br />
              꺼내서 확인합니다.
            </h2>
          </div>
          <p className={styles.methodDesc}>
            단순 표면 청소가 아니라 상태 확인부터 고압 집진, 얼룩 전처리, 습식 세척과 오염수 추출,
            건조 안내까지 순서에 맞춰 진행합니다. 어떤 단계에서 무엇을 확인했는지 현장에서 함께 봅니다.
          </p>
          <a href={`tel:${PHONE}`} className={styles.btnGhost}>
            <Icon icon="solar:phone-calling-bold" width={18} />
            내 매트리스 상태 상담하기
          </a>
        </div>
      </section>

      {/* ── 공정 5단계 ── */}
      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={styles.shell}>
          <div className={styles.splitHeader}>
            <div>
              <span className={`${styles.splitTag} ${styles.eng}`}>Visible Cleaning</span>
              <h2 className={styles.splitTitle}>
                무엇을 어떻게 하는지<br />
                숨기지 않습니다.
              </h2>
            </div>
            <p className={styles.splitDesc}>
              작업 전 상태와 진행 중 확인 항목, 마무리 결과까지 이해하실 수 있도록 설명합니다.
              매트리스 상태에 따라 세부 방식은 조정됩니다.
            </p>
          </div>

          <div className={styles.methodSteps}>
            {methodSteps.map(({ n, title, desc }) => (
              <div key={n} className={styles.methodStep}>
                <div className={`${styles.methodStepNum} ${styles.eng}`}>{n}</div>
                <p className={styles.methodStepTitle}>{title}</p>
                <p className={styles.methodStepDesc}>{desc}</p>
              </div>
            ))}
          </div>

          <div className={styles.includedCard}>
            <p className={`${styles.includedLabel} ${styles.eng}`}>Included</p>
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

          <p className={styles.methodNote}>
            ※ 사용 연한, 변색, 손상, 오염 고착 정도에 따라 제거 가능한 범위는 달라질 수 있으며 작업 전에 먼저 설명드립니다.
          </p>
        </div>
      </section>

      {/* ── 관리 포인트 ── */}
      <section className={styles.section}>
        <div className={styles.shell}>
          <div className={styles.splitHeader}>
            <div>
              <span className={`${styles.splitTag} ${styles.eng}`}>Care Point</span>
              <h2 className={styles.splitTitle}>
                어디를 먼저 보고<br />
                어디에 오래<br />
                머무는지.
              </h2>
            </div>
            <p className={styles.splitDesc}>
              가장 많이 묻는 확인 위치와 관리 포인트를 오염 유형별로 나눴습니다.
              상담 단계부터 어떤 부분을 중점적으로 보는지 미리 확인하실 수 있습니다.
            </p>
          </div>

          <div className={styles.careRows}>
            {carePoints.map(({ n, name: careName, eng, first, focus, last }) => (
              <div key={n} className={styles.careRow}>
                <div className={styles.careLabel}>
                  <span className={`${styles.careIndex} ${styles.eng}`}>{n}</span>
                  <p className={styles.careName}>{careName}</p>
                  <span className={`${styles.careWatermark} ${styles.eng}`}>{eng}</span>
                </div>
                <div className={styles.careCell}>
                  <p className={styles.careCellLabel}>먼저 확인</p>
                  <p className={styles.careCellText}>{first}</p>
                </div>
                <div className={styles.careCell}>
                  <p className={styles.careCellLabel}>집중 관리</p>
                  <p className={styles.careCellText}>{focus}</p>
                </div>
                <div className={styles.careCell}>
                  <p className={styles.careCellLabel}>마무리 안내</p>
                  <p className={styles.careCellText}>{last}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 상담 · 후불 ── */}
      <section id="pricing" className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={styles.shell}>
          <div className={styles.priceSplit}>
            <div className={styles.priceIntro}>
              <span className={`${styles.splitTag} ${styles.eng}`} style={{ color: "#9DB4CB" }}>
                Estimate, Pay After
              </span>
              <h2 className={styles.priceIntroTitle}>
                비용은 상담으로<br />
                정확하게,<br />
                결제는 결과<br />
                확인 후에.
              </h2>
              <p className={styles.priceIntroDesc}>
                매트리스 상태와 오염 정도, 작업 장소에 따라 필요한 범위가 달라집니다.
                전화나 사진으로 상태를 먼저 확인한 뒤, 작업을 시작하기 전에 비용을 안내해 드립니다.
              </p>
              <a href={`tel:${PHONE}`} className={`${styles.btnSolid} ${styles.priceIntroCta}`}>
                <Icon icon="solar:phone-calling-bold" width={18} />
                견적 문의하기
              </a>
              <p className={styles.priceIntroNote}>
                현장에서 추가 작업이 필요하다면 진행 전에 먼저 설명드립니다.
              </p>
            </div>

            <div className={styles.priceQuad}>
              {payFlow.map(({ n, text }, i) => (
                <div key={n} className={`${styles.quad} ${styles[`quad${i + 1}`]}`}>
                  <span className={`${styles.quadNum} ${styles.eng}`}>{n}</span>
                  <p className={styles.quadText} style={{ whiteSpace: "pre-line" }}>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 작업 기록 ── */}
      <section id="record" className={styles.section}>
        <div className={styles.shell}>
          <div className={styles.splitHeader}>
            <div>
              <span className={`${styles.splitTag} ${styles.eng}`}>Work Record</span>
              <h2 className={styles.splitTitle}>
                결과는 말보다<br />
                기록으로<br />
                보여드립니다.
              </h2>
            </div>
            <p className={styles.splitDesc}>
              작업 전 오염 상태, 진행 중 세척 장면, 작업 후 결과를 같은 기준으로 기록합니다.
              방문 때 현장에서 함께 확인하고 남겨 드립니다.
            </p>
          </div>

          <div className={styles.recordStat}>
            <span className={styles.recordStatNum}>{records.length}</span>
            <div>
              <p className={`${styles.recordStatLabel} ${styles.eng}`}>Work Records</p>
              <p className={styles.recordStatDesc}>작업 전 · 중 · 후 기록</p>
            </div>
          </div>

          <div className={styles.recordGrid}>
            {records.map((n) => (
              <div key={n} className={styles.recordItem}>
                <div className={styles.recordCaption}>
                  <span className={styles.eng}>Work Record</span>
                  <span className={styles.recordCaptionNum}>{n}</span>
                </div>
              </div>
            ))}
          </div>

          <p className={styles.recordNote}>
            ※ 회색으로 비워 둔 칸은 실제 작업 사진이 들어갈 자리입니다.
          </p>
        </div>
      </section>

      {/* ── 가정 / 다량 작업 ── */}
      <section className={styles.section}>
        <div className={styles.shell}>
          <div className={styles.segmentGrid}>
            <div className={`${styles.segment} ${styles.segmentHome}`}>
              <span className={`${styles.segmentTag} ${styles.eng}`}>For Home</span>
              <h3 className={styles.segmentTitle}>
                집에서 매일 쓰는<br />
                매트리스를 위한 관리
              </h3>
              <ul className={styles.segmentList}>
                <li>싱글 · 더블 · 퀸 · 킹 침대 매트리스</li>
                <li>토퍼와 매트리스 커버 상태 확인</li>
                <li>평일 · 주말 모두 방문 일정 조율</li>
              </ul>
              <a href={`tel:${PHONE}`} className={styles.segmentBtn}>
                가정용 서비스 상담
                <Icon icon="solar:arrow-right-linear" width={16} />
              </a>
            </div>

            <div className={`${styles.segment} ${styles.segmentBiz}`}>
              <span className={`${styles.segmentTag} ${styles.eng}`}>For Business</span>
              <h3 className={styles.segmentTitle}>
                여러 개를 한 번에<br />
                맡기는 다량 작업
              </h3>
              <ul className={styles.segmentList}>
                <li>게스트하우스 · 펜션 객실 매트리스</li>
                <li>기숙사 · 고시원 등 다량 작업</li>
                <li>수량과 희망 일정 기준으로 상담</li>
              </ul>
              <a href={`tel:${PHONE}`} className={styles.segmentBtn}>
                다량 작업 상담
                <Icon icon="solar:arrow-right-linear" width={16} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={`${styles.shell} ${styles.faqLayout}`}>
          <div>
            <span className={`${styles.splitTag} ${styles.eng}`}>FAQ</span>
            <h2 className={styles.splitTitle}>
              상담 전<br />
              자주 묻는 질문
            </h2>
          </div>

          <div className={styles.faqList}>
            {faqs.map(({ q, a }, i) => {
              const open = openFaq === i;
              return (
                <div key={q} className={styles.faqItem}>
                  <button
                    type="button"
                    className={styles.faqQ}
                    aria-expanded={open}
                    onClick={() => setOpenFaq(open ? null : i)}
                  >
                    {q}
                    <Icon
                      icon="solar:add-circle-linear"
                      width={22}
                      className={`${styles.faqIcon} ${open ? styles.faqIconOpen : ""}`}
                    />
                  </button>
                  {open && <p className={styles.faqA}>{a}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 상담 안내 ── */}
      <section className={styles.section}>
        <div className={styles.shell}>
          <div className={styles.contactSplit}>
            <div className={styles.contactLeft}>
              <span className={`${styles.splitTag} ${styles.eng}`} style={{ color: "#9DB4CB" }}>
                Contact
              </span>
              <h2 className={styles.contactTitle}>
                사진 한 장이면<br />
                상담이 더<br />
                빨라집니다.
              </h2>
              <p className={styles.contactDesc}>
                전화나 문자로 매트리스 사진을 보내주시면 오염 상태를 먼저 확인하고,
                방문 전에 필요한 작업 범위를 안내해 드립니다.
              </p>
              <div className={styles.regionChips}>
                {["김포", "인천", "경기 서부"].map((r) => (
                  <span key={r} className={styles.regionChip}>{r}</span>
                ))}
              </div>
            </div>

            <div className={styles.contactRight}>
              <p className={styles.contactRightTitle}>상담할 때 알려주세요</p>
              <div className={styles.contactAsk}>
                {askItems.map(({ n, title, desc }) => (
                  <div key={n} className={styles.askCell}>
                    <span className={`${styles.askNum} ${styles.eng}`}>{n}</span>
                    <div>
                      <p className={styles.askTitle}>{title}</p>
                      <p className={styles.askDesc}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <a href={`tel:${PHONE}`} className={styles.contactLine}>
                <span className={styles.contactLineLabel}>전화 상담</span>
                <span className={styles.contactLineValue}>{PHONE}</span>
              </a>
              <a href={`sms:${PHONE_RAW}`} className={styles.contactLine}>
                <span className={styles.contactLineLabel}>문자 상담</span>
                <span className={styles.contactLineValue}>사진과 함께 보내기</span>
              </a>
              <p className={styles.contactNote}>
                ※ 전화번호는 실제 운영 연락처로 교체해 주세요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 간편 견적 ── */}
      <section id="estimate" className={styles.estimateBand}>
        <form className={`${styles.shell} ${styles.estimateInner}`} onSubmit={handleEstimate}>
          <div>
            <p className={styles.estimateBrand}>
              오염파이터 간편견적
              <span className={`${styles.estimateBrandEng} ${styles.eng}`}>Quick Estimate</span>
            </p>
          </div>

          <div className={styles.estimateFields}>
            <input
              className={styles.estimateInput}
              placeholder="성함"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className={styles.estimateInput}
              placeholder="연락처"
              inputMode="tel"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
            <select
              className={styles.estimateSelect}
              value={size}
              onChange={(e) => setSize(e.target.value)}
            >
              <option value="">매트리스 사이즈</option>
              {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <label className={styles.estimateAgree}>
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
              상담을 위한 개인정보 수집에 동의합니다
            </label>
            <p className={styles.estimateHint}>
              ※ 현재는 별도 저장 없이 입력하신 내용을 문자 앱으로 넘겨 드립니다.
            </p>
          </div>

          <button type="submit" className={styles.estimateSubmit} disabled={!canSubmit}>
            상담 신청
          </button>
        </form>
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
