import React, { createContext, useContext, useMemo, useState } from 'react';
import { EJEvent } from '@/app/shared';

export type SubObjective = {
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

export type Goal = {
  id: string;
  title: string;
  why?: string[];
  target_date?: string; // YYYY-MM-DD
  constraints?: Record<string, any>;
  milestones?: string[];
  success_metric?: string;
};

export type NotificationPlan = {
  id: string;
  entity_id: string; // goal/subobjective/event
  type: 'nudge'|'deadline'|'start';
  triggers: Array<{ type: 'time_before_due'|'time_before_start'; minutes: number }>;
};

type StoreState = {
  events: EJEvent[];
  goals: Goal[];
  subobjectives: SubObjective[];
  plans: NotificationPlan[];
  // auth
  token: string | null;
  setToken: (t: string | null) => void;
  // actions
  createEvent: (e: EJEvent) => void;
  updateEvent: (id: string, patch: Partial<EJEvent>) => void;
  createGoal: (g: Goal) => void;
  createSubObjective: (s: SubObjective) => void;
  addPlan: (p: NotificationPlan) => void;
};

const StoreCtx = createContext<StoreState | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }){
  const [events, setEvents] = useState<EJEvent[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [subobjectives, setSubobjectives] = useState<SubObjective[]>([]);
  const [plans, setPlans] = useState<NotificationPlan[]>([]);
  const [token, setToken] = useState<string | null>(null);

  const value = useMemo<StoreState>(() => ({
    events,
    goals,
    subobjectives,
    plans,
    token,
    setToken,
    createEvent: (e) => setEvents(prev => [...prev, e]),
    updateEvent: (id, patch) => setEvents(prev => prev.map(ev => ev.id === id ? { ...ev, ...patch } : ev)),
    createGoal: (g) => setGoals(prev => [...prev, g]),
    createSubObjective: (s) => setSubobjectives(prev => [...prev, s]),
    addPlan: (p) => setPlans(prev => [...prev, p]),
  }), [events, goals, subobjectives, plans, token]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore(){
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

// Export por defecto nulo para evitar warning de Expo Router al estar bajo app/
export default function StoreModuleScreen(){ return null; }
