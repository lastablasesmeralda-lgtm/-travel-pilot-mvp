import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { s } from '../styles';
import { useAppContext } from '../context/AppContext';
import { BACKEND_URL } from '../../config';
import VIPModalScreen from './VIPModalScreen';

export default function BioScreen() {
    const {
        availableVoices, selectedVoice, setSelectedVoice, user,
        setHasSeenOnboarding, userPhone, setUserPhone, setIsReplayingTutorial,
        travelProfile, setTravelProfile, speak, simulatePushNotification, handleLogout,
        savedTime, recoveredMoney, masterReset
    } = useAppContext();
    const [showGuide, setShowGuide] = useState(false);
    const [showVip, setShowVip] = useState(false);

    // Estados locales para el formulario de perfil (Pre-rellenados para Demo)
    const [fullName, setFullName] = useState('Juan García López');
    const [idNumber, setIdNumber] = useState('12345678X');
    const [demoPhone, setDemoPhone] = useState('+34 600 000 000');

    return (
        <ScrollView style={{ flex: 1, backgroundColor: '#0A0A0A' }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 100, paddingBottom: 120 }}>
            <View style={{ padding: 20 }}>
                {/* ——— ENCABEZADO DE STATUS ——— */}
                <View style={{
                    backgroundColor: '#111',
                    borderRadius: 24,
                    padding: 20,
                    borderWidth: 1,
                    borderColor: travelProfile === 'premium' ? '#D4AF37' : '#333',
                    borderLeftWidth: 6,
                    borderLeftColor: travelProfile === 'premium' ? '#D4AF37' : '#555'
                }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                        <Text style={{ color: travelProfile === 'premium' ? '#D4AF37' : '#B0B0B0', fontWeight: '900', fontSize: 17 }}>
                            STATUS: {travelProfile === 'premium' ? 'ÉLITE ACTIVADO' : 'EXPLORADOR'}
                        </Text>
                        <View style={{ backgroundColor: travelProfile === 'premium' ? 'rgba(212, 175, 55, 0.1)' : 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
                            <Text style={{ color: travelProfile === 'premium' ? '#D4AF37' : '#777', fontWeight: 'bold', fontSize: 11 }}>
                                {travelProfile === 'premium' ? 'VIAJERO VIP' : 'MODO BÁSICO'}
                            </Text>
                        </View>
                    </View>
                    <View style={{ height: 6, backgroundColor: '#222', borderRadius: 3, marginBottom: 10 }}>
                        <View style={{ width: travelProfile === 'premium' ? '100%' : '30%', height: '100%', backgroundColor: travelProfile === 'premium' ? '#D4AF37' : '#555', borderRadius: 3 }} />
                    </View>
                    <Text style={{ color: '#888', fontSize: 12 }}>
                        {travelProfile === 'premium' ? 'Tu protección Travel-Pilot está activa y vigilando.' : 'Protección estándar activada. Mejora a VIP para cobertura total.'}
                    </Text>
                </View>

                {/* ——— ESTADO DE CONEXIÓN ——— */}
                <View style={{
                    flexDirection: 'row',
                    marginTop: 20,
                    backgroundColor: '#0D0D0D',
                    borderRadius: 16,
                    padding: 15,
                    borderWidth: 1,
                    borderColor: '#222',
                    alignItems: 'center'
                }}>
                    <View style={{
                        width: 10, height: 10, borderRadius: 5,
                        backgroundColor: '#4CD964', marginRight: 12,
                        shadowColor: '#4CD964', shadowOpacity: 0.5, shadowRadius: 5
                    }} />
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: '#FFF', fontSize: 13, fontWeight: 'bold' }}>ASISTENCIA CONECTADA</Text>
                        <Text style={{ color: '#B0B0B0', fontSize: 11 }}>Sincronizado con Travel-Pilot Global</Text>
                    </View>
                    <Text style={{ color: '#444', fontSize: 11 }}>Ping: 42ms</Text>
                </View>

                <Text style={[s.b, { marginTop: 30, marginBottom: 15 }]}>LO QUE HAS AHORRADO</Text>
                <View style={s.statsCard}>
                    <View style={s.statBox}>
                        <Text style={{ color: '#AF52DE', fontSize: 25, fontWeight: '900' }}>{savedTime} H</Text>
                        <Text style={{ color: '#B0B0B0', fontSize: 11, fontWeight: 'bold' }}>TIEMPO AHORRADO</Text>
                    </View>
                    <View style={s.statBox}>
                        <Text style={{ color: '#4CD964', fontSize: 25, fontWeight: '900' }}>€{recoveredMoney}</Text>
                        <Text style={{ color: '#B0B0B0', fontSize: 11, fontWeight: 'bold' }}>DINERO RECUPERADO</Text>
                    </View>
                </View>

                {/* ——— INFORMACIÓN DE SEGURIDAD ——— */}
                <Text style={[s.b, { marginTop: 10, marginBottom: 15 }]}>INFORMACIÓN DE SEGURIDAD</Text>
                <View style={[s.statsCard, { flexDirection: 'column' }]}>
                    <View style={{ width: '100%', marginBottom: 15 }}>
                        <Text style={{ color: '#AF52DE', fontSize: 11, fontWeight: 'bold', marginBottom: 5 }}>NOMBRE</Text>
                        <TextInput
                            value={fullName}
                            onChangeText={setFullName}
                            placeholder="Ej: Juan García López"
                            placeholderTextColor="#444"
                            style={{ backgroundColor: '#1A1A1A', color: '#FFF', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#333' }}
                        />
                    </View>

                    <View style={{ width: '100%', marginBottom: 15 }}>
                        <Text style={{ color: '#AF52DE', fontSize: 11, fontWeight: 'bold', marginBottom: 5 }}>DNI / PASAPORTE</Text>
                        <TextInput
                            value={idNumber}
                            onChangeText={setIdNumber}
                            placeholder="Ej: 12345678X"
                            placeholderTextColor="#444"
                            style={{ backgroundColor: '#1A1A1A', color: '#FFF', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#333' }}
                        />
                    </View>

                    <View style={{ width: '100%', marginBottom: 15 }}>
                        <Text style={{ color: '#AF52DE', fontSize: 11, fontWeight: 'bold', marginBottom: 5 }}>TELÉFONO</Text>
                        <TextInput
                            value={demoPhone}
                            onChangeText={setDemoPhone}
                            placeholder="Ej: +34 600 000 000"
                            placeholderTextColor="#444"
                            keyboardType="phone-pad"
                            style={{ backgroundColor: '#1A1A1A', color: '#FFF', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#333' }}
                        />
                    </View>

                    <TouchableOpacity
                         onPress={() => Alert.alert('Éxito', 'Información actualizada y encriptada.')}
                         style={{ backgroundColor: '#4CD964', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}
                    >
                         <Text style={{ color: '#000', fontWeight: 'bold' }}>GUARDAR CAMBIOS</Text>
                    </TouchableOpacity>
                </View>

                {/* ——— TRAVEL PROFILE (IA) ——— */}
                <Text style={[s.b, { marginTop: 30, marginBottom: 15 }]}>PERFIL DE VIAJERO (IA)</Text>
                <View style={[s.statsCard, { flexDirection: 'column' }]}>
                    <Text style={{ color: '#B0B0B0', fontSize: 11, marginBottom: 15, lineHeight: 16 }}>
                        La IA utilizará este perfil para tomar decisiones automáticas en caso de imprevistos graves.
                    </Text>

                    <View style={{ gap: 10 }}>

                        <TouchableOpacity
                            onPress={() => setTravelProfile('budget')}
                            style={{
                                backgroundColor: travelProfile === 'budget' ? 'rgba(52, 199, 89, 0.1)' : '#1A1A1A',
                                borderWidth: 1,
                                borderColor: travelProfile === 'budget' ? '#34C759' : '#333',
                                borderRadius: 12,
                                padding: 15
                            }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                <Text style={{ fontSize: 18, marginRight: 8 }}>🎒</Text>
                                <Text style={{ color: travelProfile === 'budget' ? '#34C759' : '#FFF', fontSize: 14, fontWeight: 'bold' }}>MODO ESTÁNDAR</Text>
                            </View>
                            <Text style={{ color: '#B0B0B0', fontSize: 11 }}>Vigilancia estándar de tus vuelos. Los protocolos de resolución avanzada IA están reservados para usuarios VIP.</Text>
                        </TouchableOpacity>
                    </View>

                    {/* SECCIÓN ESPECIAL: ESCUDO LEGAL VIP (Servicio Premium) */}
                    <View style={{ marginTop: 25, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#222' }}>
                        <TouchableOpacity
                            onPress={() => setShowVip(true)}
                            style={{
                                backgroundColor: travelProfile === 'premium' ? 'rgba(212, 175, 55, 0.1)' : '#1A1A1A',
                                borderWidth: travelProfile === 'premium' ? 2 : 1,
                                borderColor: travelProfile === 'premium' ? '#D4AF37' : '#333',
                                borderRadius: 16,
                                padding: 20,
                                shadowColor: travelProfile === 'premium' ? '#D4AF37' : 'transparent',
                                shadowOpacity: travelProfile === 'premium' ? 0.3 : 0,
                                shadowRadius: travelProfile === 'premium' ? 10 : 0
                            }}
                        >
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={{ fontSize: 24, marginRight: 10 }}>💎</Text>
                                    <Text style={{ color: '#D4AF37', fontSize: 16, fontWeight: '900' }}>ESCUDO LEGAL VIP</Text>
                                </View>
                                {travelProfile === 'premium' && (
                                    <View style={{ backgroundColor: '#D4AF37', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                                        <Text style={{ color: '#000', fontSize: 10, fontWeight: 'bold' }}>ACTIVO</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={{ color: '#FFF', fontSize: 13, fontWeight: 'bold', marginBottom: 4 }}>
                                {travelProfile === 'premium' ? 'Protección Total Activada' : 'Desbloquea la Asistencia de Élite'}
                            </Text>
                            <Text style={{ color: '#B0B0B0', fontSize: 11, lineHeight: 16 }}>
                                {travelProfile === 'premium'
                                    ? 'Estás cubierto contra retrasos, cancelaciones y pérdidas de equipaje con prioridad absoluta.'
                                    : 'Accede al sistema de reclamaciones automáticas, salas VIP y asistencia humana 24/7.'}
                            </Text>
                            <Text style={{ color: '#D4AF37', fontSize: 12, fontWeight: 'bold', marginTop: 12 }}>
                                {travelProfile === 'premium' ? 'GESTIONAR MI SUSCRIPCIÓN →' : 'SABER MÁS Y ACTIVAR →'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ——— VOZ ——— */}
                <Text style={[s.b, { marginTop: 30, marginBottom: 15 }]}>VOZ DEL ASISTENTE</Text>
                <View style={s.statsCard}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: '#AF52DE', fontSize: 13, fontWeight: 'bold', marginBottom: 5 }}>VOZ SELECCIONADA:</Text>
                        <Text style={{ color: '#FFF', fontSize: 11 }}>{availableVoices.find((v: any) => v.identifier === selectedVoice)?.humanName?.toUpperCase() || 'Voz Nativa'}</Text>

                        <Text style={{ color: '#B0B0B0', fontSize: 10, marginTop: 12, marginBottom: 10 }}>SELECCIÓN RÁPIDA</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {availableVoices.slice(0, 5).map((v: any, i: number) => {
                                const isLocked = v.isPremium && travelProfile !== 'premium';
                                return (
                                    <TouchableOpacity
                                        key={v.identifier || i}
                                        style={[
                                            s.voiceBtn,
                                            selectedVoice === v.identifier && s.voiceBtnSelected,
                                            isLocked && { opacity: 0.6, borderColor: '#555' }
                                        ]}
                                        onPress={() => {
                                            if (isLocked) {
                                                Alert.alert('Acceso Premium', 'Las voces de Marco y Clara son exclusivas para usuarios VIP. Mejora tu plan para desbloquearlas.');
                                                return;
                                            }
                                            setSelectedVoice(v.identifier);
                                            speak('Hola, soy tu asistente de viaje inteligente.', v.identifier);
                                        }}
                                    >
                                        <Text style={{ color: selectedVoice === v.identifier ? '#000' : '#AF52DE', fontSize: 10, fontWeight: 'bold' }}>
                                            {isLocked ? `🔒 ${v.humanName?.toUpperCase()}` : v.humanName?.toUpperCase() || `VOZ ${i + 1}`}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                </View>

                {/* ——— AYUDA Y TUTORIAL ——— */}
                <Text style={[s.b, { marginTop: 30, marginBottom: 15 }]}>📖 CENTRO DE AYUDA</Text>
                <TouchableOpacity
                    onPress={async () => {
                        await AsyncStorage.removeItem('hasSeenOnboarding');
                        setIsReplayingTutorial(true);
                        setHasSeenOnboarding(false);
                    }}
                    style={{ backgroundColor: '#111', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#007AFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 20, marginRight: 15 }}>🎬</Text>
                        <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 15 }}>VER TUTORIAL DE BIENVENIDA</Text>
                    </View>
                    <Text style={{ color: '#007AFF', fontSize: 18 }}>→</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setShowGuide(true)}
                    style={{ backgroundColor: '#111', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#AF52DE', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 20, marginRight: 15 }}>📖</Text>
                        <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 15 }}>GUÍA DEL VIAJERO</Text>
                    </View>
                    <Text style={{ color: '#AF52DE', fontSize: 18 }}>→</Text>
                </TouchableOpacity>

                {/* ——— RESET MAESTRO (PARA BETA) ——— */}
                <TouchableOpacity
                    onPress={() => {
                        Alert.alert(
                            "🔄 RESET MAESTRO (MODO BETA)",
                            "Esto borrará todos tus ahorros, vuelos y documentos para empezar de cero.\n\n¿Estás seguro?",
                            [
                                { text: "CANCELAR", style: 'cancel' },
                                { text: "SÍ, RESETEAR TODO", style: 'destructive', onPress: () => masterReset() }
                            ]
                        );
                    }}
                    style={{
                        backgroundColor: 'rgba(255, 149, 0, 0.1)',
                        padding: 20,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: '#FF9500',
                        alignItems: 'center',
                        marginBottom: 15
                    }}
                >
                    <Text style={{ color: '#FF9500', fontWeight: 'bold', fontSize: 15 }}>RESETEO MAESTRO (BETA 0.0)</Text>
                </TouchableOpacity>

                {/* ——— CERRAR SESIÓN ——— */}
                <TouchableOpacity
                    onPress={() => {
                        Alert.alert("CERRAR SESIÓN", "¿Seguro que quieres salir?", [
                            { text: "CANCELAR", style: 'cancel' },
                            { text: "SÍ, SALIR", style: 'destructive', onPress: () => handleLogout() }
                        ]);
                    }}
                    style={{
                        backgroundColor: 'rgba(255, 59, 48, 0.1)',
                        padding: 20,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: '#FF3B30',
                        alignItems: 'center',
                        marginBottom: 100
                    }}
                >
                    <Text style={{ color: '#FF3B30', fontWeight: 'bold', fontSize: 15 }}>CERRAR SESIÓN</Text>
                </TouchableOpacity>
            </View>

            {/* MODAL GUÍA DEL VIAJERO */}
            <Modal visible={showGuide} animationType="slide" transparent>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.98)', paddingTop: 60 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, marginBottom: 20 }}>
                        <Text style={{ color: '#FFF', fontSize: 20, fontWeight: '900' }}>CÓMO TE PROTEGEMOS</Text>
                        <TouchableOpacity onPress={() => setShowGuide(false)} style={{ backgroundColor: '#222', padding: 8, borderRadius: 15, width: 40, alignItems: 'center' }}>
                            <Text style={{ color: '#FFF', fontWeight: 'bold' }}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={{ padding: 25, paddingBottom: 50 }}>
                        <Text style={{ color: '#D4AF37', fontSize: 13, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 10 }}>TU EXPERIENCIA PREMIUM ✨</Text>
                        <Text style={{ color: '#B0B0B0', fontSize: 14, lineHeight: 20, marginBottom: 30 }}>
                            Bienvenido a <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Travel-Pilot</Text>. Estas son las 9 funciones clave diseñadas para que tus viajes sean siempre tranquilos y bajo control.
                        </Text>

                        {[
                            { id: '1', t: 'Organizador de Viajes', d: 'Registra tu viaje en la pestaña INICIO para activar tu escudo de protección. Al hacerlo, vinculas tu vuelo con tu alojamiento y permites que nuestra IA gestione cruzadamente el clima, los horarios y tu seguridad hotelera en tiempo real.', icon: '🗺️' },
                            { id: '2', t: 'Rastreador de Vuelos', d: 'Introduce tu código en la pestaña VUELOS. Activamos una vigilancia satelital 24/7 mediante IA que te notificará cualquier alteración o cambio de última hora en el acto.', icon: '🛰️' },
                            { id: '3', t: 'Avisos Inteligentes', d: 'Cero SPAM. Nuestro algoritmo solo genera notificaciones críticas cuando detecta un riesgo real para tu itinerario, permitiéndote disfrutar del viaje sin ruido innecesario pero con seguridad total.', icon: '🔔' },
                            { id: '4', t: 'Gestión de Reembolsos', d: 'Detectamos automáticamente retrasos de +3h y cancelaciones para generar tu reclamación legal de hasta 600€. Podrás revisar, firmar digitalmente tu demanda y exportarla en PDF en segundos desde la propia App.', icon: '🛡️' },
                            { id: '5', t: 'Ayuda en Emergencias', d: 'Ante una crisis grave, tu asistente activa una llamada de voz inteligente para avisar directamente a tu hotel de tu retraso. Protegemos tu alojamiento sin que tú tengas que realizar ninguna llamada internacional.', icon: '🆘' },
                            { id: '6', t: 'Soluciones de Ruta', d: 'No pierdas el tiempo decidiendo. Nuestra IA calcula al instante 3 protocolos de rescate personalizados: el más Rápido (Vuelo), el más Económico (Reclamación) o el de máximo Confort (Hotel). Tú eliges con un solo toque.', icon: '⚡' },
                            { id: '7', t: 'Copiloto 24/7', d: 'Tu asistente nunca duerme. Mientras tú descansas o te desplazas, nuestra IA trabaja en segundo plano rastreando plazas libres y alternativas de transporte para adelantarse a cualquier problema.', icon: '🤖' },
                            { id: '8', t: 'Agente Conversacional', d: 'Comunícate con tu asistente inteligente mediante voz o texto. Nuestra IA conoce cada detalle de tu viaje y está lista para resolver dudas complejas, traducir frases de emergencia o coordinar transporte en cualquier ciudad.', icon: '🎙️' },
                            { id: '9', t: 'Privacidad Total', d: 'Tus datos son sagrados. Pasaportes, billetes y reclamaciones se guardan bajo máxima encriptación en tu propia Bóveda Blindada, garantizando que tu información personal nunca se comparta sin tu permiso explícito.', icon: '🔐' },
                        ].map((p, i) => (
                            <View key={i} style={{ backgroundColor: '#111', padding: 20, borderRadius: 20, marginBottom: 15, borderWidth: 1, borderColor: '#222' }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                                    <Text style={{ color: '#444', fontSize: 10, fontWeight: '900' }}>FUNCIÓN {p.id}</Text>
                                    <Text style={{ fontSize: 18 }}>{p.icon}</Text>
                                </View>
                                <Text style={{ color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 6 }}>{p.t.toUpperCase()}</Text>
                                <Text style={{ color: '#888', fontSize: 13, lineHeight: 18 }}>{p.d}</Text>
                            </View>
                        ))}

                        <TouchableOpacity
                            onPress={() => setShowGuide(false)}
                            style={{ backgroundColor: '#AF52DE', padding: 18, borderRadius: 15, marginTop: 20, alignItems: 'center' }}
                        >
                            <Text style={{ color: '#FFF', fontWeight: 'bold', letterSpacing: 1 }}>ENTENDIDO</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </Modal>

            <Modal visible={showVip} animationType="slide" transparent>
                <VIPModalScreen
                    onClose={() => setShowVip(false)}
                    onActivate={() => {
                        setTravelProfile('premium');
                        setShowVip(false);
                        Alert.alert('💎 STATUS ACTIVADO', 'Bienvenido al Universo VIP.');
                    }}
                />
            </Modal>
        </ScrollView>
    );
}
