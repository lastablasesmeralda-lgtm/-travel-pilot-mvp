import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { s } from '../styles';
import { useAppContext } from '../context/AppContext';

export default function IntelScreen() {
    const { user, myTrips, saveTrip, removeTrip, myFlights, removeMyFlight, setFlightInput, setTab, weather, flightData, simulatePushNotification, tab, selectedVoice } = useAppContext();
    const [newTripTitle, setNewTripTitle] = useState('');
    const [newTripDest, setNewTripDest] = useState('');
    const [showForm, setShowForm] = useState(false);

    const handleCreate = () => {
        if (!newTripTitle || !newTripDest) return Alert.alert('Error', 'Completa los campos');
        saveTrip(newTripTitle, newTripDest);
        setNewTripTitle('');
        setNewTripDest('');
        setShowForm(false);
    };

    return (
        <ScrollView style={{ flex: 1, backgroundColor: '#0A0A0A' }} contentContainerStyle={{ padding: 20, paddingTop: 100 }}>
            {/* ——— MIS VIAJES (FUNCIONALIDAD PRINCIPAL) ——— */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={[s.b, { marginBottom: 0 }]}>🌍 MIS VIAJES</Text>
                <TouchableOpacity
                    onPress={() => setShowForm(!showForm)}
                    style={{ backgroundColor: showForm ? '#333' : '#AF52DE', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}
                >
                    <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>{showForm ? 'CANCELAR' : '+ NUEVO VIAJE'}</Text>
                </TouchableOpacity>
            </View>

            {showForm && (
                <View style={{ backgroundColor: '#111', padding: 20, borderRadius: 24, marginBottom: 20, borderWidth: 1, borderColor: '#333' }}>
                    <Text style={{ color: '#FFF', fontWeight: 'bold', marginBottom: 15, fontSize: 16 }}>AÑADIR NUEVO DESTINO</Text>
                    <TextInput
                        placeholder="Nombre (ej: Vacaciones Japón)"
                        placeholderTextColor="#666"
                        style={{ backgroundColor: '#0A0A0A', color: '#FFF', padding: 15, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#222' }}
                        value={newTripTitle}
                        onChangeText={setNewTripTitle}
                    />
                    <TextInput
                        placeholder="Ciudad (ej: Tokio, JP)"
                        placeholderTextColor="#666"
                        style={{ backgroundColor: '#0A0A0A', color: '#FFF', padding: 15, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#222' }}
                        value={newTripDest}
                        onChangeText={setNewTripDest}
                    />
                    <TouchableOpacity
                        onPress={handleCreate}
                        style={{ backgroundColor: '#AF52DE', padding: 18, borderRadius: 15, alignItems: 'center' }}
                    >
                        <Text style={{ color: '#FFF', fontWeight: 'bold', letterSpacing: 0.5 }}>GUARDAR VIAJE Y ACTIVAR IA</Text>
                    </TouchableOpacity>
                </View>
            )}

            {myTrips.length === 0 && !showForm ? (
                <View style={{ alignItems: 'center', padding: 40, backgroundColor: '#0D0D0D', borderRadius: 25, borderStyle: 'dashed', borderWidth: 1, borderColor: '#222', marginBottom: 30 }}>
                    <Text style={{ fontSize: 41, marginBottom: 15 }}>🌎</Text>
                    <Text style={{ color: '#B0B0B0', fontSize: 16, textAlign: 'center', fontWeight: 'bold' }}>NO TIENES VIAJES PLANEADOS</Text>
                    <Text style={{ color: '#B0B0B0', fontSize: 13, textAlign: 'center', marginTop: 8 }}>Añade tu próximo destino para que la IA empiece a vigilar tus reservas y el clima.</Text>
                </View>
            ) : (
                myTrips.map((trip: any) => {
                    const [displayTitle, displayDestination] = (trip.title || '').includes('|')
                        ? trip.title.split('|').map((s: string) => s.trim())
                        : [trip.title, trip.destination];

                    return (
                        <View key={trip.id} style={{ backgroundColor: '#111', borderRadius: 24, padding: 20, marginBottom: 15, borderLeftWidth: 4, borderLeftColor: '#4CD964', borderWidth: 1, borderColor: '#1A1A1A' }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CD964', marginRight: 8 }} />
                                        <Text style={{ color: '#B0B0B0', fontSize: 11, fontWeight: 'bold' }}>VIAJE ACTIVO</Text>
                                    </View>
                                    <Text style={{ color: '#FFF', fontSize: 22, fontWeight: 'bold' }}>{displayTitle}</Text>
                                    {displayDestination ? <Text style={{ color: '#CCCCCC', fontSize: 16, marginTop: 4 }}>📍 {displayDestination}</Text> : null}
                                    
                                    {/* INFO DE CLIMA DENTRO DE LA TARJETA */}
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 15, backgroundColor: '#1A1A1A', padding: 10, borderRadius: 12, alignSelf: 'flex-start' }}>
                                        <Text style={{ fontSize: 20, marginRight: 8 }}>{weather.icon}</Text>
                                        <View>
                                            <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '900' }}>{weather.temp}°C</Text>
                                            <Text style={{ color: '#B0B0B0', fontSize: 11, fontWeight: 'bold' }}>{weather.condition.toUpperCase()}</Text>
                                        </View>
                                    </View>
                                </View>
                                <TouchableOpacity onPress={() => removeTrip(trip.id)} style={{ padding: 5 }}>
                                    <Text style={{ color: '#B0B0B0', fontSize: 20 }}>✕</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                })
            )}

            {/* ——— SITUATION REPORT & TIMELINE (INFO SECUNDARIA) ——— */}
            <View style={{ marginTop: 20, marginBottom: 30 }}>
                <Text style={{ color: '#B0B0B0', fontSize: 12, fontWeight: 'bold', marginBottom: 15, letterSpacing: 1 }}>🕒 RESUMEN DE TU VIAJE</Text>
                
                <View style={{ 
                    backgroundColor: '#111', 
                    borderRadius: 20, 
                    padding: 18, 
                    marginBottom: 20,
                    borderWidth: 1,
                    borderColor: 'rgba(175, 82, 222, 0.4)', // Borde de resplandor púrpura
                    flexDirection: 'row',
                    elevation: 5, // Elevación para Android
                }}>
                    <View style={{ width: 4, backgroundColor: '#AF52DE', borderRadius: 2, marginRight: 15 }} />
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: '#C0C0C0', fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 5 }}>INFORME DEL ASISTENTE</Text>
                        <Text style={{ color: '#E0E0E0', fontSize: 13, lineHeight: 20, fontStyle: 'italic', letterSpacing: 0.3 }}>
                            {flightData?.delay >= 180 ? (
                                <Text>🚨 <Text style={{ color: '#FF3B30', fontWeight: 'bold' }}>ALERTA CRÍTICA:</Text> Tu retraso supera las 3h. Tienes derecho a <Text style={{ color: '#4CD964', fontWeight: 'bold' }}>600€</Text>. He activado el Escudo Legal en tu Vault.</Text>
                            ) : flightData?.delay >= 120 ? (
                                <Text>⚠️ <Text style={{ color: '#AF52DE', fontWeight: 'bold' }}>CONSEJO DEL SISTEMA:</Text> Tienes derecho a comida y bebida. <Text style={{ fontWeight: 'bold' }}>Guarda los tickets</Text> para reclamar gastos.</Text>
                            ) : (
                                <Text>Todo bajo control. He verificado tu vuelo <Text style={{ color: '#AF52DE', fontWeight: 'bold' }}>{flightData?.flightNumber || 'IB0123'}</Text> y no hay alertas críticas.</Text>
                            )}
                        </Text>
                    </View>
                </View>

                {[
                    { time: 'AHORA', event: 'Vigilancia activa', icon: '🛡️' },
                    { time: 'PRÓX.', event: 'Salida vuelo estimada', icon: '✈️' },
                ].map((item, idx) => (
                    <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 10, marginBottom: 12 }}>
                        <Text style={{ color: '#B0B0B0', fontSize: 11, fontWeight: '900', width: 50 }}>{item.time}</Text>
                        <View style={{ width: 1, height: 20, backgroundColor: '#222', marginHorizontal: 15 }} />
                        <Text style={{ fontSize: 14, marginRight: 8 }}>{item.icon}</Text>
                        <Text style={{ color: '#B0B0B0', fontSize: 13 }}>{item.event}</Text>
                    </View>
                ))}
                
                {/* BOTÓN TEST PUSH (OCULTO A SIMPLE VISTA) */}
                <TouchableOpacity 
                    onPress={() => simulatePushNotification()}
                    style={{
                        marginTop: 15, alignSelf: 'flex-start', marginLeft: 10,
                        backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#333'
                    }}
                >
                    <Text style={{ color: '#888', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 }}>TEST: FORZAR ALERTA PUSH</Text>
                </TouchableOpacity>

            </View>

            {/* ——— SECCIÓN: MONITOR DE VUELOS ——— */}
            <View style={{ marginTop: 20, marginBottom: 100 }}>
                <View style={{ marginBottom: 24, alignItems: 'center' }}>
                    <Text style={[s.b, { marginBottom: 12, textAlign: 'center' }]}>✈️ SEGUIMIENTO DE VUELOS</Text>
                    <TouchableOpacity
                        onPress={() => setTab('radar')}
                        style={{ 
                            backgroundColor: '#111', 
                            paddingHorizontal: 20, 
                            paddingVertical: 10, 
                            borderRadius: 14, 
                            borderWidth: 1, 
                            borderColor: '#AF52DE'
                        }}
                    >
                        <Text style={{ color: '#AF52DE', fontSize: 13, fontWeight: 'bold' }}>GESTIONAR VUELOS</Text>
                    </TouchableOpacity>
                </View>

                {myFlights.length === 0 ? (
                    <TouchableOpacity
                        onPress={() => setTab('radar')}
                        activeOpacity={0.8}
                        style={{ 
                            backgroundColor: '#111', 
                            borderRadius: 24, 
                            padding: 30, 
                            alignItems: 'center', 
                            borderWidth: 1, 
                            borderColor: '#1A1A1A',
                            borderLeftWidth: 4,
                            borderLeftColor: '#333'
                        }}
                    >
                        <View style={{ marginBottom: 15, opacity: 0.5 }}>
                            <Text style={{ fontSize: 32 }}>✈️</Text>
                        </View>
                        <Text style={{ color: '#888', fontSize: 13, textAlign: 'center', fontWeight: '600', letterSpacing: 0.3 }}>No hay vuelos en seguimiento activo</Text>
                        <View style={{ marginTop: 15, backgroundColor: 'rgba(175, 82, 222, 0.1)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12 }}>
                            <Text style={{ color: '#AF52DE', fontSize: 13, fontWeight: 'bold' }}>Añadir vuelo ahora →</Text>
                        </View>
                    </TouchableOpacity>
                ) : (
                    myFlights.map((f: any) => (
                        <View key={f.id} style={{ backgroundColor: '#111', borderRadius: 20, padding: 18, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#4CD964', borderWidth: 1, borderColor: '#1A1A1A' }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View>
                                    <Text style={{ color: '#FFF', fontSize: 22, fontWeight: '900' }}>{f.flight_number}</Text>
                                    <Text style={{ color: '#B0B0B0', fontSize: 12, marginTop: 2 }}>Seguimiento en vivo</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <View style={{ backgroundColor: 'rgba(76, 217, 100, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 5, borderWidth: 1, borderColor: 'rgba(76, 217, 100, 0.4)' }}>
                                        <Text style={{ color: '#4CD964', fontSize: 11, fontWeight: 'bold' }}>LIVE</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => removeMyFlight(f.id)}>
                                        <Text style={{ color: '#B0B0B0', fontSize: 13 }}>ELIMINAR</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ))
                )}
            </View>

            <View style={{ height: 120 }} />
        </ScrollView>
    );
}
