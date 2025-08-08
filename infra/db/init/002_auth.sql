-- Usuarios para autenticación básica
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);
create unique index if not exists idx_users_email on users(email);
