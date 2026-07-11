-- 냉장고 레시피: 코스 구성용 분류(course) 컬럼 추가
-- 예) 한식: 메인/국·탕/반찬/밥·면/후식, 양식: 전채/메인/사이드/디저트, 또는 직접 입력

alter table public.fridge_recipes
  add column if not exists course text;
