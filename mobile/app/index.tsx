import React from 'react';
import { Redirect } from 'expo-router';
import { useStore } from '@/app/store';

export default function Index(){
  const { token } = useStore();
  return <Redirect href={token ? '/(tabs)' : '/(auth)/welcome'} />;
}
