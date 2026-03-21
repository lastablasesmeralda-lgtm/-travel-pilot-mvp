import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { s } from '../styles';
import { useAppContext } from '../context/AppContext';
import { BACKEND_URL } from '../../config';

export default function BioScreen() {
    const {
        availableVoices, selectedVoice, setSelectedVoice, user,
        setHasSeenOnboarding, userPhone, setUserPhone
    } = useAppContext();
    const [showGuide, setShowGuide] = useState(false);

    return (
        <ScrollView style={{ flex: 1, backgroundColor: '#0A0A0A' }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 100, paddingBottom: 110 }}>
            <View style={{ padding: 20 }}>
                {/* ——— ENCABEZADO DE PLAN ÉLITE ——— */}
                <View style={{
                    backgroundColor: '#111',
                    borderRadius: 24,
                    padding: 20,
                    borderWidth: 1,
                    borderColor: '#D4AF37',
                    borderLeftWidth: 6,
                    borderLeftColor: '#D4AF37'
                }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                        <Text style={{ color: '#D4AF37', fontWeight: '900', fontSize: 17 }}>ESTADO: ACTIVADO</Text>
                        <View style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
                            <Text style={{ color: '#D4AF37', fontWeight: 'bold', fontSize: 11 }}>MEMBRESÍA ÉLITE</Text>
                        </View>
                    </View>
                    <View style={{ height: 6, backgroundColor: '#222', borderRadius: 3, marginBottom: 10 }}>
                        <View style={{ width: '85%', height: '100%', backgroundColor: '#D4AF37', borderRadius: 3 }} />
                    </View>
                    <Text style={{ color: '#B0B0B0', fontSize: 12 }}>Tu protección Travel-Pilot está activa hasta el 20/05/2026.</Text>
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
                        <Text style={{ color: '#B0B0B0', fontSize: 11 }}>Sincronizado con Travel-Pilot</Text>
                    </View>
                    <Text style={{ color: '#B0B0B0', fontSize: 11 }}>Ping: 42ms</Text>
                </View>

                <Text style={[s.b, { marginTop: 30, marginBottom: 15 }]}>LO QUE HAS AHORRADO</Text>
                <View style={s.statsCard}>
                    <View style={s.statBox}>
                        <Text style={{ color: '#AF52DE', fontSize: 25, fontWeight: '900' }}>4.5 H</Text>
                        <Text style={{ color: '#B0B0B0', fontSize: 11, fontWeight: 'bold' }}>TIEMPO AHORRADO</Text>
                    </View>
                    <View style={s.statBox}>
                        <Text style={{ color: '#4CD964', fontSize: 25, fontWeight: '900' }}>$320</Text>
                        <Text style={{ color: '#B0B0B0', fontSize: 11, fontWeight: 'bold' }}>DINERO AHORRADO</Text>
                    </View>
                </View>

                <Text style={[s.b, { marginTop: 30, marginBottom: 15 }]}>DATOS DE CONTACTO</Text>
                <View style={[s.statsCard, { flexDirection: 'column', alignItems: 'flex-start' }]}>
                    <Text style={{ color: '#B0B0B0', fontSize: 11, marginBottom: 10 }}>Número de teléfono para avisos de viaje:</Text>
                    <View style={{ flexDirection: 'row', width: '100%', gap: 10 }}>
                        <TextInput
                            style={{ 
                                flex: 1, 
                                backgroundColor: '#1A1A1A', 
                                borderRadius: 12, 
                                padding: 12, 
                                color: '#FFF', 
                                borderWidth: 1, 
                                borderColor: '#333' 
                            }}
                            placeholder="+34 600 000 000"
                            placeholderTextColor="#555"
                            keyboardType="phone-pad"
                            value={userPhone}
                            onChangeText={setUserPhone}
                        />
                        <TouchableOpacity 
                            onPress={() => Alert.alert('ÉXITO', 'Número de contacto actualizado correctamente.')}
                            style={{ 
                                backgroundColor: '#4CD964', 
                                borderRadius: 12, 
                                justifyContent: 'center', 
                                paddingHorizontal: 15 
                            }}
                        >
                            <Text style={{ color: '#000', fontWeight: 'bold' }}>GUARDAR</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <Text style={[s.b, { marginTop: 30, marginBottom: 15 }]}>VOZ DEL ASISTENTE</Text>
                <View style={s.statsCard}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: '#AF52DE', fontSize: 13, fontWeight: 'bold', marginBottom: 5 }}>VOZ SELECCIONADA:</Text>
                        <Text style={{ color: '#FFF', fontSize: 11 }}>{availableVoices.find((v: any) => v.identifier === selectedVoice)?.name || 'Voz por defecto'}</Text>

                        <Text style={{ color: '#B0B0B0', fontSize: 10, marginTop: 12, marginBottom: 6 }}>VOCES DISPONIBLES</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {availableVoices.slice(0, 4).map((v: any, i: number) => (
                                <TouchableOpacity
                                    key={v.identifier}
                                    style={[s.voiceBtn, selectedVoice === v.identifier && s.voiceBtnSelected]}
                                    onPress={() => setSelectedVoice(v.identifier)}
                                >
                                    <Text style={{ color: selectedVoice === v.identifier ? '#000' : '#AF52DE', fontSize: 10, fontWeight: 'bold' }}>
                                        {['CLARA', 'JORGE', 'LUCÍA', 'JAVIER'][i] || `VOZ ${i + 1}`}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <Text style={{ color: '#D4AF37', fontSize: 10, marginTop: 16, marginBottom: 6 }}>✨ VOCES PREMIUM (Plan de pago)</Text>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <View style={{ backgroundColor: '#1A1500', borderWidth: 1, borderColor: '#D4AF37', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, opacity: 0.7 }}>
                                <Text style={{ color: '#D4AF37', fontSize: 11, fontWeight: 'bold' }}>🔒 AUTONOE</Text>
                                <Text style={{ color: '#B0B0B0', fontSize: 9 }}>Castellano · Gemini</Text>
                            </View>
                             <View style={{ backgroundColor: '#1A1500', borderWidth: 1, borderColor: '#D4AF37', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, opacity: 0.7 }}>
                                <Text style={{ color: '#D4AF37', fontSize: 11, fontWeight: 'bold' }}>🔒 ENCELADUS</Text>
                                <Text style={{ color: '#B0B0B0', fontSize: 9 }}>Castellano · Gemini</Text>
                            </View>
                        </View>
                        <Text style={{ color: '#555', fontSize: 9, marginTop: 8 }}>Las voces premium se activarán con tu suscripción.</Text>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={async () => {
                        if (!user?.email) return Alert.alert('Error', 'Inicia sesión primero');
                        try {
                            const resp = await fetch(`${BACKEND_URL}/api/testPush`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    email: user.email,
                                    title: '🔔 Prueba de Travel-Pilot',
                                    body: '¡Funciona! Tu asistente te avisará aquí de cualquier retraso.',
                                    entry: { flight: 'TP404' }
                                })
                            });
                            const data = await resp.json();
                            if (data.success) Alert.alert('✅ Enviada', 'La notificación debería llegar en unos segundos.');
                            else Alert.alert('❌ Error', 'No hay dispositivos registrados para este email.');
                        } catch (e) {
                            Alert.alert('❌ Error', 'No se pudo contactar con el servidor.');
                        }
                    }}
                    style={{ backgroundColor: '#111', padding: 16, borderRadius: 16, borderLeftWidth: 4, borderLeftColor: '#4CD964', marginBottom: 20 }}
                >
                    <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 15 }}>PROBAR NOTIFICACIONES</Text>
                    <Text style={{ color: '#B0B0B0', fontSize: 11, marginTop: 4 }}>Pulsa aquí para recibir una alerta de prueba.</Text>
                </TouchableOpacity>

                <Text style={[s.b, { marginTop: 10, marginBottom: 15 }]}>📖 CENTRO DE INFORMACIÓN</Text>

                <TouchableOpacity
                    onPress={async () => {
                        await AsyncStorage.removeItem('hasSeenOnboarding');
                        setHasSeenOnboarding(false);
                    }}
                    style={{
                        backgroundColor: '#111',
                        padding: 20,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: '#007AFF',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 12
                    }}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0, 122, 255, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 15 }}>
                            <Text style={{ fontSize: 20 }}>🎬</Text>
                        </View>
                        <View>
                            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 15 }}>VER TUTORIAL DE BIENVENIDA</Text>
                            <Text style={{ color: '#B0B0B0', fontSize: 11 }}>Repasa cómo funciona Travel-Pilot</Text>
                        </View>
                    </View>
                    <Text style={{ color: '#007AFF', fontSize: 18, fontWeight: 'bold' }}>→</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setShowGuide(true)}
                    style={{
                        backgroundColor: '#111',
                        padding: 20,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: '#AF52DE',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 30
                    }}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(175, 82, 222, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 15 }}>
                            <Text style={{ fontSize: 20 }}>📖</Text>
                        </View>
                        <View>
                            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 15 }}>GUÍA DEL VIAJERO</Text>
                            <Text style={{ color: '#B0B0B0', fontSize: 11 }}>Familiarízate con los consejos clave</Text>
                        </View>
                    </View>
                    <Text style={{ color: '#AF52DE', fontSize: 18, fontWeight: 'bold' }}>→</Text>
                </TouchableOpacity>

                <Modal visible={showGuide} animationType="slide" transparent={true}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', paddingTop: 60 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, marginBottom: 20 }}>
                            <Text style={{ color: '#FFF', fontSize: 21, fontWeight: '900' }}>GUÍA DEL VIAJERO</Text>
                            <TouchableOpacity onPress={() => setShowGuide(false)} style={{ backgroundColor: '#222', width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={{ color: '#B0B0B0', fontSize: 16 }}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={{ padding: 25 }}>
                            <Text style={{ color: '#AF52DE', fontSize: 11, fontWeight: 'bold', marginBottom: 15, letterSpacing: 1 }}>PASO I: CONFIGURACIÓN Y ASISTENCIA</Text>
                            {[
                                { step: '1', title: 'Planificación de Viaje', desc: 'En la pestaña VIAJE, crea tu itinerario. El asistente cruzará datos de clima y aeropuertos para darte el control total del destino.' },
                                { step: '2', title: 'Vigilancia de Vuelos 24/7', desc: 'En la pestaña VUELOS, guarda tu número. Activamos un sistema inteligente que rastrea cualquier movimiento fuera de lo previsto.' },
                                { step: '3', title: 'Notificaciones Útiles', desc: 'Sin ruidos. Solo recibirás una notificación si existe un riesgo real para tu conexión. Tu tranquilidad es nuestra prioridad.' },
                                { step: '4', title: 'Protección al Pasajero (DOCS)', desc: 'Si el retraso supera las 3h, preparamos tu expediente de reclamación al instante en la sección DOCS. Recupera hasta 600€ con un solo toque.' }
                            ].map((item, i) => (
                                <View key={i} style={{ flexDirection: 'row', marginBottom: 25 }}>
                                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#AF52DE', justifyContent: 'center', alignItems: 'center', marginRight: 15 }}>
                                        <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 12 }}>{item.step}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 15 }}>{item.title}</Text>
                                        <Text style={{ color: '#999', fontSize: 13, marginTop: 4, lineHeight: 18 }}>{item.desc}</Text>
                                    </View>
                                </View>
                            ))}

                            <Text style={{ color: '#D4AF37', fontSize: 11, fontWeight: 'bold', marginTop: 15, marginBottom: 15, letterSpacing: 1 }}>PASO II: SERVICIOS PREMIUM</Text>
                            {[
                                { step: '5', title: 'Asistencia en Destino', desc: 'Soporte directo. El asistente puede contactar con hoteles y servicios locales para avisar de tu situación si lo necesitas.' },
                                { step: '6', title: 'Planes Alternativos', desc: 'Ante un imprevisto, calculamos opciones de ruta: rapidez vs coste. Tú decides con toda la información.' },
                                { step: '7', title: 'Gestión Inteligente', desc: 'Tu asistente se encarga de lo difícil. Podrás ver cómo realiza las gestiones pesadas por ti en tiempo real.' },
                                { step: '8', title: 'Chat con IA Personal', desc: 'Chat contextual por voz o texto. El asistente conoce tu viaje y te dará los mejores consejos.' },
                                { step: '9', title: 'Seguridad y Privacidad', desc: 'Tus documentos están seguros. Encriptación avanzada AES-256 para proteger toda tu información personal.' }
                            ].map((item, i) => (
                                <View key={i} style={{ flexDirection: 'row', marginBottom: 25 }}>
                                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#D4AF37', justifyContent: 'center', alignItems: 'center', marginRight: 15 }}>
                                        <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 12 }}>{item.step}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ color: '#D4AF37', fontWeight: 'bold', fontSize: 15 }}>{item.title}</Text>
                                        <Text style={{ color: '#999', fontSize: 13, marginTop: 4, lineHeight: 18 }}>{item.desc}</Text>
                                    </View>
                                </View>
                            ))}

                            <TouchableOpacity
                                onPress={() => setShowGuide(false)}
                                style={{ backgroundColor: '#AF52DE', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 20, marginBottom: 100 }}
                            >
                                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 15 }}>¡ENTENDIDO!</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </Modal>

            </View>
            <View style={{ height: 120 }} />
        </ScrollView>
    );
}
