import React, { useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { helloLineForSalutation, loadSalutation, EJEvent } from '@/app/shared';
import { useStore } from '@/app/store';

interface Msg { id: string; role: 'user'|'assistant'; text: string }

function scheduleNudge(title: string, body: string, secondsFromNow = 5){
  setTimeout(()=>{
    Alert.alert(title, body);
  }, secondsFromNow * 1000);
}

export default function ChatScreen(){
  const ins = useSafeAreaInsets();
  const { createEvent } = useStore();
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState<Msg[]>([
    { id: 'm1', role: 'assistant', text: 'Soy Emily. ¿En qué avanzamos hoy?' }
  ]);
  const listRef = useRef<FlatList<Msg>>(null);

  const salute = useMemo(()=> helloLineForSalutation(loadSalutation()), []);

  function send(text: string){
    if (!text.trim()) return;
    const m: Msg = { id: String(Date.now()), role: 'user', text };
    setMsgs(prev => [...prev, m]);
    setInput('');
    // Respuesta simple mock y nudge de ejemplo si se menciona "recordatorio"
    const normalized = text.toLowerCase();
    if (normalized.includes('crear evento')){
      // Crear un evento simple para mañana 10:00–11:00
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1, 10, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1, 11, 0, 0);
      const ev: EJEvent = {
        id: 'evt_'+Date.now(), source: 'internal', title: 'Evento creado desde chat',
        start: start.toISOString(), end: end.toISOString(),
        priority: 3, difficulty: 2, status: 'planned'
      };
      createEvent(ev);
      setMsgs(prev => [...prev, { id: String(Date.now()+1), role: 'assistant', text: 'He creado un evento mañana 10:00–11:00 (puedes verlo en Calendario).'}]);
      requestAnimationFrame(()=> listRef.current?.scrollToEnd({ animated: true }));
      return;
    }
    if (normalized.includes('recordatorio') || normalized.includes('nudge')){
      setMsgs(prev => [...prev, { id: String(Date.now()+1), role: 'assistant', text: 'Agendado un recordatorio en 5s (demo).'}]);
      scheduleNudge('Recordatorio', 'Toca para revisar tu sub‑objetivo pendiente.');
    } else {
      setMsgs(prev => [...prev, { id: String(Date.now()+1), role: 'assistant', text: 'Entendido. Puedo crear un evento o dividirlo en sub‑objetivos.' }]);
    }
    requestAnimationFrame(()=> listRef.current?.scrollToEnd({ animated: true }));
  }

  function QuickChip({label}:{label:string}){
    return (
      <Pressable style={S.chip} onPress={()=> send(label)}>
        <Text style={S.chipText}>{label}</Text>
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={S.container} edges={['top','bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={ins.top}>
        <View style={{ flex: 1, paddingBottom: ins.bottom + 12 }}>
      <View style={S.header}>
        <Text style={S.headerTitle}>{salute}</Text>
        <Text style={S.subtext}>MR.PRESIDENT</Text>
      </View>

      <View style={S.quickRow}>
        <QuickChip label="Crear evento mañana 10:00"/>
        <QuickChip label="Dividir meta en sub‑objetivos"/>
        <QuickChip label="Nudge diario 8:00"/>
      </View>

      <FlatList
        ref={listRef}
        data={msgs}
        keyExtractor={m=>m.id}
        style={S.list}
        renderItem={({item})=> (
          <View style={[S.bubble, item.role==='user'? S.me : S.emily]}>
            <Text style={[S.text, item.role==='assistant' && S.textDark]}>{item.text}</Text>
          </View>
        )}
      />

      <View style={S.inputRow}>
        <TextInput
          placeholder="Escribe a Emily…"
          placeholderTextColor="#94a3b8"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={()=> send(input)}
          style={S.input}
          returnKeyType="send"
        />
        <Pressable style={S.sendBtn} onPress={()=> send(input)}>
          <Text style={S.sendText}>Enviar</Text>
        </Pressable>
      </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E6F4FF' },
  header: { paddingTop: 16, paddingHorizontal: 16 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  subtext: { color: '#475569', marginTop: 2 },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12 },
  chip: { backgroundColor: '#3B82F6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
  chipText: { color: '#fff', fontWeight: '700' },
  list: { flex: 1, paddingHorizontal: 12 },
  bubble: { marginVertical: 6, padding: 12, borderRadius: 14, maxWidth: '85%' },
  me: { alignSelf: 'flex-end', backgroundColor: '#DBEAFE' },
  emily: { alignSelf: 'flex-start', backgroundColor: '#fff' },
  text: { color: '#0F172A' },
  textDark: { color: '#0F172A' },
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 },
  input: { flex: 1, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, height: 44, color: '#0F172A' },
  sendBtn: { backgroundColor: '#3B82F6', borderRadius: 12, paddingHorizontal: 14, height: 44, alignItems: 'center', justifyContent: 'center' },
  sendText: { color: '#fff', fontWeight: '800' },
});
