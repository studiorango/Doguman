-- 냉장고 레시피: 레시피별 공개/비공개 토글
-- 주의: 공개 레시피 읽기는 서버 API(service_role)로만 제공한다.
-- anon/public SELECT 정책은 의도적으로 추가하지 않는다 (테이블 직접 덤프 방지).

alter table public.fridge_recipes
  add column if not exists is_public boolean not null default false;

create index if not exists idx_fridge_recipes_public
  on public.fridge_recipes (is_public, created_at desc)
  where is_public = true;
