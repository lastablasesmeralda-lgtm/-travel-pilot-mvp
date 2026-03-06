import React from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { s } from '../styles';
import { useAppContext } from '../context/AppContext';

export default function VaultScreen() {
    const { legalShieldActive, setViewDoc, setIsScanning, claims } = useAppContext();

    return (
        <View style={{ flex: 1, padding: 20, backgroundColor: '#0A0A0A' }}>
            {legalShieldActive && (
                <View style={{ backgroundColor: 'rgba(39, 201, 63, 0.2)', padding: 12, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#27C93F', flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 18, marginRight: 10 }}>🛡️</Text>
                    <View>
                        <Text style={{ color: '#27C93F', fontWeight: 'bold', fontSize: 12 }}>ESCUDO DE PROTECCIÓN LEGAL</Text>
                        <Text style={{ color: '#EEE', fontSize: 10 }}>Expediente activo por retraso de vuelo detectado.</Text>
                    </View>
                </View>
            )}
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => Alert.alert(
                    "📊 ESTADO DE TU ASISTENTE",
                    "ESTADO: Operativo\nConectado a: tu email y datos de vuelo\nÚLTIMA ACTUALIZACIÓN: Hace 12 min\n\nTu asistente está vigilando 3 documentos detectados y comprobando tu conexión en Londres (LHR) en tiempo real.",
                    [{ text: "ENTENDIDO", style: "default" }]
                )}
                style={{ backgroundColor: '#111', padding: 15, borderRadius: 15, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: '#AF52DE' }}
            >
                <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold' }}>🧠 TU VIAJE ESTÁ VIGILADO</Text>
                <Text style={{ color: '#666', fontSize: 10 }}>Conectado con: tu email // Hace 12 min</Text>
            </TouchableOpacity>

            <Text style={s.vl}>DOCUMENTACIÓN PROTEGIDA</Text>

            {[
                { t: 'PASAPORTE', s: 'ID: ESP-9283', i: 'https://images.unsplash.com/photo-1544333346-ced983050275?w=400', source: 'VAULT' },
                { t: 'BOARDING PASS', s: 'GATE 12A // FLIGHT TP-90', i: 'https://images.unsplash.com/photo-1582559930335-648679198642?w=400', source: 'GMAIL' },
                { t: 'HOTEL BOOKING', s: 'CONF: #88291-TX // TOKYO', i: 'https://images.unsplash.com/photo-1551882547-ff43c630f5e1?w=400', source: 'OUTLOOK' }
            ].map((d, i) => (
                <TouchableOpacity
                    key={i}
                    style={s.vc}
                    onPress={() => {
                        setViewDoc(d);
                        setIsScanning(true);
                        setTimeout(() => setIsScanning(false), 2500);
                    }}
                >
                    <Image source={{ uri: d.i }} style={s.vi} />
                    <View style={{ flex: 1, marginLeft: 15 }}>
                        <Text style={s.vt}>{d.t}</Text>
                        <Text style={s.vs}>{d.s}</Text>
                        <Text style={{ color: d.source === 'VAULT' ? '#666' : '#AF52DE', fontSize: 8, fontWeight: 'bold', marginTop: 4 }}>
                            {d.source !== 'VAULT' ? '✨ Detección Inteligente (AI Scan)' : 'Documento Seguro'}
                        </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ color: '#AF52DE', fontSize: 10, fontWeight: 'bold' }}>PROTEGIDO</Text>
                        <Text style={{ color: '#666', fontSize: 8 }}>VERIFICAR</Text>
                    </View>
                </TouchableOpacity>
            ))}

            <Text style={[s.vl, { marginTop: 20 }]}>⚖️ GESTION DE REEMBOLSOS (EU261)</Text>
            {claims && claims.map((c, i) => (
                <TouchableOpacity key={i} style={[s.vc, { borderLeftWidth: 3, borderLeftColor: '#27C93F', flexDirection: 'column', alignItems: 'flex-start' }]}>
                    <View style={{ flexDirection: 'row', width: '100%', alignItems: 'center', marginBottom: 5 }}>
                        <View style={{ flex: 1 }}>
                            <Text style={s.vt}>{c.aerolinea}</Text>
                            <Text style={{ color: '#27C93F', fontSize: 10, fontWeight: 'bold' }}>{c.estado}</Text>
                        </View>
                        <ActivityIndicator size="small" color="#27C93F" />
                    </View>
                    <View style={{ backgroundColor: '#222', width: '100%', height: 4, borderRadius: 2, marginVertical: 8 }}>
                        <View style={{ backgroundColor: '#27C93F', width: c.estado.includes('ENVIADA') ? '60%' : '20%', height: '100%', borderRadius: 2 }} />
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                        <Text style={{ color: '#666', fontSize: 9 }}>COMPENSACIÓN: <Text style={{ color: '#FFF' }}>{c.compensacion}</Text></Text>
                        <Text style={{ color: '#AF52DE', fontSize: 9, fontWeight: 'bold' }}>VER EXPEDIENTE</Text>
                    </View>
                </TouchableOpacity>
            ))}

            <View style={{ marginTop: 40, opacity: 0.3, alignItems: 'center' }}>
                <Text style={{ color: '#666', fontSize: 9 }}>VAULT ENCRIPTADO · GRADO MILITAR AES-256</Text>
            </View>
        </View>
    );
}
