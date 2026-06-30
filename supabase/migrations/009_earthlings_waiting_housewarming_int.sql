-- 대기 명단 집들이: boolean → int(횟수)로 변경
-- 기존 true → 1, false → 0 으로 변환
-- Supabase SQL 에디터에서 실행하세요.

alter table public.earthlings_waiting alter column housewarming drop default;
alter table public.earthlings_waiting alter column housewarming type int using (housewarming::int);
alter table public.earthlings_waiting alter column housewarming set default 0;
