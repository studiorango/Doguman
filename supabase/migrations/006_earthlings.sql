-- 지구의 아이들: 아이 + 대기 명단 테이블
-- Supabase SQL 에디터에서 실행하세요.

-- 아이 테이블
create table if not exists public.earthlings_babies (
  id          bigint primary key generated always as identity,
  num         text not null,                       -- "1호"
  parent1     text not null,
  parent2     text not null default '',
  name        text not null,
  birthdate   date not null,
  housewarming int not null default 0,             -- 집들이 횟수 (🎖️)
  status      text not null default 'born' check (status in ('born', 'incoming')),
  gender      text not null check (gender in ('m', 'f')),
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- 대기 명단 테이블
create table if not exists public.earthlings_waiting (
  id          bigint primary key generated always as identity,
  parent1     text not null,
  parent2     text not null default '',
  housewarming boolean not null default false,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- RLS (친목 앱 — anon 읽기/쓰기 허용)
alter table public.earthlings_babies  enable row level security;
alter table public.earthlings_waiting enable row level security;

drop policy if exists "earthlings_babies_read"   on public.earthlings_babies;
drop policy if exists "earthlings_babies_insert" on public.earthlings_babies;
drop policy if exists "earthlings_babies_update" on public.earthlings_babies;
drop policy if exists "earthlings_babies_delete" on public.earthlings_babies;
create policy "earthlings_babies_read"   on public.earthlings_babies for select using (true);
create policy "earthlings_babies_insert" on public.earthlings_babies for insert with check (true);
create policy "earthlings_babies_update" on public.earthlings_babies for update using (true);
create policy "earthlings_babies_delete" on public.earthlings_babies for delete using (true);

drop policy if exists "earthlings_waiting_read"   on public.earthlings_waiting;
drop policy if exists "earthlings_waiting_insert" on public.earthlings_waiting;
drop policy if exists "earthlings_waiting_update" on public.earthlings_waiting;
drop policy if exists "earthlings_waiting_delete" on public.earthlings_waiting;
create policy "earthlings_waiting_read"   on public.earthlings_waiting for select using (true);
create policy "earthlings_waiting_insert" on public.earthlings_waiting for insert with check (true);
create policy "earthlings_waiting_update" on public.earthlings_waiting for update using (true);
create policy "earthlings_waiting_delete" on public.earthlings_waiting for delete using (true);

-- 초기 데이터 (중복 실행 방지: 비어있을 때만 삽입)
insert into public.earthlings_babies (num, parent1, parent2, name, birthdate, housewarming, status, gender, sort_order)
select * from (values
  ('1호',  '김예슬', '윤상우', '윤하영', date '2019-11-19', 3, 'born',     'f', 1),
  ('2호',  '이희원', '조세연', '이태연', date '2021-12-09', 0, 'born',     'f', 2),
  ('3호',  '조영준', '신수민', '조윤서', date '2022-12-08', 0, 'born',     'f', 3),
  ('4호',  '김민제', '심혜리', '김아린', date '2023-03-20', 1, 'born',     'f', 4),
  ('5호',  '조정흠', '김수연', '조해나', date '2023-04-17', 0, 'born',     'f', 5),
  ('6호',  '우지윤', '이상훈', '이유',   date '2024-01-04', 0, 'born',     'f', 6),
  ('7호',  '신유인', '황찬우', '황서빈', date '2024-11-15', 1, 'born',     'm', 7),
  ('8호',  '최필경', '오은정', '최인우', date '2025-02-17', 0, 'born',     'm', 8),
  ('9호',  '한혜조', '정성원', '정이현', date '2025-04-18', 0, 'born',     'm', 9),
  ('10호', '신정하', '권보라', '신지안', date '2025-08-06', 0, 'born',     'f', 10),
  ('11호', '이희원', '조세연', '이도은', date '2025-09-04', 0, 'born',     'f', 11),
  ('12호', '이은하', '곽승형', '곽도윤', date '2025-09-30', 1, 'born',     'm', 12),
  ('13호', '이경민', '김은비', '이주원', date '2026-02-26', 1, 'born',     'm', 13),
  ('14호', '서혜림', '전준용', '꼬부기', date '2026-08-18', 1, 'incoming', 'm', 14),
  ('15호', '강석훈', '이세진', '또마',   date '2026-11-28', 2, 'incoming', 'f', 15)
) as v
where not exists (select 1 from public.earthlings_babies);

insert into public.earthlings_waiting (parent1, parent2, housewarming, sort_order)
select * from (values
  ('정해영', '김영진', true,  1),
  ('손미희', '이창덕', false, 2),
  ('박인용', '김지은', true,  3),
  ('한재휘', '송두리', false, 4),
  ('성은아', '',       false, 5),
  ('권혁주', '',       false, 6),
  ('윤승완', '',       false, 7)
) as v
where not exists (select 1 from public.earthlings_waiting);
