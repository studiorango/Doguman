-- 지구의 아이들: 성별 예측(아들/딸/적중/예측안함) 컬럼 추가
-- Supabase SQL 에디터에서 실행하세요.
-- 값: 'none'(예측 안함) | 'son'(아들 예측) | 'daughter'(딸 예측) | 'correct'(적중)

alter table public.earthlings_babies  add column if not exists prediction text not null default 'none';
alter table public.earthlings_waiting add column if not exists prediction text not null default 'none';

-- 아이: 조윤서(3호)부터 또마(15호)까지 적중
update public.earthlings_babies set prediction = 'correct'
  where num in ('3호','4호','5호','6호','7호','8호','9호','10호','11호','12호','13호','14호','15호');

-- 초록이(16호) 아들 예측
update public.earthlings_babies set prediction = 'son' where name = '초록이';

-- 윤하영(1호), 이태연(2호) 및 나머지는 기본값 'none' = 예측 안함

-- 대기 명단 예측
update public.earthlings_waiting set prediction = 'daughter' where parent1 = '정해영';
update public.earthlings_waiting set prediction = 'son'      where parent1 = '손미희';
update public.earthlings_waiting set prediction = 'daughter' where parent1 = '박인용';
update public.earthlings_waiting set prediction = 'daughter' where parent1 = '한재휘';
