// App — Mr. President (React Web/TSX preview — CDN-free, Material Design look)
// -----------------------------------------------------------------
// Estética Material Design clara + glass (blanco, celeste, nubes).
// 👉 Ahora con **3 pestañas**: Chat, Calendario y **Perfil** (config de horarios).
// Sin dependencias externas para evitar fallas de bundling.

import React, { useEffect, useMemo, useState, useRef } from 'react';

// —— Diseño (Material‑like, Light)
const tokens = {
  colors: {
    // Capa cielo (fondos)
    skyTop: '#E6F4FF',
    skyBottom: '#FFFFFF',
    cloud: 'rgba(255,255,255,0.75)',

    // Superficies y texto
    surfaceGlass: 'rgba(255,255,255,0.55)',
    surfaceGlassStrong: 'rgba(255,255,255,0.7)',
    stroke: 'rgba(255,255,255,0.65)',
    text: '#0F172A',      // slate-900
    subtext: '#475569',   // slate-600

    // Accentos Material
    primary: '#3B82F6',   // blue‑500
    primaryContainer: '#DCEBFF',
    secondary: '#38BDF8', // sky‑400
    success: '#16A34A',
    danger: '#EF4444',
    accent: '#60A5FA'
  },
  radius: { sm: 10, md: 14, lg: 20, xl: 28, xxl: 36 },
  spacing: { xs: 6, sm: 10, md: 14, lg: 18, xl: 24, xxl: 32 },
  elevation: {
    1: '0 1px 2px rgba(0,0,0,0.06), 0 1px 1px rgba(0,0,0,0.04)',
    2: '0 3px 6px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.06)',
    3: '0 8px 20px rgba(0,0,0,0.10)'
  }
};

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
  day: 0|1|2|3|4|5|6; // 0=Dom..6=Sab o 0=Lun? Usaremos 0=Lun aquí para consistencia con vista (L..D)
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
function ymd(d: Date) { return d.toISOString().slice(0,10); }
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth()+1, 0); }
function buildMonthMatrix(anchor: Date) {
  const first = startOfMonth(anchor);
  const daysInMonth = endOfMonth(anchor).getDate();
  // getDay(): 0=Dom → Lunes=0…Domingo=6 (transform)
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

// —— Utilidades horario
const DOW_LABELS = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']; // 0..6
function t2m(t: string){ const [h,m] = t.split(':').map(Number); return h*60 + (m||0); }
function overlap(aStart: string, aEnd: string, bStart: string, bEnd: string){
  const A = t2m(aStart), B = t2m(aEnd), C = t2m(bStart), D = t2m(bEnd);
  return Math.max(A, C) < Math.min(B, D);
}
function validateSchedule(rules: ScheduleRule[]): { ok: boolean; issues: string[] }{
  const issues: string[] = [];
  for (const r of rules) if (t2m(r.start) >= t2m(r.end)) issues.push(`Rango inválido ${r.start}-${r.end} en ${DOW_LABELS[r.day]}`);
  // overlaps por día
  for (let d=0; d<7; d++){
    const dayRules = rules.filter(r=>r.day===d).sort((a,b)=>t2m(a.start)-t2m(b.start));
    for (let i=0; i<dayRules.length-1; i++){
      const A = dayRules[i], B = dayRules[i+1];
      if (overlap(A.start,A.end,B.start,B.end)) issues.push(`Solape en ${DOW_LABELS[d]} entre ${A.start}-${A.end} y ${B.start}-${B.end}`);
    }
  }
  return { ok: issues.length===0, issues };
}

// —— Saludo dinámico
function normalizeSalutation(input: string): Salutation {
  const s = (input || '').toLowerCase().replace(/\./g, '').trim();
  const female = ['sra presidenta','sra','señora presidenta','senora presidenta','señora','senora'];
  if (female.includes(s)) return 'Sra Presidenta';
  const male = ['sr presidente','sr','señor presidente','senor presidente','mr presidente','mr','mister'];
  if (male.includes(s)) return 'Sr Presidente';
  return 'Sr Presidente';
}
function helloLineForSalutation(s: string){
  const norm = normalizeSalutation(s);
  return norm === 'Sra Presidenta' ? 'Hola Sra Presidenta' : 'Hola Sr Presidente';
}
function loadSalutation(): Salutation {
  try {
    const raw = localStorage.getItem('mrpresident_profile');
    if (raw){
      const p = JSON.parse(raw);
      if (p && p.salutation) return normalizeSalutation(p.salutation);
    }
  } catch {}
  return 'Sr Presidente';
}

// —— Datos mock eventos
const sampleEvents: EJEvent[] = [
  {
    id: 'evt_1', source: 'internal', title: 'Brainstorming chalecos', description: 'Moodboard FW25',
    start: '2025-08-09T10:00:00-04:00', end: '2025-08-09T11:00:00-04:00', timezone: 'America/Santiago',
    priority: 4, difficulty: 3, status: 'planned', dod: '2 ideas viables + 1 moodboard base'
  },
  {
    id: 'evt_2', source: 'google', title: 'Inglés — speaking A2', description: 'Sesión 30 min',
    start: '2025-08-09T18:30:00-04:00', end: '2025-08-09T19:00:00-04:00', timezone: 'America/Santiago',
    priority: 3, difficulty: 2, status: 'planned', dod: 'Ejercicio de roleplay 1'
  },
];

// —— Stubs notificaciones (para preview)
const Notifications = {
  async requestPermissionsAsync(){ return { granted: true } as const; },
  async scheduleNotificationAsync({ content, trigger }: any){
    console.log('🔔 (stub) Notificación programada:', content?.title, content?.body, trigger);
  }
};
async function scheduleNudge(title: string, body: string, secondsFromNow: number) {
  await Notifications.requestPermissionsAsync();
  await Notifications.scheduleNotificationAsync({ content: { title, body }, trigger: { seconds: secondsFromNow } });
}

// —— Estilos inline (Material + Glass + Cielo)
const skyBg = {
  backgroundImage: [
    `linear-gradient(180deg, ${tokens.colors.skyTop} 0%, ${tokens.colors.skyBottom} 100%)`,
    `radial-gradient(1200px 500px at 15% 20%, ${tokens.colors.cloud} 0%, transparent 60%)`,
    `radial-gradient(1000px 420px at 75% 15%, ${tokens.colors.cloud} 0%, transparent 60%)`,
    `radial-gradient(900px 380px at 40% 70%, ${tokens.colors.cloud} 0%, transparent 60%)`,
  ].join(', ')
} as React.CSSProperties;

const S: Record<string, React.CSSProperties> = {
  app: { ...skyBg, color: tokens.colors.text, minHeight: '100vh', paddingBottom: 88, fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto' },
  header: { padding: 24, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: 800, letterSpacing: 0.2 },
  subtitle: { color: tokens.colors.subtext, fontSize: 14, marginTop: 4 },

  list: { paddingInline: 24, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', maxHeight: 'calc(100vh - 280px)', paddingBottom: 220, overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch', scrollBehavior: 'smooth' },
  bubble: { maxWidth: '86%', padding: 14, borderRadius: tokens.radius.lg, boxShadow: tokens.elevation[2], backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', border: `1px solid ${tokens.colors.stroke}` },
  bubbleA: { background: tokens.colors.surfaceGlass },
  bubbleU: { background: tokens.colors.primaryContainer },

  inputBar: { position: 'fixed', left: 18, right: 18, bottom: 112, background: tokens.colors.surfaceGlassStrong, borderRadius: tokens.radius.xl, display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${tokens.colors.stroke}`, padding: 8, boxShadow: tokens.elevation[3], backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' },
  textInput: { flex: 1, width: '100%', background: 'transparent', color: tokens.colors.text, border: 'none', outline: 'none', fontSize: 16, height: 44, padding: '0 12px' },
  sendBtn: { background: tokens.colors.primary, borderRadius: 14, padding: '10px 14px', border: 'none', cursor: 'pointer', color: '#fff', fontWeight: 700, boxShadow: tokens.elevation[2] },

  micWrap: { position: 'fixed', bottom: 20, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  micBtn: { width: 84, height: 84, borderRadius: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: tokens.elevation[3], border: `1px solid ${tokens.colors.stroke}`, backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', background: tokens.colors.primary },
  micHint: { marginTop: 8, color: tokens.colors.subtext, fontSize: 12 },

  tabBar: { position: 'fixed', bottom: 0, left: 0, right: 0, height: 78, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, borderTop: `1px solid ${tokens.colors.stroke}`, background: tokens.colors.surfaceGlassStrong, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', boxShadow: tokens.elevation[2] },
  tabBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', color: tokens.colors.subtext, fontWeight: 700, cursor: 'pointer', borderTop: '3px solid transparent' },
  tabBtnActive: { color: tokens.colors.primary, borderTopColor: tokens.colors.primary, background: 'rgba(59,130,246,0.06)' },

  headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 24 },
  chipPrimary: { background: tokens.colors.primary, color: '#fff', padding: '10px 12px', borderRadius: tokens.radius.lg, fontWeight: 700, cursor: 'pointer', border: 'none', boxShadow: tokens.elevation[2] },

  calendarCard: { marginInline: 24, background: tokens.colors.surfaceGlass, borderRadius: tokens.radius.xl, padding: 14, border: `1px solid ${tokens.colors.stroke}`, boxShadow: tokens.elevation[2], backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' },
  weekHeaderRow: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 8 },
  weekHeaderText: { textAlign: 'center', color: tokens.colors.subtext, fontWeight: 700 },
  weekRow: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6 },
  dayCell: { aspectRatio: '1 / 1', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 120ms ease' },
  daySel: { background: tokens.colors.primary, color: '#fff', boxShadow: tokens.elevation[2], transform: 'translateY(-1px)' },
  dayText: { color: tokens.colors.text },
  dayTextSel: { color: '#fff', fontWeight: 800 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: tokens.colors.secondary, marginTop: 2 },

  section: { padding: 24, display: 'grid', gap: 10 },
  emptyCard: { background: tokens.colors.surfaceGlass, borderRadius: tokens.radius.lg, padding: 16, border: `1px solid ${tokens.colors.stroke}`, backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' },
  eventCard: { background: tokens.colors.surfaceGlassStrong, borderRadius: tokens.radius.lg, padding: 14, display: 'flex', alignItems: 'center', gap: 12, border: `1px solid ${tokens.colors.stroke}`, marginBottom: 10, marginInline: 24, boxShadow: tokens.elevation[1], backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' },
  eventTitle: { color: tokens.colors.text, fontSize: 16, fontWeight: 700 },
  eventMeta: { color: tokens.colors.subtext, fontSize: 13, marginTop: 4 },
  eventDod: { color: tokens.colors.accent, fontSize: 12, marginTop: 4 },
  badge: { background: tokens.colors.primary, borderRadius: 12, padding: '6px 10px', color: '#fff', fontWeight: 800 },

  // —— Perfil
  card: { background: tokens.colors.surfaceGlass, borderRadius: tokens.radius.xl, padding: 16, border: `1px solid ${tokens.colors.stroke}`, boxShadow: tokens.elevation[2], margin: 24, backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 },
  input: { width: '100%', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 12px', fontSize: 14 },
  select: { width: '100%', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 12px', fontSize: 14 },
  table: { width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 14 },
  th: { textAlign: 'left', color: tokens.colors.subtext, padding: '8px 10px' },
  td: { padding: '6px 8px' },
  pill: { padding: '6px 10px', background: tokens.colors.primaryContainer, borderRadius: 999, display: 'inline-block', color: tokens.colors.text },
  dangerLink: { color: tokens.colors.danger, cursor: 'pointer', fontWeight: 700 },
  saveBar: { display: 'flex', justifyContent: 'flex-end', padding: '0 24px 24px' },
  saveBtn: { background: tokens.colors.primary, color: '#fff', border: 'none', borderRadius: 12, padding: '10px 14px', fontWeight: 700, cursor: 'pointer', boxShadow: tokens.elevation[2] },
  issues: { color: tokens.colors.danger, fontSize: 13, marginTop: 8 },

  testBanner: { position: 'fixed', top: 6, left: '50%', transform: 'translateX(-50%)', padding: '6px 10px', borderRadius: 12, border: '1px solid', zIndex: 50 },
  testOk: { background: 'rgba(22,163,74,0.12)', borderColor: 'rgba(22,163,74,0.35)', color: tokens.colors.text },
  testFail: { background: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.35)', color: tokens.colors.text },
};

// —— Tabs caseros
function TabBar({ tab, setTab }: { tab: 'Chat'|'Calendario'|'Perfil'; setTab: (t: 'Chat'|'Calendario'|'Perfil')=>void }){
  return (
    <div style={S.tabBar}>
      <div onClick={()=>setTab('Chat')} style={{ ...S.tabBtn, ...(tab==='Chat'? S.tabBtnActive : {}) }}>💬 Chat</div>
      <div onClick={()=>setTab('Calendario')} style={{ ...S.tabBtn, ...(tab==='Calendario'? S.tabBtnActive : {}) }}>📆 Calendario</div>
      <div onClick={()=>setTab('Perfil')} style={{ ...S.tabBtn, ...(tab==='Perfil'? S.tabBtnActive : {}) }}>👤 Perfil</div>
    </div>
  );
}

// —— Chat Screen
function ChatScreen() {
  const [messages, setMessages] = useState<{ id: string; role: 'user' | 'assistant'; text: string }[]>([
    { id: 'm1', role: 'assistant', text: `${helloLineForSalutation(loadSalutation())}, ¿Qué meta atacamos hoy?` }
  ]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages]);

  const send = (text?: string) => {
    const content = (text ?? input).trim();
    if (!content) return;
    const id = `m_${Date.now()}`;
    setMessages(prev => [...prev, { id, role: 'user', text: content }]);
    setInput('');
    setTimeout(() => {
      setMessages(prev => [...prev, { id: 'a_'+Date.now(), role: 'assistant', text: 'Puedo agendar un bloque de inspiración mañana 10:00–11:00. ¿Te sirve?' }]);
    }, 300);
  };

  const handleVoicePressIn = () => setIsRecording(true);
  const handleVoicePressOut = () => { setIsRecording(false); send('"nota de voz" → Agendar brainstorming de chalecos para mañana'); };

  return (
    <div>
      <div style={S.header}>
        <div style={S.title as any}>Mr. President</div>
        <div style={S.subtitle as any}>Asistente de objetivos</div>
      </div>
      <div style={S.list}>
        {messages.map(m => (
          <div key={m.id} style={{ ...S.bubble, ...(m.role==='assistant'? S.bubbleA : S.bubbleU), alignSelf: m.role==='assistant'? 'flex-start':'flex-end' }}>
            {m.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      {/* Input */}
      <div style={S.inputBar}>
        <input
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{ if (e.key==='Enter') send(); }}
          placeholder="Escribe un mensaje…"
          style={S.textInput}
        />
        <button onClick={()=>send()} style={S.sendBtn as any}>Enviar</button>
      </div>
      {/* Botón de voz */}
      <div style={S.micWrap}>
        <div
          onMouseDown={handleVoicePressIn}
          onMouseUp={handleVoicePressOut}
          onTouchStart={handleVoicePressIn}
          onTouchEnd={handleVoicePressOut}
          style={{ ...S.micBtn, background: isRecording ? tokens.colors.danger : tokens.colors.primary }}
        >
          <div style={{ fontSize: 26, color: '#fff' }}>{isRecording ? '🎤' : '🎙️'}</div>
        </div>
        <div style={S.micHint}>{isRecording ? 'Suelta para enviar' : 'Mantén para hablar'}</div>
      </div>
    </div>
  );
}

// —— Calendar mini propio (mensual, L-D)
function CalendarMini({ date, selected, onSelect, dayDots }: {
  date: Date;
  selected: string;
  onSelect: (key: string)=>void;
  dayDots: Record<string, boolean>;
}){
  const matrix = useMemo(()=>buildMonthMatrix(date), [date]);
  const year = date.getFullYear();
  const month = date.getMonth();
  const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  return (
    <div style={S.calendarCard}>
      <div style={S.weekHeaderRow}>
        {weekDays.map(d => <div key={d} style={S.weekHeaderText}>{d}</div>)}
      </div>
      {matrix.map((row, ri) => (
        <div key={`r${ri}`} style={S.weekRow}>
          {row.map((day, ci) => {
            if (day === 0) return <div key={`c${ci}`} style={S.dayCell}/>;
            const key = ymd(new Date(year, month, day));
            const isSel = key === selected;
            const hasDot = !!dayDots[key];
            return (
              <div key={`c${ci}`} onClick={()=>onSelect(key)} style={{ ...S.dayCell, ...(isSel? S.daySel : {}) }}>
                <div style={{ ...(isSel? S.dayTextSel : S.dayText) }}>{day}</div>
                {hasDot && <div style={S.dot}/>} 
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// —— Calendar Screen
function CalendarScreen() {
  const [monthAnchor] = useState<Date>(new Date());
  const [selected, setSelected] = useState<string>(ymd(new Date()));
  const [events, setEvents] = useState<EJEvent[]>(sampleEvents);

  const dayEvents = useMemo(() => events.filter(e => e.start.slice(0,10) === selected), [events, selected]);
  const dayDots = useMemo(() => {
    const m: Record<string, boolean> = {};
    for (const ev of events) m[ev.start.slice(0,10)] = true;
    return m;
  }, [events]);

  const addQuick = async () => {
    const start = new Date(); start.setHours(start.getHours() + 2, 0, 0, 0);
    const end = new Date(start.getTime() + 60*60000);
    const newEv: EJEvent = {
      id: 'evt_'+Date.now(), source: 'internal', title: 'Bloque foco — chalecos',
      start: start.toISOString(), end: end.toISOString(), timezone: 'America/Santiago',
      priority: 4, difficulty: 3, status: 'planned', dod: 'Primer boceto listo'
    };
    setEvents(prev => [...prev, newEv]);
    await scheduleNudge('Bloque de foco creado', 'Te aviso 15 min antes para preparar el material', 1);
  };

  return (
    <div>
      <div style={S.headerRow}>
        <div style={S.title as any}>Calendario</div>
        <button onClick={addQuick} style={S.chipPrimary as any}>＋ Bloque rápido</button>
      </div>
      <CalendarMini date={monthAnchor} selected={selected} onSelect={setSelected} dayDots={dayDots} />
      <div style={S.section}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>Eventos de {selected}</div>
        {dayEvents.length === 0 ? (
          <div style={S.emptyCard}><div style={{ color: tokens.colors.subtext }}>Sin eventos. ¿Agendamos algo?</div></div>
        ) : (
          dayEvents.map(ev => (
            <div key={ev.id} style={S.eventCard}>
              <div style={{ flex: 1 }}>
                <div style={S.eventTitle}>{ev.title}</div>
                <div style={S.eventMeta}>{new Date(ev.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {new Date(ev.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                {ev.dod ? <div style={S.eventDod}>DOD: {ev.dod}</div> : null}
              </div>
              <div style={S.badge}>P{ev.priority ?? 3}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// —— Perfil Screen (config de horarios y datos del usuario)
function ProfileScreen(){
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Santiago';
  const [profile, setProfile] = useState<EJProfile>(()=>{
    try{
      const raw = localStorage.getItem('mrpresident_profile');
      if (raw) return JSON.parse(raw);
    }catch{}
    return {
      name: 'Tu nombre',
      timezone: tz,
      salutation: 'Sr Presidente',
      notificationIntensity: 'Media',
      schedule: [
        { id: 'r1', category: 'Estudio', day: 0, start: '07:00', end: '08:00', priority: 4, difficulty: 3 },
        { id: 'r2', category: 'Trabajo', day: 0, start: '09:00', end: '12:30', priority: 5, difficulty: 3 },
        { id: 'r3', category: 'Focus',   day: 2, start: '15:00', end: '16:30', priority: 5, difficulty: 4 },
      ]
    } as EJProfile;
  });

  useEffect(()=>{ try{ localStorage.setItem('mrpresident_profile', JSON.stringify(profile)); }catch{} }, [profile]);

  const updateField = (k: keyof EJProfile, v: any) => setProfile(p=>({ ...p, [k]: v }));

  const addRule = () => {
    const id = 'r'+Date.now();
    setProfile(p=>({ ...p, schedule: [...p.schedule, { id, category: 'Estudio', day: 0, start: '10:00', end: '11:00', priority: 3, difficulty: 2 }] }));
  };
  const removeRule = (id: string) => setProfile(p=>({ ...p, schedule: p.schedule.filter(r=>r.id!==id) }));
  const patchRule = (id: string, patch: Partial<ScheduleRule>) => setProfile(p=>({ ...p, schedule: p.schedule.map(r=> r.id===id ? { ...r, ...patch }: r) }));

  const { ok, issues } = validateSchedule(profile.schedule);

  return (
    <div>
      <div style={S.header}>
        <div style={S.title as any}>Perfil</div>
        <div style={S.subtitle as any}>Configura tu nombre y tus **formatos de horario** (estudio, trabajo, etc.).</div>
      </div>

      <div style={S.card}>
        <div className="row" style={{...S.row, gridTemplateColumns:'1fr 1fr 1fr'} as any}>
          <div>
            <label>Intensidad de notificaciones</label>
            <select style={S.select as any} value={profile.notificationIntensity} onChange={e=>updateField('notificationIntensity', e.target.value as any)}>
              <option>Suave</option>
              <option>Media</option>
              <option>Intensa</option>
            </select>
          </div>
          <div>
            <label>Saludo en chat</label>
            <select style={S.select as any} value={profile.salutation} onChange={e=>updateField('salutation', e.target.value as any)}>
              <option>Sr Presidente</option>
              <option>Sra Presidenta</option>
            </select>
          </div>
          <div style={{ display:'flex', alignItems:'flex-end' }}>
            <span style={S.pill as any}>App: Mr. President</span>
          </div>
        </div>
      </div>

      <div style={S.card}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Formato de horarios (semanal)</div>
          <div style={{ color: tokens.colors.subtext }}>Define bloques por día, categoría, hora de inicio y fin. Mr. President los usará para sugerir agenda y recordatorios.</div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={S.table as any}>
            <thead>
              <tr>
                <th style={S.th as any}>Día</th>
                <th style={S.th as any}>Categoría</th>
                <th style={S.th as any}>Inicio</th>
                <th style={S.th as any}>Fin</th>
                <th style={S.th as any}>Prioridad</th>
                <th style={S.th as any}>Dificultad</th>
                <th style={S.th as any}></th>
              </tr>
            </thead>
            <tbody>
              {profile.schedule.map(r=> (
                <tr key={r.id}>
                  <td style={S.td as any}>
                    <select style={S.select as any} value={r.day} onChange={e=>patchRule(r.id, { day: Number(e.target.value) as any })}>
                      {DOW_LABELS.map((lbl, i)=> <option key={i} value={i}>{lbl}</option>)}
                    </select>
                  </td>
                  <td style={S.td as any}>
                    <select style={S.select as any} value={r.category} onChange={e=>patchRule(r.id, { category: e.target.value as ScheduleCategory })}>
                      {(['Estudio','Trabajo','Focus','Ejercicio','Descanso','Otro'] as ScheduleCategory[]).map(c=> <option key={c} value={c}>{c}</option>)}
                    </select>
                  </td>
                  <td style={S.td as any}><input type="time" style={S.input as any} value={r.start} onChange={e=>patchRule(r.id, { start: e.target.value })} /></td>
                  <td style={S.td as any}><input type="time" style={S.input as any} value={r.end} onChange={e=>patchRule(r.id, { end: e.target.value })} /></td>
                  <td style={S.td as any}>
                    <select style={S.select as any} value={r.priority ?? 3} onChange={e=>patchRule(r.id, { priority: Number(e.target.value) })}>
                      {[1,2,3,4,5].map(n=> <option key={n} value={n}>{n}</option>)}
                    </select>
                  </td>
                  <td style={S.td as any}>
                    <select style={S.select as any} value={r.difficulty ?? 3} onChange={e=>patchRule(r.id, { difficulty: Number(e.target.value) })}>
                      {[1,2,3,4,5].map(n=> <option key={n} value={n}>{n}</option>)}
                    </select>
                  </td>
                  <td style={S.td as any}><span style={S.dangerLink as any} onClick={()=>removeRule(r.id)}>Eliminar</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!ok && (<div style={S.issues as any}>{issues.map((x,i)=>(<div key={i}>• {x}</div>))}</div>)}
        <div style={{ marginTop: 12 }}>
          <button onClick={addRule} style={S.chipPrimary as any}>＋ Agregar bloque</button>
        </div>
      </div>

      <div style={S.saveBar}>
        <button style={S.saveBtn as any} onClick={()=>alert('Guardado (local)')}>Guardar</button>
      </div>
    </div>
  );
}

// —— App + tests
export default function App(){
  const [tab, setTab] = useState<'Chat'|'Calendario'|'Perfil'>('Chat');
  const [testStatus, setTestStatus] = useState<'idle'|'ok'|'fail'>('idle');

  useEffect(()=>{ runTests() ? setTestStatus('ok') : setTestStatus('fail'); }, []);

  return (
    <div style={S.app}>
      {tab === 'Chat' && <ChatScreen/>}
      {tab === 'Calendario' && <CalendarScreen/>}
      {tab === 'Perfil' && <ProfileScreen/>}
      <TabBar tab={tab} setTab={setTab} />
      {testStatus !== 'idle' && (
        <div style={{ ...S.testBanner, ...(testStatus==='ok'? S.testOk : S.testFail) }}>
          {testStatus==='ok' ? '✓ Tests básicos OK' : '✗ Falló al menos un test'}
        </div>
      )}
    </div>
  );
}

// —— Tests (originales + nuevos)
function runTests(): boolean {
  try {
    // ymd formato
    const k = ymd(new Date('2025-08-07T12:34:56Z'));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(k)) throw new Error('ymd formato inválido');

    // buildMonthMatrix cubre todo el mes y solo números válidos o 0
    const anchor = new Date('2025-08-07T00:00:00Z');
    const m = buildMonthMatrix(anchor);
    if (!Array.isArray(m) || m.length < 4 || m.length > 6) throw new Error('matriz filas fuera de rango');
    const flat = m.flat();
    const positives = flat.filter(n => n>0);
    const dim = endOfMonth(anchor).getDate();
    if (new Set(positives).size !== dim) throw new Error('días del mes incompletos');
    if (Math.max(...positives) !== dim) throw new Error('último día incorrecto');

    // Filtro de eventos por día seleccionado
    const selected = '2025-08-09';
    const dayEvents = sampleEvents.filter(e => e.start.slice(0,10) === selected);
    if (dayEvents.length !== 2) throw new Error('filtro de eventos por día no coincide');

    // —— Nuevos tests: horarios del perfil
    const rules: ScheduleRule[] = [
      { id:'a', category:'Estudio', day:0, start:'09:00', end:'10:00' },
      { id:'b', category:'Trabajo', day:0, start:'09:30', end:'10:30' },
      { id:'c', category:'Focus',   day:1, start:'11:00', end:'12:00' },
    ];
    const v1 = validateSchedule(rules);
    if (v1.ok) throw new Error('validador no detectó solape');

    const v2 = validateSchedule([{ id:'x', category:'Estudio', day:2, start:'08:00', end:'09:00' }]);
    if (!v2.ok) throw new Error('validador marcó error en rango válido');

    // Saludos dinámicos
    if (helloLineForSalutation('Sr Presidente') !== 'Hola Sr Presidente') throw new Error('saludo Sr incorrecto');
    if (helloLineForSalutation('Sra Presidenta') !== 'Hola Sra Presidenta') throw new Error('saludo Sra incorrecto');
    if (helloLineForSalutation('Mr Presidente') !== 'Hola Sr Presidente') throw new Error('saludo Mr incorrecto');
    if (helloLineForSalutation('sr.') !== 'Hola Sr Presidente') throw new Error('saludo abreviado Sr incorrecto');

    return true;
  } catch (e) {
    console.error('❌ Tests fallaron:', e);
    return false;
  }
}

/*
▶ Para portar este preview a Expo (móvil real)
---------------------------------------------
1) Crear app Expo
   npx create-expo-app mr-president

2) React Navigation (tabs)
   npx expo install @react-navigation/native @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context

3) Calendario
   npx expo install react-native-calendars
   // Sustituir <CalendarMini/> por <Calendar />

4) Voz (expo-av) + backend STT (OpenAI Whisper API)
   npx expo install expo-av

5) Notificaciones
   npx expo install expo-notifications

6) Persistencia de Perfil
   - Guardar/leer de AsyncStorage o backend (Postgres) y sincronizar con el LLM
*/
