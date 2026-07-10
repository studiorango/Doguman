-- 냉장고 레시피: 카테고리(대분류), 영양성분(탄단지), 별점, 아이용 여부 추가

alter table public.fridge_recipes
  add column if not exists category text,
  add column if not exists carbs numeric,
  add column if not exists protein numeric,
  add column if not exists fat numeric,
  add column if not exists rating numeric,
  add column if not exists kid_friendly boolean not null default false;
