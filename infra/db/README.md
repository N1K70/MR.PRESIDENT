# Infraestructura de Base de Datos (PostgreSQL)

Este entorno levanta un PostgreSQL listo para desarrollo, con el esquema inicial de MR.PRESIDENT.

## Estructura
- `docker-compose.yml`: define el servicio `postgres` (imagen 16-alpine).
- `.env`: credenciales locales (usuario, password, base).
- `init/001_schema.sql`: esquema inicial (se ejecuta automáticamente al crear el contenedor).
- `data/`: volumen de datos persistentes (se crea al levantar el contenedor).

## Requisitos
- Docker Desktop o Docker + Docker Compose.

## Levantar la base
```bash
cd infra/db
docker compose up -d
```
- Puerto host: `5433` → contenedor: `5432`.
- Usuario/base por defecto en `.env`.

Comprobar conexión (psql):
```bash
psql "postgresql://mrpresident:devpassword@localhost:5433/mrpresident"
```

Detener:
```bash
docker compose down
```

Recrear desde cero (elimina datos):
```bash
docker compose down -v && rm -rf data && docker compose up -d
```

## Esquema
Ver `init/001_schema.sql`. Resumen de tablas principales:
- `profiles` y `schedule_rules` (perfil y horarios por día 0..6).
- `goals` y `subobjectives` (metas y sub‑objetivos).
- `events` (eventos de calendario) + relación `event_subobjectives`.
- `notification_plans` (planes de notificación polimórficos con `triggers` JSONB).

Tipos enumerados clave: `source_type`, `event_status_type`, `salutation_type`, `schedule_category`, `subobjective_state`, etc.
