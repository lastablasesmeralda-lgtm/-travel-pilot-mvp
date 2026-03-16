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

function RootComponent() {
  const {
    user, setShowSOSMenu, setShowChat, sosPulse, compensationEligible, speak,
    hasSeenOnboarding, setHasSeenOnboarding
  } = useAppContext();

  useEffect(() => {
    if (user && hasSeenOnboarding === true && compensationEligible) {
      speak("Atención: He detectado un retraso eligible para compensación legal. Tienes derecho a reclamar hasta seiscientos euros. He activado tu escudo legal.");
    } else if (user && hasSeenOnboarding === true && !compensationEligible) {
      const name = user?.displayName || user?.email?.split('@')[0] || "miembro de Travel-Pilot";
      speak(`Hola de nuevo ${name}. He restablecido la conexión. Estoy vigilando tus viajes en tiempo real.`);
    }
  }, [hasSeenOnboarding, !!user]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A' }} edges={['top', 'left', 'right']}>
      {!user ? (
        <LoginScreen />
      ) : hasSeenOnboarding === false ? (
        <OnboardingScreen onComplete={() => {
          setHasSeenOnboarding(true);
          const name = user?.displayName || user?.email?.split('@')[0] || "miembro de Travel-Pilot";
          speak(`Hola ${name}, es un placer saludarte. Ya estoy conectado para vigilar tus vuelos y proteger tu viaje. Dime si necesitas que revise algo.`);
        }} />
      ) : (
        <>
          {compensationEligible && (
            <TouchableOpacity style={s.compBanner} onPress={() => Alert.alert('ESCUDO LEGAL', 'Tu retraso de 3h da derecho a una indemnización de hasta 600€ por el reglamento EU261. Travel-Pilot ya está gestionando el proceso.')}>
              <Text style={s.compText}>⚡ COMPENSACIÓN ELEGIBLE: 600€ DETECTADOS</Text>
              <Text style={s.compSub}>REGLAMENTO EU261 · EXPEDIENTE TP-LX90</Text>
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }}>
            <NavigationContainer theme={DarkTheme}>
              <AppNavigator />
            </NavigationContainer>

            {/* ——— PANEL DE MANDO SUPERIOR (FIJO) ——— */}
            <View style={s.topPanel}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                  <View style={{ backgroundColor: '#111', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: '#222', flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CD964', marginRight: 6 }} />
                    <Text style={{ color: '#B0B0B0', fontSize: 9, fontWeight: 'bold', letterSpacing: 1 }}>OPERATIVO / VIGILANCIA</Text>
                  </View>
              </View>
            </View>

            {/* BOTONES FLOTANTES (AHORA EN POSICIONES FIJAS SUPERIORES) */}
            <View style={s.sosContainer}>
              <TouchableOpacity style={s.sos} onPress={() => setShowSOSMenu(true)}>
                <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 12, textAlign: 'center' }} numberOfLines={1}>SOS</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={s.sosChat} onPress={() => setShowChat(true)}>
              <Text style={{ color: '#AF52DE', fontWeight: 'bold', fontSize: 24 }}>💬</Text>
            </TouchableOpacity>
          </View>
        </>
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
