# MR.PRESIDENT

Asistente móvil para gestión de calendario, metas y recordatorios inteligentes.

## Estructura del repositorio
- `mobile/`: app móvil Expo (solo teléfonos) con tabs: `chat`, `calendar`, `profile`.
- `infra/db/`: entorno Docker para PostgreSQL (desarrollo), esquema SQL inicial.

## Estructura de datos (modelo lógico)

Tipos principales usados en la app (ver `mobile/app/shared.ts` y `mobile/app/store.tsx`):

```ts
// Evento de calendario (fuente unificada)
type EJEvent = {
  id: string;
  source: 'google' | 'outlook' | 'internal';
  title: string;
  description?: string;
  start: string; // ISO
  end: string;   // ISO
  timezone?: string;
  priority?: number;   // 1-5
  difficulty?: number; // 1-5
  goal_id?: string;
  subobjectives?: string[]; // ids
  status?: 'planned' | 'in_progress' | 'done' | 'blocked';
  dod?: string; // Definition of Done
};

type Goal = {
  id: string;
  title: string;
  why?: string[];
  target_date?: string; // YYYY-MM-DD
  constraints?: Record<string, any>;
  milestones?: string[];
  success_metric?: string;
};

type SubObjective = {
  id: string;
  goal_id: string;
  title: string;
  description?: string;
  difficulty?: number;
  priority?: number;
  estimate_min?: number;
  due?: string; // YYYY-MM-DD
  state?: 'todo'|'doing'|'done'|'blocked';
  dod?: string;
};

type NotificationPlan = {
  id: string;
  entity_id: string; // goal | subobjective | event
  type: 'nudge'|'deadline'|'start';
  triggers: Array<{ type: 'time_before_due'|'time_before_start'; minutes: number }>;
};

type ScheduleRule = {
  id: string;
  category: 'Estudio'|'Trabajo'|'Focus'|'Ejercicio'|'Descanso'|'Otro';
  day: 0|1|2|3|4|5|6; // 0=Lun..6=Dom
  start: string; // HH:MM
  end: string;   // HH:MM
  priority?: number;
  difficulty?: number;
};

type EJProfile = {
  name: string;
  timezone: string;
  salutation: 'Sr Presidente' | 'Sra Presidenta';
  notificationIntensity: 'Suave'|'Media'|'Intensa';
  schedule: ScheduleRule[];
};
```

El store global (`mobile/app/store.tsx`) mantiene:

- `events: EJEvent[]`
- `goals: Goal[]`
- `subobjectives: SubObjective[]`
- `plans: NotificationPlan[]`

con acciones de creación/actualización en memoria (para POC). El calendario usa `events`; el chat puede crear eventos desde el mensaje “crear evento…”.

## Modelo relacional (PostgreSQL)

Esquema en `infra/db/init/001_schema.sql`. Tablas principales:

- `profiles` y `schedule_rules` (preferencias y reglas por día 0..6, con validación de rangos en app).
- `goals`, `subobjectives` y `event_subobjectives` (N:M entre eventos y sub‑objetivos).
- `events` (status, DOD, prioridad/dificultad, referencias a goals).
- `notification_plans` (polimórfico via `entity_type`, `entity_id`, con `triggers` JSONB).

Enumerados clave: `source_type`, `event_status_type`, `salutation_type`, `notification_intensity_type`, `schedule_category`, `subobjective_state`, `notification_type`.

## UI y soporte notch/tamaños de pantalla

- Envolturas con `SafeAreaProvider` (root: `mobile/app/_layout.tsx`).
- `SafeAreaView` + `useSafeAreaInsets` en `chat.tsx`, `calendar.tsx`, `profile.tsx`.
- `KeyboardAvoidingView` en `chat.tsx` para evitar que el teclado tape el input.
- iOS tablet deshabilitado (`mobile/app.json` → `ios.supportsTablet=false`).

## Ejecutar la app móvil

```bash
cd mobile
npm install
npx expo start --tunnel
```

Escanea el QR con Expo Go (Android/iOS). Pestañas:

- Chat (crea evento con “crear evento …”)
- Calendario (ver eventos por día)
- Perfil (tratamiento, intensidad, horarios con validación)

## Levantar PostgreSQL con Docker

Requisitos: Docker Desktop.

```bash
cd infra/db
docker compose up -d
```

- Puerto host: `5433` (contenedor `5432`).
- Credenciales: ver `infra/db/.env`.
- Esquema inicial: `infra/db/init/001_schema.sql` (se aplica al crear el contenedor).

Conectar por `psql`:

```bash
psql "postgresql://mrpresident:devpassword@localhost:5433/mrpresident"
```

Reset completo (destruye datos locales):

```bash
docker compose down -v && rm -rf data && docker compose up -d
```

## Backend API (Express)

Ruta: `backend/`. Requiere que la base de datos esté arriba (ver sección anterior).

1) Copiar variables de entorno y editar si es necesario:

```bash
cd backend
cp .env.example .env
# Asegura DATABASE_URL apunta a localhost:5433 y setea un JWT_SECRET de desarrollo
```

2) Instalar dependencias y ejecutar en modo dev:

```bash
npm install
npm run dev
# API en http://localhost:4000
```

Endpoints:
- POST `/auth/register` { name, email, password } → { token }
- POST `/auth/login` { email, password } → { token }

## Conectar app móvil al backend

La app lee `EXPO_PUBLIC_API_URL` en tiempo de ejecución.

Opciones:
- `.env` (en `mobile/`):

```env
EXPO_PUBLIC_API_URL=http://localhost:4000
```

Luego:

```bash
cd mobile
npm install
npx expo start --tunnel
```

El guard de rutas en `mobile/app/_layout.tsx` mostrará `(auth)` si no hay token;
tras login/register, `setToken` habilita las tabs.

## Roadmap próximo

- Integración OAuth (Google/Microsoft) y sync de calendarios.
- Persistencia real (API/DB) para `profile`, `events`, `goals`, `subobjectives`.
- Notificaciones push (Expo Notifications) mapeadas a `notification_plans`.