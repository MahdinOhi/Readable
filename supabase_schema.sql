-- Supabase SQL Schema for Readable App
-- Paste this into your Supabase SQL Editor (https://database.supabase.com/)

-- 1. Create Articles Table
create table public.articles (
  id text not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  url text not null,
  title text not null,
  byline text,
  site_name text,
  excerpt text,
  content_html text not null,
  timestamp bigint not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  primary key (id, user_id)
);

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
  id text not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  article_id text not null,
  color text not null,
  text text not null,
  start_xpath text not null,
  start_offset integer not null,
  end_xpath text not null,
  end_offset integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,

  primary key (id, user_id)
);

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
