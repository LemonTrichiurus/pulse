-- 删除现有的插入策略
DROP POLICY IF EXISTS news_insert_mod ON public.news;
DROP POLICY IF EXISTS share_insert_mod ON public.sharespeare;

-- 创建新的插入策略，允许认证用户插入草稿
CREATE POLICY news_insert_mod ON public.news
  FOR INSERT WITH CHECK (
    public.is_mod() OR 
    (auth.uid() IS NOT NULL AND status = 'DRAFT'::public.publish_status)
  );

CREATE POLICY share_insert_mod ON public.sharespeare
  FOR INSERT WITH CHECK (
    public.is_mod() OR 
    (auth.uid() IS NOT NULL AND status = 'DRAFT'::public.publish_status)
  );