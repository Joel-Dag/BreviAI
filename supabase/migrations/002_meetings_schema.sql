-- RecapAI Step 3: meetings, transcripts, summaries, action_items

create type public.meeting_status as enum (
  'uploading',
  'transcribing',
  'summarizing',
  'done',
  'failed'
);

create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'Untitled meeting',
  audio_file_path text,
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  status public.meeting_status not null default 'uploading',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.transcripts (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null unique references public.meetings (id) on delete cascade,
  full_text text not null,
  raw_groq_response jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.summaries (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null unique references public.meetings (id) on delete cascade,
  executive_summary text not null,
  key_topics jsonb not null default '[]'::jsonb,
  decisions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.action_items (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings (id) on delete cascade,
  description text not null,
  owner_name text,
  due_date date,
  is_confident boolean not null default true,
  is_completed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index meetings_user_id_created_at_idx
  on public.meetings (user_id, created_at desc);

create index meetings_user_id_status_idx
  on public.meetings (user_id, status);

create index action_items_meeting_id_idx
  on public.action_items (meeting_id);

create or replace function public.user_owns_meeting(meeting_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.meetings
    where id = meeting_uuid
      and user_id = auth.uid()
  );
$$;

create or replace function public.handle_meetings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger on_meetings_updated
  before update on public.meetings
  for each row
  execute function public.handle_meetings_updated_at();

create or replace function public.handle_action_items_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger on_action_items_updated
  before update on public.action_items
  for each row
  execute function public.handle_action_items_updated_at();

alter table public.meetings enable row level security;
alter table public.transcripts enable row level security;
alter table public.summaries enable row level security;
alter table public.action_items enable row level security;

create policy "Users can view own meetings"
  on public.meetings
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own meetings"
  on public.meetings
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own meetings"
  on public.meetings
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own meetings"
  on public.meetings
  for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can view transcripts for own meetings"
  on public.transcripts
  for select
  to authenticated
  using (public.user_owns_meeting(meeting_id));

create policy "Users can insert transcripts for own meetings"
  on public.transcripts
  for insert
  to authenticated
  with check (public.user_owns_meeting(meeting_id));

create policy "Users can update transcripts for own meetings"
  on public.transcripts
  for update
  to authenticated
  using (public.user_owns_meeting(meeting_id))
  with check (public.user_owns_meeting(meeting_id));

create policy "Users can delete transcripts for own meetings"
  on public.transcripts
  for delete
  to authenticated
  using (public.user_owns_meeting(meeting_id));

create policy "Users can view summaries for own meetings"
  on public.summaries
  for select
  to authenticated
  using (public.user_owns_meeting(meeting_id));

create policy "Users can insert summaries for own meetings"
  on public.summaries
  for insert
  to authenticated
  with check (public.user_owns_meeting(meeting_id));

create policy "Users can update summaries for own meetings"
  on public.summaries
  for update
  to authenticated
  using (public.user_owns_meeting(meeting_id))
  with check (public.user_owns_meeting(meeting_id));

create policy "Users can delete summaries for own meetings"
  on public.summaries
  for delete
  to authenticated
  using (public.user_owns_meeting(meeting_id));

create policy "Users can view action items for own meetings"
  on public.action_items
  for select
  to authenticated
  using (public.user_owns_meeting(meeting_id));

create policy "Users can insert action items for own meetings"
  on public.action_items
  for insert
  to authenticated
  with check (public.user_owns_meeting(meeting_id));

create policy "Users can update action items for own meetings"
  on public.action_items
  for update
  to authenticated
  using (public.user_owns_meeting(meeting_id))
  with check (public.user_owns_meeting(meeting_id));

create policy "Users can delete action items for own meetings"
  on public.action_items
  for delete
  to authenticated
  using (public.user_owns_meeting(meeting_id));
