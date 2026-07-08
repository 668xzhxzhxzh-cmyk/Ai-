create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text,
  role text not null default 'member' check (role in ('member', 'admin')),
  name text,
  language text not null default 'zh' check (language in ('zh', 'en')),
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists email text;

create table if not exists public.member_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  age int not null,
  gender text not null,
  height numeric not null,
  weight numeric not null,
  target_weight numeric not null,
  goal text not null,
  experience text not null,
  training_days_per_week int not null,
  training_time_per_session int not null,
  equipment text not null,
  diet_preference text,
  food_restrictions text,
  schedule text,
  has_injury boolean not null default false,
  injury_area text,
  pain_level int not null default 0,
  discomfort text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_content text not null,
  week_start date,
  need_human_review boolean not null default false,
  review_reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.nutrition_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_content text not null,
  need_human_review boolean not null default false,
  review_reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  weight numeric,
  training_completed boolean not null default false,
  training_completion_rate int not null default 0,
  diet_completion_rate int not null default 0,
  sleep_hours numeric not null default 0,
  fatigue_level int not null default 0,
  pain_level int not null default 0,
  mood text,
  notes text,
  image_urls text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique(user_id, date)
);

create table if not exists public.ai_daily_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  checkin_id uuid not null references public.daily_checkins(id) on delete cascade,
  review_content text not null,
  need_human_review boolean not null default false,
  review_reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.weekly_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  week_end date not null,
  report_content text not null,
  need_human_review boolean not null default false,
  review_reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  need_human_review boolean not null default false,
  review_reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  description text not null,
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_member_profiles_updated_at on public.member_profiles;
create trigger set_member_profiles_updated_at
before update on public.member_profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, role, language)
  values (new.id, new.email, 'member', 'zh')
  on conflict (user_id) do update
    set email = excluded.email
    where public.profiles.email is distinct from excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.protect_member_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and auth.uid() = old.user_id and not public.is_admin() then
    new.id = old.id;
    new.user_id = old.user_id;
    new.email = old.email;
    new.role = old.role;
    new.created_at = old.created_at;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_member_profile_role on public.profiles;
create trigger protect_member_profile_role
before update on public.profiles
for each row execute function public.protect_member_profile_role();

insert into public.profiles (user_id, email, role, language)
select users.id, users.email, 'member', 'zh'
from auth.users as users
on conflict (user_id) do update
  set email = excluded.email
  where public.profiles.email is distinct from excluded.email;

alter table public.profiles enable row level security;
alter table public.member_profiles enable row level security;
alter table public.training_plans enable row level security;
alter table public.nutrition_plans enable row level security;
alter table public.daily_checkins enable row level security;
alter table public.ai_daily_reviews enable row level security;
alter table public.weekly_reports enable row level security;
alter table public.ai_chat_messages enable row level security;
alter table public.admin_tasks enable row level security;

drop policy if exists "profiles own select" on public.profiles;
create policy "profiles own select" on public.profiles for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists "profiles own update" on public.profiles;
create policy "profiles own update" on public.profiles for update using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "member_profiles own all" on public.member_profiles;
create policy "member_profiles own all" on public.member_profiles for all using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "training_plans own select" on public.training_plans;
drop policy if exists "training_plans own all" on public.training_plans;
create policy "training_plans own all" on public.training_plans for all using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "nutrition_plans own select" on public.nutrition_plans;
drop policy if exists "nutrition_plans own all" on public.nutrition_plans;
create policy "nutrition_plans own all" on public.nutrition_plans for all using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "daily_checkins own all" on public.daily_checkins;
create policy "daily_checkins own all" on public.daily_checkins for all using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "ai_daily_reviews own select" on public.ai_daily_reviews;
drop policy if exists "ai_daily_reviews own all" on public.ai_daily_reviews;
create policy "ai_daily_reviews own all" on public.ai_daily_reviews for all using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "weekly_reports own select" on public.weekly_reports;
drop policy if exists "weekly_reports own all" on public.weekly_reports;
create policy "weekly_reports own all" on public.weekly_reports for all using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "ai_chat_messages own all" on public.ai_chat_messages;
create policy "ai_chat_messages own all" on public.ai_chat_messages for all using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "admin_tasks own select" on public.admin_tasks;
drop policy if exists "admin_tasks own all" on public.admin_tasks;
create policy "admin_tasks own select" on public.admin_tasks for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists "admin_tasks admin update" on public.admin_tasks;
drop policy if exists "admin_tasks admin all" on public.admin_tasks;
create policy "admin_tasks admin all" on public.admin_tasks for all using (public.is_admin()) with check (public.is_admin());

create index if not exists idx_member_profiles_user_id on public.member_profiles(user_id);
create index if not exists idx_profiles_user_id on public.profiles(user_id);
create index if not exists idx_profiles_email_lower on public.profiles(lower(email));
create index if not exists idx_daily_checkins_user_date on public.daily_checkins(user_id, date desc);
create index if not exists idx_admin_tasks_status on public.admin_tasks(status, created_at desc);
create index if not exists idx_training_plans_user_created on public.training_plans(user_id, created_at desc);
create index if not exists idx_nutrition_plans_user_created on public.nutrition_plans(user_id, created_at desc);

-- Set the first administrator after that user has signed up:
-- update public.profiles
-- set role = 'admin'
-- where lower(email) = lower('你的管理员邮箱@example.com');
