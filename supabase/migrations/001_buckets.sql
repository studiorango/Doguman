-- 버킷리스트: Supabase SQL 에디터에서 실행하거나 마이그레이션으로 적용하세요.

create table if not exists public.buckets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  category text not null check (category in ('travel', 'challenge', 'relation', 'other')),
  is_completed boolean not null default false,
  created_at timestamptz not null default now(),
  share_slug text
);

create index if not exists idx_buckets_user_id on public.buckets (user_id);
create index if not exists idx_buckets_share_slug on public.buckets (share_slug)
  where share_slug is not null;

alter table public.buckets enable row level security;

create policy "Users select own buckets"
  on public.buckets for select
  using (auth.uid() = user_id);

create policy "Users insert own buckets"
  on public.buckets for insert
  with check (auth.uid() = user_id);

create policy "Users update own buckets"
  on public.buckets for update
  using (auth.uid() = user_id);

create policy "Users delete own buckets"
  on public.buckets for delete
  using (auth.uid() = user_id);

-- 공유 조회: RLS 우회 없이 slug로만 반환 (security definer)
create or replace function public.get_buckets_by_share_slug(sl text)
returns setof public.buckets
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.buckets
  where share_slug is not null
    and share_slug = sl;
$$;

grant execute on function public.get_buckets_by_share_slug(text) to anon, authenticated;
