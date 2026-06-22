-- 1. predictions 테이블
create table if not exists predictions (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  team text not null,
  score_doosan int not null default 0,
  score_kia int not null default 0,
  cheer text,
  created_at timestamptz default now()
);

-- 2. live_score 테이블 (항상 id=1 행 하나만 사용)
create table if not exists live_score (
  id int primary key default 1,
  d int,
  k int,
  inning int,
  half text default '초',
  status text default '경기 전',
  updated_at timestamptz default now()
);

-- 초기값 삽입
insert into live_score (id, d, k, inning, half, status)
values (1, null, null, null, '초', '경기 전')
on conflict (id) do nothing;

-- 3. RLS 활성화 (공개 읽기/쓰기)
alter table predictions enable row level security;
alter table live_score enable row level security;

create policy "public read predictions" on predictions for select using (true);
create policy "public insert predictions" on predictions for insert with check (true);
create policy "public update predictions" on predictions for update using (true);

create policy "public read live_score" on live_score for select using (true);
create policy "public upsert live_score" on live_score for insert with check (true);
create policy "public update live_score" on live_score for update using (true);
