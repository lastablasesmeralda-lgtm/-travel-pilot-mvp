import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { s } from '../styles';
import { useAppContext } from '../context/AppContext';

export default function IntelScreen() {
    const { user, myTrips, saveTrip, removeTrip, myFlights, removeMyFlight, setFlightInput, setTab } = useAppContext();
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
            {/* ——— SECCIÓN: MIS VUELOS VIGILADOS ——— */}
            <View style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={[s.b, { marginBottom: 0 }]}>✈️ MIS VUELOS</Text>
                    <TouchableOpacity
                        onPress={() => setTab('radar')}
                        style={{ backgroundColor: '#1F2937', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}
                    >
                        <Text style={{ color: '#AF52DE', fontSize: 11, fontWeight: 'bold' }}>+ AÑADIR</Text>
                    </TouchableOpacity>
                </View>

                {myFlights.length === 0 ? (
                    <TouchableOpacity
                        onPress={() => setTab('radar')}
                        style={{ backgroundColor: '#111', borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#222', borderStyle: 'dashed' }}
                    >
                        <Text style={{ fontSize: 30, marginBottom: 8 }}>🔍</Text>
                        <Text style={{ color: '#666', fontSize: 13, textAlign: 'center' }}>No vigilas ningún vuelo.</Text>
                        <Text style={{ color: '#AF52DE', fontSize: 12, fontWeight: 'bold', marginTop: 6 }}>Ir a VUELOS para buscar y guardar →</Text>
                    </TouchableOpacity>
                ) : (
                    myFlights.map((f: any) => (
                        <View key={f.id} style={{ backgroundColor: '#111', borderRadius: 16, padding: 16, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#4CD964' }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '900', marginRight: 10 }}>{f.flight_number}</Text>
                                    <View style={{ backgroundColor: '#4CD964', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                                        <Text style={{ color: '#FFF', fontSize: 9, fontWeight: 'bold' }}>VIGILANDO</Text>
                                    </View>
                                </View>
                                <TouchableOpacity onPress={() => removeMyFlight(f.id)}>
                                    <Text style={{ color: '#555', fontSize: 18 }}>✕</Text>
                                </TouchableOpacity>
                            </View>
                            {f.alias && <Text style={{ color: '#AAA', fontSize: 12, marginTop: 4 }}>{f.alias}</Text>}
                            <View style={{ flexDirection: 'row', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#222' }}>
                                <View style={{ backgroundColor: '#1A1A1A', padding: 6, borderRadius: 6, marginRight: 8 }}>
                                    <Text style={{ color: '#4CD964', fontSize: 9, fontWeight: 'bold' }}>🛡️ IA ACTIVA</Text>
                                </View>
                                <Text style={{ color: '#666', fontSize: 10, alignSelf: 'center' }}>
                                    Vigilando retrasos en tiempo real
                                </Text>
                            </View>
                        </View>
                    ))
                )}
            </View>

            {/* ——— SECCIÓN: MIS VIAJES ——— */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={[s.b, { marginBottom: 0 }]}>🌍 MIS VIAJES</Text>
                <TouchableOpacity
                    onPress={() => setShowForm(!showForm)}
                    style={{ backgroundColor: '#AF52DE', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}
                >
                    <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{showForm ? 'CANCELAR' : '+ NUEVO'}</Text>
                </TouchableOpacity>
            </View>

            {showForm && (
                <View style={{ backgroundColor: '#111', padding: 20, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#333' }}>
                    <Text style={{ color: '#FFF', fontWeight: 'bold', marginBottom: 15 }}>CREAR NUEVO VIAJE</Text>
                    <TextInput
                        placeholder="Nombre (ej: Vacaciones Japón)"
                        placeholderTextColor="#666"
                        style={{ backgroundColor: '#000', color: '#FFF', padding: 12, borderRadius: 10, marginBottom: 12 }}
                        value={newTripTitle}
                        onChangeText={setNewTripTitle}
                    />
                    <TextInput
                        placeholder="Destino (ej: Tokio, JP)"
                        placeholderTextColor="#666"
                        style={{ backgroundColor: '#000', color: '#FFF', padding: 12, borderRadius: 10, marginBottom: 12 }}
                        value={newTripDest}
                        onChangeText={setNewTripDest}
                    />
                    <TouchableOpacity
                        onPress={handleCreate}
                        style={{ backgroundColor: '#AF52DE', padding: 15, borderRadius: 12, alignItems: 'center' }}
                    >
                        <Text style={{ color: '#FFF', fontWeight: 'bold' }}>CREAR VIAJE</Text>
                    </TouchableOpacity>
                </View>
            )}

            {myTrips.length === 0 && !showForm ? (
                <View style={{ alignItems: 'center', marginTop: 20, opacity: 0.6 }}>
                    <Text style={{ fontSize: 40, marginBottom: 20 }}>🌍</Text>
                    <Text style={{ color: '#FFF', fontSize: 16, textAlign: 'center' }}>No tienes viajes creados.</Text>
                    <Text style={{ color: '#666', fontSize: 13, textAlign: 'center', marginTop: 8 }}>Crea uno para que la IA vigile tus hoteles y conexiones.</Text>
                </View>
            ) : (
                myTrips.map((trip: any) => (
                    <View key={trip.id} style={{ backgroundColor: '#111', borderRadius: 16, padding: 16, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#AF52DE' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: '#666', fontSize: 10, fontWeight: 'bold', marginBottom: 4 }}>PRÓXIMO VIAJE</Text>
                                <Text style={{ color: '#FFF', fontSize: 18, fontWeight: 'bold' }}>{trip.title}</Text>
                                {trip.destination && <Text style={{ color: '#AAA', fontSize: 13, marginTop: 2 }}>📍 {trip.destination}</Text>}
                                {trip.start_date && (
                                    <Text style={{ color: '#666', fontSize: 11, marginTop: 4 }}>
                                        📅 {new Date(trip.start_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                        {trip.end_date ? ` — ${new Date(trip.end_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}` : ''}
                                    </Text>
                                )}
                            </View>
                            <TouchableOpacity onPress={() => removeTrip(trip.id)}>
                                <Text style={{ color: '#555', fontSize: 18 }}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={{ flexDirection: 'row', marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#222' }}>
                            <View style={{ backgroundColor: '#1A1A1A', padding: 8, borderRadius: 8, marginRight: 10 }}>
                                <Text style={{ color: '#AF52DE', fontSize: 10, fontWeight: 'bold' }}>ASISTENTE ACTIVO</Text>
                            </View>
                            <Text style={{ color: '#666', fontSize: 11, alignSelf: 'center' }}>Vigilando 24/7</Text>
                        </View>
                    </View>
                ))
            )}

            <View style={{ height: 120 }} />
        </ScrollView>
    );
}
