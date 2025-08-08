import React from 'react';
import { View, Text, Pressable, StyleSheet, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function WelcomeScreen(){
  const router = useRouter();
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ImageBackground
        source={undefined}
        style={s.bg}
      >
        <View style={s.card}>
          <Text style={s.title}>MR.PRESIDENT</Text>
          <Text style={s.subtitle}>Tu asistente para planificar, priorizar y ejecutar.
          </Text>
          <View style={s.bullets}>
            <Text style={s.bullet}>• Organiza tu calendario y metas.</Text>
            <Text style={s.bullet}>• Divide en sub‑objetivos accionables.</Text>
            <Text style={s.bullet}>• Recibe nudges inteligentes en el momento correcto.</Text>
          </View>
          <Pressable style={[s.btn, s.primary]} onPress={()=> router.push('/(auth)/login')}>
            <Text style={s.btnText}>Iniciar Sesión</Text>
          </Pressable>
          <Pressable style={[s.btn, s.secondary]} onPress={()=> router.push('/(auth)/register')}>
            <Text style={[s.btnText, { color: '#1e88e5' }]}>Crear Cuenta</Text>
          </Pressable>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: '#E6F4FF',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 16, textAlign: 'center', color: '#333', marginBottom: 14 },
  bullets: { marginBottom: 16 },
  bullet: { fontSize: 14, color: '#333', marginBottom: 6 },
  btn: { padding: 14, borderRadius: 12, marginTop: 10, alignItems: 'center' },
  primary: { backgroundColor: '#1e88e5' },
  secondary: { backgroundColor: 'rgba(30,136,229,0.12)', borderWidth: 1, borderColor: '#1e88e5' },
  btnText: { color: '#fff', fontWeight: '600' },
});
