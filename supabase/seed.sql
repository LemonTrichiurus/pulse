-- ===========================
-- seed.sql  (idempotent)
-- 插入基础标签/示例内容；选用第一位管理员或第一位用户作为作者
-- ===========================

DO $$
DECLARE
  v_author uuid;
  v_topic_id bigint;
  v_news_campus_id bigint;
  v_news_global_id bigint;
  v_share_id bigint;
  -- 新增：前端展示新闻对应的ID
  v_news_techfest_id bigint;
  v_news_competition_id bigint;
  v_news_clubfest_id bigint;
  v_news_award_id bigint;
BEGIN
  -- 0) tags
  INSERT INTO public.tags(name) VALUES
    ('campus'),('global'),('music'),('books'),('film'),
    -- 新增中文标签
    ('科技'),('创新'),('比赛'),('教育'),('社团'),('获奖'),('AI')
  ON CONFLICT(name) DO NOTHING;

  -- 1) 选择作者（优先 ADMIN；否则第一位 profile）
  SELECT id INTO v_author
  FROM public.profiles
  WHERE role='ADMIN'::public.role
  ORDER BY created_at
  LIMIT 1;

  IF v_author IS NULL THEN
    SELECT id INTO v_author
    FROM public.profiles
    ORDER BY created_at
    LIMIT 1;
  END IF;

  IF v_author IS NULL THEN
    RAISE NOTICE 'No profiles found. Please register at least one user, then re-run seed.';
    RETURN;
  END IF;

  -- 2) news
  IF NOT EXISTS (SELECT 1 FROM public.news WHERE title='Welcome to Campus Pulse') THEN
    INSERT INTO public.news
      (title, content_rich, cover_url, category, status, author_id, published_at)
    VALUES
      ('Welcome to Campus Pulse',
       'This is a sample published campus news for the club.',
       NULL,
       'CAMPUS'::public.news_category,
       'PUBLISHED'::public.publish_status,
       v_author,
       NOW())
    RETURNING id INTO v_news_campus_id;
  ELSE
    SELECT id INTO v_news_campus_id FROM public.news WHERE title='Welcome to Campus Pulse' LIMIT 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.news WHERE title='Global Snapshot: Weekly') THEN
    INSERT INTO public.news
      (title, content_rich, cover_url, category, status, author_id)
    VALUES
      ('Global Snapshot: Weekly',
       'Draft example for global news.',
       NULL,
       'GLOBAL'::public.news_category,
       'DRAFT'::public.publish_status,
       v_author)
    RETURNING id INTO v_news_global_id;
  ELSE
    SELECT id INTO v_news_global_id FROM public.news WHERE title='Global Snapshot: Weekly' LIMIT 1;
  END IF;

  -- 新增：根据前端展示的中文新闻，插入到种子数据（幂等）
  IF NOT EXISTS (SELECT 1 FROM public.news WHERE title='学校成功举办第十届科技创新节') THEN
    INSERT INTO public.news (title, content_rich, cover_url, category, status, author_id, published_at)
    VALUES (
      '学校成功举办第十届科技创新节',
      $BODY$
<p>2024年1月10日，我校第十届科技创新节在体育馆圆满落幕。本次活动以“创新引领未来”为主题，展示了学生在人工智能、环保科技、生物医学、新能源等领域的优秀成果。</p>

<h2>活动亮点</h2>
<ul>
<li><strong>参展规模：</strong>500余名学生参与，展出200余件创新作品。</li>
<li><strong>前沿方向：</strong>从AI到绿色科技，创意兼具实用与探索价值。</li>
<li><strong>专家点评：</strong>多位业界专家现场指导，共同探讨项目落地与提升空间。</li>
</ul>

<p>学校将持续支持学生的科研探索，为培养具有创新精神与实践能力的新时代人才夯实基础。</p>
      $BODY$,
      NULL,
      'CAMPUS'::public.news_category,
      'PUBLISHED'::public.publish_status,
      v_author,
      to_timestamp('2024-01-10','YYYY-MM-DD')
    ) RETURNING id INTO v_news_techfest_id;
  ELSE
    SELECT id INTO v_news_techfest_id FROM public.news WHERE title='学校成功举办第十届科技创新节' LIMIT 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.news WHERE title='学校举办科技创新大赛') THEN
    INSERT INTO public.news (title, content_rich, cover_url, category, status, author_id, published_at)
    VALUES (
      '学校举办科技创新大赛',
      '本周学校举办年度科技创新大赛，涵盖人工智能、机器人、环保等多个方向，吸引全校200多名学生参与。',
      NULL,
      'CAMPUS'::public.news_category,
      'PUBLISHED'::public.publish_status,
      v_author,
      to_timestamp('2024-01-08','YYYY-MM-DD')
    ) RETURNING id INTO v_news_competition_id;
  ELSE
    SELECT id INTO v_news_competition_id FROM public.news WHERE title='学校举办科技创新大赛' LIMIT 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.news WHERE title='社团文化节圆满落幕') THEN
    INSERT INTO public.news (title, content_rich, cover_url, category, status, author_id, published_at)
    VALUES (
      '社团文化节圆满落幕',
      '为期三天的社团文化节在同学们的热情参与下落下帷幕，各社团带来了精彩的展示与演出，丰富了校园文化生活。',
      NULL,
      'CAMPUS'::public.news_category,
      'PUBLISHED'::public.publish_status,
      v_author,
      to_timestamp('2024-01-06','YYYY-MM-DD')
    ) RETURNING id INTO v_news_clubfest_id;
  ELSE
    SELECT id INTO v_news_clubfest_id FROM public.news WHERE title='社团文化节圆满落幕' LIMIT 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.news WHERE title='我校学生获得市级奖项') THEN
    INSERT INTO public.news (title, content_rich, cover_url, category, status, author_id, published_at)
    VALUES (
      '我校学生获得市级奖项',
      '在市级学科竞赛中，我校多名学生荣获佳绩，展现了扎实的学术功底与出色的创新能力。',
      NULL,
      'CAMPUS'::public.news_category,
      'PUBLISHED'::public.publish_status,
      v_author,
      to_timestamp('2024-01-05','YYYY-MM-DD')
    ) RETURNING id INTO v_news_award_id;
  ELSE
    SELECT id INTO v_news_award_id FROM public.news WHERE title='我校学生获得市级奖项' LIMIT 1;
  END IF;

  -- 为新增新闻绑定标签（如已存在则忽略）
  INSERT INTO public.news_tags(news_id, tag_id)
  SELECT v_news_techfest_id, t.id FROM public.tags t WHERE t.name IN ('campus','科技','创新','比赛','教育')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.news_tags(news_id, tag_id)
  SELECT v_news_competition_id, t.id FROM public.tags t WHERE t.name IN ('campus','科技','创新','比赛')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.news_tags(news_id, tag_id)
  SELECT v_news_clubfest_id, t.id FROM public.tags t WHERE t.name IN ('campus','社团')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.news_tags(news_id, tag_id)
  SELECT v_news_award_id, t.id FROM public.tags t WHERE t.name IN ('campus','获奖')
  ON CONFLICT DO NOTHING;

  -- 旧的示例标签绑定（保留）
  INSERT INTO public.news_tags(news_id, tag_id)
  SELECT v_news_campus_id, t.id FROM public.tags t WHERE t.name='campus'
  ON CONFLICT DO NOTHING;

  INSERT INTO public.news_tags(news_id, tag_id)
  SELECT v_news_global_id, t.id FROM public.tags t WHERE t.name='global'
  ON CONFLICT DO NOTHING;

  -- 3) sharespeare
  IF NOT EXISTS (SELECT 1 FROM public.sharespeare WHERE title='Editor Picks #1') THEN
    INSERT INTO public.sharespeare
      (title, content_rich, media_url, status, author_id, published_at)
    VALUES
      ('Editor Picks #1',
       'Books, songs, and films we loved this week.',
       NULL,
       'PUBLISHED'::public.publish_status,
       v_author,
       NOW())
    RETURNING id INTO v_share_id;
  ELSE
    SELECT id INTO v_share_id FROM public.sharespeare WHERE title='Editor Picks #1' LIMIT 1;
  END IF;

  -- 4) topic + comments
  IF NOT EXISTS (SELECT 1 FROM public.topics WHERE title='Welcome Thread') THEN
    INSERT INTO public.topics (title, body_rich, status, author_id)
    VALUES ('Welcome Thread','Introduce yourself and say hi!','OPEN'::public.topic_status, v_author)
    RETURNING id INTO v_topic_id;
  ELSE
    SELECT id INTO v_topic_id FROM public.topics WHERE title='Welcome Thread' LIMIT 1;
  END IF;

  IF v_topic_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.comments WHERE topic_id=v_topic_id AND status='APPROVED'::public.comment_status) THEN
      INSERT INTO public.comments (topic_id, author_id, body_rich, status, moderated_at)
      VALUES (v_topic_id, v_author, 'Welcome to the board! 🎉', 'APPROVED'::public.comment_status, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.comments WHERE topic_id=v_topic_id AND status='PENDING'::public.comment_status) THEN
      INSERT INTO public.comments (topic_id, author_id, body_rich, status)
      VALUES (v_topic_id, v_author, 'This comment is waiting for review.', 'PENDING'::public.comment_status);
    END IF;
  END IF;

  -- 5) calendar events
  INSERT INTO public.calendar_events
    (title,"date",type,source,description,visibility,created_by)
  SELECT 'AP Calculus Exam', CURRENT_DATE + INTERVAL '30 days',
         'EXAM'::public.event_type, 'AP'::public.event_source,
         'Mock AP Calculus exam','PUBLIC'::public.visibility,v_author
  WHERE NOT EXISTS (SELECT 1 FROM public.calendar_events WHERE title='AP Calculus Exam');

  INSERT INTO public.calendar_events
    (title,"date",type,source,description,visibility,created_by)
  SELECT 'UCLA Campus Tour', CURRENT_DATE + INTERVAL '45 days',
         'EVENT'::public.event_type, 'UCLA'::public.event_source,
         'Visit UCLA campus with advisors','PUBLIC'::public.visibility,v_author
  WHERE NOT EXISTS (SELECT 1 FROM public.calendar_events WHERE title='UCLA Campus Tour');

  RAISE NOTICE 'Seed done. Author used: %', v_author;
END $$;

-- 可选：把某些邮箱提为管理员（先注册过才有 profile）
-- update public.profiles set role='ADMIN' where email in ('admin@school.edu');
-- update public.profiles set role='MOD'   where email in ('ta@school.edu');
