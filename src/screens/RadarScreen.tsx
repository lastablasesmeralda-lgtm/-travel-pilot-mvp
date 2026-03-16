import React from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { s } from '../styles';
import { useAppContext } from '../context/AppContext';

export default function RadarScreen() {
    const {
        flightInput, setFlightInput, searchFlight, clearFlight, isSearching, searchError,
        flightData, formatTime, getStatusColor, getStatusLabel, showPlan,
        agentLogs, fetchAgentLogs,
        myFlights, saveMyFlight, removeMyFlight
    } = useAppContext();

    return (
        <ScrollView style={{ flex: 1, backgroundColor: '#0A0A0A' }} contentContainerStyle={{ padding: 20, paddingTop: 100 }}>

            <View style={{ backgroundColor: '#111', borderRadius: 16, padding: 16, marginBottom: 16 }}>
                <Text style={{ color: '#B0B0B0', fontSize: 11, fontWeight: 'bold', marginBottom: 8 }}>🔍 BUSCAR VUELO</Text>
                <View style={{ flexDirection: 'row', position: 'relative' }}>

                    <TextInput
                        placeholder="Ej: IB3166, BA0117..."
                        placeholderTextColor="#B0B0B0"
                        value={flightInput}
                        onChangeText={setFlightInput}
                        autoCapitalize="characters"
                        style={{
                        flex: 1, backgroundColor: '#1F2937', color: 'white', paddingHorizontal: 12, paddingVertical: 10, paddingRight: 36, borderRadius: 10, marginRight: 10, fontSize: 15,
}}

                    />
                   {(flightData || searchError || flightInput.length > 0) && (
                        <TouchableOpacity
                            onPress={clearFlight}
                            style={{ position: 'absolute', right: 18, top: 0, bottom: 0, justifyContent: 'center' }}
                        >
                            <Text style={{ color: '#FF3B30', fontSize: 21, fontWeight: 'bold' }}>✕</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        onPress={searchFlight}
                        disabled={isSearching || !flightInput.trim()}
                        style={{ backgroundColor: isSearching ? '#666' : '#AF52DE', paddingHorizontal: 16, borderRadius: 10, justifyContent: 'center', opacity: !flightInput.trim() ? 0.5 : 1 }}
                    >
                        {isSearching ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: 'bold' }}>BUSCAR</Text>}
                    </TouchableOpacity>
                </View>
            </View>

            {searchError && (
                <View style={{ backgroundColor: '#1A0000', borderRadius: 16, padding: 16, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#FF3B30', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: '#FF3B30', fontWeight: 'bold', fontSize: 14 }}>❌ {searchError}</Text>
                        <Text style={{ color: '#B0B0B0', fontSize: 12, marginTop: 4 }}>Comprueba el número e intenta de nuevo.</Text>
                    </View>
                    <TouchableOpacity onPress={() => clearFlight()} style={{ padding: 5 }}>
                        <Text style={{ color: '#FF3B30', fontSize: 20 }}>✕</Text>
                    </TouchableOpacity>
                </View>
            )}

            {flightData ? (
                <View style={{ backgroundColor: '#111', borderRadius: 16, padding: 16, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: getStatusColor(flightData.status) }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <Text style={{ color: '#B0B0B0', fontSize: 11, fontWeight: 'bold' }}>✈️ {flightData.airline?.toUpperCase()}</Text>
                        <Text style={{ color: '#B0B0B0', fontSize: 11 }}>SEGUIMIENTO EN VIVO</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ color: '#FFF', fontSize: 23, fontWeight: '900' }}>{flightData.flightNumber}</Text>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TouchableOpacity
                                onPress={() => saveMyFlight(flightData.flightNumber)}
                                style={{ backgroundColor: '#AF52DE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}
                            >
                                <Text style={{ color: '#FFF', fontSize: 11, fontWeight: 'bold' }}>GUARDAR</Text>
                            </TouchableOpacity>
                            <View style={{ backgroundColor: getStatusColor(flightData.status), paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                                <Text style={{ color: '#FFF', fontSize: 11, fontWeight: 'bold' }}>{getStatusLabel(flightData.status, flightData.departure.delay)}</Text>
                            </View>
                        </View>
                    </View>
                    <Text style={{ color: '#B0B0B0', fontSize: 14, marginTop: 8 }}>{flightData.departure.airport} ({flightData.departure.iata}) → {flightData.arrival.airport} ({flightData.arrival.iata})</Text>
                    <View style={{ flexDirection: 'row', marginTop: 12 }}>
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: '#B0B0B0', fontSize: 11 }}>SALIDA</Text>
                            <Text style={{ color: '#FFF', fontSize: 17, fontWeight: 'bold' }}>{formatTime(flightData.departure.scheduled)}</Text>
                        </View>
                        {flightData.departure.delay > 0 && (
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: '#B0B0B0', fontSize: 11 }}>NUEVA SALIDA</Text>
                                <Text style={{ color: '#FF3B30', fontSize: 17, fontWeight: 'bold' }}>{formatTime(flightData.departure.estimated)}</Text>
                            </View>
                        )}
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: '#B0B0B0', fontSize: 11 }}>LLEGADA</Text>
                            <Text style={{ color: '#FFF', fontSize: 17, fontWeight: 'bold' }}>{formatTime(flightData.arrival.scheduled)}</Text>
                        </View>
                    </View>
                    <View style={{ flexDirection: 'row', marginTop: 12 }}>
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: '#B0B0B0', fontSize: 11 }}>TERMINAL</Text>
                            <Text style={{ color: '#FFF', fontSize: 15, fontWeight: 'bold' }}>{flightData.departure.terminal || '—'}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: '#B0B0B0', fontSize: 11 }}>PUERTA</Text>
                            <Text style={{ color: '#FFF', fontSize: 15, fontWeight: 'bold' }}>{flightData.departure.gate || '—'}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: '#B0B0B0', fontSize: 11 }}>ESTADO</Text>
                            <Text style={{ color: getStatusColor(flightData.status), fontSize: 13, fontWeight: 'bold' }}>{flightData.status?.toUpperCase()}</Text>
                        </View>
                    </View>
                </View>
            ) : !searchError && !isSearching && (
                <View style={{ backgroundColor: '#111', borderRadius: 16, padding: 24, marginBottom: 16, alignItems: 'center' }}>
                    <Text style={{ fontSize: 31, marginBottom: 10 }}>✈️</Text>
                    <Text style={{ color: '#B0B0B0', fontSize: 14, textAlign: 'center' }}>Introduce el código de tu vuelo (ej: IB3166) y pulsa BUSCAR para que mi IA empiece a vigilarlo.</Text>
                </View>
            )}

            {myFlights.length > 0 && (
                <View style={{ marginBottom: 20 }}>
                    <Text style={{ color: '#FFF', fontSize: 14, fontWeight: 'bold', marginBottom: 12 }}>MIS VUELOS</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {myFlights.map((f: any) => (
                            <View key={f.id} style={{ backgroundColor: '#111', padding: 16, borderRadius: 16, marginRight: 10, width: 140, borderWidth: 1, borderColor: '#222' }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{f.flight_number}</Text>
                                    <TouchableOpacity onPress={() => removeMyFlight(f.id)}>
                                        <Text style={{ color: '#FF3B30', fontSize: 17 }}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                                <Text style={{ color: '#4CD964', fontSize: 10, fontWeight: 'bold', marginTop: 8 }}>SIGUIENDO</Text>
                                <Text style={{ color: '#B0B0B0', fontSize: 9, marginTop: 2 }}>En tiempo real</Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            )}

            <View style={{ backgroundColor: '#111', borderRadius: 16, padding: 16, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#FF9500' }}>
                <Text style={{ color: '#B0B0B0', fontSize: 11, fontWeight: 'bold', marginBottom: 8 }}>🔗 CONEXIÓN EN RIESGO</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: '#FFF', fontSize: 23, fontWeight: '900' }}>BA0117</Text>
                    <View style={{ backgroundColor: '#FF9500', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                        <Text style={{ color: '#FFF', fontSize: 11, fontWeight: 'bold' }}>68 MIN DISPONIBLES</Text>
                    </View>
                </View>
                <Text style={{ color: '#B0B0B0', fontSize: 14, marginTop: 8 }}>Londres Heathrow (LHR) → Nueva York (JFK)</Text>
                <View style={{ flexDirection: 'row', marginTop: 12 }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: '#B0B0B0', fontSize: 11 }}>SALIDA</Text>
                        <Text style={{ color: '#FFF', fontSize: 17, fontWeight: 'bold' }}>11:00</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: '#B0B0B0', fontSize: 11 }}>TERMINAL</Text>
                        <Text style={{ color: '#FFF', fontSize: 17, fontWeight: 'bold' }}>T5</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: '#B0B0B0', fontSize: 11 }}>PUERTA</Text>
                        <Text style={{ color: '#FFF', fontSize: 17, fontWeight: 'bold' }}>C32</Text>
                    </View>
                </View>
                <Text style={{ color: '#FF9500', fontSize: 12, marginTop: 10 }}>⚠️ Tiempo mínimo de conexión en LHR: 60 min. Margen crítico.</Text>
            </View>

            <View style={{ backgroundColor: '#111', borderRadius: 16, padding: 16, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#4CD964' }}>
                <Text style={{ color: '#B0B0B0', fontSize: 11, fontWeight: 'bold', marginBottom: 8 }}>🏨 HOTEL</Text>
                <Text style={{ color: '#FFF', fontSize: 19, fontWeight: '900' }}>The Standard NYC</Text>
                <Text style={{ color: '#B0B0B0', fontSize: 14, marginTop: 4 }}>848 Washington St, Nueva York</Text>
                <View style={{ flexDirection: 'row', marginTop: 12 }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: '#B0B0B0', fontSize: 11 }}>CHECK-IN</Text>
                        <Text style={{ color: '#4CD964', fontSize: 17, fontWeight: 'bold' }}>15:00</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: '#B0B0B0', fontSize: 11 }}>CHECK-OUT</Text>
                        <Text style={{ color: '#FFF', fontSize: 17, fontWeight: 'bold' }}>12:00</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: '#B0B0B0', fontSize: 11 }}>ESTADO</Text>
                        <Text style={{ color: '#4CD964', fontSize: 13, fontWeight: 'bold' }}>A TIEMPO ✓</Text>
                    </View>
                </View>
            </View>

            <TouchableOpacity
                onPress={showPlan}
                style={{ backgroundColor: '#FF3B30', padding: 16, borderRadius: 16, alignItems: 'center', marginBottom: 20 }}
            >
                <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 17 }}>🚨 VER PLANES ALTERNATIVOS</Text>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 }}>El asistente calculará 3 opciones ahora</Text>
            </TouchableOpacity>

            <View style={{ backgroundColor: '#111', borderRadius: 16, padding: 16, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#AF52DE' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={{ color: '#AF52DE', fontSize: 13, fontWeight: 'bold' }}>🧠 MI ASISTENTE</Text>
                    <TouchableOpacity onPress={fetchAgentLogs} style={{ backgroundColor: '#1F2937', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                        <Text style={{ color: '#AF52DE', fontSize: 11, fontWeight: 'bold' }}>VER ACTIVIDAD</Text>
                    </TouchableOpacity>
                </View>
                <Text style={{ color: '#B0B0B0', fontSize: 11, marginBottom: 12 }}>Acciones realizadas para proteger tu viaje</Text>

                {agentLogs.length === 0 ? (
                    <View style={{ alignItems: 'center', padding: 16 }}>
                        <Text style={{ fontSize: 25, marginBottom: 6 }}>🛡️</Text>
                        <Text style={{ color: '#B0B0B0', fontSize: 13, textAlign: 'center' }}>Tu asistente está vigilando.{'\n'}Pulsa REVISAR para ver su actividad.</Text>
                    </View>
                ) : (
                    agentLogs.map((log) => {
                        const label = log.event_type === 'contingency_planned' ? '✈️ Plan alternativo generado'
                            : log.event_type === 'test_connection' || log.event_type === 'test_connection_v2' ? '🔗 Verificación de conexión'
                                : log.event_type === 'quick_test' || log.event_type === 'min_test' ? '🔗 Verificación de conexión'
                                    : `📋 ${log.event_type}`;
                        const statusText = log.status === 'executed' ? '✅ Completado' : '⏳ Procesando...';
                        const statusColor = log.status === 'executed' ? '#4CD964' : '#FF9500';
                        return (
                            <View key={log.id} style={{ backgroundColor: '#0A0A0A', borderRadius: 10, padding: 12, marginBottom: 6 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '600', flex: 1 }}>{label}</Text>
                                    <Text style={{ color: statusColor, fontSize: 11, fontWeight: 'bold' }}>{statusText}</Text>
                                </View>
                                <Text style={{ color: '#B0B0B0', fontSize: 11, marginTop: 4 }}>
                                    {new Date(log.created_at).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </View>
                        );
                    })
                )}
            </View>

            <View style={{ height: 120 }} />

        </ScrollView>
    );
}
