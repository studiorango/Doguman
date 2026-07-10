-- 냉장고 레시피: 요리 종류(cuisine) + 페어링 술(pairing) 컬럼 추가

alter table public.fridge_recipes
  add column if not exists cuisine text,
  add column if not exists pairing text;
