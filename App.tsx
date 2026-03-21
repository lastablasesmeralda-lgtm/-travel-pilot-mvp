import React, { useEffect, useState } from 'react';
import { View, StatusBar, TouchableOpacity, Text, Animated, Alert, LogBox } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// SILENCIAR TODOS LOS ERRORES DE DESARROLLO (ESTILO PRODUCCIÓN)
LogBox.ignoreAllLogs(true);
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';

import { AppProvider, useAppContext } from './src/context/AppContext';
import LoginScreen from './src/screens/LoginScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import AppNavigator from './src/navigation/AppNavigator';
import GlobalOverlays from './src/GlobalOverlays';
import { s } from './src/styles';
import { getEU261Amount } from './src/utils/flightUtils';

function RootComponent() {
  const {
    user, setShowSOSMenu, setShowChat, sosPulse, compensationEligible, speak,
    hasSeenOnboarding, setHasSeenOnboarding,
    compBannerDismissed, setCompBannerDismissed,
    flightData
  } = useAppContext();

  useEffect(() => {
    if (user && hasSeenOnboarding === true) {
      if (compensationEligible) {
        speak("Atención: He detectado un retraso que puede darte derecho a una compensación legal. Puedes reclamar hasta seiscientos euros. He activado tu asistencia legal.");
      } else {
        const name = user?.displayName || user?.email?.split('@')[0] || "viajero";
        speak(`Hola de nuevo ${name}. Todo está listo. Estoy vigilando tus vuelos para que viajes con tranquilidad.`);
      }
    }
  }, [hasSeenOnboarding, !!user, compensationEligible]);

  if (!user) return <LoginScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A' }} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />
      {hasSeenOnboarding === false ? (
        <OnboardingScreen onComplete={() => {
          setHasSeenOnboarding(true);
          const name = user?.displayName || user?.email?.split('@')[0] || "miembro de Travel-Pilot";
          speak(`Hola ${name}, es un placer saludarte. Ya estoy conectado para vigilar tus vuelos y proteger tu viaje. Dime si necesitas que revise algo.`);
        }} />
      ) : (
        <View style={{ flex: 1 }}>
          <NavigationContainer theme={DarkTheme}>
            <AppNavigator />
          </NavigationContainer>

          {/* ——— PANEL DE MANDO SUPERIOR (FIJO) ——— */}
          <View style={s.topPanel}>
            <View style={{ flex: 1, alignItems: 'center' }}>
                <View style={{ backgroundColor: '#111', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: '#222', flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CD964', marginRight: 6 }} />
                  <Text style={{ color: '#B0B0B0', fontSize: 9, fontWeight: 'bold', letterSpacing: 1 }}>ASISTENTE / ACTIVO</Text>
                </View>
            </View>
          </View>

          {/* BOTONES FLOTANTES (AHORA EN POSICIONES FIJAS SUPERIORES) */}
          <View style={s.sosContainer}>
            <TouchableOpacity style={s.sos} onPress={() => setShowSOSMenu(true)}>
              <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 10, textAlign: 'center' }} numberOfLines={1}>AYUDA</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={s.sosChat} onPress={() => setShowChat(true)}>
            <Text style={{ color: '#AF52DE', fontWeight: 'bold', fontSize: 24 }}>💬</Text>
          </TouchableOpacity>
        </View>
      )}
      <GlobalOverlays />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <AppProvider>
        <RootComponent />
      </AppProvider>
    </SafeAreaProvider>
  );
}
