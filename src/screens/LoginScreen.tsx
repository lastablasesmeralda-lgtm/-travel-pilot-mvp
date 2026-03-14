import React, { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import { s } from '../styles';
import { useAppContext } from '../context/AppContext';

export default function LoginScreen() {
    const {
        user, authEmail, setAuthEmail, authName, setAuthName, authPassword, setAuthPassword,
        authMode, setAuthMode, authLoading, handleLogin, handleRegister, handleLogout
    } = useAppContext();

    return (
        <ScrollView style={{ flex: 1, backgroundColor: '#0A0A0A' }} contentContainerStyle={{ padding: 12 }}>
            {!user ? (
                <View style={{ padding: 16, backgroundColor: '#111', borderRadius: 16, marginBottom: 12, marginTop: 40, borderWidth: 1, borderColor: '#222' }}>
                    <View style={{ marginBottom: 24, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#333' }}>
                        <Image
                            source={{ uri: 'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?w=900' }}
                            style={{ width: '100%', height: 200 }}
                            resizeMode="cover"
                        />
                    </View>

                    <Text style={{ color: '#F2F2F2', fontSize: 26, fontWeight: '900', marginBottom: 8, letterSpacing: 3, textShadowColor: 'rgba(255, 255, 255, 0.1)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 }}>
                        TRAVEL‑PILOT
                    </Text>
                    <Text style={{ color: '#B0B0B0', fontSize: 13, marginBottom: 24, lineHeight: 20, fontWeight: '500' }}>
                        Tu copiloto de IA para retrasos, reclamaciones y planes de emergencia.
                    </Text>

                    <View style={{ marginBottom: 30, paddingHorizontal: 4 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                            <View style={{ width: 8, height: 2, backgroundColor: '#27C93F', marginRight: 12, borderRadius: 1 }} />
                            <Text style={{ color: '#E0E0E0', fontSize: 13, fontWeight: '600', letterSpacing: 0.3 }}>
                                <Text style={{ color: '#27C93F' }}>Vigilancia Activa</Text> de Vuelos en Tiempo Real
                            </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                            <View style={{ width: 8, height: 2, backgroundColor: '#D4AF37', marginRight: 12, borderRadius: 1 }} />
                            <Text style={{ color: '#E0E0E0', fontSize: 13, fontWeight: '600', letterSpacing: 0.3 }}>
                                <Text style={{ color: '#D4AF37' }}>Garantía de Compensación</Text> por Retraso y Cancelación
                            </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ width: 8, height: 2, backgroundColor: '#00DEFF', marginRight: 12, borderRadius: 1 }} />
                            <Text style={{ color: '#E0E0E0', fontSize: 13, fontWeight: '600', letterSpacing: 0.3 }}>
                                <Text style={{ color: '#00DEFF' }}>Protocolos de Contingencia</Text> de Respuesta Inmediata
                            </Text>
                        </View>
                    </View>

                    <View style={{ height: 1, backgroundColor: '#222', marginBottom: 24 }} />

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#AF52DE', marginRight: 8, shadowColor: '#AF52DE', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4 }} />
                        <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 15, letterSpacing: 0.5 }}>
                            {authMode === 'login' ? 'Bienvenido a Bordo' : 'Únete a Travel‑Pilot'}
                        </Text>
                    </View>
                    <Text style={{ color: '#888', fontSize: 12, marginBottom: 16, marginLeft: 16 }}>
                        {authMode === 'login' ? 'Inicia sesión para activar tu vigilancia táctica.' : 'Crea tu perfil táctico para empezar el blindaje.'}
                    </Text>

                    <TextInput
                        placeholder="Email"
                        placeholderTextColor="#444"
                        value={authEmail}
                        onChangeText={setAuthEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        style={{ backgroundColor: '#000', color: 'white', paddingHorizontal: 12, paddingVertical: 12, borderRadius: 10, marginTop: 8, borderWidth: 1, borderColor: '#333', fontSize: 14 }}
                    />

                    {authMode === 'register' && (
                        <TextInput
                            placeholder="Nombre completo"
                            placeholderTextColor="#444"
                            value={authName}
                            onChangeText={setAuthName}
                            style={{ backgroundColor: '#000', color: 'white', paddingHorizontal: 12, paddingVertical: 12, borderRadius: 10, marginTop: 12, borderWidth: 1, borderColor: '#333', fontSize: 14 }}
                        />
                    )}

                    <TextInput
                        placeholder="Contraseña"
                        placeholderTextColor="#444"
                        value={authPassword}
                        onChangeText={setAuthPassword}
                        secureTextEntry
                        style={{ backgroundColor: '#000', color: 'white', paddingHorizontal: 12, paddingVertical: 12, borderRadius: 10, marginTop: 12, borderWidth: 1, borderColor: '#333', fontSize: 14 }}
                    />

                    <View style={{ flexDirection: 'row', marginTop: 28 }}>
                        <TouchableOpacity
                            onPress={authMode === 'login' ? handleLogin : handleRegister}
                            style={{ backgroundColor: '#AF52DE', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12, marginRight: 12, opacity: authLoading ? 0.6 : 1, shadowColor: '#AF52DE', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 }}
                            disabled={authLoading}
                        >
                            <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 13, letterSpacing: 1 }}>
                                {authMode === 'login' ? 'ACCEDER' : 'REGISTRARME'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setAuthMode((prev: string) => (prev === 'login' ? 'register' : 'login'))}
                            style={{ backgroundColor: '#1A1A1A', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: '#333' }}
                        >
                            <Text style={{ color: '#E0E0E0', fontSize: 12, fontWeight: '700' }}>
                                {authMode === 'login' ? 'CREAR CUENTA' : 'VOLVER A LOGIN'}
                            </Text>
                        </TouchableOpacity>
                    </View>


                </View>
            ) : (
                <View style={{ padding: 40, alignItems: 'center', marginTop: 100, backgroundColor: '#111', borderRadius: 16, borderWidth: 1, borderColor: '#222' }}>
                    <Text style={{ color: '#E0E0E0', fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>SISTEMA ACTIVO</Text>
                    <Text style={{ color: '#888', marginBottom: 30 }}>Operativo: {user.email}</Text>
                    <TouchableOpacity onPress={handleLogout} style={{ backgroundColor: '#333', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 8 }}>
                        <Text style={{ color: '#E0E0E0', fontWeight: 'bold' }}>CERRAR SISTEMA</Text>
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
    );
}
