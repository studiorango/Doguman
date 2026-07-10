-- 냉장고 레시피: 출처 링크(수동 입력) 컬럼 추가
-- youtube_url(유튜버 검색 자동 연결)과 별개로, 직접 참고 링크를 남길 수 있게 함

alter table public.fridge_recipes
  add column if not exists link text;
