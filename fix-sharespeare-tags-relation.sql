-- 修复 sharespeare 表的 tags 字段与 tags 表的关联
-- 简化版本，只包含必要的操作

-- 1. 首先确保tags表有基础数据（根据实际数据库结构）
INSERT INTO tags (id, name, name_en, description) VALUES 
(1, 'Summer Stories（夏校纪事）', 'Summer Stories', '分享世界各地夏校的申请过程、课程体验、社交经历～'),
(2, 'Hidden Chapters（隐藏的章节）', 'Hidden Chapters', '生活中那些"未被讲述的故事"。'),
(3, 'Creative Sparks（创意火花）', 'Creative Sparks', '摄影配文、短篇、艺术作品展示区')
ON CONFLICT (id) DO NOTHING;

-- 2. 清理sharespeare表中的无效tags（设为NULL，稍后手动分配）
UPDATE sharespeare 
SET tags = NULL 
WHERE tags IS NOT NULL 
AND EXISTS (
    SELECT 1 
    FROM unnest(tags) AS tag_id 
    WHERE tag_id NOT IN (SELECT id FROM tags)
);

-- 3. 为现有的sharespeare记录分配默认tags
-- 将前1/3的记录分配给"Summer Stories" (id=1)
WITH numbered_shares AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn,
           COUNT(*) OVER () as total_count
    FROM sharespeare 
    WHERE tags IS NULL OR array_length(tags, 1) IS NULL
)
UPDATE sharespeare 
SET tags = ARRAY[1] 
WHERE id IN (
    SELECT id FROM numbered_shares 
    WHERE rn <= (total_count / 3)
);

-- 将中间1/3的记录分配给"Hidden Chapters" (id=2)
WITH numbered_shares AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn,
           COUNT(*) OVER () as total_count
    FROM sharespeare 
    WHERE tags IS NULL OR array_length(tags, 1) IS NULL
)
UPDATE sharespeare 
SET tags = ARRAY[2] 
WHERE id IN (
    SELECT id FROM numbered_shares 
    WHERE rn > (total_count / 3) AND rn <= (total_count * 2 / 3)
);

-- 将剩余记录分配给"Creative Sparks" (id=3)
UPDATE sharespeare 
SET tags = ARRAY[3] 
WHERE tags IS NULL OR array_length(tags, 1) IS NULL;

-- 4. 确保RLS策略正确设置
ALTER TABLE sharespeare ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- 为tags表创建读取策略（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tags' AND policyname = 'Allow read access to tags'
    ) THEN
        CREATE POLICY "Allow read access to tags" ON tags FOR SELECT USING (true);
    END IF;
END $$;

-- 5. 验证设置
SELECT 'Setup completed successfully!' as status;

-- 查看当前的sharespeare记录和它们的tags
SELECT 
    id, 
    title, 
    tags,
    (SELECT string_agg(name, ', ') FROM tags WHERE id = ANY(COALESCE(sharespeare.tags, ARRAY[]::integer[]))) as tag_names
FROM sharespeare 
ORDER BY created_at DESC 
LIMIT 5;