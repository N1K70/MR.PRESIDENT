import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';
import { useStore } from '@/app/store';

export default function LoginScreen(){
  const router = useRouter();
  const { setToken } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onLogin(){
    if (!email || !password) return Alert.alert('Completa email y contraseña');
    setLoading(true);
    try{
      const res = await api.login(email, password);
      setToken(res.token);
      // El guard mostrará tabs automáticamente
    }catch(e:any){
      Alert.alert('Error al iniciar sesión', e.message || 'Intenta nuevamente');
    }finally{ setLoading(false); }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#E6F4FF' }}>
      <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS==='ios'?'padding':undefined}>
        <ScrollView contentContainerStyle={{ flexGrow:1, padding:20, justifyContent:'center' }} keyboardShouldPersistTaps='handled'>
          <View style={s.card}>
            <Text style={s.title}>Iniciar Sesión</Text>
            <Text style={s.subtitle}>Accede para continuar con tu planificación.</Text>
            <TextInput placeholder="Email" placeholderTextColor="#666" autoCapitalize='none' keyboardType='email-address' value={email} onChangeText={setEmail} style={s.input} />
            <TextInput placeholder="Contraseña" placeholderTextColor="#666" secureTextEntry value={password} onChangeText={setPassword} style={s.input} />
            <Pressable onPress={onLogin} style={[s.btn, s.primary]} disabled={loading}>
              <Text style={s.btnPrimaryText}>{loading? 'Ingresando…' : 'Ingresar'}</Text>
            </Pressable>
            <Pressable onPress={()=> router.push('/(auth)/register')} style={[s.btn, s.secondary]}>
              <Text style={s.btnSecondaryText}>Crear Cuenta</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor:'rgba(255,255,255,0.7)', borderRadius:16, padding:20, shadowColor:'#000', shadowOpacity:0.08, shadowRadius:12, shadowOffset:{ width:0, height:4 } },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 6, textAlign:'center' },
  subtitle: { fontSize: 14, color: '#333', textAlign:'center', marginBottom: 16 },
  input: { borderWidth:1, borderColor:'rgba(0,0,0,0.1)', backgroundColor:'rgba(255,255,255,0.9)', borderRadius:10, padding:12, marginBottom:12 },
  btn: { padding:14, borderRadius:12, marginTop:8, alignItems:'center' },
  primary: { backgroundColor:'#1e88e5' },
  secondary: { backgroundColor:'rgba(30,136,229,0.12)', borderWidth:1, borderColor:'#1e88e5' },
  btnPrimaryText: { color:'#fff', textAlign:'center', fontWeight:'700' },
  btnSecondaryText: { color:'#1e88e5', textAlign:'center', fontWeight:'700' },
});
