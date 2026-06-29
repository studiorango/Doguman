-- 지구의 아이들: anon 쓰기/삭제 차단 (읽기만 허용)
-- 쓰기/삭제는 서버 API(service_role)로만 처리됩니다. service_role 은 RLS 를 우회하므로
-- 별도 쓰기 정책이 없어도 서버에서는 정상 동작합니다.
-- Supabase SQL 에디터에서 실행하세요.

-- 읽기 정책은 유지, 쓰기/수정/삭제 정책만 제거
drop policy if exists "earthlings_babies_insert" on public.earthlings_babies;
drop policy if exists "earthlings_babies_update" on public.earthlings_babies;
drop policy if exists "earthlings_babies_delete" on public.earthlings_babies;

drop policy if exists "earthlings_waiting_insert" on public.earthlings_waiting;
drop policy if exists "earthlings_waiting_update" on public.earthlings_waiting;
drop policy if exists "earthlings_waiting_delete" on public.earthlings_waiting;

-- 읽기 정책 보강 (없으면 생성)
drop policy if exists "earthlings_babies_read"  on public.earthlings_babies;
drop policy if exists "earthlings_waiting_read" on public.earthlings_waiting;
create policy "earthlings_babies_read"  on public.earthlings_babies  for select using (true);
create policy "earthlings_waiting_read" on public.earthlings_waiting for select using (true);
