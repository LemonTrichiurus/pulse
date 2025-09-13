-- ===========================
-- rls-policies.sql  (idempotent)
-- 启用 RLS + 幂等创建/修改策略
-- ===========================

-- 启用 RLS
alter table if exists public.profiles        enable row level security;
alter table if exists public.news            enable row level security;
alter table if exists public.sharespeare     enable row level security;
alter table if exists public.topics          enable row level security;
alter table if exists public.comments        enable row level security;
alter table if exists public.calendar_events enable row level security;
alter table if exists public.tags            enable row level security;
alter table if exists public.news_tags       enable row level security;
alter table if exists public.audit_logs      enable row level security;

-- -------- profiles --------
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_select_all') then
    create policy profiles_select_all on public.profiles for select using (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_update_own') then
    create policy profiles_update_own on public.profiles
      for update using (auth.uid() = id)
      with check (auth.uid() = id);
  end if;
end $$;

-- -------- news --------
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='news' and policyname='news_select_published') then
    create policy news_select_published on public.news
      for select using (
        status = 'PUBLISHED'::public.publish_status
        or (auth.uid() is not null and (author_id = auth.uid() or public.is_mod()))
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='news' and policyname='news_insert_mod') then
    create policy news_insert_mod on public.news
      for insert with check (
        public.is_mod() or 
        (auth.uid() is not null and status = 'DRAFT'::public.publish_status)
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='news' and policyname='news_update_author_mod') then
    create policy news_update_author_mod on public.news
      for update using (author_id = auth.uid() or public.is_mod())
      with check (author_id = auth.uid() or public.is_mod());
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='news' and policyname='news_delete_admin') then
    create policy news_delete_admin on public.news
      for delete using (public.is_admin());
  end if;
end $$;

-- -------- sharespeare --------
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='sharespeare' and policyname='share_select_published') then
    create policy share_select_published on public.sharespeare
      for select using (
        status = 'PUBLISHED'::public.publish_status
        or (auth.uid() is not null and (author_id = auth.uid() or public.is_mod()))
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='sharespeare' and policyname='share_insert_mod') then
    create policy share_insert_mod on public.sharespeare
      for insert with check (
        public.is_mod() or 
        (auth.uid() is not null and status = 'DRAFT'::public.publish_status)
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='sharespeare' and policyname='share_update_author_mod') then
    create policy share_update_author_mod on public.sharespeare
      for update using (author_id = auth.uid() or public.is_mod())
      with check (author_id = auth.uid() or public.is_mod());
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='sharespeare' and policyname='share_delete_admin') then
    create policy share_delete_admin on public.sharespeare
      for delete using (public.is_admin());
  end if;
end $$;

-- -------- topics --------
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='topics' and policyname='topics_select_all') then
    create policy topics_select_all on public.topics for select using (true);
  end if;

  -- Removed topics_insert_authenticated - conflicts with topics_insert_mod

  -- Removed topics_update_author_mod and topics_delete_mod - using stricter MOD-only policies below
end $$;

-- -------- comments --------
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='comments' and policyname='comments_select_approved') then
    create policy comments_select_approved on public.comments
      for select using (
        status = 'APPROVED'::public.comment_status
        or (auth.uid() is not null and (author_id = auth.uid() or public.is_mod()))
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='comments' and policyname='comments_insert_authenticated') then
    create policy comments_insert_authenticated on public.comments
      for insert with check (
        auth.uid() is not null
        and exists (
          select 1 from public.topics t
          where t.id = topic_id and t.status = 'OPEN'::public.topic_status
        )
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='comments' and policyname='comments_update_own_pending') then
    create policy comments_update_own_pending on public.comments
      for update using (
        (author_id = auth.uid() and status = 'PENDING'::public.comment_status)
        or public.is_mod()
      )
      with check (
        (author_id = auth.uid() and status = 'PENDING'::public.comment_status)
        or public.is_mod()
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='comments' and policyname='comments_delete_own_pending') then
    create policy comments_delete_own_pending on public.comments
      for delete using (
        (author_id = auth.uid() and status = 'PENDING'::public.comment_status)
        or public.is_mod()
      );
  end if;
end $$;

-- -------- calendar_events --------
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='calendar_events' and policyname='calendar_events_select_public') then
    create policy calendar_events_select_public on public.calendar_events
      for select using (
        visibility = 'PUBLIC'::public.visibility
        or (auth.uid() is not null and (created_by = auth.uid() or public.is_mod()))
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='calendar_events' and policyname='calendar_events_insert_mod') then
    create policy calendar_events_insert_mod on public.calendar_events
      for insert with check (public.is_mod());
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='calendar_events' and policyname='calendar_events_update_mod') then
    create policy calendar_events_update_mod on public.calendar_events
      for update using (public.is_mod())
      with check (public.is_mod());
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='calendar_events' and policyname='calendar_events_delete_admin') then
    create policy calendar_events_delete_admin on public.calendar_events
      for delete using (public.is_admin());
  end if;
end $$;

-- -------- tags & news_tags --------
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='tags' and policyname='tags_select_all') then
    create policy tags_select_all on public.tags for select using (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='tags' and policyname='tags_write_mod') then
    create policy tags_write_mod on public.tags
      for all using (public.is_mod()) with check (public.is_mod());
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='news_tags' and policyname='news_tags_select_all') then
    create policy news_tags_select_all on public.news_tags for select using (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='news_tags' and policyname='news_tags_write_mod') then
    create policy news_tags_write_mod on public.news_tags
      for all using (public.is_mod()) with check (public.is_mod());
  end if;
end $$;

-- -------- Storage policies (storage.objects for bucket=media) --------
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='storage' and tablename='objects' and policyname='media_authenticated_upload'
  ) then
    create policy "media_authenticated_upload"
      on storage.objects for insert
      with check (bucket_id = 'media' and auth.uid() is not null);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='storage' and tablename='objects' and policyname='media_owner_or_mod_delete'
  ) then
    create policy "media_owner_or_mod_delete"
      on storage.objects for delete
      using (
        bucket_id = 'media'
        and (owner = auth.uid() or public.is_mod())
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='storage' and tablename='objects' and policyname='media_public_read'
  ) then
    -- 如走私有+签名URL，可不建这条
    create policy "media_public_read"
      on storage.objects for select
      using (bucket_id = 'media');
  end if;
end $$;

-- ===== Helper：角色判断（如果你库里还没有就创建）=====
create or replace function public.is_admin(u uuid default auth.uid())
returns boolean language sql stable as $$
  select exists(select 1 from public.profiles p where p.id=u and p.role='ADMIN');
$$;

create or replace function public.is_mod(u uuid default auth.uid())
returns boolean language sql stable as $$
  select exists(select 1 from public.profiles p where p.id=u and p.role in ('ADMIN','MOD'));
$$;

-- ===== 触发器：插入时自动填 author_id（前端可不传）=====
create or replace function public.set_author_id()
returns trigger language plpgsql as $$
begin
  if new.author_id is null then new.author_id := auth.uid(); end if;
  return new;
end $$;

drop trigger if exists topics_set_author on public.topics;
create trigger topics_set_author
  before insert on public.topics
  for each row execute function public.set_author_id();

drop trigger if exists comments_set_author on public.comments;
create trigger comments_set_author
  before insert on public.comments
  for each row execute function public.set_author_id();

-- ===== 启用 RLS（如果尚未启用）=====
alter table if exists public.topics   enable row level security;
alter table if exists public.comments enable row level security;

-- ===== topics：管理员/版主可发帖；所有人可读 OPEN =====
do $$
begin
  if not exists (select 1 from pg_policies where tablename='topics' and policyname='topics_select_open_or_mod') then
    create policy topics_select_open_or_mod on public.topics
      for select using (status='OPEN' or public.is_mod());
  end if;

  if not exists (select 1 from pg_policies where tablename='topics' and policyname='topics_insert_mod') then
    create policy topics_insert_mod on public.topics
      for insert with check (public.is_mod());
  end if;

  if not exists (select 1 from pg_policies where tablename='topics' and policyname='topics_update_mod') then
    create policy topics_update_mod on public.topics
      for update using (public.is_mod()) with check (public.is_mod());
  end if;

  if not exists (select 1 from pg_policies where tablename='topics' and policyname='topics_delete_mod') then
    create policy topics_delete_mod on public.topics
      for delete using (public.is_mod());
  end if;
end $$;

-- ===== comments：登录可发评论(入库为 PENDING)，审核后公开 =====
do $$
begin
  -- 展示：匿名仅看到 APPROVED；作者和 MOD 能看到全部
  if not exists (select 1 from pg_policies where tablename='comments' and policyname='comments_select_approved_or_own_or_mod') then
    create policy comments_select_approved_or_own_or_mod on public.comments
      for select using (
        status='APPROVED'
        or (auth.uid() is not null and (author_id=auth.uid() or public.is_mod()))
      );
  end if;

  -- 发表：登录，且 topic 必须是 OPEN；初始 PENDING
  if not exists (select 1 from pg_policies where tablename='comments' and policyname='comments_insert_authenticated_open_topic') then
    create policy comments_insert_authenticated_open_topic on public.comments
      for insert with check (
        auth.uid() is not null
        and exists (select 1 from public.topics t where t.id=topic_id and t.status='OPEN')
        and status='PENDING'
      );
  end if;

  -- 作者可修改/删除“自己 PENDING 的评论”；MOD 可改任意
  if not exists (select 1 from pg_policies where tablename='comments' and policyname='comments_update_own_pending_or_mod') then
    create policy comments_update_own_pending_or_mod on public.comments
      for update using (
        (author_id=auth.uid() and status='PENDING') or public.is_mod()
      ) with check (
        (author_id=auth.uid() and status='PENDING') or public.is_mod()
      );
  end if;

  if not exists (select 1 from pg_policies where tablename='comments' and policyname='comments_delete_own_pending_or_mod') then
    create policy comments_delete_own_pending_or_mod on public.comments
      for delete using (
        (author_id=auth.uid() and status='PENDING') or public.is_mod()
      );
  end if;

  -- 审核：版主/管理员可把 PENDING 改为 APPROVED/REJECTED
  if not exists (select 1 from pg_policies where tablename='comments' and policyname='comments_moderate_by_mod') then
    create policy comments_moderate_by_mod on public.comments
      for update using (public.is_mod()) with check (public.is_mod());
  end if;
end $$;

-- 确保 RLS 开启
alter table public.topics enable row level security;

-- 角色判断函数（若已存在会覆盖为最新）
create or replace function public.is_mod(u uuid default auth.uid())
returns boolean language sql stable as $$
  select exists(
    select 1 from public.profiles p
    where p.id = u and p.role in ('ADMIN','MOD')
  );
$$;

-- 可选：如果你想严格到“只有 ADMIN”，把 is_mod 换成 is_admin 并用下面这个
-- create or replace function public.is_admin(u uuid default auth.uid())
-- returns boolean language sql stable as $$
--   select exists(select 1 from public.profiles p where p.id=u and p.role='ADMIN');
-- $$;

-- 关闭放权策略
do $$
begin
  if exists (select 1 from pg_policies where tablename='topics' and policyname='topics_insert_authenticated') then
    execute 'drop policy topics_insert_authenticated on public.topics';
  end if;

  if exists (select 1 from pg_policies where tablename='topics' and policyname='topics_update_author_mod') then
    execute 'drop policy topics_update_author_mod on public.topics';
  end if;

  -- 如果你不想“所有人都能读所有话题”，也可以顺便关掉 topics_select_all
  -- if exists (select 1 from pg_policies where tablename='topics' and policyname='topics_select_all') then
  --   execute 'drop policy topics_select_all on public.topics';
  -- end if;
end $$;

-- 新建/补齐严格策略（只允许 MOD/ADMIN）
do $$
begin
  -- 读取：对外只展示 OPEN；版主/管理员可读全部
  if not exists (select 1 from pg_policies where tablename='topics' and policyname='topics_select_open_or_mod') then
    create policy topics_select_open_or_mod on public.topics
      for select using (status='OPEN' or public.is_mod());
  end if;

  -- 插入：只有 MOD/ADMIN
  if not exists (select 1 from pg_policies where tablename='topics' and policyname='topics_insert_mod') then
    create policy topics_insert_mod on public.topics
      for insert with check (public.is_mod());
  end if;

  -- 更新：只有 MOD/ADMIN
  if not exists (select 1 from pg_policies where tablename='topics' and policyname='topics_update_mod') then
    create policy topics_update_mod on public.topics
      for update using (public.is_mod()) with check (public.is_mod());
  end if;

  -- 删除：只有 MOD/ADMIN
  if not exists (select 1 from pg_policies where tablename='topics' and policyname='topics_delete_mod') then
    create policy topics_delete_mod on public.topics
      for delete using (public.is_mod());
  end if;
end $$;

-- 查看最终策略
select schemaname, tablename, policyname, cmd
from pg_policies
where tablename='topics'
order by policyname;
