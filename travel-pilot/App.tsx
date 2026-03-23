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
import ChatView from './src/components/ChatView';
import { s } from './src/styles';
import { getEU261Amount } from './src/utils/flightUtils';

function RootComponent() {
  const {
    user, showChat, setShowSOSMenu, setShowChat, sosPulse, compensationEligible, speak, stopSpeak, isSpeaking,
    hasSeenOnboarding, setHasSeenOnboarding, isReplayingTutorial, setIsReplayingTutorial, flightData,
    compBannerDismissed, setCompBannerDismissed
  } = useAppContext();

  const dynamicAmount = getEU261Amount(flightData);

  useEffect(() => {
    // Solo hablamos automáticamente si hay una incidencia detectada (Aviso de emergencia)
    const delay = flightData?.departure?.delay || 0;
    if (user && hasSeenOnboarding === true && delay >= 60) {
        if (delay >= 180) {
            const amt = dynamicAmount.replace('€', ' euros');
            const role = travelProfile === 'premium' ? "Sigo vigilando tus vuelos y ya he activado tu protocolo VIP" : "Ya estoy gestionando tu asistencia";
            speak(`Atención. He detectado un retraso crítico que puede darte derecho a una compensación legal de ${amt}. ${role}.`);
        } else {
            speak("Hola. He detectado una incidencia en tu vuelo. Tienes derecho a asistencia inmediata. He preparado un plan para ayudarte.");
        }
    }
  }, [hasSeenOnboarding, !!user, flightData?.departure?.delay]);

  if (!user) return <LoginScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A' }} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />
      {hasSeenOnboarding === false ? (
        <OnboardingScreen onComplete={() => {
          setHasSeenOnboarding(true);
          if (!isReplayingTutorial) {
            const name = user?.displayName || user?.email?.split('@')[0] || "miembro de Travel-Pilot";
            speak(`Hola ${name}, es un placer saludarte. Ya estoy conectado para vigilar tus vuelos y proteger tu viaje. Dime si necesitas que revise algo.`);
          }
          setIsReplayingTutorial(false);
        }} />
      ) : (
        <View style={{ flex: 1 }}>
          {showChat ? (
            <ChatView />
          ) : (
            <>
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
            </>
          )}
          <GlobalOverlays />
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
