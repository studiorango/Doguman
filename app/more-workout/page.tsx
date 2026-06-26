'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase'

// ─── 3분할 루틴 데이터 ──────────────────────────────────────────────────────────

type Exercise = { name: string; tag?: string; scheme: string }
type Day = { id: 'd1' | 'd2' | 'd3'; label: string; title: string; target: string; exercises: Exercise[] }

const DAYS: Day[] = [
  {
    id: 'd1',
    label: 'D1',
    title: 'Push · 밀기',
    target: '가슴 · 어깨 · 삼두',
    exercises: [
      { name: '바벨 벤치프레스', scheme: '4 × 6–8' },
      { name: '인클라인 바벨 프레스', tag: '벤치', scheme: '3 × 8–10' },
      { name: '바벨 오버헤드 프레스', scheme: '4 × 6–8' },
      { name: '딥스', tag: '맨몸', scheme: '3 × 최대' },
      { name: '클로즈그립 벤치프레스', scheme: '3 × 10' },
      { name: '푸시업', tag: '마무리', scheme: '2 × 최대' },
    ],
  },
  {
    id: 'd2',
    label: 'D2',
    title: 'Pull · 당기기',
    target: '등 · 이두',
    exercises: [
      { name: '턱걸이', tag: '풀업', scheme: '4 × 최대' },
      { name: '바벨 로우', scheme: '4 × 8' },
      { name: '랫풀다운', scheme: '3 × 10–12' },
      { name: '케이블 시티드 로우', scheme: '3 × 12' },
      { name: '바벨 컬', scheme: '3 × 10' },
      { name: '페이스풀', tag: '케이블', scheme: '3 × 15' },
    ],
  },
  {
    id: 'd3',
    label: 'D3',
    title: 'Legs · 하체',
    target: '하체 · 코어',
    exercises: [
      { name: '바벨 백스쿼트', scheme: '4 × 6–8' },
      { name: '루마니안 데드리프트', scheme: '4 × 8–10' },
      { name: '바벨 워킹 런지', scheme: '3 × 12' },
      { name: '불가리안 스플릿 스쿼트', tag: '벤치', scheme: '3 × 10' },
      { name: '바벨 카프레이즈', scheme: '4 × 15' },
      { name: '행잉 레그레이즈', tag: '턱걸이바', scheme: '3 × 15' },
    ],
  },
]

// 스킴 "4 × 6–8" → 세트 수 4, 목표 횟수 "6–8"
function parseScheme(scheme: string) {
  const [setsRaw, repsRaw] = scheme.split('×')
  return { sets: parseInt(setsRaw.trim()) || 3, repsHint: (repsRaw ?? '').trim() }
}

// ─── 기록 상태 타입 ──────────────────────────────────────────────────────────────

type SetRecord = { weight: number | null; reps: number | null; done: boolean }
const EMPTY_SET: SetRecord = { weight: null, reps: null, done: false }
const recKey = (day: string, ex: string, i: number) => `${day}|${ex}|${i}`

function fmtDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function todayStr() {
  return fmtDate(new Date())
}
function addDays(d: Date, n: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

// ─── 페이지 ────────────────────────────────────────────────────────────────────

export default function WorkoutPage() {
  const [logDate, setLogDate] = useState(todayStr())
  const [activeDay, setActiveDay] = useState<'d1' | 'd2' | 'd3'>('d1')
  const [records, setRecords] = useState<Record<string, SetRecord>>({})
  const recordsRef = useRef<Record<string, SetRecord>>({}) // 동기 병합용 최신 스냅샷
  const [activity, setActivity] = useState<Record<string, number>>({}) // 날짜 → 완료 세트 수 (히트맵)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')

  // 전체 운동 활동량 로드 (히트맵용)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('workout_sets')
        .select('log_date')
        .eq('done', true)
      if (cancelled || error) return
      const counts: Record<string, number> = {}
      for (const r of data ?? []) counts[r.log_date] = (counts[r.log_date] ?? 0) + 1
      setActivity(counts)
    })()
    return () => { cancelled = true }
  }, [])

  // 날짜 바뀌면 해당 날짜 기록 전체 로드
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('workout_sets')
          .select('day_id, exercise_name, set_index, weight, reps, done')
          .eq('log_date', logDate)
        if (cancelled) return
        if (error) { console.error('불러오기 실패:', error.message); setToast('불러오기 실패'); }
        const next: Record<string, SetRecord> = {}
        for (const r of data ?? []) {
          next[recKey(r.day_id, r.exercise_name, r.set_index)] = {
            weight: r.weight, reps: r.reps, done: r.done,
          }
        }
        recordsRef.current = next
        setRecords(next)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [logDate])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(''), 1400)
  }, [])

  // 단일 세트 upsert
  const saveSet = useCallback(async (day: string, ex: string, i: number, patch: Partial<SetRecord>) => {
    const key = recKey(day, ex, i)
    // ref에서 최신 값을 동기적으로 병합 — 무게·횟수·완료 연속 저장 시 서로 덮어쓰지 않도록
    const merged: SetRecord = { ...EMPTY_SET, ...recordsRef.current[key], ...patch }
    recordsRef.current = { ...recordsRef.current, [key]: merged }
    setRecords(recordsRef.current)
    // 완료 상태가 바뀌면 히트맵의 해당 날짜 카운트도 즉시 갱신
    if (patch.done !== undefined) {
      const count = Object.values(recordsRef.current).filter(r => r.done).length
      setActivity(prev => ({ ...prev, [logDate]: count }))
    }
    try {
      const supabase = createClient()
      const { error } = await supabase.from('workout_sets').upsert(
        { log_date: logDate, day_id: day, exercise_name: ex, set_index: i, ...merged },
        { onConflict: 'log_date,day_id,exercise_name,set_index' },
      )
      if (error) { console.error('저장 실패:', error.message); showToast('저장 실패') }
      else if (patch.done !== undefined) showToast(patch.done ? '완료' : '해제')
    } catch (e) {
      console.error(e); showToast('저장 실패')
    }
  }, [logDate, showToast])

  // 분할별 완료 세트 수
  function dayDoneCount(day: Day) {
    let done = 0, total = 0
    for (const ex of day.exercises) {
      const { sets } = parseScheme(ex.scheme)
      total += sets
      for (let i = 0; i < sets; i++) if (records[recKey(day.id, ex.name, i)]?.done) done++
    }
    return { done, total }
  }

  const current = DAYS.find(d => d.id === activeDay)!

  return (
    <div className="min-h-[100dvh] bg-[#FAFAFA]">
      {/* Sticky 헤더 */}
      <header className="bg-white/80 backdrop-blur-[12px] border-b border-[#E6E6E6] h-14 sticky top-0 z-50 flex items-center px-5">
        <div className="max-w-[720px] mx-auto w-full flex items-center justify-between">
          <h1 className="text-[15px] font-bold text-[#222222] tracking-tight break-keep">3분할 운동 루틴</h1>
          <input
            type="date"
            value={logDate}
            onChange={e => setLogDate(e.target.value)}
            className="text-[12px] font-semibold text-[#5C5C5C] bg-[#F5F5F5] rounded-[8px] px-2.5 py-1.5 border border-[#E6E6E6] focus:outline-none focus:border-[#222222]"
          />
        </div>
      </header>

      <main className="max-w-[720px] mx-auto px-5 pb-24 pt-5">
        {/* 운동 기록 히트맵 */}
        <Heatmap activity={activity} selected={logDate} onSelect={setLogDate} />

        {/* 분할 선택 — 정사각형 카드 3장 */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {DAYS.map(day => {
            const { done, total } = dayDoneCount(day)
            const isActive = activeDay === day.id
            return (
              <button
                key={day.id}
                type="button"
                onClick={() => setActiveDay(day.id)}
                className={`aspect-square flex flex-col justify-between p-3 rounded-[14px] border-2 text-left transition-all duration-150 active:scale-[0.98]
                  ${isActive
                    ? 'bg-[#222222] border-[#222222] shadow-[0_4px_12px_rgba(0,0,0,0.12)]'
                    : 'bg-white border-[#E6E6E6] hover:border-[#999999]'}`}
              >
                <span className={`text-[11px] font-bold ${isActive ? 'text-white/60' : 'text-[#BBBBBB]'}`}>{day.label}</span>
                <span className={`text-[13px] font-bold leading-tight break-keep ${isActive ? 'text-white' : 'text-[#222222]'}`}>
                  {day.title}
                </span>
                <span className={`text-[11px] font-semibold tabular-nums ${isActive ? 'text-white/70' : 'text-[#8B8B8B]'}`}>
                  {done}/{total} 세트
                </span>
              </button>
            )
          })}
        </div>

        {/* 선택한 분할 정보 */}
        <div className="flex items-baseline justify-between mb-3">
          <p className="text-[15px] font-bold text-[#222222] break-keep">{current.title}</p>
          <p className="text-[12px] text-[#8B8B8B]">{current.target}</p>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-[120px] rounded-[14px] bg-[#F5F7FA] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {current.exercises.map(ex => {
              const { sets, repsHint } = parseScheme(ex.scheme)
              return (
                <section key={ex.name} className="bg-white rounded-[14px] border border-[#E6E6E6] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4">
                  {/* 운동 헤더 */}
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[14px] font-bold text-[#222222] break-keep">
                      {ex.name}
                      {ex.tag && <span className="text-[11px] text-[#BBBBBB] ml-1.5 font-medium">{ex.tag}</span>}
                    </p>
                    <span className="text-[11px] font-semibold text-[#8B8B8B] tabular-nums">목표 {ex.scheme}</span>
                  </div>

                  {/* 세트 입력 행 */}
                  <div className="flex flex-col gap-2">
                    {Array.from({ length: sets }).map((_, i) => {
                      const rec = records[recKey(activeDay, ex.name, i)]
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-9 text-[11px] font-bold text-[#BBBBBB] tabular-nums">SET {i + 1}</span>
                          <div className="flex-1 flex items-center gap-2">
                            <NumField
                              placeholder="kg"
                              value={rec?.weight}
                              onCommit={v => saveSet(activeDay, ex.name, i, { weight: v })}
                            />
                            <span className="text-[#DCDCDC] text-xs">×</span>
                            <NumField
                              placeholder={repsHint === '최대' ? '최대' : repsHint || '회'}
                              value={rec?.reps}
                              onCommit={v => saveSet(activeDay, ex.name, i, { reps: v })}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => saveSet(activeDay, ex.name, i, { done: !rec?.done })}
                            aria-label={`SET ${i + 1} 완료 토글`}
                            className={`w-7 h-7 rounded-[8px] border-2 flex items-center justify-center flex-shrink-0 transition-all duration-150
                              ${rec?.done ? 'bg-[#222222] border-[#222222]' : 'border-[#DCDCDC] hover:border-[#999999]'}`}
                          >
                            {rec?.done && (
                              <svg width="11" height="9" viewBox="0 0 10 8" fill="none">
                                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )
            })}
          </div>
        )}

        {/* 운영 팁 */}
        <div className="flex flex-wrap gap-2 mt-6">
          {['세트 사이 휴식 90–120초', '복합운동 먼저, 머신·맨몸 나중', '맨몸 운동은 무게 칸 비워두세요'].map(tip => (
            <span key={tip} className="text-[11px] text-[#8B8B8B] px-3 py-1.5 rounded-full border border-[#E6E6E6] bg-white break-keep">
              {tip}
            </span>
          ))}
        </div>
      </main>

      {/* Snackbar */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#222222] text-white text-sm font-medium px-5 py-3 rounded-[12px] shadow-[0_4px_16px_rgba(0,0,0,0.16)]">
          {toast}
        </div>
      )}
    </div>
  )
}

// ─── 운동 기록 히트맵 (GitHub 잔디 스타일, 모노톤) ──────────────────────────────

const HEAT_WEEKS = 20
const HEAT_LEVELS = ['#ECECEC', '#D2D2D2', '#9E9E9E', '#5C5C5C', '#222222'] // 적음 → 많음

function heatLevel(count: number) {
  if (!count) return 0
  if (count <= 5) return 1
  if (count <= 10) return 2
  if (count <= 15) return 3
  return 4
}

function Heatmap({ activity, selected, onSelect }: {
  activity: Record<string, number>
  selected: string
  onSelect: (date: string) => void
}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayKey = fmtDate(today)
  // 현재 주의 일요일에서 (HEAT_WEEKS-1)주 전 일요일이 그리드 시작점
  const firstSunday = addDays(addDays(today, -today.getDay()), -(HEAT_WEEKS - 1) * 7)

  // 주(컬럼) × 요일(행) 매트릭스
  const weeks: { date: Date; key: string }[][] = []
  for (let w = 0; w < HEAT_WEEKS; w++) {
    const days: { date: Date; key: string }[] = []
    for (let d = 0; d < 7; d++) {
      const date = addDays(firstSunday, w * 7 + d)
      days.push({ date, key: fmtDate(date) })
    }
    weeks.push(days)
  }

  // 월 라벨: 주의 첫날 기준 월이 바뀌면 표기
  const monthLabels = weeks.map((week, i) => {
    const m = week[0].date.getMonth()
    const prevM = i > 0 ? weeks[i - 1][0].date.getMonth() : -1
    return m !== prevM ? `${m + 1}월` : ''
  })

  const activeDays = weeks.flat().filter(c => c.key <= todayKey && (activity[c.key] ?? 0) > 0).length

  return (
    <section className="bg-white rounded-[14px] border border-[#E6E6E6] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 mb-6">
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-[13px] font-bold text-[#222222]">운동 기록</p>
        <p className="text-[11px] text-[#8B8B8B]">
          최근 {HEAT_WEEKS}주 · <span className="text-[#222222] font-semibold tabular-nums">{activeDays}일</span> 운동
        </p>
      </div>

      <div className="overflow-x-auto -mx-1 px-1">
        <div className="inline-block">
          {/* 월 라벨 */}
          <div className="grid gap-[3px] mb-1" style={{ gridTemplateColumns: `repeat(${HEAT_WEEKS}, 11px)` }}>
            {monthLabels.map((label, i) => (
              <span key={i} className="text-[9px] text-[#BBBBBB] h-3 leading-none whitespace-nowrap">{label}</span>
            ))}
          </div>
          {/* 셀 그리드 (컬럼=주, 행=요일) */}
          <div className="grid grid-flow-col gap-[3px]" style={{ gridTemplateRows: 'repeat(7, 11px)', gridAutoColumns: '11px' }}>
            {weeks.map(week =>
              week.map(({ key }) => {
                const isFuture = key > todayKey
                const count = activity[key] ?? 0
                const isSel = key === selected
                const isToday = key === todayKey
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={isFuture}
                    onClick={() => onSelect(key)}
                    title={isFuture ? '' : `${key} · ${count}세트`}
                    aria-label={`${key} ${count}세트`}
                    className="w-[11px] h-[11px] rounded-[2px] p-0 border-0 transition-all duration-100"
                    style={{
                      backgroundColor: isFuture ? 'transparent' : HEAT_LEVELS[heatLevel(count)],
                      boxShadow: isSel ? '0 0 0 1.5px #222222' : isToday ? '0 0 0 1.5px #BBBBBB' : 'none',
                      cursor: isFuture ? 'default' : 'pointer',
                    }}
                  />
                )
              }),
            )}
          </div>
        </div>
      </div>

      {/* 범례 */}
      <div className="flex items-center justify-end gap-1.5 mt-2.5">
        <span className="text-[9px] text-[#BBBBBB]">적음</span>
        {HEAT_LEVELS.map((c, i) => (
          <span key={i} className="w-[11px] h-[11px] rounded-[2px]" style={{ backgroundColor: c }} />
        ))}
        <span className="text-[9px] text-[#BBBBBB]">많음</span>
      </div>
    </section>
  )
}

// ─── 숫자 입력 필드 (blur 시 커밋) ───────────────────────────────────────────────

function NumField({ value, placeholder, onCommit }: {
  value: number | null | undefined
  placeholder: string
  onCommit: (v: number | null) => void
}) {
  const [text, setText] = useState(value != null ? String(value) : '')

  // 외부 값(로드/날짜 변경) 동기화
  useEffect(() => { setText(value != null ? String(value) : '') }, [value])

  // blur 시점의 DOM 값을 직접 읽음 — setText 비동기 지연과 무관하게 항상 정확한 값 커밋
  function commit(raw: string) {
    const trimmed = raw.trim()
    const num = trimmed === '' ? null : Number(trimmed)
    onCommit(num != null && Number.isFinite(num) ? num : null)
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      value={text}
      placeholder={placeholder}
      onChange={e => setText(e.target.value.replace(/[^\d.]/g, ''))}
      onBlur={e => commit(e.target.value)}
      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
      className="w-full min-w-0 bg-[#F5F5F5] border border-[#E6E6E6] rounded-[10px] px-3 py-2 text-[13px] text-center
                 text-[#222222] placeholder:text-[#BBBBBB] tabular-nums
                 focus:outline-none focus:bg-white focus:border-[#222222] transition-colors"
    />
  )
}
