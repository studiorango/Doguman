'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { ServiceHeader } from "@/components/doguman/service-header";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const ADMIN_EMAIL = 'k1017im@naver.com'

interface Quest {
  id: number; ch: number; ph: number; icon: string; title: string; sub: string
  xp: number; diff: 'EASY' | 'NORMAL' | 'HARD' | 'BOSS'
  type?: 'FIELD' | 'CONTENT' | 'MONEY'; boss?: boolean
  stats: { biz: number; con: number; fld: number; rev: number }; tasks: string[]
}
interface Chapter { id: number; ph: number; num: string; name: string }
interface Phase { id: number; title: string; name: string; target: string; bg: string; bdr: string; col: string }
interface Level { l: number; t: string; min: number }

const PH: Phase[] = [
    { id:1, title:'Phase 1', name:'생존', target:'월 순수익 500만원', bg:'#1A1A1A', bdr:'#333333', col:'#FFFFFF' },
    { id:2, title:'Phase 2', name:'성장', target:'월 순수익 1,500만원', bg:'#1A1A1A', bdr:'#333333', col:'#FFFFFF' },
    { id:3, title:'Phase 3', name:'성공', target:'월 순수익 3,000만원', bg:'#1A1A1A', bdr:'#333333', col:'#FFFFFF' },
  ]

const CH: Chapter[] = [
  { id:1, ph:1, num:'Ch.1', name:'창업의 시작' }, { id:2, ph:1, num:'Ch.2', name:'촬영 준비' },
  { id:3, ph:1, num:'Ch.3', name:'콘텐츠 제작 — 포트폴리오 구축' }, { id:4, ph:1, num:'Ch.4', name:'첫 클라이언트' },
  { id:5, ph:1, num:'Ch.5', name:'성장 기반' }, { id:6, ph:1, num:'Ch.6', name:'Phase 1 완료' },
  { id:7, ph:2, num:'Ch.7', name:'단가 혁명' }, { id:8, ph:2, num:'Ch.8', name:'SNS 파워' },
  { id:9, ph:2, num:'Ch.9', name:'시스템화' }, { id:10, ph:2, num:'Ch.10', name:'재무 기반' },
  { id:11, ph:2, num:'Ch.11', name:'위기 대응' }, { id:12, ph:2, num:'Ch.12', name:'Phase 2 완료' },
  { id:13, ph:3, num:'Ch.13', name:'브랜드 파워' }, { id:14, ph:3, num:'Ch.14', name:'수익 다각화' },
  { id:15, ph:3, num:'Ch.15', name:'고도화' }, { id:16, ph:3, num:'Ch.16', name:'전설의 완성' },
]

const Q: Quest[] = [
  { id:1, ch:1, ph:1, icon:'ti-building', title:'회사 차리기', sub:'사업자 등록 + 기반 구축', xp:200, diff:'EASY', stats:{ biz:10, con:0, fld:0, rev:0 }, tasks:['사업자 등록 (홈택스)', '법인 계좌 개설', '회사 이름 + 로고 결정', '명함 제작'] },
  { id:2, ch:1, ph:1, icon:'ti-device-laptop', title:'채널 기초 세팅', sub:'영상 올릴 집부터 만들어라', xp:200, diff:'EASY', type:'CONTENT', stats:{ biz:5, con:10, fld:0, rev:0 }, tasks:['유튜브 채널 개설 + 채널 아트 설정', '인스타그램 비즈니스 계정 개설', '서비스 소개 1페이지 작성', '제안서 템플릿 초안 작성'] },
  { id:20, ch:1, ph:1, icon:'ti-receipt-tax', title:'세금 기초 파악', sub:'돈 벌기 전에 세금부터', xp:150, diff:'EASY', type:'MONEY', stats:{ biz:5, con:0, fld:0, rev:15 }, tasks:['부가세 과세/면세 사업자 확인', '세무사 무료 상담 1회', '경비처리 가능 항목 파악', '사업용 카드 발급'] },
  { id:21, ch:2, ph:1, icon:'ti-camera', title:'장비 + 촬영 기술', sub:'찍을 줄 알아야 팔 수 있다', xp:200, diff:'NORMAL', type:'CONTENT', stats:{ biz:0, con:20, fld:15, rev:0 }, tasks:['카메라 / 삼각대 / 마이크 세팅', '시범 촬영 + 편집 테스트', '촬영 기초 독학 3시간+', '지인 찍어주며 실전 연습'] },
  { id:33, ch:3, ph:1, icon:'ti-run', title:'1편 — 일단 나가라', sub:'완벽하지 않아도 괜찮다. 그냥 나가라.', xp:200, diff:'EASY', type:'FIELD', stats:{ biz:0, con:8, fld:10, rev:0 }, tasks:['촬영 장소 선정 + 소품/선물 준비 (자비)', '현장 나가서 5~10명 만나기', '첫 리액션 영상 확보', '유튜브 + 인스타 첫 업로드 완료'] },
  { id:34, ch:3, ph:1, icon:'ti-repeat', title:'3편 — 리듬을 찾아라', sub:'세 번이면 내 패턴이 보이기 시작한다', xp:300, diff:'NORMAL', type:'CONTENT', stats:{ biz:0, con:12, fld:8, rev:0 }, tasks:['2차 현장 출격 + 영상 편집 + 업로드', '3차 현장 출격 + 영상 편집 + 업로드', '3편 조회수/댓글 비교 분석', '잘된 요소 1개 추출 → 다음 영상에 적용'] },
  { id:35, ch:3, ph:1, icon:'ti-flame', title:'5편 — 슬럼프를 이겨라', sub:'5편에서 그만두는 사람이 99%다. 넌 아니다.', xp:350, diff:'HARD', type:'CONTENT', stats:{ biz:0, con:15, fld:10, rev:0 }, tasks:['4차 현장 출격 + 영상 제작', '5차 현장 출격 + 영상 제작', '"이게 될까?" 의심이 들어도 계속하기', '5편 전체 조회수 + 패턴 분석 정리'] },
  { id:36, ch:3, ph:1, icon:'ti-bolt', title:'10편 — 이제 습관이다', sub:'10편을 만든 사람은 이미 달라져 있다', xp:500, diff:'HARD', type:'CONTENT', stats:{ biz:0, con:22, fld:12, rev:3 }, tasks:['6~10차 현장 출격 + 영상 5편 추가', '편집 포맷 / 인트로 / 자막 스타일 고도화', '구독자 / 팔로워 100명+ 달성', '가장 잘된 영상 분석 → 재현 시도'] },
  { id:37, ch:3, ph:1, icon:'ti-eye', title:'20편 — 진짜 시작이다', sub:'20편, 이제 알고리즘도 당신을 알아가고 있다', xp:700, diff:'HARD', type:'CONTENT', stats:{ biz:3, con:30, fld:15, rev:5 }, tasks:['11~20차 현장 출격 + 영상 10편 추가', '편집 루틴화 → 제작 시간 절반 이하', '조회수 1만 이상 영상 1편 달성', '첫 DM 문의 or 공유/저장 반응 확인'] },
  { id:38, ch:3, ph:1, icon:'ti-trophy', title:'30편 — 포트폴리오 완성', sub:'30편을 만든 사람에게, 오퍼는 반드시 온다', xp:1000, diff:'HARD', type:'CONTENT', stats:{ biz:5, con:40, fld:10, rev:8 }, tasks:['21~30차 현장 출격 + 영상 10편 추가', '조회수 10만 이상 영상 1편 달성', '포트폴리오 채널 링크 + 성과 데이터 정리', '광고주 오퍼 or 협업 문의 첫 건 달성'] },
  { id:22, ch:4, ph:1, icon:'ti-file-certificate', title:'계약서 완성', sub:'법적 보호장치를 만들어라', xp:200, diff:'NORMAL', stats:{ biz:15, con:0, fld:0, rev:5 }, tasks:['표준 계약서 템플릿 완성', '저작권 / 수정횟수 / 납기 조항 파악', '지연 페널티 조항 추가', '첫 계약에 정식 계약서 적용'] },
  { id:3, ch:4, ph:1, icon:'ti-mail-forward', title:'첫 광고주 사냥', sub:'포트폴리오 들고 영업하러 가라', xp:350, diff:'HARD', stats:{ biz:25, con:0, fld:5, rev:5 }, tasks:['타겟 브랜드 20개 리스트업', '포트폴리오 기반 맞춤 제안서 3개 작성', '콜드메일 / DM 10개 발송', '첫 미팅 일정 확보', '미팅 진행', '계약서 서명 완료'] },
  { id:4, ch:4, ph:1, icon:'ti-map-pin', title:'클라이언트 현장 촬영', sub:'계약 후 첫 광고 촬영 출격', xp:400, diff:'NORMAL', type:'FIELD', stats:{ biz:5, con:10, fld:30, rev:5 }, tasks:['광고주 상품 수령 + 수량 확인', '촬영 장소 2곳 섭외 (타겟층 밀집 지역)', '카메라 / 조명 / 마이크 점검', '현장 출발!', '타겟층 10명 이상 만나기', '리액션 영상 확보'] },
  { id:5, ch:4, ph:1, icon:'ti-video', title:'클라이언트 영상 납품', sub:'편집 → 업로드 → 성과 보고', xp:300, diff:'NORMAL', type:'CONTENT', stats:{ biz:0, con:30, fld:5, rev:5 }, tasks:['영상 편집 (2~3분 완성)', '썸네일 제작', '유튜브 업로드 + 태그 최적화', '인스타 릴스 업로드', '광고주에게 성과 리포트 발송'] },
  { id:23, ch:4, ph:1, icon:'ti-mood-sad', title:'첫 위기 극복', sub:'현실은 항상 계획과 다르다', xp:250, diff:'HARD', stats:{ biz:5, con:15, fld:10, rev:0 }, tasks:['조회수 / 반응 부진 원인 분석', '광고주 피드백 수용 + 수정 대응', '다음 영상에 개선점 반영', '포기하지 않고 다음 촬영 일정 확정'] },
  { id:6, ch:5, ph:1, icon:'ti-chart-line', title:'두 번째 계약', sub:'성과 데이터로 단가 올리기', xp:400, diff:'HARD', stats:{ biz:30, con:5, fld:0, rev:15 }, tasks:['첫 영상 성과 데이터 정리', '성과 사례 포함 제안서 업데이트', '두 번째 광고주 미팅', '단가 협상 (첫 계약 +30%)', '계약 체결'] },
  { id:7, ch:5, ph:1, icon:'ti-users-group', title:'팀 빌딩', sub:'혼자서 다 할 수 없다', xp:350, diff:'NORMAL', type:'FIELD', stats:{ biz:15, con:10, fld:15, rev:10 }, tasks:['촬영 파트너 구하기 (지인 or 알바)', '편집자 섭외 또는 아웃소싱 테스트', '역할 분담 + 합의', '2인 팀으로 현장 첫 출격'] },
  { id:8, ch:6, ph:1, icon:'ti-flag', title:'생존 완료', sub:'월 순수익 500만원 달성', xp:700, diff:'BOSS', boss:true, stats:{ biz:30, con:30, fld:30, rev:50 }, tasks:['월 매출 700만원 이상 달성', '정산 후 순수익 500만원 확인', '레귤러 광고주 3개 이상 확보', 'SNS 팔로워 1,000명+', 'Phase 1 클리어!'] },
  { id:9, ch:7, ph:2, icon:'ti-trending-up', title:'단가 2배 올리기', sub:'성과 데이터가 무기다', xp:450, diff:'HARD', stats:{ biz:30, con:0, fld:0, rev:20 }, tasks:['기존 영상 성과 데이터 정리', '단가표 리뉴얼 (기본/스탠다드/프리미엄)', '기존 광고주 단가 인상 제안', '신규 계약 고단가 첫 적용'] },
  { id:10, ch:7, ph:2, icon:'ti-calendar-repeat', title:'월정 계약 3개 확보', sub:'단발에서 구독으로', xp:500, diff:'HARD', stats:{ biz:35, con:5, fld:0, rev:25 }, tasks:['기존 단발 계약 2개를 월정으로 전환', '신규 월정 계약 1개 성사', '월정 납품 스케줄 합의', '월 매출 1,000만원 이상 안착'] },
  { id:24, ch:7, ph:2, icon:'ti-shield-off', title:'거절 극복', sub:'NO는 데이터다', xp:300, diff:'HARD', stats:{ biz:20, con:0, fld:0, rev:5 }, tasks:['단가 인상 후 거절 원인 분석', '거절 피드백 기반 제안 수정', '재제안 or 새 타겟으로 전환', '거절 10회 이상 + 멘탈 유지'] },
  { id:25, ch:8, ph:2, icon:'ti-brand-youtube', title:'SNS 채널 전략 수립', sub:'채널이 자산이 되기 전에', xp:300, diff:'NORMAL', type:'CONTENT', stats:{ biz:5, con:25, fld:0, rev:5 }, tasks:['채널 컨셉 / 톤앤매너 정의', '유튜브/인스타/틱톡 우선순위 결정', '업로드 주기 + 포맷 고정', '경쟁 채널 5개 분석'] },
  { id:13, ch:8, ph:2, icon:'ti-chart-bar', title:'SNS 1만 팔로워 달성', sub:'채널이 자산이 된다', xp:500, diff:'HARD', type:'CONTENT', stats:{ biz:0, con:40, fld:5, rev:10 }, tasks:['유튜브 구독자 5,000명 달성', '인스타 팔로워 5,000명 달성', '월 4편 이상 정기 업로드 루틴화', '첫 바이럴 영상 달성 (10만 뷰+)'] },
  { id:11, ch:9, ph:2, icon:'ti-clipboard-list', title:'제작 SOP 구축', sub:'시스템이 나를 대신 일한다', xp:400, diff:'NORMAL', stats:{ biz:10, con:15, fld:10, rev:5 }, tasks:['촬영 체크리스트 문서화', '편집 가이드 + 템플릿 제작', '브리핑→납품 표준 워크플로 완성', '편집자 / 파트너에게 SOP 공유'] },
  { id:12, ch:9, ph:2, icon:'ti-funnel', title:'영업 파이프라인 자동화', sub:'월 20개 제안서 발송 체계', xp:400, diff:'NORMAL', stats:{ biz:25, con:5, fld:0, rev:10 }, tasks:['CRM 세팅 (노션 or 스프레드시트)', '콜드메일 템플릿 3종 완성', '월 제안서 20개 발송 달성', '팔로업 리마인더 루틴 구축'] },
  { id:26, ch:10, ph:2, icon:'ti-receipt', title:'세금 시스템 구축', sub:'정산 루틴이 곧 사업 건강', xp:300, diff:'NORMAL', type:'MONEY', stats:{ biz:5, con:0, fld:0, rev:20 }, tasks:['부가가치세 첫 신고 경험', '세무사 월 정기 정산 루틴 구축', '매출/비용 월별 손익 작성', '사업 비용 경비처리 체계화'] },
  { id:27, ch:10, ph:2, icon:'ti-pig-money', title:'비용관리 + 절세', sub:'버는 것만큼 남기는 게 실력', xp:350, diff:'HARD', type:'MONEY', stats:{ biz:10, con:0, fld:0, rev:25 }, tasks:['장비 감가상각 처리 파악', '프리랜서 vs 직원 4대보험 비교', '법인 전환 시점 시뮬레이션', '절세 경비 항목 전부 처리'] },
  { id:28, ch:11, ph:2, icon:'ti-alert-triangle', title:'위기 대응', sub:'갈등 + 분쟁 + 미수금 처리', xp:350, diff:'HARD', stats:{ biz:15, con:5, fld:5, rev:10 }, tasks:['팀 갈등 1:1 대화로 해결', '역할 / 기대치 재합의', '광고주 수정 과다 → 계약서 협상', '미수금 발생 시 내용증명 발송'] },
  { id:14, ch:12, ph:2, icon:'ti-rocket', title:'성장 완료', sub:'월 순수익 1,500만원 달성', xp:800, diff:'BOSS', boss:true, stats:{ biz:30, con:30, fld:20, rev:50 }, tasks:['월 매출 2,200만원 이상 달성', '정산 후 순수익 1,500만원 확인', '월정 광고주 5개 이상 유지', '팀원 2명 이상 안정적 운영', 'Phase 2 클리어!'] },
  { id:15, ch:13, ph:3, icon:'ti-building-community', title:'에이전시 브랜드화', sub:'우리만의 인지도를 만든다', xp:500, diff:'HARD', stats:{ biz:25, con:20, fld:5, rev:10 }, tasks:['회사 공식 웹사이트 런칭', '미디어 키트 (Agency Deck) 제작', '포트폴리오 케이스스터디 3개 완성', '업계 SNS에서 브랜드 인지도 확보'] },
  { id:16, ch:13, ph:3, icon:'ti-share', title:'레퍼럴 시스템 구축', sub:'소개가 영업이 된다', xp:450, diff:'NORMAL', stats:{ biz:30, con:0, fld:10, rev:20 }, tasks:['기존 광고주에게 소개 인센티브 제안', '레퍼럴로 첫 신규 계약 성사', '파트너 에이전시와 협업 계약', '인바운드 문의 월 3건 이상 달성'] },
  { id:29, ch:13, ph:3, icon:'ti-home-2', title:'법인 전환', sub:'세금 구조를 리셋하라', xp:400, diff:'HARD', type:'MONEY', stats:{ biz:10, con:0, fld:0, rev:30 }, tasks:['법인 전환 시점 세무사 확정 상담', '법인 설립 등기 진행', '법인 계좌 + 법인카드 발급', '대표 급여 설정 + 법인세 구조 파악'] },
  { id:17, ch:14, ph:3, icon:'ti-device-tv', title:'채널 자체 수익화', sub:'콘텐츠가 돈을 벌기 시작한다', xp:600, diff:'HARD', type:'CONTENT', stats:{ biz:0, con:50, fld:5, rev:30 }, tasks:['유튜브 채널 수익화 달성', '채널 광고 수익 월 100만원+', '팔로워 기반 스폰서십 수주', '콘텐츠 수익 + 광고 수익 이원화 완성'] },
  { id:18, ch:14, ph:3, icon:'ti-diamond', title:'대형 계약 달성', sub:'편당 700만원+ 클라이언트', xp:650, diff:'HARD', stats:{ biz:40, con:0, fld:10, rev:40 }, tasks:['중견기업 고단가 계약 제안 (700만원+)', '미팅 + 단가 협상', '계약 체결 + 선금 입금 확인', '첫 대형 클라이언트 납품 완료'] },
  { id:30, ch:14, ph:3, icon:'ti-school', title:'강의 / 컨설팅 수익화', sub:'경험을 상품으로 팔아라', xp:450, diff:'HARD', type:'CONTENT', stats:{ biz:10, con:25, fld:0, rev:20 }, tasks:['마케팅 노하우 콘텐츠화', '첫 유료 강의 or 컨설팅 개설', '유료 상담 클라이언트 3명 확보', '이 분야 첫 달 수익 100만원+'] },
  { id:31, ch:15, ph:3, icon:'ti-calculator', title:'세금 고도화', sub:'대표님 돈은 회사 돈이 아니다', xp:400, diff:'HARD', type:'MONEY', stats:{ biz:10, con:0, fld:0, rev:40 }, tasks:['법인세 절감 전략 수립', '대표 급여 최적화 (급여 vs 배당)', '퇴직금 적립 구조 설계', '개인 자산 vs 법인 자산 분리'] },
  { id:32, ch:15, ph:3, icon:'ti-user-plus', title:'직원 채용', sub:'첫 정직원을 맞이하라', xp:400, diff:'HARD', type:'FIELD', stats:{ biz:20, con:0, fld:10, rev:15 }, tasks:['채용 공고 작성 + 플랫폼 게시', '서류 심사 + 면접 진행', '첫 정직원 계약 서명', '4대보험 등록 + 첫 급여 이체'] },
  { id:19, ch:16, ph:3, icon:'ti-crown', title:'마케팅 회사 성공!', sub:'월 순수익 3,000만원 달성', xp:1500, diff:'BOSS', boss:true, stats:{ biz:50, con:50, fld:50, rev:100 }, tasks:['월 매출 4,500만원 이상 달성', '인건비 + 세금 + 운영비 정산', '순수익 3,000만원 통장 확인', '팀 전체와 성공 축하', '전설이 되었다 ★'] },
]

const TOT = Q.reduce((s, q) => s + q.xp, 0)
const MAXST = { biz:533, con:532, fld:305, rev:616 }
const MILESTONE: Record<number, number> = { 33:1, 34:3, 35:5, 36:10, 37:20, 38:30 }
const DIFF_STYLE = {
  EASY:   { bg:'#C0DD97', tc:'#27500A' },
  NORMAL: { bg:'#B5D4F4', tc:'#0C447C' },
  HARD:   { bg:'#E0E0E0', tc:'#474747' },
  BOSS:   { bg:'#FAC775', tc:'#633806' },
}
const TYPE_STYLE = {
  FIELD:   { bg:'#F5C4B3', tc:'#712B13', lb:'FIELD' },
  CONTENT: { bg:'#F4C0D1', tc:'#72243E', lb:'CONTENT' },
  MONEY:   { bg:'#D3D1C7', tc:'#444441', lb:'MONEY' },
}
const LV: Level[] = [
  { l:1,  t:'예비 창업가',          min:0     },
  { l:2,  t:'거리의 신입 마케터',   min:600   },
  { l:3,  t:'콘텐츠 크리에이터',    min:1500  },
  { l:4,  t:'영상 마케팅 대표',     min:2500  },
  { l:5,  t:'인플루언서 마케터',    min:3800  },
  { l:6,  t:'초보 에이전시 대표',   min:5300  },
  { l:7,  t:'Phase 1 클리어! ★',   min:6750  },
  { l:8,  t:'프로 마케터',          min:7900  },
  { l:9,  t:'시스템 빌더',          min:9000  },
  { l:10, t:'채널 파워 대표',       min:10100 },
  { l:11, t:'SNS 마스터',           min:10800 },
  { l:12, t:'Phase 2 클리어! ★★',  min:11400 },
  { l:13, t:'브랜드 빌더',          min:12700 },
  { l:14, t:'수익 다각화 사업가',   min:14200 },
  { l:15, t:'마케팅 사업가',        min:15600 },
  { l:16, t:'마케팅의 전설 ★★★',  min:TOT   },
]

function calcXP(ck: Record<string, boolean>) {
  return Math.round(Q.reduce((s, q) => s + q.tasks.reduce((ts, _, i) => ts + (ck[`${q.id}_${i}`] ? q.xp / q.tasks.length : 0), 0), 0))
}
function calcStats(ck: Record<string, boolean>) {
  const s = { biz:0, con:0, fld:0, rev:0 }
  Q.forEach(q => q.tasks.forEach((_, i) => {
    if (ck[`${q.id}_${i}`]) {
      const f = 1 / q.tasks.length
      s.biz += q.stats.biz * f; s.con += q.stats.con * f
      s.fld += q.stats.fld * f; s.rev += q.stats.rev * f
    }
  }))
  return s
}
function getLevel(xp: number) {
  let lv = LV[0]
  for (const l of LV) if (xp >= l.min) lv = l
  return lv
}
function questDone(id: number, ck: Record<string, boolean>) {
  const q = Q.find(x => x.id === id)
  return q ? q.tasks.every((_, i) => ck[`${id}_${i}`]) : false
}
function questStarted(id: number, ck: Record<string, boolean>) {
  const q = Q.find(x => x.id === id)
  return q ? q.tasks.some((_, i) => ck[`${id}_${i}`]) : false
}
function phXP(pid: number) { return Q.filter(q => q.ph === pid).reduce((s, q) => s + q.xp, 0) }
function phCXP(pid: number, ck: Record<string, boolean>) {
  return Math.round(Q.filter(q => q.ph === pid).reduce((s, q) => s + q.tasks.reduce((ts, _, i) => ts + (ck[`${q.id}_${i}`] ? q.xp / q.tasks.length : 0), 0), 0))
}

function Bar({ val, max, col }: { val:number; max:number; col:string }) {
  return (
    <div style={{ background:'#EBEBEF', borderRadius:'99px', height:'5px', flex:1, overflow:'hidden', border:'0.5px solid #E0E0E4' }}>
      <div style={{ background:col, height:'100%', width:`${Math.min(100, Math.round(val/max*100))}%`, borderRadius:'99px', transition:'width 0.4s' }} />
    </div>
  )
}

function QuestCard({ q, ck, ex, toggle, toggleEx }: {
  q: Quest; ck: Record<string,boolean>; ex: boolean
  toggle: (id:number, ti:number)=>void; toggleEx: (id:number)=>void
}) {
  const done    = questDone(q.id, ck)
  const started = questStarted(q.id, ck)
  const checkedN = q.tasks.filter((_, i) => ck[`${q.id}_${i}`]).length
  const pct     = Math.round(checkedN / q.tasks.length * 100)
  const ds      = DIFF_STYLE[q.diff]
  const ts      = q.type ? TYPE_STYLE[q.type] : null
  const isMile  = MILESTONE[q.id] !== undefined
  const bc  = done ? '#9FE1CB' : q.boss ? '#FAC775' : isMile ? '#DCDCDC' : '#E5E5E9'
  const bg  = done ? '#E1F5EE' : q.boss ? '#FAEEDA' : isMile ? '#FAFAFA' : '#FFFFFF'
  const ic  = done ? '#0F6E56' : q.boss ? '#854F0B' : '#1A1A1A'
  const ib  = done ? '#9FE1CB' : q.boss ? '#FAC775' : '#F5F5F5'
  const cc  = done ? '#1D9E75' : q.boss ? '#EF9F27' : '#1A1A1A'
  return (
    <div style={{ background:bg, border:`0.5px solid ${bc}`, borderRadius:'12px', overflow:'hidden' }}>
      <div onClick={() => toggleEx(q.id)} style={{ padding:'1rem 1.25rem', cursor:'pointer', userSelect:'none' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ width:'36px', height:'36px', borderRadius:'8px', background:ib, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <i className={`ti ${done ? 'ti-check' : q.icon}`} style={{ fontSize:'18px', color:ic }} aria-hidden />
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:'5px', flexWrap:'wrap', marginBottom:'2px' }}>
              <span style={{ fontSize:'14px', fontWeight:500, color:'#1A1A1A' }}>{q.title}</span>
              <span style={{ fontSize:'10px', padding:'2px 6px', borderRadius:'4px', background:ds.bg, color:ds.tc, fontWeight:500 }}>{q.diff}</span>
              {ts && <span style={{ fontSize:'10px', padding:'2px 6px', borderRadius:'4px', background:ts.bg, color:ts.tc, fontWeight:500 }}>{ts.lb}</span>}
              {done && <span style={{ fontSize:'10px', padding:'2px 6px', borderRadius:'4px', background:'#9FE1CB', color:'#085041', fontWeight:500 }}>완료</span>}
            </div>
            <span style={{ fontSize:'12px', color:'#888', fontStyle: isMile ? 'italic' : 'normal' }}>{q.sub}</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'3px', flexShrink:0 }}>
            <span style={{ fontSize:'12px', fontWeight:500, color: q.boss ? '#854F0B' : '#1A1A1A' }}>+{q.xp} XP</span>
            <i className={`ti ${ex ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ fontSize:'15px', color:'#999' }} aria-hidden />
          </div>
        </div>
        {started && !done && (
          <div style={{ marginTop:'10px', background:'#EBEBEF', borderRadius:'99px', height:'4px', overflow:'hidden', border:`0.5px solid ${bc}` }}>
            <div style={{ background: q.boss ? '#EF9F27' : '#1A1A1A', height:'100%', width:`${pct}%`, borderRadius:'99px', transition:'width 0.4s' }} />
          </div>
        )}
      </div>
      {ex && (
        <div style={{ padding:'0.5rem 1.25rem 1rem', borderTop:`0.5px solid ${bc}` }}>
          {q.tasks.map((task, ti) => {
            const on = !!ck[`${q.id}_${ti}`]
            return (
              <div key={ti} onClick={() => toggle(q.id, ti)}
                style={{ display:'flex', alignItems:'center', gap:'10px', padding:'7px 0', borderBottom: ti < q.tasks.length-1 ? '0.5px solid #EBEBEF' : 'none', cursor:'pointer' }}>
                <div style={{ width:'18px', height:'18px', borderRadius:'4px', border:`1.5px solid ${on ? cc : '#BEBEC8'}`, background: on ? cc : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s' }}>
                  {on && <i className="ti ti-check" style={{ fontSize:'11px', color:'white' }} aria-hidden />}
                </div>
                <span style={{ fontSize:'13px', color: on ? '#AAAAAA' : '#1A1A1A', textDecoration: on ? 'line-through' : 'none', transition:'all 0.15s' }}>{task}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function MarketingRPGClient() {
  const router = useRouter()
  const [ck, setCk] = useState<Record<string, boolean>>({})
  const [ex, setEx] = useState<Record<string, boolean>>({})
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.email !== ADMIN_EMAIL) {
        router.push('/')
        return
      }
      try {
        const saved = localStorage.getItem('mj-marketing-rpg')
        if (saved) setCk(JSON.parse(saved))
      } catch {}
      setMounted(true)
    }
    init()
  }, [router])

  useEffect(() => {
    if (!mounted) return
    try { localStorage.setItem('mj-marketing-rpg', JSON.stringify(ck)) } catch {}
  }, [ck, mounted])

  const toggle   = useCallback((id:number, ti:number) => setCk(p => ({ ...p, [`${id}_${ti}`]: !p[`${id}_${ti}`] })), [])
  const toggleEx = useCallback((id:number) => setEx(p => ({ ...p, [id]: !p[id] })), [])

  const xp  = calcXP(ck)
  const st  = calcStats(ck)
  const lv  = getLevel(xp)
  const nx  = LV.find(l => l.min > xp) || lv
  const xpp = nx === lv ? 100 : Math.round((xp - lv.min) / (nx.min - lv.min) * 100)
  const dc  = Q.filter(q => questDone(q.id, ck)).length
  const milestoneIds    = [33, 34, 35, 36, 37, 38]
  const lastDone        = milestoneIds.filter(id => questDone(id, ck))
  const currentEpisodes = lastDone.length > 0 ? MILESTONE[lastDone[lastDone.length-1]] : 0
  const nextTarget      = [1, 3, 5, 10, 20, 30].find(n => n > currentEpisodes) ?? 30

  if (!mounted) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', color:'#888', fontSize:'14px' }}>
      로딩 중...
    </div>
  )

  return (
    <div style={{ minHeight:'100dvh', background:'#FAF9F7', fontFamily:'Pretendard, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      <ServiceHeader />
      <div style={{ maxWidth:'600px', margin:'0 auto', padding:'32px 24px 80px' }}>

        {/* 헤더 */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem' }}>
          <div>
            <h1 style={{ fontSize:'18px', fontWeight:500, color:'#1A1A1A', margin:0 }}>창업 RPG</h1>
            <p style={{ fontSize:'12px', color:'#888', margin:0, marginTop:'2px' }}>마케팅 회사 — 월 순수익 3,000만원까지</p>
          </div>
          <span style={{ fontSize:'11px', padding:'4px 10px', borderRadius:'99px', background:'#F5F5F5', color:'#474747', fontWeight:500, border:'0.5px solid #DCDCDC' }}>관리자 전용</span>
        </div>

        {/* 플레이어 카드 */}
        <div style={{ background:'#fff', border:'0.5px solid #E5E5E9', borderRadius:'12px', padding:'1.25rem', marginBottom:'1.25rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'14px' }}>
            <div style={{ width:'52px', height:'52px', borderRadius:'12px', background:'#F5F5F5', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <span style={{ fontSize:'10px', color:'#888', fontWeight:500, lineHeight:'1.2' }}>LV</span>
              <span style={{ fontSize:'22px', color:'#1A1A1A', fontWeight:500, lineHeight:'1.1' }}>{lv.l}</span>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:'6px' }}>
                <span style={{ fontSize:'15px', fontWeight:500, color:'#1A1A1A' }}>{lv.t}</span>
                <span style={{ fontSize:'12px', color:'#999' }}>{xp} / {nx === lv ? TOT : nx.min} XP</span>
              </div>
              <div style={{ background:'#EBEBEF', borderRadius:'99px', height:'8px', overflow:'hidden', border:'0.5px solid #E0E0E4' }}>
                <div style={{ background:'#1A1A1A', height:'100%', width:`${xpp}%`, borderRadius:'99px', transition:'width 0.5s' }} />
              </div>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
            {[
              { label:'영업력',   icon:'ti-briefcase',   val:st.biz, max:MAXST.biz, col:'#1A1A1A', tc:'#474747' },
              { label:'콘텐츠력', icon:'ti-movie',        val:st.con, max:MAXST.con, col:'#D4537E', tc:'#993556' },
              { label:'현장력',   icon:'ti-map-pin',      val:st.fld, max:MAXST.fld, col:'#D85A30', tc:'#993C1D' },
              { label:'수익력',   icon:'ti-currency-won', val:st.rev, max:MAXST.rev, col:'#639922', tc:'#3B6D11' },
            ].map(s => (
              <div key={s.label}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'5px' }}>
                  <span style={{ fontSize:'11px', color:'#888', display:'flex', alignItems:'center', gap:'3px' }}>
                    <i className={`ti ${s.icon}`} style={{ fontSize:'12px' }} aria-hidden /> {s.label}
                  </span>
                  <span style={{ fontSize:'11px', color:s.tc }}>{Math.round(s.val/s.max*100)}%</span>
                </div>
                <Bar val={s.val} max={s.max} col={s.col} />
              </div>
            ))}
          </div>
          {currentEpisodes > 0 && (
            <div style={{ marginTop:'12px', padding:'10px 14px', background:'#F5F5F5', borderRadius:'8px', border:'0.5px solid #DCDCDC', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontSize:'12px', color:'#474747', fontWeight:500 }}>제작 완료</span>
              <span style={{ fontSize:'20px', fontWeight:500, color:'#1A1A1A' }}>{currentEpisodes}편</span>
              <span style={{ fontSize:'12px', color:'#888' }}>
                {currentEpisodes < 30 ? `→ 다음 목표 ${nextTarget}편` : '포트폴리오 완성!'}
              </span>
            </div>
          )}
        </div>

        {/* 요약 */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px', padding:'0 2px' }}>
          <span style={{ fontSize:'13px', color:'#888' }}>퀘스트 {dc} / {Q.length} 완료</span>
          <span style={{ fontSize:'13px', fontWeight:500, color:'#1A1A1A' }}>{Math.round(xp/TOT*100)}% 달성</span>
        </div>

        {/* Phase 섹션 */}
        {PH.map(ph => {
          const pxp  = phXP(ph.id)
          const cxp  = phCXP(ph.id, ck)
          const ppct = Math.round(cxp / pxp * 100)
          const phDone = ppct >= 100
          return (
            <div key={ph.id} style={{ marginBottom:'1.5rem' }}>
              <div style={{ background:ph.bg, border:`0.5px solid ${ph.bdr}`, borderRadius:'12px', padding:'18px 20px', marginBottom:'10px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
                  <div>
                    <span style={{ fontSize:'11px', fontWeight:500, color:ph.col }}>{ph.title}</span>
                    <span style={{ fontSize:'13px', fontWeight:500, color:'#1A1A1A', marginLeft:'6px' }}>{ph.name}</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    {phDone
                      ? <span style={{ fontSize:'10px', padding:'2px 8px', borderRadius:'99px', background:'#FFD700', color:'#1A1A1A', fontWeight:500 }}>완료</span>
                      : <span style={{ fontSize:'12px', fontWeight:500, color:ph.col }}>{ppct}%</span>}
                    <span style={{ fontSize:'12px', color:'#999' }}>{ph.target}</span>
                  </div>
                </div>
                <div style={{ background:'rgba(255,255,255,0.2)', borderRadius:'99px', height:'5px', overflow:'hidden' }}>
                  <div style={{ background:ph.col, height:'100%', width:`${ppct}%`, borderRadius:'99px', transition:'width 0.5s' }} />
                </div>
              </div>
              {CH.filter(c => c.ph === ph.id).map(ch => {
                const cq = Q.filter(q => q.ch === ch.id)
                if (cq.length === 0) return null
                const cd = cq.filter(q => questDone(q.id, ck)).length
                return (
                  <div key={ch.id} style={{ marginBottom:'10px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
                      <div style={{ height:'1px', background:'#E5E5E9', width:'16px' }} />
                      <span style={{ fontSize:'11px', fontWeight:500, color:'#888', whiteSpace:'nowrap' }}>{ch.num} · {ch.name}</span>
                      {cd === cq.length && <span style={{ fontSize:'10px', padding:'1px 6px', borderRadius:'4px', background:'#C0DD97', color:'#27500A', fontWeight:500 }}>완료</span>}
                      <div style={{ height:'1px', background:'#E5E5E9', flex:1 }} />
                      <span style={{ fontSize:'11px', color:'#888' }}>{cd}/{cq.length}</span>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                      {cq.map(q => (
                        <QuestCard key={q.id} q={q} ck={ck} ex={!!ex[q.id]} toggle={toggle} toggleEx={toggleEx} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}