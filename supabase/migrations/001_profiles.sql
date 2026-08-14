-- RecapAI Step 2: profiles table + auto-create on signup

create type public.plan_tier as enum ('free', 'pro', 'team');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text,
  plan_tier public.plan_tier not null default 'free',
  usage_minutes_this_period integer not null default 0,
  period_reset_at timestamptz not null default (
    date_trunc('month', timezone('utc', now())) + interval '1 month'
  ),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

create or replace function public.handle_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger on_profiles_updated
  before update on public.profiles
  for each row
  execute function public.handle_profiles_updated_at();
