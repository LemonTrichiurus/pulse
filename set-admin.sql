-- 设置管理员权限的 SQL 脚本
-- 将第一个用户设置为管理员
UPDATE profiles 
SET role = 'ADMIN' 
WHERE id = (SELECT id FROM profiles ORDER BY created_at LIMIT 1);

-- 查看更新结果
SELECT id, email, role, created_at 
FROM profiles 
ORDER BY created_at;