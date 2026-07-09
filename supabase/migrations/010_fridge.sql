-- 냉장고 레시피 관리 시스템: Supabase SQL 에디터에서 실행하거나 마이그레이션으로 적용하세요.

create table if not exists public.fridge_stock (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.fridge_recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  source text,
  ingredients text[] not null default '{}',
  steps jsonb not null default '[]',
  total_time int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_fridge_stock_user_id on public.fridge_stock (user_id);
create index if not exists idx_fridge_recipes_user_id on public.fridge_recipes (user_id);

alter table public.fridge_stock enable row level security;

create policy "Users select own fridge stock"
  on public.fridge_stock for select
  using (auth.uid() = user_id);

create policy "Users insert own fridge stock"
  on public.fridge_stock for insert
  with check (auth.uid() = user_id);

create policy "Users update own fridge stock"
  on public.fridge_stock for update
  using (auth.uid() = user_id);

create policy "Users delete own fridge stock"
  on public.fridge_stock for delete
  using (auth.uid() = user_id);

alter table public.fridge_recipes enable row level security;

create policy "Users select own fridge recipes"
  on public.fridge_recipes for select
  using (auth.uid() = user_id);

create policy "Users insert own fridge recipes"
  on public.fridge_recipes for insert
  with check (auth.uid() = user_id);

create policy "Users update own fridge recipes"
  on public.fridge_recipes for update
  using (auth.uid() = user_id);

create policy "Users delete own fridge recipes"
  on public.fridge_recipes for delete
  using (auth.uid() = user_id);
