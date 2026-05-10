-- ============================================================================
-- Complete RLS Policies Setup for Study Planner
-- Run this script in Supabase SQL Editor to set up all required policies
-- Each user's data is isolated by their unique auth user ID
-- ============================================================================

-- ============================================================================
-- 1. PROFILES TABLE - Stores user profile data keyed by user ID
-- ============================================================================

create extension if not exists pgcrypto;

-- Create profiles table if it doesn't exist
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  username text not null,
  age integer,
  gender text,
  is_profile_complete boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Add updated_at trigger if it doesn't exist
create or replace function public.handle_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.handle_profiles_updated_at();

-- Enable RLS on profiles table
alter table public.profiles enable row level security;

-- Drop old policies if they exist
drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

-- Create RLS policies for profiles
-- Policy: Users can only read their own profile
create policy "Users can read own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

-- Policy: Users can only insert their own profile
create policy "Users can insert own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

-- Policy: Users can only update their own profile
create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ============================================================================
-- 2. PLANS TABLE - Stores user's study plans/tasks keyed by user ID
-- ============================================================================

-- Create plans table if it doesn't exist
create table if not exists public.plans (
  id bigint primary key generated always as identity,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  subject text,
  topic text,
  slot text,
  done boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(user_id, id)
);

-- Add updated_at trigger for plans if it doesn't exist
create or replace function public.handle_plans_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_plans_updated_at on public.plans;
create trigger set_plans_updated_at
before update on public.plans
for each row
execute function public.handle_plans_updated_at();

-- Create index on user_id for faster queries
create index if not exists idx_plans_user_id on public.plans(user_id);
create index if not exists idx_plans_created_at on public.plans(created_at desc);

-- Enable RLS on plans table
alter table public.plans enable row level security;

-- Drop old policies if they exist
drop policy if exists "Users can read own plans" on public.plans;
drop policy if exists "Users can create own plans" on public.plans;
drop policy if exists "Users can update own plans" on public.plans;
drop policy if exists "Users can delete own plans" on public.plans;

-- Create RLS policies for plans
-- Policy: Users can only read their own plans
create policy "Users can read own plans"
  on public.plans
  for select
  using (auth.uid() = user_id);

-- Policy: Users can only create plans for themselves
create policy "Users can create own plans"
  on public.plans
  for insert
  with check (auth.uid() = user_id);

-- Policy: Users can only update their own plans
create policy "Users can update own plans"
  on public.plans
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policy: Users can only delete their own plans
create policy "Users can delete own plans"
  on public.plans
  for delete
  using (auth.uid() = user_id);

-- ============================================================================
-- 3. VERIFICATION - Check current setup
-- ============================================================================

-- Verify profiles table exists and RLS is enabled
select 'Profiles table:' as item, to_jsonb(row_to_json(t)) as details
from (
  select 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
  from pg_tables 
  where schemaname = 'public' and tablename = 'profiles'
) t;

-- Verify plans table exists and RLS is enabled
select 'Plans table:' as item, to_jsonb(row_to_json(t)) as details
from (
  select 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
  from pg_tables 
  where schemaname = 'public' and tablename = 'plans'
) t;

-- Verify policies on profiles
select 'Profiles policies:' as item, 
       policyname, 
       qual as read_condition,
       with_check as write_condition
from pg_policies 
where schemaname = 'public' and tablename = 'profiles';

-- Verify policies on plans
select 'Plans policies:' as item, 
       policyname, 
       qual as read_condition,
       with_check as write_condition
from pg_policies 
where schemaname = 'public' and tablename = 'plans';
