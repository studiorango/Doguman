-- 3분할 운동 기록: 날짜·분할·운동·세트별 무게/횟수 로그
-- Supabase SQL 에디터에서 실행하세요.

create table if not exists public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  log_date date not null default current_date,           -- 운동 날짜
  day_id text not null check (day_id in ('d1', 'd2', 'd3')), -- Push/Pull/Legs
  exercise_name text not null,                            -- 운동 이름
  set_index int not null,                                 -- 0-based 세트 번호
  weight numeric(6,1),                                    -- kg, 맨몸이면 null
  reps int,                                               -- 수행 횟수
  done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (log_date, day_id, exercise_name, set_index)     -- 같은 날·세트 중복 방지(upsert 키)
);

-- updated_at 자동 갱신
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_workout_sets_updated on public.workout_sets;
create trigger trg_workout_sets_updated
  before update on public.workout_sets
  for each row execute function public.touch_updated_at();

-- RLS 활성화 + anon 키 읽기/쓰기 허용 (개인 친목용)
alter table public.workout_sets enable row level security;

create policy "workout_sets_read"   on public.workout_sets for select using (true);
create policy "workout_sets_insert" on public.workout_sets for insert with check (true);
create policy "workout_sets_update" on public.workout_sets for update using (true);
create policy "workout_sets_delete" on public.workout_sets for delete using (true);

create index if not exists idx_workout_sets_date on public.workout_sets (log_date);
create index if not exists idx_workout_sets_day  on public.workout_sets (log_date, day_id);
