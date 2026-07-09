-- 냉장고 레시피: 유튜브 검색에서 등록한 레시피의 원본 링크 저장 (중복 등록 표시용)

alter table public.fridge_recipes
  add column if not exists youtube_url text;
