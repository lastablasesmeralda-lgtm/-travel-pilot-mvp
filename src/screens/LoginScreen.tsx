import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert, ScrollView, Platform, Keyboard, StyleSheet, Modal } from 'react-native';
import { s } from '../styles';
import { useAppContext } from '../context/AppContext';

export default function LoginScreen() {
    const {
        user, authEmail, setAuthEmail, authName, setAuthName, authPassword, setAuthPassword,
        authMode, setAuthMode, authLoading, handleLogin, handleRegister, handleLogout,
        userPhone, setUserPhone
    } = useAppContext();

    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [showTOS, setShowTOS] = useState(false);
    const scrollRef = useRef<ScrollView>(null);

    // Escuchar eventos reales del teclado del sistema operativo
    useEffect(() => {
        const showSub = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            (e) => {
                setKeyboardHeight(e.endCoordinates.height);
                // Scroll hasta abajo tras un breve delay para que el layout se ajuste
                setTimeout(() => {
                    scrollRef.current?.scrollToEnd({ animated: true });
                }, 100);
            }
        );
        const hideSub = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => {
                setKeyboardHeight(0);
            }
        );
        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    const handleFocus = (field: string) => {
        setFocusedField(field);
        // Doble scroll: inmediato + tras el teclado
        setTimeout(() => {
            scrollRef.current?.scrollToEnd({ animated: true });
        }, 400);
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
            <ScrollView
                ref={scrollRef}
                contentContainerStyle={{
                    flexGrow: 1,
                    padding: 12,
                    paddingBottom: keyboardHeight > 0 ? keyboardHeight + 80 : 150
                }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {!user ? (
                    <View style={{ padding: 16, backgroundColor: '#111', borderRadius: 16, marginBottom: 12, marginTop: 40, borderWidth: 1, borderColor: '#222' }}>
                        <View style={{ marginBottom: 24, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#333' }}>
                            <Image
                                source={require('../../assets/jet.jpg')}
                                style={{ width: '100%', height: 200 }}
                                resizeMode="cover"
                            />
                        </View>

                        <Text style={{ color: '#F2F2F2', fontSize: 26, fontWeight: '900', marginBottom: 8, letterSpacing: 3, textShadowColor: 'rgba(255, 255, 255, 0.1)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 }}>
                            TRAVEL‑PILOT
                        </Text>
                        <Text style={{ color: '#B0B0B0', fontSize: 13, marginBottom: 24, lineHeight: 20, fontWeight: '500' }}>
                            Asistente inteligente para viajar con total seguridad, gestionando retrasos, conexiones y reclamaciones por ti.
                        </Text>

                        <View style={{ marginBottom: 30, paddingHorizontal: 4 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                                <View style={{ width: 8, height: 2, backgroundColor: '#27C93F', marginRight: 12, borderRadius: 1 }} />
                                <Text style={{ color: '#E0E0E0', fontSize: 12.5, fontWeight: '600', letterSpacing: 0.3, flex: 1 }}>
                                    <Text style={{ color: '#27C93F' }}>Monitorización Predictiva</Text> de todos tus vuelos en tiempo real, vigilando cada cambio 24/7.
                                </Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                                <View style={{ width: 8, height: 2, backgroundColor: '#D4AF37', marginRight: 12, borderRadius: 1 }} />
                                <Text style={{ color: '#E0E0E0', fontSize: 12.5, fontWeight: '600', letterSpacing: 0.3, flex: 1 }}>
                                    <Text style={{ color: '#D4AF37' }}>Gestión de Compensación</Text> legal de hasta 600€ por el reglamento EU261 de forma automática.
                                </Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{ width: 8, height: 2, backgroundColor: '#00DEFF', marginRight: 12, borderRadius: 1 }} />
                                <Text style={{ color: '#E0E0E0', fontSize: 12.5, fontWeight: '600', letterSpacing: 0.3, flex: 1 }}>
                                    <Text style={{ color: '#00DEFF' }}>Asistencia Inmediata</Text> con planes alternativos de hoteles y transporte en caso de cualquier imprevisto.
                                </Text>
                            </View>
                        </View>

                        <View style={{ height: 1, backgroundColor: '#222', marginBottom: 24 }} />

                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#AF52DE', marginRight: 8, shadowColor: '#AF52DE', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4 }} />
                            <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 15, letterSpacing: 0.5 }}>
                                {authMode === 'login' ? 'Tu viaje empieza aquí' : 'Únete a Travel‑Pilot'}
                            </Text>
                        </View>
                        <Text style={{ color: '#888', fontSize: 12, marginBottom: 16, marginLeft: 16 }}>
                            {authMode === 'login' ? 'Inicia sesión para que nuestra IA cuide de tu viaje por ti.' : 'Crea tu perfil para empezar a viajar tranquilo.'}
                        </Text>

                        <TextInput
                            placeholder="Email"
                            placeholderTextColor="#444"
                            value={authEmail}
                            onChangeText={setAuthEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            onFocus={() => handleFocus('email')}
                            onBlur={() => setFocusedField(null)}
                            style={{ backgroundColor: '#000', color: 'white', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, marginTop: 8, borderWidth: 1, borderColor: focusedField === 'email' ? '#AF52DE' : '#222', fontSize: 14 }}
                        />

                        {authMode === 'register' && (
                            <>
                                <TextInput
                                    placeholder="Nombre completo"
                                    placeholderTextColor="#444"
                                    value={authName}
                                    onChangeText={setAuthName}
                                    onFocus={() => handleFocus('name')}
                                    onBlur={() => setFocusedField(null)}
                                    style={{ backgroundColor: '#000', color: 'white', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, marginTop: 12, borderWidth: 1, borderColor: focusedField === 'name' ? '#AF52DE' : '#222', fontSize: 14 }}
                                />
                                <TextInput
                                    placeholder="Teléfono de contacto (ej: +34...)"
                                    placeholderTextColor="#444"
                                    value={userPhone}
                                    onChangeText={setUserPhone}
                                    keyboardType="phone-pad"
                                    onFocus={() => handleFocus('phone')}
                                    onBlur={() => setFocusedField(null)}
                                    style={{ backgroundColor: '#000', color: 'white', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, marginTop: 12, borderWidth: 1, borderColor: focusedField === 'phone' ? '#AF52DE' : '#222', fontSize: 14 }}
                                />
                            </>
                        )}

                        <View style={{ position: 'relative', marginTop: 12 }}>
                            <TextInput
                                placeholder="Contraseña"
                                placeholderTextColor="#444"
                                value={authPassword}
                                onChangeText={setAuthPassword}
                                secureTextEntry={!showPassword}
                                onFocus={() => handleFocus('password')}
                                onBlur={() => setFocusedField(null)}
                                style={{ backgroundColor: '#000', color: 'white', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: focusedField === 'password' ? '#AF52DE' : '#222', fontSize: 14 }}
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                                style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 50, justifyContent: 'center', alignItems: 'center' }}
                                activeOpacity={0.6}
                            >
                                <Text style={{ fontSize: 20, color: '#666' }}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                            </TouchableOpacity>
                        </View>

                        {authMode === 'register' && (
                            <View style={{ marginTop: 20, alignItems: 'center' }}>
                                <Text style={{ color: '#888', fontSize: 11, textAlign: 'center' }}>
                                    Al pulsar "CONFIRMAR REGISTRO" declaras haber leído y aceptado nuestro{' '}
                                    <Text
                                        onPress={() => setShowTOS(true)}
                                        style={{ color: '#AF52DE', fontWeight: 'bold', textDecorationLine: 'underline' }}
                                    >
                                        Escudo Legal y Términos de Servicio
                                    </Text>.
                                </Text>
                            </View>
                        )}

                        {/* MODAL DE TÉRMINOS DE SERVICIO (LEGAL SHIELD) */}
                        <Modal visible={showTOS} transparent animationType="slide">
                            <View style={{ flex: 1, backgroundColor: '#000', padding: 25, paddingTop: 60 }}>
                                <Text style={{ color: '#AF52DE', fontSize: 24, fontWeight: '900', marginBottom: 10 }}>ESCUDO LEGAL</Text>
                                <Text style={{ color: '#888', fontSize: 13, marginBottom: 25, letterSpacing: 1 }}>TÉRMINOS DE SERVICIO Y USO</Text>

                                <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, marginBottom: 30 }}>
                                    <Text style={{ color: '#E0E0E0', fontSize: 15, lineHeight: 24, marginBottom: 20 }}>
                                        1. <Text style={{ color: '#AF52DE', fontWeight: 'bold' }}>Naturaleza del Servicio:</Text> Travel-Pilot es una herramienta inteligencia artificial de monitorización informativa. No somos una aerolínea ni un servicio de gestoría jurídica directa.{"\n\n"}
                                        2. <Text style={{ color: '#AF52DE', fontWeight: 'bold' }}>Limitación de Responsabilidad:</Text> Las respuestas del asistente IA son orientativas. Las decisiones operativas del viajero deben contrastarse siempre con el personal oficial del aeropuerto o aerolínea.{"\n\n"}
                                        3. <Text style={{ color: '#AF52DE', fontWeight: 'bold' }}>Datos de Vuelo:</Text> Aunque monitorizamos redes globales, el estado oficial del vuelo es el comunicado por las pantallas del aeropuerto. Travel-Pilot no responde por retrasos en la actualización de datos externos.{"\n\n"}
                                        4. <Text style={{ color: '#AF52DE', fontWeight: 'bold' }}>Gestión en Nombre del Usuario:</Text> El sistema no realiza transacciones económicas, reservas ni cancelaciones definitivas automáticamente sin intervención humana directa según el Plan suscrito.{"\n\n"}
                                        5. <Text style={{ color: '#AF52DE', fontWeight: 'bold' }}>Protección de Documentos:</Text> El Escudo de DOCS proporciona almacenamiento cifrado de alta seguridad. El usuario garantiza que posee los derechos legales sobre cualquier documento subido a la plataforma.{"\n\n"}
                                        6. <Text style={{ color: '#AF52DE', fontWeight: 'bold' }}>Indemnización EU261:</Text> El cálculo de compensaciones es una estimación técnica basada en la normativa europea. No garantiza el desembolso final, el cual depende de los plazos legales y la aceptación de la aerolínea.
                                    </Text>
                                </ScrollView>

                                <TouchableOpacity
                                    onPress={() => setShowTOS(false)}
                                    style={{ backgroundColor: '#AF52DE', padding: 20, borderRadius: 16, alignItems: 'center', shadowColor: '#AF52DE', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 }}
                                >
                                    <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 13, letterSpacing: 1 }}>ENTENDIDO Y ACEPTO</Text>
                                </TouchableOpacity>
                            </View>
                        </Modal>

                        <View style={{ marginTop: 28 }}>
                            <TouchableOpacity
                                onPress={authMode === 'login' ? handleLogin : handleRegister}
                                style={{
                                    backgroundColor: authMode === 'login' ? '#007AFF' : '#AF52DE',
                                    paddingVertical: 16,
                                    borderRadius: 12,
                                    alignItems: 'center',
                                    opacity: authLoading ? 0.6 : 1,
                                    shadowColor: authMode === 'login' ? '#007AFF' : '#AF52DE',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.4,
                                    shadowRadius: 8,
                                    elevation: 5
                                }}
                                disabled={authLoading}
                            >
                                <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 13, letterSpacing: 1 }}>
                                    {authMode === 'login' ? 'INICIAR SESIÓN' : 'CONFIRMAR REGISTRO'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setAuthMode((prev: string) => (prev === 'login' ? 'register' : 'login'))}
                                style={{ backgroundColor: '#1A1A1A', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#333', marginTop: 12, alignItems: 'center' }}
                            >
                                <Text style={{ color: '#888', fontWeight: 'bold', fontSize: 12 }}>
                                    {authMode === 'login' ? 'CREAR UNA CUENTA NUEVA' : '← VOLVER AL INICIO DE SESIÓN'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                    </View>
                ) : (
                    <View style={{ padding: 40, alignItems: 'center', marginTop: 100, backgroundColor: '#111', borderRadius: 16, borderWidth: 1, borderColor: '#222' }}>
                        <Text style={{ color: '#E0E0E0', fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>ASISTENCIA ACTIVA</Text>
                        <Text style={{ color: '#888', marginBottom: 30 }}>Usuario: {user.email}</Text>
                        <TouchableOpacity onPress={handleLogout} style={{ backgroundColor: '#333', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 8 }}>
                            <Text style={{ color: '#E0E0E0', fontWeight: 'bold' }}>CERRAR SESIÓN</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}
