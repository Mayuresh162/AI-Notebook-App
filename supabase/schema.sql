-- Production schema for AI Notebook.
-- Review and run manually in the Supabase SQL editor or migration tooling.
-- Do not apply this automatically from application code.

create extension if not exists vector;
create extension if not exists pgcrypto;

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  embedding vector(1536) not null,
  metadata jsonb not null default '{}'::jsonb,
  env text not null default 'prod',
  created_at timestamptz not null default now()
);

create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('google', 'notion')),
  access_token text not null,
  refresh_token text,
  last_synced_at timestamptz,
  env text not null default 'prod',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create index if not exists documents_user_env_created_idx
  on public.documents (user_id, env, created_at desc);

create index if not exists documents_metadata_source_idx
  on public.documents ((metadata->>'source'));

create index if not exists documents_embedding_idx
  on public.documents
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create index if not exists integrations_user_provider_idx
  on public.integrations (user_id, provider);

alter table public.documents enable row level security;
alter table public.integrations enable row level security;

create policy "Users can read their own documents"
  on public.documents
  for select
  using (auth.uid() = user_id);

create policy "Users can create their own documents"
  on public.documents
  for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own documents"
  on public.documents
  for delete
  using (auth.uid() = user_id);

create policy "Users can read their own integrations"
  on public.integrations
  for select
  using (auth.uid() = user_id);

create policy "Users can create their own integrations"
  on public.integrations
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own integrations"
  on public.integrations
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own integrations"
  on public.integrations
  for delete
  using (auth.uid() = user_id);

create table if not exists public.threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  sources jsonb,
  created_at timestamptz not null default now()
);

create index if not exists threads_user_updated_idx
  on public.threads (user_id, updated_at desc);

create index if not exists messages_thread_created_idx
  on public.messages (thread_id, created_at desc);

create index if not exists messages_user_created_idx
  on public.messages (user_id, created_at desc);

alter table public.threads enable row level security;
alter table public.messages enable row level security;

create policy "Users can read their own threads"
  on public.threads
  for select
  using (auth.uid() = user_id);

create policy "Users can create their own threads"
  on public.threads
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own threads"
  on public.threads
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own threads"
  on public.threads
  for delete
  using (auth.uid() = user_id);

create policy "Users can read their own messages"
  on public.messages
  for select
  using (auth.uid() = user_id);

create policy "Users can create their own messages"
  on public.messages
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.threads
      where threads.id = messages.thread_id
        and threads.user_id = auth.uid()
    )
  );

create policy "Users can update their own messages"
  on public.messages
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own messages"
  on public.messages
  for delete
  using (auth.uid() = user_id);

create table if not exists public.source_upload_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  filename text not null,
  mime_type text,
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 10485760),
  part_count integer not null check (part_count > 0),
  received_parts integer not null default 0 check (received_parts >= 0),
  status text not null default 'uploading'
    check (status in ('uploading', 'queued', 'processing', 'completed', 'failed')),
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.source_upload_parts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.source_upload_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  part_number integer not null check (part_number > 0),
  storage_path text not null,
  size_bytes integer not null check (size_bytes > 0),
  checksum text not null,
  created_at timestamptz not null default now(),
  unique (session_id, part_number)
);

create table if not exists public.source_ingestion_jobs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.source_upload_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'queued'
    check (status in ('queued', 'processing', 'completed', 'failed')),
  attempts integer not null default 0 check (attempts >= 0),
  max_attempts integer not null default 3 check (max_attempts > 0),
  next_retry_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  error text,
  source_metadata jsonb,
  created_at timestamptz not null default now(),
  unique (session_id)
);

create table if not exists public.server_usage_counters (
  id uuid primary key default gen_random_uuid(),
  subject_key text not null,
  action text not null,
  window_start timestamptz not null,
  count bigint not null default 0 check (count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subject_key, action, window_start)
);

create index if not exists source_upload_sessions_user_status_idx
  on public.source_upload_sessions (user_id, status, updated_at desc);

create index if not exists source_upload_parts_session_idx
  on public.source_upload_parts (session_id, part_number);

create index if not exists source_ingestion_jobs_status_retry_idx
  on public.source_ingestion_jobs (status, next_retry_at, created_at);

create index if not exists source_ingestion_jobs_user_status_idx
  on public.source_ingestion_jobs (user_id, status, created_at desc);

create index if not exists server_usage_counters_lookup_idx
  on public.server_usage_counters (subject_key, action, window_start);

create or replace function public.consume_usage_limit(
  counter_subject_key text,
  counter_action text,
  counter_window_start timestamptz,
  counter_limit bigint,
  counter_amount bigint default 1
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  next_count bigint;
begin
  insert into public.server_usage_counters (
    subject_key,
    action,
    window_start,
    count
  )
  values (
    counter_subject_key,
    counter_action,
    counter_window_start,
    counter_amount
  )
  on conflict (subject_key, action, window_start)
  do update set
    count = public.server_usage_counters.count + counter_amount,
    updated_at = now()
  returning count into next_count;

  if next_count > counter_limit then
    update public.server_usage_counters
    set
      count = greatest(count - counter_amount, 0),
      updated_at = now()
    where subject_key = counter_subject_key
      and action = counter_action
      and window_start = counter_window_start;

    return false;
  end if;

  return true;
end;
$$;

alter table public.source_upload_sessions enable row level security;
alter table public.source_upload_parts enable row level security;
alter table public.source_ingestion_jobs enable row level security;
alter table public.server_usage_counters enable row level security;

create policy "Users can read their own upload sessions"
  on public.source_upload_sessions
  for select
  using (auth.uid() = user_id);

create policy "Users can create their own upload sessions"
  on public.source_upload_sessions
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own upload sessions"
  on public.source_upload_sessions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can read their own upload parts"
  on public.source_upload_parts
  for select
  using (auth.uid() = user_id);

create policy "Users can create their own upload parts"
  on public.source_upload_parts
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.source_upload_sessions
      where source_upload_sessions.id = source_upload_parts.session_id
        and source_upload_sessions.user_id = auth.uid()
    )
  );

create policy "Users can update their own upload parts"
  on public.source_upload_parts
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can read their own ingestion jobs"
  on public.source_ingestion_jobs
  for select
  using (auth.uid() = user_id);

create policy "Users can create their own ingestion jobs"
  on public.source_ingestion_jobs
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.source_upload_sessions
      where source_upload_sessions.id = source_ingestion_jobs.session_id
        and source_upload_sessions.user_id = auth.uid()
    )
  );

create policy "Users can update their own ingestion jobs"
  on public.source_ingestion_jobs
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('source-upload-parts', 'source-upload-parts', false)
on conflict (id) do nothing;

create policy "Users can manage their own source upload parts"
  on storage.objects
  for all
  using (
    bucket_id = 'source-upload-parts'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'source-upload-parts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create or replace function public.match_documents(
  query_embedding vector(1536),
  match_count int default 8,
  filter_source text default null,
  filter_sources text[] default null,
  filter_user_id uuid default null,
  filter_env text default null
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity double precision
)
language sql stable
as $$
  select
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from public.documents
  where (filter_user_id is null or documents.user_id = filter_user_id)
    and (filter_env is null or documents.env = filter_env)
    and (
      filter_source is null
      or documents.metadata->>'source' = filter_source
    )
    and (
      filter_sources is null
      or coalesce(documents.metadata->>'name', '') = any(filter_sources)
      or coalesce(documents.metadata->>'url', '') = any(filter_sources)
      or coalesce(documents.metadata->>'source', '') = any(filter_sources)
    )
  order by documents.embedding <=> query_embedding
  limit match_count;
$$;

create or replace function public.delete_documents_by_names(
  names text[],
  auth_user_id uuid,
  data_env text default null
)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.documents
  where user_id = auth_user_id
    and (data_env is null or env = data_env)
    and (
      metadata->>'name' = any(names)
      or metadata->>'url' = any(names)
      or metadata->>'source' = any(names)
    );
$$;

revoke all on function public.consume_usage_limit(text, text, timestamptz, bigint, bigint)
  from anon, authenticated;
revoke all on function public.delete_documents_by_names(text[], uuid, text)
  from anon, authenticated;
revoke all on function public.match_documents(vector, int, text, text[], uuid, text)
  from anon, authenticated;

grant execute on function public.consume_usage_limit(text, text, timestamptz, bigint, bigint)
  to service_role;
grant execute on function public.delete_documents_by_names(text[], uuid, text)
  to service_role;
grant execute on function public.match_documents(vector, int, text, text[], uuid, text)
  to service_role;

grant select, insert, update, delete on public.documents to authenticated;
grant select, insert, update, delete on public.integrations to authenticated;
grant select, insert, update, delete on public.threads to authenticated;
grant select, insert, update, delete on public.messages to authenticated;
grant select, insert, update on public.source_upload_sessions to authenticated;
grant select, insert, update on public.source_upload_parts to authenticated;
grant select, insert, update on public.source_ingestion_jobs to authenticated;
