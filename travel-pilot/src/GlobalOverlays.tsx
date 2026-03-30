import React from 'react';
import { View, Text, TouchableOpacity, Animated, Modal, TextInput, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform, Image, Linking } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { s } from './styles';
import { useAppContext } from './context/AppContext';
import { BACKEND_URL } from '../config';
import * as Notifications from 'expo-notifications';

// Importar imágenes directamente para que siempre estén disponibles
const DOC_IMAGES: Record<string, any> = {
    'demo-passport-premium': require('../assets/pasaporte_puro.jpg'),
    'demo-boarding-premium': require('../assets/tarjeta_embarque_pura.jpg'),
    'demo-hotel-premium': require('../assets/reserva_hotel_pura.jpg'),
    'ticket-rapido': require('../assets/ticket_rapido_vip.jpg'),
    'ticket-rapido-estandar': require('../assets/ticket_rapido_estandar.png'),
    'ticket-equilibrado': require('../assets/ticket_equilibrado_confort.jpg'),
    'ticket-economico': require('../assets/ticket_economico.jpg'),
};

// Diccionario de teléfonos de atención al cliente por aerolínea
const AIRLINE_PHONES: Record<string, string> = {
    'Iberia': '+34 901 111 500',
    'Vueling': '+34 931 151 415',
    'Ryanair': '+34 912 058 150',
    'British Airways': '+44 344 493 0787',
    'Turkish Airlines': '+34 911 640 777',
    'Emirates': '+34 911 640 410',
    'Travel-Pilot Air': '+34 900 000 000',
    'Travel-Pilot Test': '+34 900 000 000',
    'Simulated Airlines': '+34 900 000 000',
};

export default function GlobalOverlays() {
    const {
        user, showSOSMenu, setShowSOSMenu, speak, stopSpeak, setLegalShieldActive, setCompensationEligible,
        setTab, setShowChat, showChat, isSpeaking, waveAnim, messages, isTyping, inputText, setInputText,
        handleSendMessage, scrollViewRef, viewDoc, isScanning, setViewDoc, scanAnim, selectedPlan, setSelectedPlan, showSOS, setShowSOS,
        isGenerating, loadingStep, apiPlan, setApiPlan, setPlanes, setShowBrowser, browserLogs, showBrowser,
        clearMessages, availableVoices, selectedVoice, setSelectedVoice,
        isDictating, startDictation, stopDictation, userPhone, travelProfile,
        setExtraDocs, setFlightData, showPlan, flightData, setHasNewDoc,
        setSelectedRescuePlan, selectedRescuePlan, setPendingVIPRedirect
    } = useAppContext();

    const [showVoiceMenu, setShowVoiceMenu] = React.useState(false);
    const [showAllOptions, setShowAllOptions] = React.useState(false);
    const [hasAutoTriggered, setHasAutoTriggered] = React.useState(false);

    // Resetear el trigger cuando cambia el vuelo buscado
    React.useEffect(() => {
        setHasAutoTriggered(false);
    }, [flightData?.flightNumber]);

    // AUTO-TRIGGER DE CRISIS (EXPERIENCIA PREMIUM) — SIN DELAY
    React.useEffect(() => {
        if (flightData && (flightData.departure?.delay || 0) >= 60 && !hasAutoTriggered && !showSOS) {
            showPlan();
            setHasAutoTriggered(true);
        }
    }, [flightData, hasAutoTriggered, showSOS]);

    // ESCUCHADOR DE NOTIFICACIONES DE SISTEMA
    React.useEffect(() => {
        const subscription = Notifications.addNotificationResponseReceivedListener(response => {
            console.log("🔔 [Push Click] Iniciando asistencia inmediata...");
            showPlan();
        });
        return () => subscription.remove();
    }, []);

    if (!user) return null;

    return (
        <>
            {/* MENÚ DE AYUDA — ASISTENCIA RÁPIDA */}
            <Modal visible={showSOSMenu} transparent animationType="fade">
                <View style={[s.mf]}>
                    <SafeAreaView style={[s.mc, { width: '90%' }]}>
                        <Text style={{ color: '#AF52DE', fontSize: 23, fontWeight: '900', marginBottom: 5 }}>🙋 ASISTENCIA</Text>
                        <Text style={{ color: '#B0B0B0', fontSize: 12, marginBottom: 20 }}>TU ASISTENTE PERSONAL DE VIAJE</Text>

                        {[
                            {
                                icon: '📞', title: 'LLAMAR AL HOTEL', sub: 'Notificar llegada tardía automáticamente', color: '#AF52DE', action: () => {
                                    setShowSOSMenu(false);
                                    Alert.alert('AVISO AL HOTEL', 'Travel-Pilot intentará contactar al hotel para avisarles de tu llegada tardía. Te recomendamos confirmar con ellos directamente.', [
                                        {
                                            text: 'AVISAR AHORA', onPress: async () => {
                                                speak('Iniciando intento de contacto con el alojamiento. Por favor, verifica con ellos más tarde.');
                                                try {
                                                    const controller = new AbortController();
                                                    const timeoutId = setTimeout(() => controller.abort(), 7000); // 7 segundos de margen

                                                    const res = await fetch(`${BACKEND_URL}/api/notifyHotel`, {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                            hotelPhone: "+34623986708",
                                                            passengerName: user?.email?.split('@')[0] || "Viajero",
                                                            passengerPhone: userPhone || "No registrado",
                                                            delayMinutes: 210
                                                        }),
                                                        signal: controller.signal
                                                    });
                                                    if (res.ok) {
                                                        Alert.alert('AVISO ENVIADO', 'Hemos intentado contactar con tu hotel. Para mayor seguridad, confírmalo tú mismo llamando directamente a recepción.');
                                                    } else {
                                                        const data = await res.json();
                                                        Alert.alert('AVISO', data.error || 'No se pudo contactar con el hotel.');
                                                    }
                                                } catch (e) {
                                                    Alert.alert('ERROR', 'No se ha podido conectar con el servidor.');
                                                }
                                            }
                                        },
                                        { text: 'CANCELAR', style: 'cancel' }
                                    ]);
                                }
                            },
                            { icon: '✈️', title: 'CONTACTAR AEROLÍNEA', sub: 'Línea directa de tu compañía aérea', color: '#007AFF', action: () => {
                                setShowSOSMenu(false);
                                if (!flightData?.airline) {
                                    Alert.alert('SIN VUELO ACTIVO', 'Primero busca un vuelo en VUELOS para poder contactar con tu aerolínea.');
                                    return;
                                }
                                const airlineName = flightData.airline;
                                const phone = AIRLINE_PHONES[airlineName] || '+34 901 111 500';
                                speak(`Voy a preparar la llamada a ${airlineName}. El número aparecerá en tu marcador.`);
                                Alert.alert(
                                    'CONTACTAR AEROLÍNEA',
                                    `Vamos a abrir el marcador con el número de ${airlineName}:\n\n📞 ${phone}\n\nLa llamada corre a tu cargo.`,
                                    [
                                        { text: 'CANCELAR', style: 'cancel' },
                                        { text: 'LLAMAR AHORA', onPress: () => Linking.openURL(`tel:${phone.replace(/\s/g, '')}`) }
                                    ]
                                );
                            } },
                            { icon: '🏥', title: 'EMERGENCIA MÉDICA', sub: 'Llamar a servicios de emergencia', color: '#FF3B30', action: () => {
                                setShowSOSMenu(false);
                                speak('En caso de emergencia médica, llama al 112 inmediatamente. Funciona en toda Europa.');
                                Alert.alert(
                                    '🚨 EMERGENCIA MÉDICA',
                                    'En caso de emergencia médica real, pulsa LLAMAR AL 112 para contactar con los servicios de emergencia.\n\nSi estás fuera de España, el 112 funciona en toda la Unión Europea. Para otros países, pulsa VER NÚMEROS POR PAÍS.\n\nTravel-Pilot no sustituye a los servicios de emergencia oficiales. En caso de peligro real, llama siempre al 112 o número local.',
                                    [
                                        { text: 'CANCELAR', style: 'cancel' },
                                        { text: 'VER NÚMEROS POR PAÍS', onPress: () => {
                                            Alert.alert(
                                                '🌍 EMERGENCIAS POR PAÍS',
                                                '🇪🇸 España → 112\n🇫🇷 Francia → 15\n🇬🇧 Reino Unido → 999\n🇺🇸 EE.UU. → 911\n🇩🇪 Alemania → 112\n🇮🇹 Italia → 118\n🇹🇷 Turquía → 112\n🇦🇪 Emiratos → 998\n🇵🇱 Polonia → 112\n🌍 Resto del mundo → 112\n\nTravel-Pilot no sustituye a los servicios de emergencia oficiales.',
                                                [{ text: 'ENTENDIDO' }]
                                            );
                                        }},
                                        { text: '🚨 LLAMAR AL 112', style: 'destructive', onPress: () => Linking.openURL('tel:112') }
                                    ]
                                );
                            } },
                            { icon: '🛡️', title: 'ASISTENCIA LEGAL', sub: 'Reclamar indemnización por retraso', color: '#27C93F', action: () => { setShowSOSMenu(false); setLegalShieldActive(true); setCompensationEligible(true); setTab('Vault'); speak('Asistencia legal activada.'); } },
                            { icon: '💬', title: 'HABLAR CON ASISTENTE', sub: 'Asistente de viaje en tiempo real', color: '#AF52DE', action: () => { setShowSOSMenu(false); setShowChat(true); } },
                        ].map((item, i) => (
                            <TouchableOpacity key={i} onPress={item.action} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 14, borderRadius: 14, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: item.color, width: '100%' }}>
                                <Text style={{ fontSize: 23, marginRight: 12 }}>{item.icon}</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>{item.title}</Text>
                                    <Text style={{ color: '#B0B0B0', fontSize: 11 }}>{item.sub}</Text>
                                </View>
                                <Text style={{ color: '#B0B0B0', fontSize: 17 }}>›</Text>
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity onPress={() => setShowSOSMenu(false)} style={{ marginTop: 15, paddingVertical: 10 }}>
                            <Text style={{ color: '#B0B0B0', fontSize: 13 }}>CERRAR</Text>
                        </TouchableOpacity>
                    </SafeAreaView>
                </View>
            </Modal>



            {/* PLANES CONTINGENCIA (RADAR) */}
            <Modal visible={!!user && showSOS} transparent animationType="fade">
                <View style={s.mf}>
                    <SafeAreaView style={[s.mc, { padding: 0, overflow: 'hidden' }]}>
                        {/* CABECERA CON BOTÓN DE CIERRE */}
                        <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#222' }}>
                            <Text style={[s.mt, { fontSize: 16, letterSpacing: 1 }]}>RESOLUCIÓN DE CRISIS</Text>
                            <TouchableOpacity onPress={() => { stopSpeak(); setShowSOS(false); setSelectedPlan(null); setShowAllOptions(false); }} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={{ color: '#AF52DE', fontSize: 18, fontWeight: 'bold' }}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ width: '100%' }} contentContainerStyle={{ padding: 20 }}>
                        {isGenerating ? (
                            <View style={{ marginVertical: 30, alignItems: 'center' }}>
                                <ActivityIndicator size="large" color="#AF52DE" />
                                <Text style={{ color: '#AF52DE', marginTop: 15, fontWeight: 'bold', fontSize: 13 }}>
                                    {loadingStep === 0 && "CONSULTANDO AL ASISTENTE..."}
                                    {loadingStep === 1 && "REVISANDO TU ALOJAMIENTO..."}
                                    {loadingStep === 2 && "BUSCANDO OPCIONES..."}
                                    {loadingStep === 3 && "SINCRONIZANDO TUS DATOS..."}
                                </Text>
                            </View>
                        ) : (
                            <>
                                {apiPlan?.impact && (
                                    <View style={{ backgroundColor: '#111', width: '100%', padding: 12, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: apiPlan.impact.potentialLoss > 0 ? '#FF9500' : '#4CD964' }}>
                                        <Text style={{ color: '#AF52DE', fontSize: 12, fontWeight: 'bold' }}>✨ SUGERENCIA DEL ASISTENTE:</Text>
                                        <Text style={{ color: '#FF9500', fontSize: 11, marginTop: 4 }}>• {apiPlan.impact.hotelAlert}</Text>
                                    </View>
                                )}
                                <View style={{ width: '100%', marginTop: 10 }}>
                                    {(() => {
                                        const options = apiPlan?.options || [];
                                        if (options.length === 0) return null;

                                        // 1. Determinar La mejor opción según el perfil
                                        let bestOptionIdx = 0;
                                        if (travelProfile === 'premium') {
                                            if (travelProfile === 'fast') {
                                                bestOptionIdx = options.findIndex((o: any) => o.type?.includes('RÁPID') || o.type?.includes('RAPID'));
                                            } else if (travelProfile === 'budget') {
                                                bestOptionIdx = options.findIndex((o: any) => o.type?.includes('ECONÓMIC') || o.type?.includes('BARAT'));
                                            } else {
                                                bestOptionIdx = options.findIndex((o: any) => !o.type?.includes('RÁPID') && !o.type?.includes('ECONÓMIC'));
                                            }
                                        } else {
                                            // FREE: Siempre la primera es la mejor (ECONÓMICA según AppContext)
                                            bestOptionIdx = 0;
                                        }
                                        
                                        if (bestOptionIdx === -1) bestOptionIdx = 0;

                                        const bestOpt = options[bestOptionIdx];
                                        const otherOpts = options.filter((_: any, idx: number) => idx !== bestOptionIdx);

                                        const renderOption = (opt: any, isMain: boolean) => {
                                            let bgColor = isMain ? '#1a1a1a' : '#0D0D0D';
                                            let borderColor = '#007AFF';
                                            let icon = '✨';
                                            let typeLabel = 'OPCIÓN CONFORT';
                                            
                                            if (opt.type?.includes('RÁPID') || opt.type?.includes('RAPID')) {
                                                borderColor = '#FF3B30';
                                                icon = '🚀';
                                                typeLabel = 'OPCIÓN RÁPIDA';
                                            } else if (opt.type?.includes('ECONÓMIC') || opt.type?.includes('BARAT')) {
                                                borderColor = '#34C759';
                                                icon = '💰';
                                                typeLabel = 'OPCIÓN ECONÓMICA';
                                            } else if (opt.type === 'VIP_LOCKED') {
                                                borderColor = '#D4AF37';
                                                icon = '🔒';
                                                typeLabel = 'DESBLOQUEAR VIP';
                                            }

                                            return (
                                                <TouchableOpacity
                                                    key={opt.title}
                                                    style={{ 
                                                        backgroundColor: bgColor,
                                                        borderLeftWidth: isMain ? 6 : 4,
                                                        borderLeftColor: borderColor,
                                                        borderWidth: isMain ? 2 : 1,
                                                        borderColor: isMain ? borderColor : '#222',
                                                        borderRadius: 16, 
                                                        padding: isMain ? 20 : 16, 
                                                        marginBottom: 12,
                                                        shadowColor: isMain ? borderColor : 'transparent',
                                                        shadowOpacity: isMain ? 0.3 : 0,
                                                        shadowRadius: 10
                                                    }}
                                                onPress={() => {
                                                    if (opt.actionType === 'locked') {
                                                        speak('Estas opciones están reservadas para usuarios VIP. Desbloquéalas ahora con un solo clic.');
                                                        setShowSOS(false);
                                                        setPendingVIPRedirect(true);
                                                        return;
                                                    }
                                                    const isRápido = opt.type?.includes('RÁPID') || opt.type?.includes('RAPID');
                                                    const isEco = opt.type?.includes('ECONÓMIC') || opt.type?.includes('BARAT');
                                                    const optType = (isRápido && travelProfile === 'premium') ? 'VIP' : isRápido ? 'RÁPIDO' : isEco ? 'ECONÓMICO' : 'EQUILIBRADO';
                                                    const msg = `Confirmado. Iniciando protocolo ${optType} para la opción: ${opt.title}.`;
                                                        speak(msg);
                                                        setSelectedRescuePlan(opt.title); // Capturamos la elección
                                                        setSelectedPlan(opt);
                                                        setShowSOS(false);
                                                        setShowBrowser(true);
                                                    }}
                                                >
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                                        <Text style={{ fontSize: isMain ? 22 : 18, marginRight: 8 }}>{icon}</Text>
                                                        <View>
                                                            {isMain && <Text style={{ color: borderColor, fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 2 }}>PROPUESTA PERSONALIZADA ({travelProfile === 'premium' ? 'VIP' : travelProfile === 'fast' ? 'RÁPIDA' : travelProfile === 'budget' ? 'ECONÓMICA' : 'CONFORT'})</Text>}
                                                            <Text style={{ color: isMain ? '#FFF' : borderColor, fontSize: isMain ? 15 : 12, fontWeight: '900' }}>{typeLabel}</Text>
                                                        </View>
                                                    </View>
                                                    <Text style={{ color: '#FFF', fontSize: isMain ? 18 : 16, fontWeight: 'bold', marginBottom: 6 }}>{opt.title}</Text>
                                                    <Text style={{ color: '#B0B0B0', fontSize: isMain ? 13 : 12, lineHeight: 18 }}>{opt.description}</Text>
                                                    
                                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 15 }}>
                                                        <View style={{ backgroundColor: borderColor + (isMain ? '30' : '15'), paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
                                                            <Text style={{ color: borderColor, fontSize: isMain ? 15 : 13, fontWeight: '900' }}>
                                                                {opt.type?.includes('ECONÓM') ? '+' : (opt.estimatedCost > 0 ? '-' : '')} {opt.estimatedCost} €
                                                            </Text>
                                                        </View>
                                                        {isMain && (
                                                            <View style={{ backgroundColor: borderColor, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 }}>
                                                                <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 12 }}>
                                                                    {opt.actionType === 'locked' ? 'ACTUALIZAR A VIP' : 'EJECUTAR SEGÚN PERFIL'}
                                                                </Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                </TouchableOpacity>
                                            );
                                        };
 
                                        return (
                                            <>
                                                <View style={{ backgroundColor: 'rgba(175, 82, 222, 0.05)', padding: 15, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(175, 82, 222, 0.2)' }}>
                                                    <Text style={{ color: '#AF52DE', fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 6 }}>🧠 ANÁLISIS DE INTELIGENCIA</Text>
                                                    <Text style={{ color: '#FFF', fontSize: 13, lineHeight: 20 }}>
                                                        He analizado {flightData?.departure?.delay} min de retraso. Según tu prioridad <Text style={{ color: '#AF52DE', fontWeight: 'bold' }}>{travelProfile === 'premium' ? 'VIP' : travelProfile === 'fast' ? 'Rápida' : travelProfile === 'budget' ? 'Económica' : 'CONFORT'}</Text>, esta es mi mejor recomendación. 
                                                        Pulsa para ejecutarla o revisa otras estrategias si prefieres cambiar de criterio.
                                                    </Text>
                                                </View>
                                                
                                                {renderOption(bestOpt, true)}
 
                                                {!showAllOptions && otherOpts.length > 0 && travelProfile === 'premium' && (
                                                    <TouchableOpacity 
                                                        onPress={() => setShowAllOptions(true)} 
                                                        style={{ padding: 15, alignItems: 'center', marginTop: 10, borderWidth: 1, borderColor: '#333', borderRadius: 12, borderStyle: 'dotted' }}
                                                    >
                                                        <Text style={{ color: '#888', fontWeight: 'bold', fontSize: 11 }}>SOLICITAR CAMBIO DE ESTRATEGIA (VER OTROS PLANES)</Text>
                                                    </TouchableOpacity>
                                                )}
 
                                                {(showAllOptions || (travelProfile !== 'premium' && otherOpts.length > 0)) && (
                                                    <View style={{ marginTop: 20 }}>
                                                        {travelProfile === 'premium' && <Text style={{ color: '#666', fontSize: 11, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' }}>VÍAS ALTERNATIVAS DISPONIBLES</Text>}
                                                        {otherOpts.map((opt: any) => renderOption(opt, false))}
                                                    </View>
                                                )}
                                            </>
                                        );
                                    })()}
                                    <View style={{ height: 40 }} />
                                </View>
                            </>
                        )}
                        </ScrollView>
                    </SafeAreaView>
                </View>
            </Modal >

            <Modal visible={showBrowser} transparent animationType="fade" >
                <View style={s.mf}>
                    <SafeAreaView style={[s.mc, { width: '90%', height: '80%', padding: 0, overflow: 'hidden' }]}>
                        <View style={{ backgroundColor: '#222', padding: 10, flexDirection: 'row', alignItems: 'center' }}>
                            {(() => {
                                const isRápido = selectedPlan?.type?.includes('RÁPID') || selectedPlan?.type?.includes('RAPID');
                                const isEco = selectedPlan?.type?.includes('ECONÓMIC') || selectedPlan?.type?.includes('BARAT');
                                const modeLabel = (isRápido && travelProfile === 'premium') ? 'VIP' : isRápido ? 'RÁPIDO' : isEco ? 'ECONÓMICO' : 'EQUILIBRADO';
                                return (
                                    <View style={{ flex: 1, backgroundColor: '#333', borderRadius: 4, padding: 4 }}>
                                        <Text style={{ color: '#AAA', fontSize: 11, textAlign: 'center', fontWeight: 'bold', letterSpacing: 1 }}>
                                            🛡️ ASISTENTE IA — MODO {modeLabel}
                                        </Text>
                                    </View>
                                );
                            })()}
                        </View>
                        <View style={{ flex: 1, backgroundColor: '#000', padding: 20 }}>
                            <Text style={{ color: '#4CD964', fontSize: 13, lineHeight: 22, fontWeight: '500' }}>{browserLogs.join('\n')}</Text>
                            <View style={{ marginTop: 40, alignItems: 'center' }}>
                                {browserLogs.length < 8 ? (
                                    <>
                                        <ActivityIndicator color="#27C93F" size="large" />
                                        <Text style={{ color: '#27C93F', marginTop: 15, fontWeight: 'bold' }}>CONSTRUYENDO TU PLAN DE RESCATE...</Text>
                                    </>
                                ) : (
                                    <View style={{ alignItems: 'center' }}>
                                        <Text style={{ fontSize: 40 }}>✅</Text>
                                          <Text style={{ color: '#27C93F', marginTop: 15, fontWeight: 'bold', fontSize: 16 }}>ESTRATEGIA COMPLETADA</Text>
                                          <Text style={{ color: '#4CD964', marginTop: 5, fontSize: 13, textAlign: 'center', fontWeight: '500' }}>
                                              {travelProfile === 'premium' ? 'Protocolo VIP ejecutado. Tu expediente legal y tus alternativas están listos. Tú decides el siguiente paso.' :
                                               selectedPlan?.type?.includes('ECONÓMIC') ? 'Tu documentación legal está lista. Firma el expediente para enviarlo a la aerolínea.' : 
                                               selectedPlan?.type?.includes('CONFORT') || selectedPlan?.actionType === 'hotel' ? 'He encontrado opciones de alojamiento cercanas. Revisa la guía y confirma tú mismo la reserva.' : 
                                               'He analizado las rutas alternativas disponibles. Elige la que mejor se adapte a tu situación.'}
                                          </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                        <TouchableOpacity style={{ padding: 15, backgroundColor: '#27C93F', alignItems: 'center' }} onPress={() => { 
                            setShowBrowser(false); 
                            stopSpeak(); 
                            if (selectedPlan) {
                                 const isVip = (selectedPlan.type?.includes('RÁPID') || selectedPlan.type?.includes('RAPID')) && travelProfile === 'premium';
                                 const isRápido = (selectedPlan.type?.includes('RÁPID') || selectedPlan.type?.includes('RAPID')) && travelProfile !== 'premium';
                                 const isEco = selectedPlan.type?.includes('ECONÓMIC');
                                 const isHotel = selectedPlan.actionType === 'hotel' || selectedPlan.type?.includes('CONFORT');
                                 
                                 const imgRescate = isHotel ? require('../assets/reserva_hotel_pura.jpg') :
                                                   isVip ? require('../assets/ticket_rapido_vip.jpg') : 
                                                   isRápido ? require('../assets/ticket_rapido_estandar.png') :
                                                   isEco ? require('../assets/ticket_economico.jpg') : 
                                                   require('../assets/ticket_equilibrado_confort.jpg');

                                 speak(`Misión completada. He preparado tu propuesta de ${isHotel ? 'alojamiento' : 'transporte alternativo'} en la bóveda de documentos para que la utilices. Buen viaje.`);
                                 
                                 const newTicket = {
                                     id: `rescue_${Date.now()}`,
                                     t: isHotel ? `PROPUESTA ALOJAMIENTO IA (PLAN ${isEco ? 'ECONÓMICO' : isVip ? 'VIP' : isRápido ? 'RÁPIDO' : 'EQUILIBRADO'})` : `PROPUESTA RESCATE IA (${isEco ? 'ECONÓMICO' : isVip ? 'VIP' : isRápido ? 'RÁPIDO' : 'EQUILIBRADO'})`,
                                     s: isHotel ? `Alojamiento · ${selectedPlan.title}` : `Propuesta Vuelo · ${selectedPlan.title}`,
                                     i: imgRescate,
                                     source: 'TRAVEL-PILOT IA',
                                     icon: isHotel ? '🛌' : '🎟️',
                                     verified: true,
                                 };
                                setExtraDocs((prev: any) => [newTicket, ...prev]);
                                setHasNewDoc(true);
                                setFlightData(null);
                                setSelectedPlan(null);
                            }
                        }}><Text style={{ color: '#000', fontWeight: 'bold' }}>FINALIZAR Y VOLVER</Text></TouchableOpacity>
                    </SafeAreaView>
                </View>
            </Modal >


            {/* MODAL DE ESCANEO (CON LÁSER) */}
            <Modal visible={!!viewDoc} transparent animationType="fade" onShow={() => {
                scanAnim.setValue(0);
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(scanAnim, { toValue: 280, duration: 4000, useNativeDriver: true }),
                        Animated.timing(scanAnim, { toValue: 0, duration: 4000, useNativeDriver: true })
                    ])
                ).start();
            }}>
                <View style={s.mf}>
                    <View style={[s.mc, { backgroundColor: '#000', padding: 0, overflow: 'hidden' }]}>
                        <View style={{ width: '100%', height: 300, backgroundColor: '#0A0A0A', position: 'relative' }}>
                            {(() => {
                                const imgSource = DOC_IMAGES[viewDoc?.id] || (typeof viewDoc?.i === 'number' ? viewDoc.i : viewDoc?.i ? { uri: viewDoc.i } : null);
                                return imgSource ? (
                                    <Image 
                                        source={imgSource} 
                                        resizeMode="contain" 
                                        style={{ 
                                            position: 'absolute', 
                                            top: 0, left: 0, right: 0, bottom: 0,
                                            width: '100%', 
                                            height: '100%', 
                                            opacity: isScanning ? 0.3 : 1 
                                        }} 
                                    />
                                ) : null;
                            })()}
                            {isScanning && <Animated.View style={[s.laser, { transform: [{ translateY: scanAnim }] }]} />}
                        </View>
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14, textAlign: 'center' }}>
                                {isScanning ? 'ESCANEANDO DOCUMENTO...' : `${viewDoc?.t || 'DOCUMENTO'} - VERIFICADO`}
                            </Text>
                            <TouchableOpacity style={[s.bt, { backgroundColor: '#AF52DE', marginTop: 15, borderRadius: 12 }]} onPress={() => setViewDoc(null)}>
                                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>CERRAR</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <GlobalStopButton isSpeaking={isSpeaking} stopSpeak={stopSpeak} />
        </>
    );
}

const GlobalStopButton = ({ isSpeaking, stopSpeak }: { isSpeaking: boolean, stopSpeak: () => void }) => {
    if (!isSpeaking) return null;
    return (
        <Modal transparent visible={isSpeaking} animationType="fade">
            <View style={{ flex: 1, pointerEvents: 'box-none' }}>
                <TouchableOpacity 
                    onPress={() => stopSpeak()}
                    style={{
                        position: 'absolute',
                        top: 70,
                        right: 25,
                        backgroundColor: '#FF3B30',
                        width: 50,
                        height: 50,
                        borderRadius: 25,
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderWidth: 3,
                        borderColor: 'white',
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: 0.5,
                        shadowRadius: 10,
                        elevation: 20
                    }}
                >
                    <Text style={{ color: 'white', fontSize: 26, fontWeight: '900' }}>✕</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
};
