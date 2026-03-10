import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { s } from '../styles';
import { useAppContext } from '../context/AppContext';
import { BACKEND_URL } from '../../config';

export default function BioScreen() {
    const { availableVoices, selectedVoice, setSelectedVoice, user } = useAppContext();
    const [showGuide, setShowGuide] = useState(false);

    return (
        <ScrollView style={{ flex: 1, backgroundColor: '#0A0A0A' }} showsVerticalScrollIndicator={false}>
            <View style={{ padding: 20 }}>
                <View style={[s.bb, { borderColor: '#D4AF37', borderWidth: 1 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={s.vt}>TU PLAN</Text>
                        <Text style={{ color: '#D4AF37', fontWeight: 'bold', fontSize: 10 }}>PLAN ÉLITE</Text>
                    </View>
                    <View style={s.bg}><View style={[s.bf, { width: '85%' }]} /></View>
                    <Text style={s.vs}>Tu plan está activo • Nivel Élite</Text>
                </View>

                <Text style={[s.b, { marginTop: 30, marginBottom: 15 }]}>LO QUE HAS AHORRADO</Text>
                <View style={s.statsCard}>
                    <View style={s.statBox}>
                        <Text style={{ color: '#AF52DE', fontSize: 24, fontWeight: '900' }}>4.5 H</Text>
                        <Text style={{ color: '#666', fontSize: 10, fontWeight: 'bold' }}>TIEMPO AHORRADO</Text>
                    </View>
                    <View style={s.statBox}>
                        <Text style={{ color: '#4CD964', fontSize: 24, fontWeight: '900' }}>$320</Text>
                        <Text style={{ color: '#666', fontSize: 10, fontWeight: 'bold' }}>DINERO AHORRADO</Text>
                    </View>
                </View>

                <Text style={[s.b, { marginTop: 30, marginBottom: 15 }]}>VOZ DEL ASISTENTE</Text>
                <View style={s.statsCard}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: '#AF52DE', fontSize: 12, fontWeight: 'bold', marginBottom: 5 }}>VOZ SELECCIONADA:</Text>
                        <Text style={{ color: '#FFF', fontSize: 10 }}>{availableVoices.find((v: any) => v.identifier === selectedVoice)?.name || 'Voz por defecto'}</Text>

                        <Text style={{ color: '#666', fontSize: 9, marginTop: 12, marginBottom: 6 }}>VOCES DISPONIBLES</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {availableVoices.slice(0, 4).map((v: any, i: number) => (
                                <TouchableOpacity
                                    key={v.identifier}
                                    style={[s.voiceBtn, selectedVoice === v.identifier && s.voiceBtnSelected]}
                                    onPress={() => setSelectedVoice(v.identifier)}
                                >
                                    <Text style={{ color: selectedVoice === v.identifier ? '#000' : '#AF52DE', fontSize: 9, fontWeight: 'bold' }}>
                                        {['CLARA', 'LUCÍA', 'JORGE', 'ELENA'][i] || `VOZ ${i + 1}`}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <Text style={{ color: '#D4AF37', fontSize: 9, marginTop: 16, marginBottom: 6 }}>✨ VOCES PREMIUM (Plan de pago)</Text>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <View style={{ backgroundColor: '#1A1500', borderWidth: 1, borderColor: '#D4AF37', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, opacity: 0.7 }}>
                                <Text style={{ color: '#D4AF37', fontSize: 10, fontWeight: 'bold' }}>🔒 AUTONOE</Text>
                                <Text style={{ color: '#888', fontSize: 8 }}>Castellano · Gemini</Text>
                            </View>
                            <View style={{ backgroundColor: '#1A1500', borderWidth: 1, borderColor: '#D4AF37', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, opacity: 0.7 }}>
                                <Text style={{ color: '#D4AF37', fontSize: 10, fontWeight: 'bold' }}>🔒 ENCELADUS</Text>
                                <Text style={{ color: '#888', fontSize: 8 }}>Castellano · Gemini</Text>
                            </View>
                        </View>
                        <Text style={{ color: '#555', fontSize: 8, marginTop: 8 }}>Las voces premium se activarán con tu suscripción.</Text>
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
                    <Text style={{ color: '#FFF', fontWeight: 'bold' }}>PROBAR NOTIFICACIONES</Text>
                    <Text style={{ color: '#666', fontSize: 10, marginTop: 4 }}>Pulsa aquí para recibir una alerta de prueba.</Text>
                </TouchableOpacity>

                <Text style={[s.b, { marginTop: 10, marginBottom: 15 }]}>📖 CENTRO DE INFORMACIÓN</Text>

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
                            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>GUÍA DE OPERACIONES</Text>
                            <Text style={{ color: '#666', fontSize: 10 }}>Familiarízate con los 9 protocolos clave</Text>
                        </View>
                    </View>
                    <Text style={{ color: '#AF52DE', fontSize: 18, fontWeight: 'bold' }}>→</Text>
                </TouchableOpacity>

                <Modal visible={showGuide} animationType="slide" transparent={true}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', paddingTop: 60 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, marginBottom: 20 }}>
                            <Text style={{ color: '#FFF', fontSize: 20, fontWeight: '900' }}>GUÍA DE OPERACIONES</Text>
                            <TouchableOpacity onPress={() => setShowGuide(false)} style={{ backgroundColor: '#222', width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={{ color: '#666', fontSize: 16 }}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={{ padding: 25 }}>
                            <Text style={{ color: '#AF52DE', fontSize: 10, fontWeight: 'bold', marginBottom: 15, letterSpacing: 1 }}>FASE I: CONFIGURACIÓN Y VIGILANCIA</Text>
                            {[
                                { step: '1', title: 'Centro de Operaciones', desc: 'En la pestaña VIAJE, crea tu itinerario. La IA cruzará datos de clima y aeropuertos para darte el control total del destino.' },
                                { step: '2', title: 'Radar Centinela 24/7', desc: 'En VUELOS, guarda tu número. Activamos un radar digital que rastrea cualquier movimiento fuera de lo previsto.' },
                                { step: '3', title: 'Alertas Inteligentes', desc: 'Sin ruidos. Solo recibirás una notificación si existe un riesgo real para tu conexión. Tu paz mental es nuestra prioridad.' },
                                { step: '4', title: 'Escudo Legal (Vault)', desc: 'Si el retraso supera las 3h, generamos tu expediente legal al instante. Recupera hasta 600€ con un solo toque.' }
                            ].map((item, i) => (
                                <View key={i} style={{ flexDirection: 'row', marginBottom: 25 }}>
                                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#AF52DE', justifyContent: 'center', alignItems: 'center', marginRight: 15 }}>
                                        <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 11 }}>{item.step}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>{item.title}</Text>
                                        <Text style={{ color: '#999', fontSize: 12, marginTop: 4, lineHeight: 18 }}>{item.desc}</Text>
                                    </View>
                                </View>
                            ))}

                            <Text style={{ color: '#D4AF37', fontSize: 10, fontWeight: 'bold', marginTop: 15, marginBottom: 15, letterSpacing: 1 }}>FASE II: PROTOCOLOS DE ÉLITE</Text>
                            {[
                                { step: '5', title: 'Protocolo SOS', desc: 'Asistencia táctica. La IA puede contactar con hoteles y servicios locales para avisar de tu situación en emergencias.' },
                                { step: '6', title: 'Contingencia Táctica', desc: 'Ante un fallo, calculamos 3 realidades alternativas: rapidez vs coste. Tú decides con datos fríos.' },
                                { step: '7', title: 'Ejecución Autónoma', desc: 'Tu asistente toma los mandos. Verás a la IA navegar y realizar gestiones pesadas por ti en tiempo real.' },
                                { step: '8', title: 'Enlace con el Comandante', desc: 'Chat contextual por voz o texto. El núcleo Gemini conoce tu itinerario y te dará consejos expertos.' },
                                { step: '9', title: 'Privacidad Encriptada', desc: 'Tus documentos nunca salen de tu dispositivo sin permiso. Encriptación de grado militar AES-256.' }
                            ].map((item, i) => (
                                <View key={i} style={{ flexDirection: 'row', marginBottom: 25 }}>
                                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#D4AF37', justifyContent: 'center', alignItems: 'center', marginRight: 15 }}>
                                        <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 11 }}>{item.step}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ color: '#D4AF37', fontWeight: 'bold', fontSize: 14 }}>{item.title}</Text>
                                        <Text style={{ color: '#999', fontSize: 12, marginTop: 4, lineHeight: 18 }}>{item.desc}</Text>
                                    </View>
                                </View>
                            ))}

                            <TouchableOpacity
                                onPress={() => setShowGuide(false)}
                                style={{ backgroundColor: '#AF52DE', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 20, marginBottom: 100 }}
                            >
                                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>ENTENDIDO, COMANDANTE</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </Modal>

            </View>
            <View style={{ height: 120 }} />
        </ScrollView>
    );
}
