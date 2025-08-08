// Shared types, utils and sample data ported from APP.tsx (RN-friendly)
import { Platform } from 'react-native';

// —— Tipos básicos
export type EJEvent = {
  id: string;
  source: 'google' | 'outlook' | 'internal';
  title: string;
  description?: string;
  start: string; // ISO
  end: string;   // ISO
  timezone?: string;
  priority?: number; // 1-5
  difficulty?: number; // 1-5
  goal_id?: string;
  subobjectives?: string[];
  status?: 'planned' | 'in_progress' | 'done' | 'blocked';
  dod?: string;
};

export type ScheduleCategory = 'Estudio' | 'Trabajo' | 'Focus' | 'Ejercicio' | 'Descanso' | 'Otro';
export type ScheduleRule = {
  id: string;
  category: ScheduleCategory;
  day: 0|1|2|3|4|5|6; // 0=Lun..6=Dom
  start: string; // HH:MM
  end: string;   // HH:MM
  priority?: number;    // 1-5
  difficulty?: number;  // 1-5
};

export type Salutation = 'Sr Presidente' | 'Sra Presidenta';

export type EJProfile = {
  name: string;
  timezone: string;
  salutation: Salutation;
  notificationIntensity: 'Suave'|'Media'|'Intensa';
  schedule: ScheduleRule[];
};

// —— Utilidades fecha
export function ymd(d: Date) { return d.toISOString().slice(0,10); }
export function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
export function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth()+1, 0); }
export function buildMonthMatrix(anchor: Date) {
  const first = startOfMonth(anchor);
  const daysInMonth = endOfMonth(anchor).getDate();
  const jsDow = first.getDay(); // 0..6 (Dom..Sab)
  const dow = (jsDow + 6) % 7;  // 0..6 (Lun..Dom)
  const rows: number[][] = [];
  let current = 1 - dow;
  while (true) {
    const row: number[] = [];
    for (let i=0; i<7; i++) { row.push(current); current++; }
    rows.push(row);
    if (current > daysInMonth) break;
  }
  return rows.map(r => r.map(n => (n>=1 && n<=daysInMonth) ? n : 0));
}

export const DOW_LABELS = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
export function t2m(t: string){ const [h,m] = t.split(':').map(Number); return h*60 + (m||0); }
export function overlap(aStart: string, aEnd: string, bStart: string, bEnd: string){
  const A = t2m(aStart), B = t2m(aEnd), C = t2m(bStart), D = t2m(bEnd);
  return Math.max(A, C) < Math.min(B, D);
}
export function validateSchedule(rules: ScheduleRule[]): { ok: boolean; issues: string[] }{
  const issues: string[] = [];
  for (const r of rules) if (t2m(r.start) >= t2m(r.end)) issues.push(`Rango inválido ${r.start}-${r.end} en ${DOW_LABELS[r.day]}`);
  for (let d=0; d<7; d++){
    const dayRules = rules.filter(r => r.day === d);
    for (let i=0; i<dayRules.length; i++){
      for (let j=i+1; j<dayRules.length; j++){
        const A = dayRules[i], B = dayRules[j];
        if (overlap(A.start, A.end, B.start, B.end)) issues.push(`Solape en ${DOW_LABELS[d]}: ${A.start}-${A.end} con ${B.start}-${B.end}`);
      }
    }
  }
  return { ok: issues.length === 0, issues };
}

export function normalizeSalutation(input: string): Salutation{
  const v = (input||'').toLowerCase().trim();
  if (v.includes('sra')) return 'Sra Presidenta';
  if (v.includes('sr') || v.includes('mr')) return 'Sr Presidente';
  return 'Sr Presidente';
}
export function helloLineForSalutation(s: string){
  const norm = normalizeSalutation(s as any);
  return `Hola ${norm}`;
}
export function loadSalutation(): Salutation{
  // Placeholder (podríamos leer de almacenamiento local/backend)
  return Platform.OS === 'ios' ? 'Sra Presidenta' : 'Sr Presidente';
}

// —— Datos mock eventos (dos eventos en 2025-08-09 para tests)
export const sampleEvents: EJEvent[] = [
  {
    id: 'evt_1', source: 'internal', title: 'Brainstorming chalecos', description: 'Moodboard FW25',
    start: '2025-08-09T10:00:00-04:00', end: '2025-08-09T11:00:00-04:00', timezone: 'America/Santiago',
    priority: 4, difficulty: 3, status: 'planned', dod: '2 ideas viables y 1 moodboard base'
  },
  {
    id: 'evt_2', source: 'internal', title: 'Reunión proveedor telas', description: 'Cotizaciones iniciales',
    start: '2025-08-09T15:00:00-04:00', end: '2025-08-09T16:00:00-04:00', timezone: 'America/Santiago',
    priority: 3, difficulty: 2, status: 'planned', dod: 'Solicitar 3 muestras'
  },
  {
    id: 'evt_3', source: 'internal', title: 'Clase de alemán', description: 'Unidad 3',
    start: '2025-08-10T09:00:00-04:00', end: '2025-08-10T10:00:00-04:00', timezone: 'America/Santiago',
    priority: 2, difficulty: 2, status: 'planned'
  },
];

// Expo Router considera los archivos bajo app/ como rutas. Para evitar avisos,
// exportamos un componente por defecto nulo. Los exports nombrados siguen igual.
export default function SharedModuleScreen(){ return null; }
