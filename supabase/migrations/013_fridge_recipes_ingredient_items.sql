-- 냉장고 레시피: 재료를 이름/수량/단위 구조로 저장 (ingredient_items)
-- 기존 ingredients text[](이름만)는 냉장고 재고 매칭용으로 그대로 유지

alter table public.fridge_recipes
  add column if not exists ingredient_items jsonb not null default '[]';
