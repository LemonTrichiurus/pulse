-- 为homepage_config表添加RLS策略
alter table if exists public.homepage_config enable row level security;

-- 允许所有人读取配置
drop policy if exists homepage_config_select_all on public.homepage_config;
create policy homepage_config_select_all on public.homepage_config for select using (true);

-- 只允许管理员/版主修改配置
drop policy if exists homepage_config_write_mod on public.homepage_config;
create policy homepage_config_write_mod on public.homepage_config
  for all using (public.is_mod()) with check (public.is_mod());