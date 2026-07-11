-- 냉장고 레시피: 관리자 큐레이션 구조로 전환
--   * 작성(insert/update/delete)은 관리자 1명만
--   * 직접 SELECT 정책은 두지 않음 → 읽기는 service_role 서버 API로만 (크롤링 방어)
--   * fridge_stock(개인 냉장고)은 변경 없음
-- 참고: is_public 컬럼(016)은 더 이상 사용하지 않음. 컬럼은 남겨둠(무해).

-- 관리자 UID (NEXT_PUBLIC_ADMIN_USER_ID). 공개 식별자라 SQL에 박아도 안전.
-- 관리자 계정이 바뀌면 아래 UUID를 새 값으로 바꿔 다시 실행하면 됨.

-- 기존 per-user 정책 제거
drop policy if exists "Users select own fridge recipes" on public.fridge_recipes;
drop policy if exists "Users insert own fridge recipes" on public.fridge_recipes;
drop policy if exists "Users update own fridge recipes" on public.fridge_recipes;
drop policy if exists "Users delete own fridge recipes" on public.fridge_recipes;

-- 관리자만 직접 SELECT 가능 (등록 후 결과 조회용). 비관리자는 직접 조회 0건 → API로만 읽음.
create policy "Admin select fridge recipes"
  on public.fridge_recipes for select
  using (auth.uid() = 'bfdca7d2-aca3-4e0d-a12f-057dd412c27c');

-- 관리자만 작성/수정/삭제 가능
create policy "Admin insert fridge recipes"
  on public.fridge_recipes for insert
  with check (auth.uid() = 'bfdca7d2-aca3-4e0d-a12f-057dd412c27c');

create policy "Admin update fridge recipes"
  on public.fridge_recipes for update
  using (auth.uid() = 'bfdca7d2-aca3-4e0d-a12f-057dd412c27c');

create policy "Admin delete fridge recipes"
  on public.fridge_recipes for delete
  using (auth.uid() = 'bfdca7d2-aca3-4e0d-a12f-057dd412c27c');
