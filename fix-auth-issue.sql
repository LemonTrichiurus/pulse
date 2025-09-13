-- 解决认证问题的 SQL 脚本
-- 问题：current_user 为 NULL，说明没有正确的用户会话

-- 方案1：直接设置第一个用户为 ADMIN（如果你知道自己的邮箱）
-- 请替换 'your-email@example.com' 为你实际的邮箱地址
UPDATE profiles 
SET role = 'ADMIN' 
WHERE email = 'your-email@example.com';

-- 方案2：如果不确定邮箱，设置第一个注册的用户为 ADMIN
UPDATE profiles 
SET role = 'ADMIN' 
WHERE id = (SELECT id FROM profiles ORDER BY created_at LIMIT 1);

-- 方案3：查看所有用户邮箱，然后手动选择
SELECT id, email, role, created_at 
FROM profiles 
ORDER BY created_at;

-- 执行完更新后，请：
-- 1. 退出当前网站登录
-- 2. 重新登录你的账号
-- 3. 再次尝试审核评论

-- 验证更新是否成功
SELECT email, role 
FROM profiles 
WHERE role = 'ADMIN';