import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DOW_LABELS, buildMonthMatrix, endOfMonth, sampleEvents, startOfMonth, ymd } from '@/app/shared';
import { useStore } from '@/app/store';

export default function CalendarScreen(){
  const { events: storedEvents } = useStore();
  const [anchor, setAnchor] = useState(new Date());
  const [selected, setSelected] = useState(ymd(new Date()));

  const matrix = useMemo(()=> buildMonthMatrix(anchor), [anchor]);
  const monthName = anchor.toLocaleString(undefined, { month: 'long', year: 'numeric' });

  function prev(){ setAnchor(new Date(anchor.getFullYear(), anchor.getMonth()-1, 1)); }
  function next(){ setAnchor(new Date(anchor.getFullYear(), anchor.getMonth()+1, 1)); }

  function dayToISO(d: number){
    const dt = new Date(anchor.getFullYear(), anchor.getMonth(), d);
    return ymd(dt);
  }

  const sourceEvents = (storedEvents && storedEvents.length>0) ? storedEvents : sampleEvents;
  const events = sourceEvents.filter(e => e.start.slice(0,10) === selected);

  return (
    <SafeAreaView style={S.container} edges={['top','bottom']}>
      <View style={S.header}>
        <Pressable onPress={prev} style={S.navBtn}><Text style={S.navText}>◀</Text></Pressable>
        <Text style={S.title}>{monthName}</Text>
        <Pressable onPress={next} style={S.navBtn}><Text style={S.navText}>▶</Text></Pressable>
      </View>

      <View style={S.dowRow}>
        {DOW_LABELS.map((d)=> (<Text key={d} style={S.dow}>{d}</Text>))}
      </View>

      <View style={S.grid}>
        {matrix.map((row, ri)=> (
          <View key={ri} style={S.row}>
            {row.map((d, ci)=> {
              if (d === 0) return <View key={ci} style={[S.cell, S.empty]} />;
              const iso = dayToISO(d);
              const isSel = iso === selected;
              const count = sourceEvents.filter(e => e.start.slice(0,10) === iso).length;
              return (
                <Pressable key={ci} onPress={()=> setSelected(iso)} style={[S.cell, isSel && S.cellSel]}>
                  <Text style={[S.day, isSel && S.daySel]}>{d}</Text>
                  {count>0 && <View style={S.dot} />}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <View style={S.eventsBox}>
        <Text style={S.eventsTitle}>Eventos en {selected}</Text>
        {events.length === 0 ? (
          <Text style={S.subtext}>No hay eventos.</Text>
        ) : (
          <FlatList
            data={events}
            keyExtractor={(e)=> e.id}
            renderItem={({item})=> (
              <View style={S.eventCard}>
                <Text style={S.eventTitle}>{item.title}</Text>
                <Text style={S.subtext}>{new Date(item.start).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} – {new Date(item.end).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</Text>
                {item.dod && <Text style={S.dod}>DOD: {item.dod}</Text>}
                <Text style={S.meta}>Prioridad {item.priority ?? '-'}  ·  Dificultad {item.difficulty ?? '-'}</Text>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E6F4FF' },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navBtn: { padding: 8 },
  navText: { fontSize: 18, color: '#0F172A' },
  title: { fontWeight: '800', fontSize: 18, color: '#0F172A', textTransform: 'capitalize' },
  dowRow: { flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 6, gap: 6 },
  dow: { flex: 1, textAlign: 'center', color: '#475569', fontWeight: '700' },
  grid: { paddingHorizontal: 8 },
  row: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  cell: { flex: 1, aspectRatio: 1, backgroundColor: '#fff', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  empty: { backgroundColor: 'transparent' },
  cellSel: { backgroundColor: '#3B82F6' },
  day: { color: '#0F172A', fontWeight: '700' },
  daySel: { color: '#fff', fontWeight: '800' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#38BDF8', marginTop: 4 },
  eventsBox: { flex: 1, marginTop: 8, backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 12 },
  eventsTitle: { fontWeight: '800', fontSize: 16, color: '#0F172A', marginBottom: 8 },
  subtext: { color: '#475569' },
  eventCard: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, marginBottom: 8 },
  eventTitle: { color: '#0F172A', fontWeight: '800' },
  dod: { color: '#0F172A', marginTop: 4 },
  meta: { color: '#475569', marginTop: 6 }
});
