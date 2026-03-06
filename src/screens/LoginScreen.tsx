import React, { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import { s } from '../styles';
import { useAppContext } from '../context/AppContext';

export default function LoginScreen() {
    const {
        user, authEmail, setAuthEmail, authPassword, setAuthPassword,
        authMode, setAuthMode, authLoading, handleLogin, handleRegister, handleLogout
    } = useAppContext();

    return (
        <ScrollView style={{ flex: 1, backgroundColor: '#0A0A0A' }} contentContainerStyle={{ padding: 12 }}>
            {!user ? (
                <View style={{ padding: 12, backgroundColor: '#111827', borderRadius: 12, marginBottom: 12, marginTop: 40 }}>
                    <View style={{ marginBottom: 20, borderRadius: 20, overflow: 'hidden' }}>
                        <Image
                            source={{ uri: 'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?w=900' }}
                            style={{ width: '100%', height: 220 }}
                            resizeMode="cover"
                        />
                    </View>

                    <Text style={{ color: '#FFF', fontSize: 24, fontWeight: '900', marginBottom: 8 }}>
                        Travel‑Pilot Assistant
                    </Text>
                    <Text style={{ color: '#AAA', fontSize: 13, marginBottom: 16 }}>
                        Tu copiloto de IA para retrasos, reclamaciones y planes de emergencia.
                    </Text>
                    <View style={{ marginBottom: 20 }}>
                        <Text style={{ color: '#FFF', fontSize: 13, marginBottom: 6 }}>• Detecta problemas en tus vuelos antes de que te afecten.</Text>
                        <Text style={{ color: '#FFF', fontSize: 13, marginBottom: 6 }}>• Reclama tu compensación sin papeleo ni llamadas.</Text>
                        <Text style={{ color: '#FFF', fontSize: 13 }}>• Te propone rutas y hoteles alternativos en minutos.</Text>
                    </View>

                    <Text style={{ color: 'white', fontWeight: 'bold', marginBottom: 4 }}>
                        {authMode === 'login' ? 'Acceso Travel-Pilot' : 'Crea tu cuenta Travel-Pilot'}
                    </Text>
                    <Text style={{ color: 'white' }}>Introduce tus credenciales</Text>

                    <TextInput
                        placeholder="Email"
                        placeholderTextColor="#9CA3AF"
                        value={authEmail}
                        onChangeText={setAuthEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        style={{ backgroundColor: '#1F2937', color: 'white', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, marginTop: 8 }}
                    />

                    <TextInput
                        placeholder="Contraseña"
                        placeholderTextColor="#9CA3AF"
                        value={authPassword}
                        onChangeText={setAuthPassword}
                        secureTextEntry
                        style={{ backgroundColor: '#1F2937', color: 'white', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, marginTop: 8 }}
                    />

                    <View style={{ flexDirection: 'row', marginTop: 10 }}>
                        <TouchableOpacity
                            onPress={authMode === 'login' ? handleLogin : handleRegister}
                            style={{ backgroundColor: '#10B981', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, marginRight: 8, opacity: authLoading ? 0.6 : 1 }}
                            disabled={authLoading}
                        >
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>
                                {authMode === 'login' ? 'Entrar' : 'Registrar'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setAuthMode((prev: string) => (prev === 'login' ? 'register' : 'login'))}
                            style={{ backgroundColor: '#374151', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 }}
                        >
                            <Text style={{ color: 'white' }}>
                                {authMode === 'login' ? 'Cambiar a registro' : 'Cambiar a login'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        onPress={() => setAuthMode((prev: string) => (prev === 'login' ? 'register' : 'login'))}
                        style={{ marginTop: 10 }}
                    >
                        <Text style={{ color: '#666', fontSize: 12 }}>
                            {authMode === 'login' ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
                            <Text style={{ color: '#AF52DE', fontWeight: 'bold' }}>
                                {authMode === 'login' ? 'Regístrate' : 'Inicia sesión'}
                            </Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={{ padding: 20, alignItems: 'center', marginTop: 50 }}>
                    <Text style={{ color: '#FFF' }}>Conectado como {user.email}</Text>
                    <TouchableOpacity onPress={handleLogout} style={{ backgroundColor: '#EF4444', padding: 10, borderRadius: 8, marginTop: 20 }}>
                        <Text style={{ color: 'white', fontWeight: 'bold' }}>Cerrar sesión</Text>
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
    );
}
