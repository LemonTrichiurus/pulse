-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 创建枚举类型
CREATE TYPE user_role AS ENUM ('member', 'moderator', 'admin');
CREATE TYPE news_category AS ENUM ('校园', '全球');
CREATE TYPE news_status AS ENUM ('draft', 'published');
CREATE TYPE topic_category AS ENUM ('学习', '社团', '活动', '生活', '建议', '其他');
CREATE TYPE topic_status AS ENUM ('open', 'locked');
CREATE TYPE sharespeare_type AS ENUM ('学习方法', '社团经历', '竞赛经验', '大学申请心得');
CREATE TYPE picks_kind AS ENUM ('书', '歌', '电影', '刊物');
CREATE TYPE submission_type AS ENUM ('News', 'Topic', 'Sharespeare', 'Picks', 'Birthday', 'Exam');
CREATE TYPE submission_status AS ENUM ('pending', 'approved', 'rejected');

-- 用户档案表
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'member',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 新闻表
CREATE TABLE news (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    summary TEXT,
    cover_url TEXT,
    body TEXT NOT NULL,
    author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    category news_category NOT NULL,
    published_at TIMESTAMPTZ,
    tags TEXT[] DEFAULT '{}',
    status news_status DEFAULT 'draft',
    views INTEGER DEFAULT 0,
    allow_comments BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    search TSVECTOR
);

-- 话题表
CREATE TABLE topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    category topic_category NOT NULL,
    starter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    upvotes INTEGER DEFAULT 0,
    pinned BOOLEAN DEFAULT false,
    status topic_status DEFAULT 'open',
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 话题评论表
CREATE TABLE topic_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
    author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    parent_id UUID REFERENCES topic_comments(id) ON DELETE CASCADE,
    upvotes INTEGER DEFAULT 0,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sharespeare 分享表
CREATE TABLE sharespeare (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    advisor_name TEXT,
    type sharespeare_type NOT NULL,
    summary TEXT,
    body TEXT NOT NULL,
    resources JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    qna_enabled BOOLEAN DEFAULT true,
    status news_status DEFAULT 'published',
    published_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 每周推荐表
CREATE TABLE picks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    kind picks_kind NOT NULL,
    link TEXT,
    why_short TEXT,
    week_of DATE NOT NULL,
    contributor UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 生日墙表
CREATE TABLE birthdays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_name TEXT NOT NULL,
    class_grade TEXT,
    birthday DATE NOT NULL,
    photo_url TEXT,
    wishes TEXT,
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 考试日历表
CREATE TABLE exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_title TEXT NOT NULL,
    exam_type TEXT NOT NULL,
    organization TEXT,
    course_or_subject TEXT,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ,
    time_zone TEXT DEFAULT 'Asia/Shanghai',
    location TEXT,
    registration_deadline DATE,
    admission_ticket_date DATE,
    resources JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 投稿表
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submitter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type submission_type NOT NULL,
    payload JSONB NOT NULL,
    attachments JSONB DEFAULT '{}',
    status submission_status DEFAULT 'pending',
    reviewer UUID REFERENCES profiles(id),
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ
);

-- 新闻评论表
CREATE TABLE news_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    news_id UUID REFERENCES news(id) ON DELETE CASCADE,
    author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    parent_id UUID REFERENCES news_comments(id) ON DELETE CASCADE,
    upvotes INTEGER DEFAULT 0,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sharespeare 问答表
CREATE TABLE sharespeare_qna (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sharespeare_id UUID REFERENCES sharespeare(id) ON DELETE CASCADE,
    author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    parent_id UUID REFERENCES sharespeare_qna(id) ON DELETE CASCADE,
    upvotes INTEGER DEFAULT 0,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_news_published_at ON news(published_at DESC) WHERE status = 'published';
CREATE INDEX idx_news_category ON news(category);
CREATE INDEX idx_news_author ON news(author_id);
CREATE INDEX idx_news_tags ON news USING GIN(tags);
CREATE INDEX idx_news_search ON news USING GIN(search);

CREATE INDEX idx_topics_last_activity ON topics(last_activity_at DESC);
CREATE INDEX idx_topics_category ON topics(category);
CREATE INDEX idx_topics_pinned ON topics(pinned DESC, last_activity_at DESC);

CREATE INDEX idx_topic_comments_topic ON topic_comments(topic_id);
CREATE INDEX idx_topic_comments_parent ON topic_comments(parent_id);

CREATE INDEX idx_exams_start_date ON exams(start_at);
CREATE INDEX idx_exams_type ON exams(exam_type);
CREATE INDEX idx_exams_organization ON exams(organization);

CREATE INDEX idx_birthdays_date ON birthdays(birthday);
CREATE INDEX idx_picks_week ON picks(week_of DESC);

-- 创建触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search := to_tsvector('chinese', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.body, '') || ' ' || array_to_string(NEW.tags, ' '));
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_topic_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE topics SET last_activity_at = NOW() WHERE id = NEW.topic_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建触发器
CREATE TRIGGER update_news_updated_at BEFORE UPDATE ON news
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON exams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sharespeare_updated_at BEFORE UPDATE ON sharespeare
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_news_search_vector BEFORE INSERT OR UPDATE ON news
    FOR EACH ROW EXECUTE FUNCTION update_search_vector();

CREATE TRIGGER update_topic_activity_trigger AFTER INSERT ON topic_comments
    FOR EACH ROW EXECUTE FUNCTION update_topic_activity();

-- 创建 RPC 函数
CREATE OR REPLACE FUNCTION increment_views(news_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE news SET views = views + 1 WHERE id = news_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 启用 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sharespeare ENABLE ROW LEVEL SECURITY;
ALTER TABLE sharespeare_qna ENABLE ROW LEVEL SECURITY;
ALTER TABLE picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE birthdays ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- RLS 策略
-- Profiles 策略
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- News 策略
CREATE POLICY "Published news are viewable by everyone" ON news
    FOR SELECT USING (status = 'published' OR auth.uid() = author_id);

CREATE POLICY "Authenticated users can create news" ON news
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors and moderators can update news" ON news
    FOR UPDATE USING (
        auth.uid() = author_id OR 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('moderator', 'admin'))
    );

-- Topics 策略
CREATE POLICY "Topics are viewable by everyone" ON topics
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create topics" ON topics
    FOR INSERT WITH CHECK (auth.uid() = starter_id);

CREATE POLICY "Authors and moderators can update topics" ON topics
    FOR UPDATE USING (
        auth.uid() = starter_id OR 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('moderator', 'admin'))
    );

-- Comments 策略
CREATE POLICY "Comments are viewable by everyone" ON topic_comments
    FOR SELECT USING (NOT is_deleted);

CREATE POLICY "Authenticated users can create comments" ON topic_comments
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors and moderators can update comments" ON topic_comments
    FOR UPDATE USING (
        auth.uid() = author_id OR 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('moderator', 'admin'))
    );

-- News Comments 策略
CREATE POLICY "News comments are viewable by everyone" ON news_comments
    FOR SELECT USING (NOT is_deleted);

CREATE POLICY "Authenticated users can create news comments" ON news_comments
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors and moderators can update news comments" ON news_comments
    FOR UPDATE USING (
        auth.uid() = author_id OR 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('moderator', 'admin'))
    );

-- Sharespeare 策略
CREATE POLICY "Published sharespeare are viewable by everyone" ON sharespeare
    FOR SELECT USING (status = 'published' OR auth.uid() = author_id);

CREATE POLICY "Authenticated users can create sharespeare" ON sharespeare
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors and moderators can update sharespeare" ON sharespeare
    FOR UPDATE USING (
        auth.uid() = author_id OR 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('moderator', 'admin'))
    );

-- Sharespeare QnA 策略
CREATE POLICY "Sharespeare QnA are viewable by everyone" ON sharespeare_qna
    FOR SELECT USING (NOT is_deleted);

CREATE POLICY "Authenticated users can create sharespeare QnA" ON sharespeare_qna
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors and moderators can update sharespeare QnA" ON sharespeare_qna
    FOR UPDATE USING (
        auth.uid() = author_id OR 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('moderator', 'admin'))
    );

-- Picks 策略
CREATE POLICY "Picks are viewable by everyone" ON picks
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create picks" ON picks
    FOR INSERT WITH CHECK (auth.uid() = contributor);

CREATE POLICY "Contributors and moderators can update picks" ON picks
    FOR UPDATE USING (
        auth.uid() = contributor OR 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('moderator', 'admin'))
    );

-- Birthdays 策略
CREATE POLICY "Birthdays are viewable by everyone" ON birthdays
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create birthdays" ON birthdays
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners and moderators can update birthdays" ON birthdays
    FOR UPDATE USING (
        auth.uid() = owner_id OR 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('moderator', 'admin'))
    );

-- Exams 策略
CREATE POLICY "Published exams are viewable by everyone" ON exams
    FOR SELECT USING (published = true);

CREATE POLICY "Moderators can create exams" ON exams
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('moderator', 'admin'))
    );

CREATE POLICY "Moderators can update exams" ON exams
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('moderator', 'admin'))
    );

-- Submissions 策略
CREATE POLICY "Users can view their own submissions" ON submissions
    FOR SELECT USING (auth.uid() = submitter_id);

CREATE POLICY "Moderators can view all submissions" ON submissions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('moderator', 'admin'))
    );

CREATE POLICY "Authenticated users can create submissions" ON submissions
    FOR INSERT WITH CHECK (auth.uid() = submitter_id);

CREATE POLICY "Moderators can update submissions" ON submissions
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('moderator', 'admin'))
    );

-- 创建存储桶
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true);

-- 存储策略
CREATE POLICY "Anyone can view uploads" ON storage.objects
    FOR SELECT USING (bucket_id = 'uploads');

CREATE POLICY "Authenticated users can upload files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'uploads' AND 
        auth.role() = 'authenticated'
    );

CREATE POLICY "Users can update their own uploads" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'uploads' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own uploads" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'uploads' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- 创建自动插入 profile 的触发器
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, role)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name', 'member');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();