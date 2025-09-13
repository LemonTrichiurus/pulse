-- 检查当前用户角色和权限
-- 请在 Supabase Studio 的 SQL Editor 中执行

-- 1. 检查当前登录用户ID
SELECT 
  auth.uid() as current_user_id,
  'Current logged in user ID' as description;

-- 2. 检查所有用户的角色信息
SELECT 
  id,
  email,
  role,
  created_at
FROM profiles 
ORDER BY created_at;

-- 3. 检查当前用户的具体角色
SELECT 
  p.id,
  p.email,
  p.role,
  auth.uid() = p.id as is_current_user,
  'Current user profile info' as description
FROM profiles p 
WHERE p.id = auth.uid();

-- 4. 测试 is_mod() 函数
SELECT 
  public.is_mod() as is_mod_result,
  'is_mod() function result for current user' as description;

-- 5. 检查是否有权限更新评论
SELECT 
  c.id,
  c.content,
  c.status,
  c.author_id,
  auth.uid() as current_user,
  public.is_mod() as has_mod_permission,
  'Sample comments and permissions' as description
FROM comments c 
LIMIT 3;

-- 如果发现角色不是 ADMIN，取消下面的注释并替换邮箱地址
-- UPDATE profiles 
-- SET role = 'ADMIN' 
-- WHERE email = 'your-email@example.com';