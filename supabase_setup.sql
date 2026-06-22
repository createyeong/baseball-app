-- Supabase SQL Editor에서 실행하세요.
-- 중요: 아래 CHANGE_THIS_TO_A_LONG_PASSWORD 값만 본인 비밀번호로 바꾸세요.
-- 실제 비밀번호가 들어간 이 파일은 Git에 커밋하지 마세요.

create schema if not exists private;
revoke all on schema private from public;

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.predictions (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  team text not null,
  score_doosan int not null default 0,
  score_kia int not null default 0,
  cheer text,
  created_at timestamptz not null default now()
);

create table if not exists public.live_score (
  id int primary key default 1,
  d int,
  k int,
  inning int,
  half text not null default '초',
  status text not null default '경기 전',
  predictions_locked boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.live_score
  add column if not exists predictions_locked boolean not null default false;

insert into public.live_score (id, d, k, inning, half, status, predictions_locked)
values (1, null, null, null, '초', '경기 전', false)
on conflict (id) do nothing;

alter table public.predictions drop constraint if exists predictions_valid_name;
alter table public.predictions add constraint predictions_valid_name
  check (char_length(btrim(name)) between 1 and 10);
alter table public.predictions drop constraint if exists predictions_valid_team;
alter table public.predictions add constraint predictions_valid_team
  check (team in ('두산', '기아'));
alter table public.predictions drop constraint if exists predictions_valid_scores;
alter table public.predictions add constraint predictions_valid_scores
  check (score_doosan between 0 and 30 and score_kia between 0 and 30);
alter table public.predictions drop constraint if exists predictions_valid_cheer;
alter table public.predictions add constraint predictions_valid_cheer
  check (cheer is null or char_length(cheer) <= 30);

alter table public.live_score drop constraint if exists live_score_valid_values;
alter table public.live_score add constraint live_score_valid_values check (
  (d is null or d between 0 and 30)
  and (k is null or k between 0 and 30)
  and (inning is null or inning between 1 and 30)
  and half in ('초', '말')
  and status in ('경기 전', '진행 중', '경기 종료')
);

create table if not exists private.app_secrets (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

do $$
declare
  v_password constant text := 'CHANGE_THIS_TO_A_LONG_PASSWORD';
begin
  if v_password = 'CHANGE_THIS_TO_A_LONG_PASSWORD' or char_length(v_password) < 8 then
    raise exception '관리자 비밀번호를 8자 이상으로 바꾼 뒤 다시 실행하세요.';
  end if;

  insert into private.app_secrets (key, value, updated_at)
  values ('admin_password_hash', crypt(v_password, gen_salt('bf', 12)), now())
  on conflict (key) do update
    set value = excluded.value, updated_at = excluded.updated_at;
end
$$;

create or replace function private.admin_password_ok(p_password text)
returns boolean
language sql
stable
security definer
set search_path = private, extensions, public
as $$
  select exists (
    select 1
    from private.app_secrets
    where key = 'admin_password_hash'
      and crypt(p_password, value) = value
  );
$$;

revoke all on function private.admin_password_ok(text) from public;

create or replace function public.admin_check_password(p_password text)
returns boolean
language sql
security definer
set search_path = private, extensions, public
as $$
  select private.admin_password_ok(p_password);
$$;

create or replace function public.admin_update_score(
  p_password text,
  p_d int,
  p_k int,
  p_inning int,
  p_half text,
  p_status text
)
returns boolean
language plpgsql
security definer
set search_path = private, extensions, public
as $$
begin
  if not private.admin_password_ok(p_password) then return false; end if;
  if p_d not between 0 and 30
    or p_k not between 0 and 30
    or p_inning not between 1 and 30
    or p_half not in ('초', '말')
    or p_status not in ('경기 전', '진행 중', '경기 종료')
  then
    raise exception '유효하지 않은 경기 정보입니다.';
  end if;

  update public.live_score
  set d = p_d, k = p_k, inning = p_inning, half = p_half,
      status = p_status, updated_at = now()
  where id = 1;
  return true;
end
$$;

create or replace function public.admin_set_predictions_locked(
  p_password text,
  p_locked boolean
)
returns boolean
language plpgsql
security definer
set search_path = private, extensions, public
as $$
begin
  if not private.admin_password_ok(p_password) then return false; end if;
  update public.live_score
  set predictions_locked = p_locked, updated_at = now()
  where id = 1;
  return true;
end
$$;

create or replace function public.admin_delete_prediction(
  p_password text,
  p_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = private, extensions, public
as $$
declare
  v_deleted int;
begin
  if not private.admin_password_ok(p_password) then return false; end if;
  delete from public.predictions where id = p_id;
  get diagnostics v_deleted = row_count;
  return v_deleted = 1;
end
$$;

alter table public.predictions enable row level security;
alter table public.live_score enable row level security;

drop policy if exists "public read predictions" on public.predictions;
drop policy if exists "public insert predictions" on public.predictions;
drop policy if exists "public update predictions" on public.predictions;
drop policy if exists "public delete predictions" on public.predictions;
drop policy if exists "public read live_score" on public.live_score;
drop policy if exists "public upsert live_score" on public.live_score;
drop policy if exists "public update live_score" on public.live_score;

create policy "public read predictions"
  on public.predictions for select using (true);
create policy "public insert predictions"
  on public.predictions for insert
  with check (
    not exists (
      select 1 from public.live_score
      where id = 1 and predictions_locked = true
    )
  );
create policy "public read live_score"
  on public.live_score for select using (true);

revoke update, delete on public.predictions from anon, authenticated;
revoke insert, update, delete on public.live_score from anon, authenticated;
grant select, insert on public.predictions to anon, authenticated;
grant select on public.live_score to anon, authenticated;

revoke all on function public.admin_check_password(text) from public;
revoke all on function public.admin_update_score(text, int, int, int, text, text) from public;
revoke all on function public.admin_set_predictions_locked(text, boolean) from public;
revoke all on function public.admin_delete_prediction(text, uuid) from public;
grant execute on function public.admin_check_password(text) to anon, authenticated;
grant execute on function public.admin_update_score(text, int, int, int, text, text) to anon, authenticated;
grant execute on function public.admin_set_predictions_locked(text, boolean) to anon, authenticated;
grant execute on function public.admin_delete_prediction(text, uuid) to anon, authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'predictions'
  ) then
    alter publication supabase_realtime add table public.predictions;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'live_score'
  ) then
    alter publication supabase_realtime add table public.live_score;
  end if;
end
$$;
