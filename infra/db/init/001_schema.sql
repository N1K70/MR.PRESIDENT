-- MR.PRESIDENT - PostgreSQL schema
-- Ejecutado automáticamente por Docker al inicializar el contenedor

create extension if not exists pgcrypto; -- para gen_random_uuid()

-- Tipos enumerados
create type source_type as enum ('google','outlook','internal');
create type event_status_type as enum ('planned','in_progress','done','blocked');
create type notification_type as enum ('nudge','deadline','start');
create type entity_type as enum ('goal','subobjective','event');
create type salutation_type as enum ('Sr Presidente','Sra Presidenta');
create type notification_intensity_type as enum ('Suave','Media','Intensa');
create type schedule_category as enum ('Estudio','Trabajo','Focus','Ejercicio','Descanso','Otro');
create type subobjective_state as enum ('todo','doing','done','blocked');

-- Perfiles de usuario
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null,
  salutation salutation_type not null,
  notification_intensity notification_intensity_type not null,
  created_at timestamptz not null default now()
);

-- Reglas de horario por día (0=Lun..6=Dom)
create table if not exists schedule_rules (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  category schedule_category not null,
  day smallint not null check (day between 0 and 6),
  start_time time not null,
  end_time time not null,
  priority int,
  difficulty int,
  created_at timestamptz not null default now(),
  check (start_time < end_time)
);
create index if not exists idx_schedule_rules_profile_day on schedule_rules(profile_id, day);

-- Metas
create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  why text[],
  target_date date,
  constraints_json jsonb,
  milestones text[],
  success_metric text,
  created_at timestamptz not null default now()
);

-- Sub-objetivos
create table if not exists subobjectives (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references goals(id) on delete cascade,
  title text not null,
  description text,
  difficulty int,
  priority int,
  estimate_min int,
  due date,
  state subobjective_state not null default 'todo',
  dod text,
  created_at timestamptz not null default now()
);
create index if not exists idx_subobjectives_goal on subobjectives(goal_id);

-- Eventos de calendario
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  source source_type not null,
  title text not null,
  description text,
  start timestamptz not null,
  "end" timestamptz not null,
  timezone text,
  priority int,
  difficulty int,
  goal_id uuid references goals(id) on delete set null,
  status event_status_type not null default 'planned',
  dod text,
  created_at timestamptz not null default now(),
  check (start < "end")
);
create index if not exists idx_events_start on events(start);

-- Relación N:M evento <-> sub-objetivo
create table if not exists event_subobjectives (
  event_id uuid not null references events(id) on delete cascade,
  subobjectives_id uuid not null references subobjectives(id) on delete cascade,
  primary key (event_id, subobjectives_id)
);

-- Planes de notificación (polimórfico)
create table if not exists notification_plans (
  id uuid primary key default gen_random_uuid(),
  entity_type entity_type not null,
  entity_id uuid not null,
  type notification_type not null,
  triggers jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_notification_plans_entity on notification_plans(entity_type, entity_id);

-- Vistas útiles (opcional)
create or replace view v_events_today as
select * from events
where start::date = now()::date
order by start;
