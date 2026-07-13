-- 냉장고 레시피: 몇 인분인지(servings) 컬럼 추가

alter table public.fridge_recipes
  add column if not exists servings int;
