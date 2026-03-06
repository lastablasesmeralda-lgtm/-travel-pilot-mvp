import React from 'react';
import { View, StatusBar, TouchableOpacity, Text, Animated, Alert } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';

import { AppProvider, useAppContext } from './src/context/AppContext';
import LoginScreen from './src/screens/LoginScreen';
import AppNavigator from './src/navigation/AppNavigator';
import GlobalOverlays from './src/GlobalOverlays';
import { s } from './src/styles';

function RootComponent() {
  const { user, setShowSOSMenu, setShowChat, sosPulse, compensationEligible } = useAppContext();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A' }} edges={['top', 'left', 'right']}>
      {!user ? (
        <LoginScreen />
      ) : (
        <>
          {compensationEligible && (
            <TouchableOpacity style={s.compBanner} onPress={() => Alert.alert('ESCUDO LEGAL', 'Tu retraso de 3h da derecho a una indemnización de hasta 600€ por el reglamento EU261. Travel-Pilot ya está gestionando el proceso.')}>
              <Text style={s.compText}>⚡ COMPENSACIÓN ELEGIBLE: 600€ DETECTADOS</Text>
              <Text style={s.compSub}>REGLAMENTO EU261 · EXPEDIENTE TP-LX90</Text>
            </TouchableOpacity>
          )}
          <NavigationContainer theme={DarkTheme}>
            <AppNavigator />
          </NavigationContainer>

          {/* BOTÓN CHAT IA Y SOS FLOTANTES */}
          <TouchableOpacity style={s.sosChat} onPress={() => setShowChat(true)}>
            <Text style={{ color: '#AF52DE', fontWeight: 'bold', fontSize: 24 }}>💬</Text>
          </TouchableOpacity>

          <Animated.View style={[s.sosContainer, { transform: [{ scale: sosPulse }] }]}>
            <TouchableOpacity style={s.sos} onPress={() => setShowSOSMenu(true)}>
              <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>SOS</Text>
            </TouchableOpacity>
          </Animated.View>
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
