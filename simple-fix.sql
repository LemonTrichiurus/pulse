-- 简单直接的修复脚本
-- 直接将所有用户设为 ADMIN（适用于开发环境）

-- 查看当前所有用户
SELECT id, email, role FROM profiles;

-- 将所有用户设为 ADMIN
UPDATE profiles SET role = 'ADMIN';

-- 验证更新结果
SELECT id, email, role FROM profiles;

-- 如果你只想更新特定用户，请使用下面的语句（取消注释并替换邮箱）
-- UPDATE profiles SET role = 'ADMIN' WHERE email = 'your-email@example.com';

-- 执行完毕后，请刷新网页重试审核功能