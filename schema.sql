create table if not exists users(
  id serial primary key, email text unique not null, name text default '',
  password_hash text not null, created_at timestamptz default now());
create table if not exists events(
  id serial primary key, user_id int references users(id) on delete cascade,
  title text not null, place text default '', start_at timestamptz not null,
  remind_minutes int, remind_at timestamptz, notified boolean default false,
  source text default 'manual', created_at timestamptz default now());
create index if not exists events_user_start on events(user_id, start_at);
create index if not exists events_due on events(remind_at) where not notified;
create table if not exists push_subs(
  endpoint text primary key, user_id int references users(id) on delete cascade,
  sub jsonb not null);
