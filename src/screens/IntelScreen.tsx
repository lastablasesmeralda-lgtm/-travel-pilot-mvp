import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { s } from '../styles';
import { useAppContext } from '../context/AppContext';

export default function IntelScreen() {
    const { user, myTrips, saveTrip, removeTrip, myFlights, removeMyFlight, setFlightInput, setTab, weather } = useAppContext();
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
        <ScrollView style={{ flex: 1, backgroundColor: '#0A0A0A' }} contentContainerStyle={{ padding: 20 }}>
            {/* ——— DASHBOARD DE ESTADO ——— */}
            <View style={{ marginBottom: 30, marginTop: 10 }}>
                <Text style={{ color: '#666', fontSize: 10, fontWeight: 'bold', marginBottom: 12, letterSpacing: 1 }}>🛡️ ASISTENTE DE SEGURIDAD</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1, backgroundColor: '#111', borderRadius: 20, padding: 15, borderWidth: 1, borderColor: '#222' }}>
                        <Text style={{ color: '#4CD964', fontSize: 20, fontWeight: '900' }}>ACTIVO</Text>
                        <Text style={{ color: '#666', fontSize: 9, fontWeight: 'bold', marginTop: 4 }}>INTELIGENCIA ARTIFICIAL</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: '#111', borderRadius: 20, padding: 15, borderWidth: 1, borderColor: '#222' }}>
                        <Text style={{ color: '#AF52DE', fontSize: 20, fontWeight: '900' }}>30m</Text>
                        <Text style={{ color: '#666', fontSize: 9, fontWeight: 'bold', marginTop: 4 }}>REVISIÓN CADA</Text>
                    </View>
                </View>
            </View>

            {/* ——— SECCIÓN: CLIMA & DESTINO ——— */}
            <View style={{ marginBottom: 30 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={[s.b, { marginBottom: 0 }]}>🌤️ INFORMACIÓN LOCAL</Text>
                    <View style={{ backgroundColor: '#111', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
                        <Text style={{ color: '#666', fontSize: 9, fontWeight: 'bold' }}>AHORA MISMO</Text>
                    </View>
                </View>
                <View style={{ backgroundColor: '#111', borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 40, marginRight: 20 }}>{weather.icon}</Text>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: '#FFF', fontSize: 18, fontWeight: 'bold' }}>{weather.temp}°C — {weather.condition}</Text>
                        <Text style={{ color: '#666', fontSize: 12, marginTop: 2 }}>{weather.city}: Condiciones actuales para tu viaje.</Text>
                    </View>
                </View>
            </View>

            {/* ——— SECCIÓN: MIS VIAJES ——— */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={[s.b, { marginBottom: 0 }]}>🌍 MIS VIAJES</Text>
                <TouchableOpacity
                    onPress={() => setShowForm(!showForm)}
                    style={{ backgroundColor: showForm ? '#333' : '#AF52DE', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}
                >
                    <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 12 }}>{showForm ? 'CANCELAR' : '+ AÑADIR'}</Text>
                </TouchableOpacity>
            </View>

            {showForm && (
                <View style={{ backgroundColor: '#111', padding: 20, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: '#333' }}>
                    <Text style={{ color: '#FFF', fontWeight: 'bold', marginBottom: 15, fontSize: 14 }}>CREAR NUEVO VIAJE</Text>
                    <TextInput
                        placeholder="Nombre (ej: Vacaciones Japón)"
                        placeholderTextColor="#666"
                        style={{ backgroundColor: '#0A0A0A', color: '#FFF', padding: 15, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#222' }}
                        value={newTripTitle}
                        onChangeText={setNewTripTitle}
                    />
                    <TextInput
                        placeholder="Destino (ej: Tokio, JP)"
                        placeholderTextColor="#666"
                        style={{ backgroundColor: '#0A0A0A', color: '#FFF', padding: 15, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#222' }}
                        value={newTripDest}
                        onChangeText={setNewTripDest}
                    />
                    <TouchableOpacity
                        onPress={handleCreate}
                        style={{ backgroundColor: '#AF52DE', padding: 18, borderRadius: 15, alignItems: 'center' }}
                    >
                        <Text style={{ color: '#FFF', fontWeight: 'bold' }}>GUARDAR VIAJE</Text>
                    </TouchableOpacity>
                </View>
            )}

            {myTrips.length === 0 && !showForm ? (
                <View style={{ alignItems: 'center', padding: 40, backgroundColor: '#0D0D0D', borderRadius: 25, borderStyle: 'dashed', borderWidth: 1, borderColor: '#222', marginBottom: 30 }}>
                    <Text style={{ fontSize: 40, marginBottom: 15 }}>🛸</Text>
                    <Text style={{ color: '#666', fontSize: 14, textAlign: 'center', fontWeight: 'bold' }}>SIN VIAJES GUARDADOS</Text>
                    <Text style={{ color: '#444', fontSize: 11, textAlign: 'center', marginTop: 8 }}>Añade un viaje para que el asistente vigile tus vuelos y hoteles.</Text>
                </View>
            ) : (
                myTrips.map((trip: any) => {
                    const [displayTitle, displayDestination] = (trip.title || '').includes('|')
                        ? trip.title.split('|').map((s: string) => s.trim())
                        : [trip.title, trip.destination];

                    return (
                        <View key={trip.id} style={{ backgroundColor: '#111', borderRadius: 20, padding: 20, marginBottom: 15, borderLeftWidth: 4, borderLeftColor: '#AF52DE', borderBottomWidth: 1, borderBottomColor: '#222' }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#AF52DE', marginRight: 8 }} />
                                        <Text style={{ color: '#666', fontSize: 9, fontWeight: 'bold', letterSpacing: 1 }}>DATOS DEL VIAJE</Text>
                                    </View>
                                    <Text style={{ color: '#FFF', fontSize: 20, fontWeight: 'bold' }}>{displayTitle}</Text>
                                    {displayDestination ? <Text style={{ color: '#AAA', fontSize: 14, marginTop: 4 }}>📍 {displayDestination}</Text> : null}

                                    <View style={{ flexDirection: 'row', marginTop: 15, gap: 10 }}>
                                        <View style={{ backgroundColor: '#1A1A1A', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
                                            <Text style={{ color: '#AF52DE', fontSize: 9, fontWeight: 'bold' }}>✨ ASISTENTE ACTIVO</Text>
                                        </View>
                                        <View style={{ backgroundColor: '#1A1A1A', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
                                            <Text style={{ color: '#4CD964', fontSize: 9, fontWeight: 'bold' }}>✓ VIGILANDO</Text>
                                        </View>
                                    </View>
                                </View>
                                <TouchableOpacity onPress={() => removeTrip(trip.id)} style={{ padding: 5 }}>
                                    <Text style={{ color: '#333', fontSize: 20 }}>✕</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                })
            )}

            {/* ——— SECCIÓN: MIS VUELOS VIGILADOS ——— */}
            <View style={{ marginTop: 20, marginBottom: 100 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Text style={[s.b, { marginBottom: 0 }]}>✈️ MONITOR DE VUELOS</Text>
                    <TouchableOpacity
                        onPress={() => setTab('radar')}
                        style={{ backgroundColor: '#1F2937', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}
                    >
                        <Text style={{ color: '#AF52DE', fontSize: 11, fontWeight: 'bold' }}>EDITAR LISTA</Text>
                    </TouchableOpacity>
                </View>

                {myFlights.length === 0 ? (
                    <TouchableOpacity
                        onPress={() => setTab('radar')}
                        style={{ backgroundColor: '#0D0D0D', borderRadius: 20, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: '#222', borderStyle: 'dashed' }}
                    >
                        <Text style={{ color: '#444', fontSize: 13, textAlign: 'center' }}>No hay vuelos en el radar.</Text>
                        <Text style={{ color: '#AF52DE', fontSize: 12, fontWeight: 'bold', marginTop: 10 }}>Añadir vuelo ahora →</Text>
                    </TouchableOpacity>
                ) : (
                    myFlights.map((f: any) => (
                        <View key={f.id} style={{ backgroundColor: '#111', borderRadius: 20, padding: 18, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#4CD964' }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View>
                                    <Text style={{ color: '#FFF', fontSize: 20, fontWeight: '900' }}>{f.flight_number}</Text>
                                    <Text style={{ color: '#666', fontSize: 10, marginTop: 2 }}>{f.alias || 'Vuelo sin alias'}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <View style={{ backgroundColor: '#4CD964', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 5 }}>
                                        <Text style={{ color: '#FFF', fontSize: 9, fontWeight: 'bold' }}>EN VIVO</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => removeMyFlight(f.id)}>
                                        <Text style={{ color: '#333', fontSize: 12 }}>QUITAR</Text>
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
