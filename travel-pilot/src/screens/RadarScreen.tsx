import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { s } from '../styles';
import { useAppContext } from '../context/AppContext';

const RECENT_SEARCHES_KEY = 'recentFlightSearches';
const MAX_RECENT = 5;

export default function VuelosScreen() {
    const {
        flightInput, setFlightInput, searchFlight, clearFlight, isSearching, searchError,
        flightData, formatTime, getStatusColor, getStatusLabel,
        myFlights, saveMyFlight, removeMyFlight, activeSearches, removeActiveSearch
    } = useAppContext();

    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    // Cargar historial de búsquedas recientes
    useEffect(() => {
        AsyncStorage.getItem(RECENT_SEARCHES_KEY).then(val => {
            if (val) setRecentSearches(JSON.parse(val));
        });
    }, []);

    // Guardar búsqueda cuando se obtienen datos de vuelo
    useEffect(() => {
        if (flightData?.flightNumber) {
            setLastUpdate(new Date());
            setRecentSearches(prev => {
                const code = flightData.flightNumber.toUpperCase();
                const updated = [code, ...prev.filter(s => s !== code)].slice(0, MAX_RECENT);
                AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
                return updated;
            });
        }
    }, [flightData?.flightNumber]);

    const handleQuickSearch = useCallback((code: string) => {
        setFlightInput(code);
        setTimeout(() => searchFlight(), 100);
    }, [setFlightInput, searchFlight]);

    return (
        <ScrollView style={{ flex: 1, backgroundColor: '#0A0A0A' }} contentContainerStyle={{ padding: 20, paddingTop: 100 }}>
            {/* ——— BANNER DE ENTORNO BETA ——— */}
            <View style={{
                backgroundColor: 'rgba(255, 149, 0, 0.1)',
                borderRadius: 16,
                padding: 15,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: 'rgba(255, 149, 0, 0.3)',
                flexDirection: 'row',
                alignItems: 'center'
            }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 149, 0, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 15 }}>
                    <Text style={{ fontSize: 20 }}>🧪</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{ color: '#FF9500', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 }}>ENTORNO DE PRUEBAS BETA</Text>
                    <Text style={{ color: '#B0B0B0', fontSize: 11, marginTop: 2 }}>Usa los códigos TP404, IB3166 o TP999 para testear.</Text>
                </View>
            </View>

            {/* ——— BUSCADOR ——— */}
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
                            <Text style={{ color: '#666', fontSize: 21, fontWeight: 'bold' }}>✕</Text>
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

                {/* ——— D) HISTORIAL DE BÚSQUEDAS RECIENTES ——— */}
                {recentSearches.length > 0 && activeSearches.length === 0 && (
                    <View style={{ marginTop: 12 }}>
                        <Text style={{ color: '#666', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 }}>🕐 RECIENTES</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {recentSearches.map((code, idx) => (
                                <TouchableOpacity
                                    key={`${code}-${idx}`}
                                    onPress={() => handleQuickSearch(code)}
                                    style={{
                                        backgroundColor: 'rgba(175, 82, 222, 0.15)',
                                        paddingHorizontal: 14,
                                        paddingVertical: 7,
                                        borderRadius: 20,
                                        marginRight: 8,
                                        borderWidth: 1,
                                        borderColor: 'rgba(175, 82, 222, 0.4)',
                                    }}
                                >
                                    <Text style={{ color: '#AF52DE', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 }}>✈ {code}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}
            </View>

            {/* ——— ERROR DE BÚSQUEDA ——— */}
            {searchError && (
                <View style={{ backgroundColor: '#111', borderRadius: 16, padding: 16, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#FF9500', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: '#FF9500', fontWeight: 'bold', fontSize: 14 }}>⚠️ {searchError}</Text>
                        <Text style={{ color: '#B0B0B0', fontSize: 12, marginTop: 4 }}>Comprueba el número e intenta de nuevo.</Text>
                    </View>
                    <TouchableOpacity onPress={() => clearFlight()} style={{ padding: 5 }}>
                        <Text style={{ color: '#666', fontSize: 20 }}>✕</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* ——— LISTA DE TARJETAS DE VUELO ——— */}
            {activeSearches.length > 0 ? (
                activeSearches.map((data) => (
                    <View key={data.flightNumber} style={{ backgroundColor: '#111', borderRadius: 16, padding: 16, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: getStatusColor(data.status) }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <Text style={{ color: '#B0B0B0', fontSize: 11, fontWeight: 'bold' }}>✈️ {data.airline?.toUpperCase()}</Text>
                            <Text style={{ color: '#B0B0B0', fontSize: 11, marginRight: 35 }}>SEGUIMIENTO EN VIVO</Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View>
                                {(data.departure?.delay || 0) >= 120 && (
                                    <View style={{ backgroundColor: 'rgba(175, 82, 222, 0.2)', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginBottom: 4, borderWidth: 1, borderColor: '#AF52DE' }}>
                                        <Text style={{ color: '#AF52DE', fontSize: 9, fontWeight: '900' }}>✨ SOLUCIÓN DISPONIBLE</Text>
                                    </View>
                                )}
                                <Text style={{ color: '#FFF', fontSize: 23, fontWeight: '900' }}>{data.flightNumber}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <TouchableOpacity
                                    onPress={() => saveMyFlight(data.flightNumber)}
                                    style={{ backgroundColor: '#AF52DE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}
                                >
                                    <Text style={{ color: '#FFF', fontSize: 11, fontWeight: 'bold' }}>GUARDAR</Text>
                                </TouchableOpacity>
                                <View style={{ backgroundColor: getStatusColor(data.status), paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                                    <Text style={{ color: '#FFF', fontSize: 11, fontWeight: 'bold' }}>{getStatusLabel(data.status, data.departure.delay)}</Text>
                                </View>
                            </View>
                        </View>
                        <Text style={{ color: '#B0B0B0', fontSize: 14, marginTop: 8 }}>{data.departure.airport} ({data.departure.iata}) → {data.arrival.airport} ({data.arrival.iata})</Text>
                        <View style={{ flexDirection: 'row', marginTop: 12 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: '#B0B0B0', fontSize: 11 }}>SALIDA</Text>
                                <Text style={{ color: '#FFF', fontSize: 17, fontWeight: 'bold' }}>{formatTime(data.departure.scheduled)}</Text>
                            </View>
                            {data.departure.delay > 0 && (
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: '#B0B0B0', fontSize: 11 }}>NUEVA SALIDA</Text>
                                    <Text style={{ color: '#FF9500', fontSize: 17, fontWeight: 'bold' }}>{formatTime(data.departure.estimated)}</Text>
                                </View>
                            )}
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: '#B0B0B0', fontSize: 11 }}>LLEGADA</Text>
                                <Text style={{ color: '#FFF', fontSize: 17, fontWeight: 'bold' }}>{formatTime(data.arrival.scheduled)}</Text>
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', marginTop: 12 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: '#B0B0B0', fontSize: 11 }}>TERMINAL</Text>
                                <Text style={{ color: '#FFF', fontSize: 15, fontWeight: 'bold' }}>{data.departure.terminal || '—'}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: '#B0B0B0', fontSize: 11 }}>PUERTA</Text>
                                <Text style={{ color: '#FFF', fontSize: 15, fontWeight: 'bold' }}>{data.departure.gate || '—'}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: '#B0B0B0', fontSize: 11 }}>ESTADO</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={{ color: getStatusColor(data.status), fontSize: 13, fontWeight: 'bold' }}>{data.status?.toUpperCase()}</Text>
                                    {data.isSimulation && (
                                        <View style={{ backgroundColor: 'rgba(76, 217, 100, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 6, borderWidth: 1, borderColor: '#4CD964' }}>
                                            <Text style={{ color: '#4CD964', fontSize: 8, fontWeight: 'bold' }}>🧪 TEST</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>
                        <TouchableOpacity 
                            onPress={() => removeActiveSearch(data.flightNumber)}
                            style={{ position: 'absolute', top: 12, right: 12, width: 30, height: 30, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 15, justifyContent: 'center', alignItems: 'center', zIndex: 10 }}
                        >
                            <Text style={{ color: '#999', fontSize: 16 }}>✕</Text>
                        </TouchableOpacity>
                    </View>
                ))
            ) : !searchError && !isSearching && (
                /* ——— C) TARJETA "RADAR VACÍO" PREMIUM ——— */
                <View style={{ 
                    backgroundColor: '#111', 
                    borderRadius: 20, 
                    padding: 30, 
                    marginBottom: 16, 
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: 'rgba(175, 82, 222, 0.2)',
                }}>
                    {/* Efecto Radar Visual */}
                    <View style={{ width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: 'rgba(175, 82, 222, 0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
                        <View style={{ width: 70, height: 70, borderRadius: 35, borderWidth: 1.5, borderColor: 'rgba(175, 82, 222, 0.2)', justifyContent: 'center', alignItems: 'center' }}>
                            <View style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(175, 82, 222, 0.15)', justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={{ fontSize: 20 }}>📡</Text>
                            </View>
                        </View>
                    </View>
                    <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1, marginBottom: 8 }}>RADAR DE VIGILANCIA</Text>
                    <Text style={{ color: '#B0B0B0', fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
                        Tu radar está vacío. Introduce un código de vuelo para activar la vigilancia IA en tiempo real.
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, backgroundColor: 'rgba(76, 217, 100, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CD964', marginRight: 8 }} />
                        <Text style={{ color: '#4CD964', fontSize: 11, fontWeight: 'bold' }}>SISTEMA OPERATIVO · EN ESPERA</Text>
                    </View>
                </View>
            )}

            {/* ——— MIS VUELOS GUARDADOS ——— */}
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

            {/* ——— A) PANEL DE ESTADO EN TIEMPO REAL ——— */}
            <View style={{ 
                backgroundColor: '#111', 
                borderRadius: 16, 
                padding: 16, 
                marginBottom: 20,
                borderWidth: 1,
                borderColor: '#1A1A1A',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: flightData ? '#4CD964' : '#666', marginRight: 10 }} />
                    <View>
                        <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold' }}>
                            {flightData 
                                ? (flightData.departure?.delay || 0) >= 60 
                                    ? '⚠️ 1 vuelo con incidencia' 
                                    : '✅ Sin incidencias'
                                : '— Sin vuelos activos'}
                        </Text>
                        <Text style={{ color: '#666', fontSize: 10, marginTop: 2 }}>
                            Última consulta: {lastUpdate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                </View>
                <TouchableOpacity 
                    onPress={() => { if (flightData) { searchFlight(); setLastUpdate(new Date()); } }}
                    style={{ 
                        backgroundColor: flightData ? 'rgba(175, 82, 222, 0.2)' : 'rgba(255,255,255,0.05)', 
                        paddingHorizontal: 12, 
                        paddingVertical: 6, 
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: flightData ? 'rgba(175, 82, 222, 0.4)' : '#222',
                    }}
                >
                    <Text style={{ color: flightData ? '#AF52DE' : '#666', fontSize: 10, fontWeight: 'bold' }}>ACTUALIZAR</Text>
                </TouchableOpacity>
            </View>

            <View style={{ height: 120 }} />

        </ScrollView>
    );
}
