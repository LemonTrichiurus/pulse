-- ===========================
-- init.sql  (idempotent)
-- 建枚举 / 表 / 函数 / 触发器 / 索引 / 媒体桶
-- 执行顺序：init → rls-policies → seed
-- ===========================

-- ---------- Enums ----------
do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'role' and n.nspname = 'public'
  ) then
    create type public.role as enum ('ADMIN','MOD','MEMBER');
  end if;

  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
                 where t.typname='news_category' and n.nspname='public') then
    create type public.news_category as enum ('CAMPUS','GLOBAL');
  end if;

  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
                 where t.typname='publish_status' and n.nspname='public') then
    create type public.publish_status as enum ('DRAFT','PUBLISHED');
  end if;

  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
                 where t.typname='comment_status' and n.nspname='public') then
    create type public.comment_status as enum ('PENDING','APPROVED','REJECTED');
  end if;

  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
                 where t.typname='topic_status' and n.nspname='public') then
    create type public.topic_status as enum ('OPEN','LOCKED');
  end if;

  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
                 where t.typname='event_type' and n.nspname='public') then
    create type public.event_type as enum ('EXAM','EVENT');
  end if;

  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
                 where t.typname='event_source' and n.nspname='public') then
    create type public.event_source as enum ('AP','UCLA','OTHER');
  end if;

  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
                 where t.typname='visibility' and n.nspname='public') then
    create type public.visibility as enum ('PUBLIC','PRIVATE');
  end if;
end $$;

-- ---------- Tables ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  display_name text,
  avatar_url text,
  role public.role not null default 'MEMBER',
  created_at timestamptz not null default now()
);

create table if not exists public.news (
  id bigserial primary key,
  title text not null,
  content_rich text not null,
  cover_url text,
  category public.news_category not null default 'CAMPUS',
  status public.publish_status not null default 'DRAFT',
  author_id uuid not null references public.profiles(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint news_published_requires_time
    check (status <> 'PUBLISHED'::public.publish_status or published_at is not null)
);

-- 新增：是否为头版/精选标记（幂等）
alter table public.news
  add column if not exists is_featured boolean not null default false;

-- 方案C：置顶排序权重（数值越大越靠前，可为空；为空表示非置顶）
alter table public.news
  add column if not exists top_rank integer;

create index if not exists idx_news_status on public.news(status);
create index if not exists idx_news_published_at on public.news(published_at desc);
create index if not exists idx_news_is_featured on public.news(is_featured);
-- 按置顶权重与发布时间的排序索引（NULLS LAST 以便未置顶的靠后）
create index if not exists idx_news_top_rank_published on public.news(top_rank desc nulls last, published_at desc);

create table if not exists public.sharespeare (
  id bigserial primary key,
  title text not null,
  content_rich text not null,
  media_url text,
  status public.publish_status not null default 'DRAFT',
  author_id uuid not null references public.profiles(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sharespeare_published_requires_time
    check (status <> 'PUBLISHED'::public.publish_status or published_at is not null)
);

create table if not exists public.topics (
  id bigserial primary key,
  title text not null,
  body_rich text not null,
  status public.topic_status not null default 'OPEN',
  author_id uuid not null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id bigserial primary key,
  topic_id bigint not null references public.topics(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete set null,
  body_rich text not null,
  status public.comment_status not null default 'PENDING',
  moderated_by uuid references public.profiles(id),
  moderated_at timestamptz,
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists idx_comments_topic on public.comments(topic_id);
create index if not exists idx_comments_status on public.comments(status);

create table if not exists public.calendar_events (
  id bigserial primary key,
  title text not null,
  "date" date not null,
  type public.event_type not null default 'EXAM',
  source public.event_source not null default 'OTHER',
  description text,
  visibility public.visibility not null default 'PUBLIC',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_calendar_date on public.calendar_events("date");

create table if not exists public.tags (
  id bigserial primary key,
  name text unique not null
);

create table if not exists public.news_tags (
  news_id bigint references public.news(id) on delete cascade,
  tag_id  bigint references public.tags(id) on delete cascade,
  primary key (news_id, tag_id)
);

create table if not exists public.audit_logs (
  id bigserial primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id text,
  meta jsonb,
  created_at timestamptz not null default now()
);

-- ---------- Utility functions ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- 可选参数版本：既可 is_mod() 也可 is_mod(auth.uid())
create or replace function public.is_admin(u uuid default auth.uid())
returns boolean language sql stable as $$
  select exists(select 1 from public.profiles p where p.id = u and p.role = 'ADMIN'::public.role);
$$;

create or replace function public.is_mod(u uuid default auth.uid())
returns boolean language sql stable as $$
  select exists(select 1 from public.profiles p where p.id = u and p.role in ('ADMIN'::public.role,'MOD'::public.role));
$$;

-- ---------- Triggers ----------
drop trigger if exists news_set_updated on public.news;
create trigger news_set_updated
  before update on public.news
  for each row execute function public.set_updated_at();

-- 仅允许 MOD/ADMIN 设置或修改 top_rank
create or replace function public.enforce_top_rank_permission()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    if new.top_rank is not null and not public.is_mod() then
      raise exception 'only moderators can set top_rank';
    end if;
  elsif tg_op = 'UPDATE' then
    if coalesce(new.top_rank, -1) <> coalesce(old.top_rank, -1) and not public.is_mod() then
      raise exception 'only moderators can change top_rank';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists news_enforce_top_rank on public.news;
create trigger news_enforce_top_rank
  before insert or update on public.news
  for each row execute function public.enforce_top_rank_permission();

drop trigger if exists sharespeare_set_updated on public.sharespeare;
create trigger sharespeare_set_updated
  before update on public.sharespeare
  for each row execute function public.set_updated_at();

drop trigger if exists topics_set_updated on public.topics;
create trigger topics_set_updated
  before update on public.topics
  for each row execute function public.set_updated_at();

drop trigger if exists calendar_set_updated on public.calendar_events;
create trigger calendar_set_updated
  before update on public.calendar_events
  for each row execute function public.set_updated_at();

-- 新用户自动创建 profile
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public as $$
begin
  insert into public.profiles(id, email, display_name)
  values (new.id, new.email, split_part(new.email,'@',1))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Storage: ensure media bucket ----------
do $$
begin
  if not exists (select 1 from storage.buckets where id = 'media') then
    perform storage.create_bucket('media', public => true); -- 如需私有改为 false
  end if;
end $$;
