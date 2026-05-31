-- Supabase SQL Schema for Readable App
-- Paste this into your Supabase SQL Editor (https://database.supabase.com/)
-- 
-- IMPORTANT: If you already have a database set up with the old schema,
-- run the MIGRATION script at the bottom of this file INSTEAD of the
-- CREATE TABLE statements.
-- ============================================================


-- ============================================================
-- FRESH INSTALL (run these if starting from scratch)
-- ============================================================

-- 1. Create Articles Table
create table public.articles (
  id text primary key not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  url text not null,
  title text not null,
  byline text,
  site_name text,
  excerpt text,
  content_html text not null,
  timestamp bigint not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for fast per-user queries and for enforcing uniqueness per user
create unique index articles_id_user_id_idx on public.articles (id, user_id);

-- Enable RLS for Articles
alter table public.articles enable row level security;

-- Policies for Articles
create policy "Users can view their own articles"
  on public.articles for select
  using (auth.uid() = user_id);

create policy "Users can insert their own articles"
  on public.articles for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own articles"
  on public.articles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own articles"
  on public.articles for delete
  using (auth.uid() = user_id);


-- 2. Create Highlights Table
create table public.highlights (
  id text primary key not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  article_id text references public.articles(id) on delete cascade not null,
  color text not null,
  text text not null,
  start_xpath text not null,
  start_offset integer not null,
  end_xpath text not null,
  end_offset integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for fast per-user and per-article queries
create unique index highlights_id_user_id_idx on public.highlights (id, user_id);
create index highlights_article_id_idx on public.highlights (article_id);

-- Enable RLS for Highlights
alter table public.highlights enable row level security;

-- Policies for Highlights
create policy "Users can view their own highlights"
  on public.highlights for select
  using (auth.uid() = user_id);

create policy "Users can insert their own highlights"
  on public.highlights for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own highlights"
  on public.highlights for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own highlights"
  on public.highlights for delete
  using (auth.uid() = user_id);


-- ============================================================
-- MIGRATION (run these if you already have the OLD schema)
-- This fixes the composite primary key bug that prevented deletions.
-- ============================================================

-- Step 1: Drop the old composite primary key from articles
-- ALTER TABLE public.highlights DROP CONSTRAINT highlights_pkey;
-- ALTER TABLE public.articles DROP CONSTRAINT articles_pkey;

-- Step 2: Re-add a single-column primary key on id
-- ALTER TABLE public.articles ADD PRIMARY KEY (id);
-- ALTER TABLE public.highlights ADD PRIMARY KEY (id);

-- Step 3: Add unique index to retain (id, user_id) uniqueness
-- CREATE UNIQUE INDEX IF NOT EXISTS articles_id_user_id_idx ON public.articles (id, user_id);
-- CREATE UNIQUE INDEX IF NOT EXISTS highlights_id_user_id_idx ON public.highlights (id, user_id);

-- Step 4: Add cascade FK from highlights.article_id -> articles.id (optional, for auto-cleanup)
-- ALTER TABLE public.highlights 
--   ADD CONSTRAINT highlights_article_id_fkey 
--   FOREIGN KEY (article_id) REFERENCES public.articles(id) ON DELETE CASCADE;
