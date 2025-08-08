import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { DOW_LABELS, EJProfile, ScheduleRule, helloLineForSalutation, loadSalutation, normalizeSalutation, validateSchedule } from '@/app/shared';

const emptyRule = (): ScheduleRule => ({ id: String(Date.now()), category: 'Estudio', day: 0, start: '09:00', end: '10:00' });

export default function ProfileScreen(){
  const ins = useSafeAreaInsets();
  const [profile, setProfile] = useState<EJProfile>({
    name: 'Usuario',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    salutation: loadSalutation(),
    notificationIntensity: 'Media',
    schedule: [
      { id: 'r1', category: 'Trabajo', day: 0, start: '09:00', end: '12:00' },
      { id: 'r2', category: 'Focus',   day: 2, start: '14:00', end: '16:00' },
    ],
  });

  const hello = useMemo(()=> helloLineForSalutation(profile.salutation), [profile.salutation]);

  function addRule(){ setProfile(p => ({ ...p, schedule: [...p.schedule, emptyRule()] })); }
  function removeRule(id: string){ setProfile(p => ({ ...p, schedule: p.schedule.filter(r => r.id !== id) })); }
  function updateRule(id: string, patch: Partial<ScheduleRule>){
    setProfile(p => ({ ...p, schedule: p.schedule.map(r => r.id === id ? { ...r, ...patch } : r) }));
  }

  function save(){
    const v = validateSchedule(profile.schedule);
    if (!v.ok){
      Alert.alert('Revisa horarios', v.issues.join('\n'));
      return;
    }
    Alert.alert('Guardado', 'Perfil guardado localmente (demo).');
  }

  const issues = validateSchedule(profile.schedule).issues;

  return (
    <SafeAreaView style={S.container} edges={['top','bottom']}>
      <Text style={S.title}>Perfil</Text>
      <Text style={S.subtext}>{hello}</Text>

      <View style={S.block}>
        <Text style={S.label}>Tratamiento</Text>
        <View style={S.row}>
          {(['Sr Presidente','Sra Presidenta'] as const).map(opt => (
            <Pressable key={opt} onPress={()=> setProfile(p=> ({ ...p, salutation: normalizeSalutation(opt) }))} style={[S.chip, profile.salutation===opt && S.chipActive]}>
              <Text style={[S.chipText, profile.salutation===opt && S.chipTextActive]}>{opt}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={S.block}>
        <Text style={S.label}>Intensidad de notificaciones</Text>
        <View style={S.row}>
          {(['Suave','Media','Intensa'] as const).map(opt => (
            <Pressable key={opt} onPress={()=> setProfile(p=> ({ ...p, notificationIntensity: opt }))} style={[S.chip, profile.notificationIntensity===opt && S.chipActive]}>
              <Text style={[S.chipText, profile.notificationIntensity===opt && S.chipTextActive]}>{opt}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={S.block}>
        <Text style={S.label}>Horarios (por día)</Text>
        <FlatList
          data={profile.schedule}
          keyExtractor={r=>r.id}
          renderItem={({item})=> (
            <View style={S.ruleCard}>
              <Text style={S.ruleTitle}>{item.category}</Text>
              <View style={S.rowBetween}>
                <Text style={S.pill}>{DOW_LABELS[item.day]}</Text>
                <Text style={S.pill}>{item.start} – {item.end}</Text>
              </View>
              <View style={S.row}>
                <Pressable onPress={()=> updateRule(item.id, { start: '09:00', end: '11:00' })} style={S.smallBtn}><Text style={S.smallText}>09–11</Text></Pressable>
                <Pressable onPress={()=> updateRule(item.id, { start: '14:00', end: '16:00' })} style={S.smallBtn}><Text style={S.smallText}>14–16</Text></Pressable>
                <Pressable onPress={()=> updateRule(item.id, { day: ((item.day + 1) % 7) as 0|1|2|3|4|5|6 })} style={S.smallBtn}><Text style={S.smallText}>+día</Text></Pressable>
                <Pressable onPress={()=> removeRule(item.id)} style={[S.smallBtn, S.danger]}><Text style={[S.smallText, S.dangerText]}>Quitar</Text></Pressable>
              </View>
            </View>
          )}
          ListFooterComponent={
            <Pressable onPress={addRule} style={S.addBtn}><Text style={S.addText}>＋ Agregar bloque</Text></Pressable>
          }
        />
      </View>

      {issues.length>0 && (
        <View style={[S.banner, S.warn]}>
          <Text style={S.bannerText}>• {issues[0]}</Text>
        </View>
      )}

      <View style={[S.footer, { bottom: ins.bottom + 12 }]}>
        <Pressable onPress={save} style={S.saveBtn}><Text style={S.saveText}>Guardar</Text></Pressable>
      </View>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E6F4FF', padding: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  subtext: { color: '#475569', marginTop: 2 },
  block: { marginTop: 16 },
  label: { color: '#0F172A', fontWeight: '800', marginBottom: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  chip: { backgroundColor: '#DBEAFE', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
  chipActive: { backgroundColor: '#3B82F6' },
  chipText: { color: '#0F172A', fontWeight: '700' },
  chipTextActive: { color: '#fff' },
  ruleCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 10 },
  ruleTitle: { color: '#0F172A', fontWeight: '800' },
  pill: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, color: '#0F172A', fontWeight: '700' },
  smallBtn: { backgroundColor: '#E2E8F0', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  smallText: { color: '#0F172A', fontWeight: '700' },
  danger: { backgroundColor: '#fee2e2' },
  dangerText: { color: '#991b1b', fontWeight: '800' },
  addBtn: { alignSelf: 'center', marginTop: 10, backgroundColor: '#3B82F6', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16 },
  addText: { color: '#fff', fontWeight: '800' },
  banner: { padding: 10, borderRadius: 10, marginTop: 10 },
  warn: { backgroundColor: '#FEF3C7' },
  bannerText: { color: '#92400E', fontWeight: '700' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 20, alignItems: 'center' },
  saveBtn: { backgroundColor: '#0EA5E9', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16 },
  saveText: { color: '#fff', fontWeight: '800' },
});
