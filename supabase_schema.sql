-- SurakshaCare database schema for Supabase
-- Run this once in Supabase Dashboard -> SQL Editor.
-- No service_role key is needed in the website.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  mobile text,
  role text not null check (role in ('customer','technician','admin')),
  skills text,
  created_at timestamptz not null default now()
);

create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null,
  product text not null,
  approx_value numeric(12,2) default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan text not null,
  price numeric(12,2) not null default 0,
  checkups integer not null default 0,
  terms_accepted_at timestamptz,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  technician_id uuid references public.profiles(id) on delete set null,
  request_code text unique not null,
  type text,
  device text,
  problem text,
  priority text,
  location text,
  preferred_time timestamptz,
  status text not null default 'Technician requested',
  created_at timestamptz not null default now()
);

create table if not exists public.health_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  device text not null,
  score integer not null,
  usage text,
  previous_issues text,
  created_at timestamptz not null default now()
);

create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  complaint_code text unique not null,
  type text,
  message text not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  service_id text,
  rating integer not null check (rating between 1 and 5),
  comment text not null,
  created_at timestamptz not null default now()
);

-- Automatically create a profile after Supabase Auth creates a user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, mobile, role, skills)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name',''),
    new.raw_user_meta_data->>'mobile',
    case when new.raw_user_meta_data->>'role' = 'technician' then 'technician' else 'customer' end,
    new.raw_user_meta_data->>'skills'
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    mobile = excluded.mobile,
    role = excluded.role,
    skills = excluded.skills;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Enable Row Level Security.
alter table public.profiles enable row level security;
alter table public.devices enable row level security;
alter table public.memberships enable row level security;
alter table public.service_requests enable row level security;
alter table public.health_assessments enable row level security;
alter table public.complaints enable row level security;
alter table public.reviews enable row level security;

-- Profiles: users can read their own profile. New users can create only customer/technician profiles.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self" on public.profiles for insert with check (auth.uid() = id and role in ('customer','technician'));

-- Devices.
drop policy if exists "devices_own_all" on public.devices;
create policy "devices_own_all" on public.devices for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Memberships.
drop policy if exists "memberships_own_all" on public.memberships;
create policy "memberships_own_all" on public.memberships for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Service requests: customers can create/read their own requests.
drop policy if exists "requests_own_all" on public.service_requests;
create policy "requests_own_all" on public.service_requests for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Health assessments.
drop policy if exists "health_own_all" on public.health_assessments;
create policy "health_own_all" on public.health_assessments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Complaints.
drop policy if exists "complaints_own_all" on public.complaints;
create policy "complaints_own_all" on public.complaints for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Reviews: customer owns their submitted review.
drop policy if exists "reviews_own_all" on public.reviews;
create policy "reviews_own_all" on public.reviews for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
