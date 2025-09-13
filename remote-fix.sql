-- 远程 Supabase 项目权限修复脚本
-- 请在远程 Supabase Studio 中执行
-- 项目地址：https://cgzcucufhdhifsphxzpb.supabase.co

-- 1. 查看当前所有用户和角色
SELECT 
  id,
  email,
  role,
  created_at
FROM profiles 
ORDER BY created_at;

-- 2. 查看当前登录用户信息
SELECT 
  auth.uid() as current_user_id,
  'Current logged in user' as description;

-- 3. 查看当前用户的角色
SELECT 
  p.id,
  p.email,
  p.role,
  auth.uid() = p.id as is_current_user
FROM profiles p 
WHERE p.id = auth.uid();

-- 4. 将当前登录用户设为 ADMIN
UPDATE profiles 
SET role = 'ADMIN' 
WHERE id = auth.uid();

-- 5. 验证更新结果
SELECT 
  p.id,
  p.email,
  p.role,
  'Updated user info' as description
FROM profiles p 
WHERE p.id = auth.uid();

-- 6. 测试权限函数
SELECT 
  public.is_mod() as has_admin_permission,
  'Permission check result' as description;

-- 执行完毕后，请刷新网页并重试审核功能