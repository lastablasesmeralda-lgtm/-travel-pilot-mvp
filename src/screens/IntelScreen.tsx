import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Animated, Image } from 'react-native';
import { s } from '../styles';
import { useAppContext, IS_BETA } from '../context/AppContext';
import { useNavigation } from '@react-navigation/native';
import { getEU261Amount } from '../utils/flightUtils';

// Frases rotativas premium para cuando no hay vuelo
const IDLE_PHRASES = [
    'Todos los sistemas operativos. Tu próximo viaje está bajo mi protección.',
    'Escaneando condiciones atmosféricas y conexiones aéreas... Todo en orden.',
    'Red de monitorización activa. Cualquier incidencia será gestionada al instante.',
    'Vigilancia en tiempo real activada. Ningún cambio pasará desapercibido.',
    'Protocolos de defensa cargados. Introduce un vuelo y activaré el blindaje completo.',
    'Mi radar está limpio. Añade un vuelo en VUELOS para activar la vigilancia 24h.',
];

export default function IntelScreen() {
    const navigation = useNavigation<any>();
    const { user, myTrips, saveTrip, removeTrip, myFlights, removeMyFlight, setFlightInput, weather, flightData, clearFlight, simulatePushNotification, tab, selectedVoice, showPlan, travelProfile, hasSeenPlan, selectedRescuePlan, speak, removeActiveSearch, availableVoices, handleLogout, setSavedTime, isSearching } = useAppContext();
    const [newTripTitle, setNewTripTitle] = useState('');
    const [newTripDest, setNewTripDest] = useState('');
    const [newHotelName, setNewHotelName] = useState('');
    const [newHotelPhone, setNewHotelPhone] = useState('');
    const [newFlightNumber, setNewFlightNumber] = useState('');
    const [showForm, setShowForm] = useState(false);

    // Animación
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isSearching) {
            Animated.loop(
                Animated.timing(rotateAnim, { toValue: 1, duration: 1500, useNativeDriver: true })
            ).start();
        } else {
            rotateAnim.setValue(0);
        }
    }, [isSearching]);


    // Frase rotativa que cambia cada vez que se monta la pantalla
    const idlePhrase = useMemo(() => IDLE_PHRASES[Math.floor(Math.random() * IDLE_PHRASES.length)], []);

    const handleCreate = () => {
        if (!newTripTitle || !newTripDest) return Alert.alert('Error', 'Completa los campos obligatorios (Título y Destino)');
        saveTrip(newTripTitle, newTripDest, newHotelName, newHotelPhone, newFlightNumber);
        setNewTripTitle('');
        setNewTripDest('');
        setNewHotelName('');
        setNewHotelPhone('');
        setNewFlightNumber('');
        setShowForm(false);
    };
    return (
        <ScrollView style={{ flex: 1, backgroundColor: '#0A0A0A' }} contentContainerStyle={{ padding: 20, paddingTop: 60 }}>


            {/* TARJETA DE STATUS VIP (Solo si NO es VIP) */}
            {travelProfile !== 'premium' && (
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => navigation.navigate('VIP')}
                    style={{
                        backgroundColor: '#111',
                        borderRadius: 24,
                        padding: 20,
                        marginBottom: 30,
                        borderWidth: 1,
                        borderColor: '#D4AF37',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        overflow: 'hidden'
                    }}
                >
                    {/* Efecto de brillo de fondo */}
                    <View style={{ position: 'absolute', top: -50, right: -50, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(212, 175, 55, 0.05)' }} />

                    <View style={{ flex: 1, paddingRight: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                            <View style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 10, borderWidth: 0.5, borderColor: '#D4AF37' }}>
                                <Text style={{ color: '#D4AF37', fontSize: 9, fontWeight: '900' }}>STATUS: ESTÁNDAR (LIMITADO)</Text>
                            </View>
                        </View>
                        <Text style={{ color: '#E0E0E0', fontSize: 13, lineHeight: 18 }}>Desbloquea el <Text style={{ color: '#D4AF37', fontWeight: 'bold' }}>Acceso VIP</Text> para activar la vigilancia de crisis y la garantía de compensación legal en todos tus tramos.</Text>
                    </View>

                    <View style={{ backgroundColor: '#D4AF37', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', shadowColor: '#D4AF37', shadowOpacity: 0.5, shadowRadius: 10, elevation: 5 }}>
                        <Text style={{ color: '#000', fontSize: 18, fontWeight: 'bold' }}>›</Text>
                    </View>
                </TouchableOpacity>
            )}

            {/* STATUS VIP ACTIVO (Solo si YA ES VIP) */}
            {travelProfile === 'premium' && (
                <View style={{
                    backgroundColor: 'rgba(212, 175, 55, 0.05)',
                    borderRadius: 20,
                    padding: 15,
                    marginBottom: 30,
                    borderWidth: 1,
                    borderColor: 'rgba(212, 175, 55, 0.3)',
                    flexDirection: 'row',
                    alignItems: 'center'
                }}>
                    <Text style={{ fontSize: 18, marginRight: 12 }}>🛡️</Text>
                    <Text style={{ color: '#D4AF37', fontSize: 13, fontWeight: 'bold' }}>Status: Bajo Protección Legal VIP</Text>
                </View>
            )}

            {/* GLOBAL BETA BANNER */}
            {IS_BETA && (
                <View style={{ backgroundColor: '#0D0D0D', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 10, marginBottom: 24, borderLeftWidth: 3, borderLeftColor: '#333', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#444', fontSize: 9, fontWeight: '900', letterSpacing: 1 }}>🛡️ ENTORNO VERIFICADO · ACCESO BETA</Text>
                </View>
            )}

            {/* ——— MIS VIAJES ——— */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={[s.b, { marginBottom: 0 }]}>🌍 INICIO</Text>
                <TouchableOpacity
                    onPress={() => setShowForm(!showForm)}
                    style={{ backgroundColor: showForm ? '#333' : '#D4AF37', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}
                >
                    <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 14 }}>{showForm ? 'CANCELAR' : '+ NUEVO VIAJE'}</Text>
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
                        style={{ backgroundColor: '#0A0A0A', color: '#FFF', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#222' }}
                        value={newTripDest}
                        onChangeText={setNewTripDest}
                    />
                    <TextInput
                        placeholder="Nº Vuelo (ej: IB3110)"
                        placeholderTextColor="#666"
                        style={{ backgroundColor: '#0A0A0A', color: '#FFF', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#222', fontWeight: 'bold' }}
                        value={newFlightNumber}
                        autoCapitalize="characters"
                        onChangeText={setNewFlightNumber}
                    />
                    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                        <TextInput
                            placeholder="Hotel"
                            placeholderTextColor="#666"
                            style={{ flex: 1.5, backgroundColor: '#0A0A0A', color: '#FFF', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#222' }}
                            value={newHotelName}
                            onChangeText={setNewHotelName}
                        />
                        <TextInput
                            placeholder="Tel. Hotel"
                            placeholderTextColor="#666"
                            style={{ flex: 1, backgroundColor: '#0A0A0A', color: '#FFF', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#222' }}
                            value={newHotelPhone}
                            keyboardType="phone-pad"
                            onChangeText={setNewHotelPhone}
                        />
                    </View>
                    <TouchableOpacity
                        onPress={handleCreate}
                        style={{ backgroundColor: '#D4AF37', padding: 18, borderRadius: 15, alignItems: 'center' }}
                    >
                        <Text style={{ color: '#000', fontWeight: 'bold', letterSpacing: 0.5 }}>GUARDAR VIAJE Y ACTIVAR IA</Text>
                    </TouchableOpacity>
                </View>
            )}

            {myTrips.length === 0 && !showForm ? (
                <View style={{ alignItems: 'center', padding: 40, backgroundColor: '#0D0D0D', borderRadius: 25, borderStyle: 'dashed', borderWidth: 1, borderColor: '#222', marginBottom: 30 }}>
                    <Text style={{ fontSize: 41, marginBottom: 15 }}>🌎</Text>
                    <Text style={{ color: '#B0B0B0', fontSize: 16, textAlign: 'center', fontWeight: 'bold' }}>NO TIENES VIAJES PLANEADOS</Text>
                    <Text style={{ color: '#B0B0B0', fontSize: 13, textAlign: 'center', marginTop: 8 }}>Tu asistente ha comprobado los detalles de tu vuelo y estado del clima.

                        Todo parece estar en orden para tu viaje. Si detectamos cualquier riesgo para tu conexión, te avisaremos al instante.</Text>
                </View>
            ) : (
                myTrips.map((trip: any) => {
                    const [displayTitle, displayDestination] = (trip.title || '').includes('|')
                        ? trip.title.split('|').map((s: string) => s.trim())
                        : [trip.title, trip.destination];

                    const destKey = (displayDestination || '').toLowerCase();
                    const tripWeather = weather[destKey] || { temp: '—', condition: 'Consultando...', icon: '🌤️' };

                    return (
                        <View key={trip.id} style={{ backgroundColor: '#111', borderRadius: 24, padding: 20, marginBottom: 15, borderLeftWidth: 4, borderLeftColor: '#4CD964', borderWidth: 1, borderColor: '#1A1A1A' }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#D4AF37', marginRight: 8 }} />
                                        <Text style={{ color: '#B0B0B0', fontSize: 11, fontWeight: 'bold' }}>VIAJE ACTIVO</Text>
                                    </View>
                                    <Text style={{ color: '#FFF', fontSize: 22, fontWeight: 'bold' }}>{displayTitle}</Text>
                                    
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
                                        {displayDestination ? <Text style={{ color: '#CCCCCC', fontSize: 13 }}>📍 {displayDestination}</Text> : null}
                                        {trip.flight_number ? (
                                            <View style={{ backgroundColor: 'rgba(175, 82, 222, 0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#AF52DE' }}>
                                                <Text style={{ color: '#AF52DE', fontSize: 11, fontWeight: 'bold' }}>✈️ {trip.flight_number}</Text>
                                            </View>
                                        ) : null}
                                    </View>
                                    
                                    {(trip.hotel_name || trip.hotel_phone) && (
                                        <View style={{ marginTop: 15, padding: 12, backgroundColor: '#1A1A1A', borderRadius: 16, borderLeftWidth: 3, borderLeftColor: '#D4AF37' }}>
                                            <Text style={{ color: '#D4AF37', fontSize: 9, fontWeight: '900', marginBottom: 4, letterSpacing: 1 }}>ESTANCIA PROTEGIDA</Text>
                                            <Text style={{ color: '#FFF', fontSize: 14, fontWeight: 'bold' }}>{trip.hotel_name || 'Alojamiento Confirmado'}</Text>
                                            {trip.hotel_phone ? <Text style={{ color: '#888', fontSize: 12, marginTop: 2 }}>📞 {trip.hotel_phone}</Text> : null}
                                        </View>
                                    )}

                                    {/* INFO DE CLIMA INDIVIDUAL POR TARJETA */}
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 15, backgroundColor: '#1A1A1A', padding: 10, borderRadius: 12, alignSelf: 'flex-start' }}>
                                        <Text style={{ fontSize: 20, marginRight: 8 }}>{tripWeather.icon}</Text>
                                        <View>
                                            <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '900' }}>{tripWeather.temp}°C</Text>
                                            <Text style={{ color: '#B0B0B0', fontSize: 11, fontWeight: 'bold' }}>{tripWeather.condition.toUpperCase()}</Text>
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
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                        <Text style={{ color: '#B0B0B0', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 }}>🕒 RESUMEN DE TU VIAJE</Text>
                    </View>
                    {flightData?.flightNumber && (
                        <TouchableOpacity onPress={() => removeActiveSearch(flightData.flightNumber)} style={{ paddingHorizontal: 10, paddingVertical: 6, backgroundColor: 'rgba(255, 59, 48, 0.2)', borderRadius: 10 }}>
                            <Text style={{ color: '#FF3B30', fontSize: 10, fontWeight: 'bold' }}>✕ DESCARTAR VUELO</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <TouchableOpacity
                    onPress={() => {
                        let msg = '';
                        if (flightData?.status === 'cancelled') {
                            msg = travelProfile === 'premium'
                                ? `Vuelo cancelado. Tu protocolo VIP está activo. Reembolso preparado y alternativas de máximo nivel seleccionadas. Dime cómo quieres proceder.`
                                : `Vuelo cancelado. Tu reclamación de reembolso está preparada. Recuperarás el importe completo sin gestiones adicionales. Un toque y listo.`;
                        } else if ((flightData?.departure?.delay || 0) >= 180) {
                            const amt = getEU261Amount(flightData).replace('€', ' euros');
                            msg = travelProfile === 'premium'
                                ? `Retraso crítico detectado. Tu protocolo VIP está activo. Tengo tu expediente legal listo y las mejores alternativas seleccionadas para ti. Todo preparado bajo tu nivel de exigencia.`
                                : travelProfile === 'budget'
                                    ? `Retraso crítico detectado. Tu expediente de reclamación EU261 está listo para firmar. Sin formularios, sin llamadas. Un toque y el proceso legal empieza solo.`
                                    : `Retraso crítico detectado. Tu expediente de reclamación EU261 está listo para firmar. Con el plan VIP tendrías acceso a opciones adicionales de rescate.`;
                        } else if ((flightData?.departure?.delay || 0) >= 60) {
                            msg = travelProfile === 'premium'
                                ? `Retraso detectado. Tu vuelo está bajo vigilancia prioritaria. Cualquier cambio relevante te llegará al instante.`
                                : `Retraso detectado. Estoy monitorizando tu vuelo en tiempo real. Si la situación cambia, serás el primero en saberlo.`;
                        } else if (flightData?.flightNumber) {
                            msg = `Todo bajo control con tu vuelo ${flightData.flightNumber}. Estoy monitorizando la red por si hubiera cualquier mínimo cambio.`;
                        } else {
                            msg = idlePhrase;
                        }
                        speak(msg, selectedVoice);
                    }}
                    activeOpacity={0.7}
                    style={{
                        backgroundColor: '#111',
                        borderRadius: 20,
                        padding: 18,
                        marginBottom: 20,
                        borderWidth: 1,
                        borderColor: travelProfile === 'premium' ? '#D4AF37' : 'rgba(175, 82, 222, 0.4)',
                        flexDirection: 'row',
                        elevation: 5,
                    }}>
                    <View style={{ width: 4, backgroundColor: '#D4AF37', borderRadius: 2, marginRight: 15 }} />
                    <View style={{ flex: 1 }}>
                        <View style={{ marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ color: '#D4AF37', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 }}>
                                {travelProfile === 'premium' ? '🛡️ INFORME DE LA IA' : 'INFORME DEL ASISTENTE'}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                {(flightData?.departure?.delay || 0) >= 60 && (
                                    <View style={{ backgroundColor: 'rgba(212, 175, 55, 0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 6, borderWidth: 1, borderColor: '#D4AF37' }}>
                                        <Text style={{ color: '#D4AF37', fontSize: 9, fontWeight: 'bold' }}>🎧 ESCUCHAR</Text>
                                    </View>
                                )}
                                {flightData?.isSimulation && (
                                    <View style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.5)' }}>
                                        <Text style={{ color: '#D4AF37', fontSize: 8, fontWeight: 'bold' }}>🛡️ SIM</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                        <View>
                            {!flightData?.flightNumber ? (
                                <View>
                                    <Text style={{ color: '#E0E0E0', fontSize: 13, lineHeight: 20, fontStyle: 'italic', letterSpacing: 0.3 }}>
                                        {idlePhrase}
                                    </Text>
                                </View>
                            ) : (flightData?.departure?.delay || 0) >= 60 ? (
                                <View>
                                    <View style={{ marginBottom: 12 }}>
                                        <Text style={{ color: '#E0E0E0', fontSize: 13, lineHeight: 20, fontStyle: 'italic', letterSpacing: 0.3 }}>
                                            {(flightData?.departure?.delay || 0) >= 180 ? (
                                                <>🚨 <Text style={{ color: '#FF3B30', fontWeight: 'bold' }}>ALERTA CRÍTICA:</Text> Retraso superior a 3h identificado en el vuelo <Text style={{ color: '#D4AF37', fontWeight: 'bold' }}>{flightData.flightNumber}</Text>. Tienes derecho a solicitar <Text style={{ color: '#4CD964', fontWeight: 'bold' }}>{getEU261Amount(flightData)}€</Text> de indemnización. He activado tu Estrategia <Text style={{ color: '#AF52DE', fontWeight: 'bold' }}>{travelProfile === 'premium' ? 'VIP' : travelProfile === 'budget' ? 'ECONÓMICA' : 'EQUILIBRADA'}</Text>.</>
                                            ) : (
                                                <>⚠️ <Text style={{ color: '#D4AF37', fontWeight: 'bold' }}>INCIDENCIA DETECTADA:</Text> Retraso de {(flightData?.departure?.delay || 0)} min en el vuelo <Text style={{ color: '#D4AF37', fontWeight: 'bold' }}>{flightData.flightNumber}</Text>. He organizado una <Text style={{ color: '#D4AF37', fontWeight: 'bold' }}>Estrategia {travelProfile === 'premium' ? 'VIP' : travelProfile === 'budget' ? 'ECONÓMICA' : 'EQUILIBRADA'}</Text> personalizada.</>
                                            )}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => {
                                            if (selectedRescuePlan) {
                                                const role = availableVoices.find(v => v.identifier === selectedVoice)?.humanName || "Tu asistente";
                                                speak(`Soy ${role}. Sigo trabajando en tu plan para ${selectedRescuePlan}. La conexión está abierta y las gestiones avanzan.`);
                                            }
                                            if (!hasSeenPlan) setSavedTime((prev: number) => prev + 1.5);
                                            showPlan();
                                        }}
                                        style={{
                                            backgroundColor: selectedRescuePlan ? '#4CD964' : '#D4AF37',
                                            paddingVertical: 12,
                                            paddingHorizontal: 20,
                                            borderRadius: 14,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            shadowColor: selectedRescuePlan ? "#4CD964" : "#D4AF37",
                                            shadowOffset: { width: 0, height: 4 },
                                            shadowOpacity: 0.3,
                                            shadowRadius: 5,
                                            elevation: 8,
                                            marginTop: 5
                                        }}
                                    >
                                        <Text style={{ color: '#000', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 }}>
                                            {selectedRescuePlan
                                                ? `🛰️ PROTOCOLO ACTIVO: ${selectedRescuePlan.toUpperCase()}`
                                                : hasSeenPlan
                                                    ? '📂 VER ESTRATEGIAS DISPONIBLES'
                                                    : '⚡ RESOLVER AHORA CON IA'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <Text style={{ color: '#E0E0E0', fontSize: 13, lineHeight: 20, fontStyle: 'italic', letterSpacing: 0.3 }}>Todo bajo control. He verificado tu vuelo <Text style={{ color: '#AF52DE', fontWeight: 'bold' }}>{flightData.flightNumber}</Text> y no hay alertas críticas en este momento.</Text>
                            )}
                        </View>
                    </View>
                </TouchableOpacity>

                {flightData?.flightNumber ? [
                    { time: 'AHORA', event: 'Monitoreo activo ' + flightData.airline, icon: '✅' },
                    { time: flightData.departure?.estimated ? String(flightData.departure.estimated).substring(11, 16) : 'PRÓX.', event: `Salida desde ${flightData.departure?.iata || 'Origen'}`, icon: '🛫' },
                    { time: flightData.arrival?.estimated ? String(flightData.arrival.estimated).substring(11, 16) : 'LUEGO', event: `Llegada a ${flightData.arrival?.iata || 'Destino'}`, icon: '🛬' },
                ].map((item, idx) => (
                    <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 10, marginBottom: 12 }}>
                        <Text style={{ color: '#B0B0B0', fontSize: 11, fontWeight: '900', width: 50 }}>{item.time}</Text>
                        <View style={{ width: 1, height: 20, backgroundColor: '#222', marginHorizontal: 15 }} />
                        <Text style={{ fontSize: 14, marginRight: 8 }}>{item.icon}</Text>
                        <Text style={{ color: '#B0B0B0', fontSize: 13 }}>{item.event}</Text>
                    </View>
                )) : [
                    { time: 'AHORA', event: 'Asistente conectado y en línea', icon: '🟢' },
                    { time: '---', event: 'Esperando asignación de vuelo', icon: '⏳' },
                ].map((item, idx) => (
                    <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 10, marginBottom: 12 }}>
                        <Text style={{ color: '#B0B0B0', fontSize: 11, fontWeight: '900', width: 50 }}>{item.time}</Text>
                        <View style={{ width: 1, height: 20, backgroundColor: '#222', marginHorizontal: 15 }} />
                        <Text style={{ fontSize: 14, marginRight: 8 }}>{item.icon}</Text>
                        <Text style={{ color: '#B0B0B0', fontSize: 13 }}>{item.event}</Text>
                    </View>
                ))}

                {/* BOTÓN TEST PUSH (OCULTO A SIMPLE VISTA) */}
                {IS_BETA && (
                    <TouchableOpacity
                        onPress={() => simulatePushNotification()}
                        style={{
                            marginTop: 15, alignSelf: 'flex-start', marginLeft: 10,
                            backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#333'
                        }}
                    >
                        <Text style={{ color: '#888', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 }}>TEST: FORZAR ALERTA PUSH</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    onPress={() => {
                        Alert.alert("CERRAR SESIÓN", "¿Estás seguro de que quieres salir de la cabina?", [
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
                        marginTop: 40,
                        marginBottom: 10
                    }}
                >
                    <Text style={{ color: '#FF3B30', fontWeight: 'bold', fontSize: 13, letterSpacing: 1 }}>CERRAR SESIÓN DE USUARIO</Text>
                </TouchableOpacity>

            </View>

            <View style={{ height: 160 }} />
        </ScrollView>
    );
}
