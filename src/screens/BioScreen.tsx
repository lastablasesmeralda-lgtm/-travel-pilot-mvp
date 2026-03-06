import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { s } from '../styles';
import { useAppContext } from '../context/AppContext';
import { BACKEND_URL } from '../../config';

export default function BioScreen() {
    const { availableVoices, selectedVoice, setSelectedVoice, user } = useAppContext();

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

                <Text style={[s.b, { marginTop: 30, marginBottom: 15 }]}>NOTIFICACIONES PUSH</Text>
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
                                    body: '¡Funciona! Tu asistente te avisará aquí de cualquier retraso.'
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
                    <Text style={{ color: '#FFF', fontWeight: 'bold' }}>ENVIAR NOTIFICACIÓN DE PRUEBA</Text>
                    <Text style={{ color: '#666', fontSize: 10, marginTop: 4 }}>Comprueba si tu dispositivo recibe alertas correctamente.</Text>
                </TouchableOpacity>
            </View>
            <View style={{ height: 120 }} />
        </ScrollView>
    );
}
