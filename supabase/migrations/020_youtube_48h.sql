-- 유튜브 48시간 조회수 추적
-- Supabase SQL 에디터에서 실행하세요.

-- 추적 중인 영상
create table if not exists public.yt_tracked_videos (
  video_id text primary key,                    -- YouTube videoId
  channel_id text not null,
  channel_title text not null default '',
  title text not null default '',
  thumbnail text not null default '',
  published_at timestamptz,                      -- 영상 업로드 시각
  created_at timestamptz not null default now()  -- 추적 시작 시각
);

-- 조회수 스냅샷 (주기적으로 기록)
create table if not exists public.yt_view_snapshots (
  id uuid primary key default gen_random_uuid(),
  video_id text not null references public.yt_tracked_videos (video_id) on delete cascade,
  view_count bigint not null default 0,
  like_count bigint not null default 0,
  comment_count bigint not null default 0,
  captured_at timestamptz not null default now()
);

create index if not exists idx_yt_snapshots_video on public.yt_view_snapshots (video_id, captured_at);

-- RLS (서비스 롤 키로 서버에서 접근, 개인용 앱)
alter table public.yt_tracked_videos enable row level security;
alter table public.yt_view_snapshots enable row level security;

create policy "yt_tracked_read"   on public.yt_tracked_videos for select using (true);
create policy "yt_tracked_write"  on public.yt_tracked_videos for insert with check (true);
create policy "yt_tracked_delete" on public.yt_tracked_videos for delete using (true);
create policy "yt_snapshots_read"  on public.yt_view_snapshots for select using (true);
create policy "yt_snapshots_write" on public.yt_view_snapshots for insert with check (true);
