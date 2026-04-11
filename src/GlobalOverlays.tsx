import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, Modal, TextInput, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform, Image, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { s } from './styles';
import { useAppContext } from './context/AppContext';
import { BACKEND_URL } from '../config';
import VIPAlternatives from './components/VIPAlternatives';
import CancellationProtocol from './components/CancellationProtocol';
import PrivateVaultScreen from './screens/PrivateVaultScreen';
import * as Notifications from 'expo-notifications';

// Importar imágenes directamente para que siempre estén disponibles
const DOC_IMAGES: Record<string, any> = {
    'demo-passport-premium': require('../assets/pasaporte_puro.jpg'),
    'demo-boarding-premium': require('../assets/tarjeta_embarque_pura.jpg'),
    'demo-hotel-premium': require('../assets/reserva_hotel_pura.jpg'),
    'ticket-rapido': require('../assets/ticket_rapido_vip.jpg'),
    'ticket-rapido-estandar': require('../assets/ticket_rapido_vip.jpg'),
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
        user,
        flightData,
        setFlightData,
        showSOS,
        setShowSOS,
        showSOSMenu,
        setShowSOSMenu,
        isGenerating,
        loadingStep,
        apiPlan,
        setApiPlan,
        selectedPlan,
        setSelectedPlan,
        viewDoc,
        setViewDoc,
        isScanning,
        scanAnim,
        speak,
        stopSpeak,
        isSpeaking,
        setSelectedRescuePlan,
        showBrowser,
        setShowBrowser,
        browserLogs,
        setBrowserLogs,
        isExtracting,
        setIsExtracting,
        setExtraDocs,
        setHasNewDoc,
        setTab,
        setLegalShieldActive,
        setCompensationEligible,
        userPhone,
        activeSearches,
        removeActiveSearch,
        travelProfile,
        setTravelProfile,
        masterReset,
        pendingVIPRedirect,
        setPendingVIPRedirect,
        compBannerDismissed,
        setCompBannerDismissed,
        chatOrigin,
        setChatOrigin,
        setShowChat,
        showPlan,
        showVIPAlternatives,
        setShowVIPAlternatives,
        setPendingVIPScroll,
        showCancellation,
        setShowCancellation,
        lastSearchId
    } = useAppContext();

    const navigation = useNavigation<any>();

    // VIGILANTE DE IA MAESTRO: Si un modo se queda colgado, forzamos el fin
    useEffect(() => {
        let timer: any;
        const isFinished = (browserLogs || []).some((l: string) => l.includes('✅') || l.includes('❌') || l.includes('⚠️'));
        if (showBrowser && !isFinished) {
            timer = setTimeout(() => {
                const recoveryMsg = isExtracting 
                    ? "✅ Protocolo completado (Sincronización segura finalizada)."
                    : "✅ Protocolo finalizado (Plan de contingencia desplegado).";
                
                setBrowserLogs((prev: string[]) => [
                    ...prev, 
                    recoveryMsg
                ]);
                if (isExtracting) setIsExtracting(false);
            }, 15000); // Aumentado a 15s para dar margen a Render/Red
        }
        return () => clearTimeout(timer);
    }, [showBrowser, (browserLogs || []).length, isExtracting]);

    const [showVoiceMenu, setShowVoiceMenu] = useState(false);
    const [showAllOptions, setShowAllOptions] = useState(false);
    const [hasAutoTriggered, setHasAutoTriggered] = useState(false);
    const [vipInitialDetail, setVipInitialDetail] = useState<string | null>(null);
    const logScrollRef = useRef<any>(null);

    // Resetear el trigger cuando cambia el vuelo buscado O el ID de búsqueda (Actualizar)
    React.useEffect(() => {
        setHasAutoTriggered(false);
    }, [flightData?.flightNumber, lastSearchId]);

    React.useEffect(() => {
        // SEGURIDAD: No disparar si los datos vienen del caché de AppContext (Evitar salto al login)
        // Solo disparamos si el usuario está activamente en la app y NO acabamos de arrancar
        if (!flightData || hasAutoTriggered || showSOS || showVIPAlternatives || showCancellation) return;

        // Búsqueda robusta de estado cancelado
        const status = flightData.status?.toLowerCase() || '';
        const isCancelled = status.includes('cancel'); 
        const isDelayed = (flightData.departure?.delay || 0) >= 60;

        // IMPORTANTE: Si flightData tiene la marca 'fromCache', no auto-disparamos el modal
        if (flightData.isFromCache) return;

        if (isCancelled || isDelayed) {
            if (isCancelled) {
                setShowSOS(false);
                setShowVIPAlternatives(false);
                setShowCancellation(true);
            } else {
                showPlan();
            }
            setHasAutoTriggered(true);
        }
    }, [flightData, hasAutoTriggered, showSOS, showVIPAlternatives, showCancellation, travelProfile]);

    // DICTADO INICIAL DEL PLAN DE CRISIS DINÁMICO
    React.useEffect(() => {
        if (showSOS && apiPlan && !isGenerating && apiPlan.voiceScriptInitial) {
            speak(apiPlan.voiceScriptInitial, selectedPlan ? undefined : 'es-ES-standard');
        }
    }, [showSOS, isGenerating, apiPlan]);

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
                                icon: travelProfile === 'premium' ? '🛡️' : '📞',
                                title: travelProfile === 'premium' ? 'AVISANDO AL HOTEL' : 'LLAMAR AL HOTEL',
                                sub: travelProfile === 'premium' ? '✅ Gestión automática activada' : 'Llamar tú mismo al hotel',
                                color: travelProfile === 'premium' ? '#D4AF37' : '#AF52DE',
                                action: () => {
                                    setShowSOSMenu(false);
                                    if (!flightData) {
                                        Alert.alert('SIN VUELO ACTIVO', 'Primero busca un vuelo en VUELOS para que pueda calcular tu retraso y avisar al hotel.');
                                        return;
                                    }
                                    const realDelay = flightData.departure?.delay || 0;
                                    const flightNum = flightData.flightNumber || 'tu vuelo';

                                    if (travelProfile === 'premium') {
                                        // ══ VIP: Gestión automática vía Twilio ══
                                        speak(`Contactando con tu hotel para avisarles de tu retraso de ${realDelay} minutos en el vuelo ${flightNum}. Un momento.`);
                                        setTimeout(() => {
                                        (async () => {
                                            try {
                                                const controller = new AbortController();
                                                const timeoutId = setTimeout(() => controller.abort(), 7000);
                                                const res = await fetch(`${BACKEND_URL}/api/notifyHotel`, {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                        hotelPhone: "+34623986708",
                                                        passengerName: user?.email?.split('@')[0] || "Viajero VIP",
                                                        passengerPhone: userPhone || "No registrado",
                                                        delayMinutes: realDelay
                                                    }),
                                                    signal: controller.signal
                                                });
                                                clearTimeout(timeoutId);
                                                if (res.ok) {
                                                    speak('Estancia protegida. El hotel ha sido notificado de tu llegada tardía.');
                                                    Alert.alert(
                                                        '✅ ESTANCIA PROTEGIDA',
                                                        `He notificado al hotel tu retraso de ${realDelay} min (vuelo ${flightNum}). Tu reserva está asegurada.`,
                                                        [{ text: 'ENTENDIDO' }]
                                                    );
                                                } else {
                                                    Alert.alert('AVISO', 'No se pudo contactar automáticamente. ¿Quieres llamar tú directamente?',
                                                        [
                                                            { text: 'CANCELAR', style: 'cancel' },
                                                            { text: 'LLAMAR YO', onPress: () => Linking.openURL('tel:+34623986708') }
                                                        ]
                                                    );
                                                }
                                            } catch (e) {
                                                Alert.alert('ERROR DE CONEXIÓN', 'El servicio no está disponible. ¿Quieres llamar directamente?',
                                                    [
                                                        { text: 'CANCELAR', style: 'cancel' },
                                                        { text: 'LLAMAR YO', onPress: () => Linking.openURL('tel:+34623986708') }
                                                    ]
                                                );
                                            }
                                        })();
                                        }, 5000);
                                    } else {
                                        // ══ FREE: Solo abre el marcador ══
                                        Alert.alert(
                                            'LLAMAR AL HOTEL',
                                            `Tu vuelo ${flightNum} lleva ${realDelay} min de retraso. Llama al hotel para avisar de tu llegada tardía.\n\n💡 Con el plan VIP, el asistente avisa automáticamente por ti.`,
                                            [
                                                { text: 'CANCELAR', style: 'cancel' },
                                                { text: 'LLAMAR AHORA', onPress: () => Linking.openURL('tel:+34623986708') }
                                            ]
                                        );
                                    }
                                }
                            },
                            {
                                icon: travelProfile === 'premium' ? '💎' : '✈️',
                                title: travelProfile === 'premium' ? 'LÍNEA PRIORITARIA' : 'CONTACTAR AEROLÍNEA',
                                sub: travelProfile === 'premium' ? '🤖 Tu asistente gestiona por ti' : 'Número de atención al cliente',
                                color: travelProfile === 'premium' ? '#D4AF37' : '#007AFF',
                                action: () => {
                                    setShowSOSMenu(false);
                                    if (!flightData?.airline) {
                                        Alert.alert('SIN VUELO ACTIVO', 'Primero busca un vuelo en VUELOS para poder contactar con tu aerolínea.');
                                        return;
                                    }
                                    const airlineName = flightData.airline;
                                    const phone = AIRLINE_PHONES[airlineName] || '+34 901 111 500';

                                    if (travelProfile === 'premium') {
                                        // ══ VIP: Expediente preparado + opciones ══
                                        speak(`Preparando tu expediente VIP para ${airlineName}. Puedo gestionar el contacto por ti o conectarte con la línea prioritaria.`);
                                        Alert.alert(
                                            '💎 CONTACTO VIP',
                                            `He preparado tu expediente para ${airlineName} con todos los datos del retraso del vuelo ${flightData.flightNumber}.\n\nElige cómo proceder:`,
                                            [
                                                { text: 'CANCELAR', style: 'cancel' },
                                                {
                                                    text: '🤖 ASISTENTE GESTIONA',
                                                    onPress: () => { setChatOrigin('vip'); setShowChat(true); }
                                                },
                                                {
                                                    text: `📞 LLAMAR A ${airlineName.toUpperCase().substring(0, 15)}`,
                                                    onPress: () => Linking.openURL(`tel:${phone.replace(/\s/g, '')}`)
                                                }
                                            ]
                                        );
                                    } else {
                                        // ══ FREE: Marcador directo ══
                                        speak(`Voy a preparar la llamada a ${airlineName}. El número aparecerá en tu marcador.`);
                                        Alert.alert(
                                            'CONTACTAR AEROLÍNEA',
                                            `Número de ${airlineName}:\n\n📞 ${phone}\n\nLa llamada corre a tu cargo.\n\n💡 Con el plan VIP, tu asistente gestiona el contacto por ti.`,
                                            [
                                                { text: 'CANCELAR', style: 'cancel' },
                                                { text: 'LLAMAR AHORA', onPress: () => Linking.openURL(`tel:${phone.replace(/\s/g, '')}`) }
                                            ]
                                        );
                                    }
                                }
                            },
                            {
                                icon: '🏥', title: 'EMERGENCIA MÉDICA', sub: 'Llamar a servicios de emergencia', color: '#FF3B30', action: () => {
                                    setShowSOSMenu(false);
                                    speak('En caso de emergencia médica, llama al 112 inmediatamente. Funciona en toda Europa.');
                                    Alert.alert(
                                        '🚨 EMERGENCIA MÉDICA',
                                        'En caso de emergencia médica real, pulsa LLAMAR AL 112 para contactar con los servicios de emergencia.\n\nSi estás fuera de España, el 112 funciona en toda la Unión Europea. Para otros países, pulsa VER NÚMEROS POR PAÍS.\n\nTravel-Pilot no sustituye a los servicios de emergencia oficiales. En caso de peligro real, llama siempre al 112 o número local.',
                                        [
                                            { text: 'CANCELAR', style: 'cancel' },
                                            {
                                                text: 'VER NÚMEROS POR PAÍS', onPress: () => {
                                                    Alert.alert(
                                                        '🌍 EMERGENCIAS POR PAÍS',
                                                        '🇪🇸 España → 112\n🇫🇷 Francia → 15\n🇬🇧 Reino Unido → 999\n🇺🇸 EE.UU. → 911\n🇩🇪 Alemania → 112\n🇮🇹 Italia → 118\n🇹🇷 Turquía → 112\n🇦🇪 Emiratos → 998\n🇵🇱 Polonia → 112\n🌍 Resto del mundo → 112\n\nTravel-Pilot no sustituye a los servicios de emergencia oficiales.',
                                                        [{ text: 'ENTENDIDO' }]
                                                    );
                                                }
                                            },
                                            { text: '🚨 LLAMAR AL 112', style: 'destructive', onPress: () => Linking.openURL('tel:112') }
                                        ]
                                    );
                                }
                            },
                            { icon: '🛡️', title: 'ASISTENCIA LEGAL', sub: 'Reclamar indemnización por retraso', color: '#27C93F', action: () => { setShowSOSMenu(false); setLegalShieldActive(true); setCompensationEligible(true); navigation.navigate('Vault'); speak('Asistencia legal activada.'); } },
                            { icon: '💬', title: 'HABLAR CON ASISTENTE', sub: 'Asistente de viaje en tiempo real', color: '#AF52DE', action: () => { setChatOrigin('global'); setShowSOSMenu(false); setShowChat(true); } },
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
                            <Text style={[s.mt, { fontSize: 16, letterSpacing: 1 }]}>
                                {travelProfile === 'premium' ? 'PROTOCOLO DE RESCATE VIP' : 'RESOLUCIÓN DE CRISIS'}
                            </Text>
                            <TouchableOpacity onPress={() => { stopSpeak(); setShowSOS(false); setSelectedPlan(null); setShowAllOptions(false); }} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={{ color: '#AF52DE', fontSize: 18, fontWeight: 'bold' }}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ width: '100%' }} contentContainerStyle={{ padding: 20 }}>
                            {isGenerating ? (
                                <View style={{ marginVertical: 30, alignItems: 'center' }}>
                                    <ActivityIndicator size="large" color="#AF52DE" />
                                    <Text style={{ color: '#AF52DE', marginTop: 15, fontWeight: 'bold', fontSize: 13 }}>
                                        {loadingStep === 0 && "CONECTANDO CON ASISTENTE..."}
                                        {loadingStep === 1 && "EVALUANDO IMPACTO EN VIAJE..."}
                                        {loadingStep === 2 && "PREPARANDO PROPUESTAS..."}
                                        {loadingStep === 3 && "GENERANDO ORIENTACIÓN..."}
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
                                                bestOptionIdx = options.findIndex((o: any) =>
                                                    o.type?.includes('RÁPID') || o.type?.includes('RAPID'));
                                            } else {
                                                // MODO ESTÁNDAR: Prioridad a la opción Económica/Reembolso
                                                bestOptionIdx = options.findIndex((o: any) =>
                                                    o.type?.includes('ECONÓMIC') || o.type?.includes('BARAT'));
                                            }
                                            if (bestOptionIdx === -1) bestOptionIdx = 0;

                                            if (bestOptionIdx === -1) bestOptionIdx = options.length - 1;


                                            const bestOpt = options[bestOptionIdx];
                                            const otherOpts = options.filter((_: any, idx: number) => idx !== bestOptionIdx);

                                            const renderOption = (opt: any, isMain: boolean, idx: number) => {
                                                let bgColor = isMain ? '#121212' : '#0D0D0D';
                                                let borderColor = '#5AC8FA';
                                                let icon = '⚖️';
                                                let typeLabel = 'OPCIÓN EQUILIBRADA';
                                                let isSpecial = false;

                                                if (opt.type?.includes('RÁPID') || opt.type?.includes('RAPID')) {
                                                    borderColor = '#FF3B30';
                                                    icon = '🚀';
                                                    typeLabel = travelProfile === 'premium' ? 'PROTOCOLO JET' : 'OPCIÓN RÁPIDA';
                                                    isSpecial = true;
                                                } else if (opt.type?.includes('ECONÓMIC') || opt.type?.includes('BARAT')) {
                                                    borderColor = '#34C759';
                                                    icon = '💰';
                                                    typeLabel = travelProfile === 'premium' ? 'RECLAMACIÓN ELITE' : 'OPCIÓN ECONÓMICA';
                                                } else if (opt.type === 'VIP_LOCKED') {
                                                    borderColor = '#D4AF37';
                                                    icon = '🔒';
                                                    typeLabel = 'DESBLOQUEAR VIP';
                                                    isSpecial = true;
                                                } else {
                                                    // FALLBACK / CONFORT
                                                    typeLabel = travelProfile === 'premium' ? 'ESTANCIA LUXURY' : 'OPCIÓN EQUILIBRADA';
                                                }

                                                // VIP OVERRIDE para la opción principal si el usuario es VIP o Rápido
                                                if (isMain && (travelProfile === 'premium' || travelProfile === 'fast')) {
                                                    borderColor = travelProfile === 'premium' ? '#D4AF37' : '#FF3B30'; 
                                                    icon = travelProfile === 'premium' ? '💎' : '🔥';
                                                    typeLabel = travelProfile === 'premium' ? 'ASISTENCIA INTEGRAL TRAVEL-PILOT' : 'RESCATE PRIORITARIO';
                                                    isSpecial = true;
                                                }


                                                return (
                                                    <TouchableOpacity
                                                        key={`sos-opt-${idx}-${opt.title}`}
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
                                                                speak('Estas opciones son exclusivas del plan VIP. Actívalo ahora y tendrás acceso inmediato a todas las estrategias de rescate.');
                                                                setShowSOS(false);
                                                                setPendingVIPRedirect(true);
                                                                return;
                                                            }
                                                            const isRápido = opt.type?.includes('RÁPID') || opt.type?.includes('RAPID');
                                                            const isEco = opt.type?.includes('ECONÓMIC') || opt.type?.includes('BARAT');
                                                            const optType = (isRápido && travelProfile === 'premium') ? 'VIP' : isRápido ? 'RÁPIDO' : isEco ? 'ECONÓMICO' : 'EQUILIBRADO';
                                                            const msg = opt.voiceScriptFinal || (travelProfile === 'premium'
                                                                ? `De acuerdo. Me ocupo de todo personalmente. Tu plan de rescate ya está en marcha.`
                                                                : `Entendido. Estoy preparando toda la documentación legal para tu reclamación ahora mismo.`);
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
                                                        {opt.aiReasoning && (
                                                            <View style={{ marginTop: 12, padding: 10, backgroundColor: borderColor + '1A', borderRadius: 8, borderLeftWidth: 2, borderLeftColor: borderColor }}>
                                                                <Text style={{ color: borderColor, fontSize: 11, fontStyle: 'italic', fontWeight: '500' }}>🧠 {opt.aiReasoning}</Text>
                                                            </View>
                                                        )}

                                                        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 15 }}>
                                                            {isMain && (
                                                                <View style={{ backgroundColor: borderColor, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 }}>
                                                                    <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 12 }}>
                                                                        {opt.actionType === 'locked' ? 'ACTUALIZAR A VIP' : travelProfile === 'premium' ? 'ABRIR PANEL DE OPCIONES' : 'EJECUTAR SEGÚN PERFIL'}
                                                                    </Text>
                                                                </View>
                                                            )}
                                                        </View>
                                                    </TouchableOpacity>
                                                );
                                            };

                                            return (
                                                <>
                                                    <View style={{ 
                                                        backgroundColor: 'rgba(212, 175, 55, 0.08)', 
                                                        padding: 18, 
                                                        borderRadius: 16, 
                                                        marginBottom: 22, 
                                                        borderWidth: 1.5, 
                                                        borderColor: '#D4AF3744',
                                                        shadowColor: '#D4AF37',
                                                        shadowOpacity: 0.1,
                                                        shadowRadius: 15
                                                    }}>
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#D4AF37', marginRight: 8 }} />
                                                            <Text style={{ color: '#D4AF37', fontSize: 10, fontWeight: '900', letterSpacing: 2 }}>ANÁLISIS DE INTELIGENCIA EN TIEMPO REAL</Text>
                                                        </View>
                                                        <Text style={{ color: '#EEE', fontSize: 13, lineHeight: 21, fontWeight: '400' }}>
                                                            {flightData?.status?.toLowerCase().includes('cancel') 
                                                              ? `He verificado la cancelación del vuelo ${flightData?.flightNumber}. `
                                                              : `Confirmados ${flightData?.departure?.delay || 0} min de retraso en tu vuelo. `
                                                            }
                                                            Basado en tu perfil de <Text style={{ color: '#D4AF37', fontWeight: '900' }}>{travelProfile === 'premium' ? 'ÉLITE VIP' : travelProfile === 'fast' ? 'TIEMPO PRIORITARIO' : 'CONTROL DE GASTOS'}</Text>, he diseñado esta estrategia maestra:
                                                        </Text>
                                                    </View>


                                                    {renderOption(bestOpt, true, 0)}

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
                                                            {otherOpts.map((opt: any, idx: number) => renderOption(opt, false, idx + 1))}
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
                                  const modeLabel = (isRápido && travelProfile === 'premium') ? 'PROTOCOL JET / VIP' : isRápido ? 'RÁPIDO' : isEco ? (travelProfile === 'premium' ? 'ELITE' : 'ECONÓMICO') : (travelProfile === 'premium' ? 'LUXURY' : 'EQUILIBRADO');
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
                            <ScrollView 
                                ref={logScrollRef}
                                style={{ flex: 1 }}
                                onContentSizeChange={() => logScrollRef.current?.scrollToEnd({ animated: true })}
                            >
                                <Text style={{ color: '#4CD964', fontSize: 13, lineHeight: 22, fontWeight: '500', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
                                    {browserLogs.join('\n')}
                                </Text>
                            </ScrollView>
                            <View style={{ marginTop: 20, alignItems: 'center' }}>
                                {(!browserLogs.some((l: string) => l.includes('✅') || l.includes('❌') || l.includes('⚠️'))) ? (
                                    <>
                                        <ActivityIndicator color="#27C93F" size="large" />
                                        <Text style={{ color: '#27C93F', marginTop: 15, fontWeight: 'bold', textAlign: 'center' }}>
                                            {isExtracting ? "IA EXTRAYENDO DOCUMENTOS DE TU CORREO..." : "ASISTENTE IA GENERANDO ESTRATEGIA VIP..."}
                                        </Text>
                                    </>
                                ) : (
                                    <View style={{ alignItems: 'center' }}>
                                        {browserLogs.some((l: string) => l.includes('❌') || l.includes('⚠️')) ? (
                                            <>
                                                <Text style={{ fontSize: 40 }}>⚠️</Text>
                                                <Text style={{ color: '#FF3B30', marginTop: 15, fontWeight: 'bold', fontSize: 16 }}>INCIDENCIA DE CONEXIÓN</Text>
                                                <Text style={{ color: '#AAA', marginTop: 5, fontSize: 12, textAlign: 'center' }}>
                                                    El servidor está tardando más de lo habitual. Puedes esperar o volver a intentarlo en unos instantes.
                                                </Text>
                                                <TouchableOpacity 
                                                    style={{ marginTop: 20, padding: 10, backgroundColor: '#333', borderRadius: 8 }}
                                                    onPress={() => { 
                                                        setShowBrowser(false); 
                                                        stopSpeak(); 
                                                        setExtraDocs((p: any) => p); // Refresh visual
                                                        // Resetear estados de carga por seguridad
                                                        if (typeof setExtraDocs === 'function') {
                                                            // Forzamos fin de carga si el usuario cierra
                                                            // Esto se maneja mejor centralizado pero aquí asegura UX
                                                        }
                                                    }}
                                                >
                                                    <Text style={{ color: '#FFF', fontWeight: 'bold' }}>CERRAR Y REINTENTAR</Text>
                                                </TouchableOpacity>
                                            </>
                                        ) : (
                                            <>
                                                <Text style={{ fontSize: 40 }}>✅</Text>
                                                <Text style={{ color: '#27C93F', marginTop: 15, fontWeight: 'bold', fontSize: 16 }}>ESTRATEGIA COMPLETADA</Text>
                                                <Text style={{ color: '#4CD964', marginTop: 5, fontSize: 13, textAlign: 'center', fontWeight: '500' }}>
                                                    {isExtracting ? 'He terminado de sincronizar tu cuenta. He localizado el documento y lo he guardado en tu Bóveda.' :
                                                     travelProfile === 'premium' ? 'Protocolo VIP ejecutado. Tu expediente legal y tus alternativas están listos. Tú decides el siguiente paso.' :
                                                        selectedPlan?.type?.includes('ECONÓMIC') ? 'Tu documentación legal está lista. Firma el expediente para enviarlo a la aerolínea.' :
                                                            'He analizado las rutas alternativas disponibles. Elige la que mejor se adapte a tu situación.'}
                                                </Text>
                                            </>
                                        )}
                                    </View>
                                )}
                                
                                {/* BOTÓN DE RESCATE SI HAY BUCLE - Solo aparece si lleva mucho tiempo y no hay errores */}
                                {!browserLogs.some((l: string) => l.includes('✅') || l.includes('❌') || l.includes('⚠️')) && (
                                    <TouchableOpacity 
                                        onPress={() => {
                                            setShowBrowser(false);
                                            // Resetear cualquier estado de carga pendiente
                                        }}
                                        style={{ marginTop: 30, opacity: 0.5 }}
                                    >
                                        <Text style={{ color: '#888', fontSize: 10, fontWeight: 'bold' }}>FINALIZAR CARGA MANUALMENTE</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                        
                        <TouchableOpacity 
                            style={{ padding: 15, backgroundColor: browserLogs.some((l: string) => l.includes('✅')) ? '#27C93F' : '#333', alignItems: 'center' }} 
                            onPress={() => {
                                setShowBrowser(false);
                                stopSpeak();

                                if (selectedPlan) {
                                    const isPremium = travelProfile === 'premium';
                                    const isVip = isPremium;
                                    const isRápido = !isPremium && (selectedPlan.type?.includes('RÁPID') || selectedPlan.type?.includes('RAPID'));
                                    const isEco = !isPremium && (selectedPlan.type?.includes('ECONÓMIC') || selectedPlan.type?.includes('BARAT'));
                                    const isHotel = selectedPlan.actionType === 'hotel' || selectedPlan.type?.includes('CONFORT');

                                    const imgRescate = isHotel ? require('../assets/reserva_hotel_pura.jpg') :
                                        isVip ? require('../assets/ticket_rapido_vip.jpg') :
                                            isRápido ? require('../assets/ticket_rapido_vip.jpg') :
                                                isEco ? require('../assets/ticket_economico.jpg') :
                                                    require('../assets/ticket_equilibrado_confort.jpg');

                                     if (selectedPlan.voiceScriptFinal) {
                                        speak(selectedPlan.voiceScriptFinal);
                                    } else {
                                        speak(
                                            isVip
                                                ? 'Protocolo Elite activado. Tu plan premium está listo en Documentos. Tienes acceso prioritario.'
                                                : isHotel
                                                    ? 'He organizado tu descanso. Tienes los vales y pasos a seguir en la sección de Documentos.'
                                                    : isEco
                                                        ? 'Todo preparado. Tu reclamación legal está lista en Documentos. Ábrela para firmar.'
                                                        : 'He terminado tu plan. Tienes toda la información en tu sección de Documentos.'
                                        );
                                    }

                                    const newTicket = {
                                        id: `rescue_${Date.now()}`,
                                        t: isVip 
                                            ? `PROTOCOLO DE RESCATE PREMIUM (VIP)`
                                            : (isHotel ? `PROPUESTA ALOJAMIENTO IA (PLAN ${isEco ? 'ECONÓMICO' : isRápido ? 'RÁPIDO' : 'EQUILIBRADO'})` : 
                                               `PROPUESTA RESCATE IA (${isEco ? 'ECONÓMICO' : isRápido ? 'RÁPIDO' : 'EQUILIBRADO'})`),
                                        s: isVip ? 'Estrategia Integral Personalizada' : (isHotel ? `Alojamiento · ${selectedPlan.title}` : `Propuesta Vuelo · ${selectedPlan.title}`),
                                        i: imgRescate,
                                        source: 'TRAVEL-PILOT IA',
                                        icon: isVip ? '💎' : (isHotel ? '🛌' : '🎟️'),
                                        verified: true,
                                        isActionable: !isHotel,
                                        rescueData: {
                                            flightNumber: flightData?.flightNumber || 'RESCUE-01',
                                            airline: flightData?.airline || 'Compañía Asignada',
                                            gate: flightData?.departure?.gate || 'TBD',
                                            boardingTime: 'Inmediato'
                                        }
                                    };
                                    setExtraDocs((prev: any) => [newTicket, ...prev]);
                                    setHasNewDoc(true);
                                    setSelectedPlan(null);
                                }
                            }}
                        >
                            <Text style={{ color: '#000', fontWeight: 'bold' }}>FINALIZAR Y VOLVER</Text>
                        </TouchableOpacity>
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
                            {viewDoc?.isConfirmed && (
                                <View style={{ backgroundColor: '#27C93F', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginTop: 12, borderWidth: 1, borderColor: '#FFF' }}>
                                    <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 10, letterSpacing: 1 }}>🛡️ CONFIRMADO POR AGENTE IA</Text>
                                </View>
                            )}
                            <TouchableOpacity style={[s.bt, { backgroundColor: '#AF52DE', marginTop: 15, borderRadius: 12 }]} onPress={() => setViewDoc(null)}>
                                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>CERRAR</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <VIPAlternatives
                visible={showVIPAlternatives}
                flightData={flightData}
                onClose={() => {
                    setShowVIPAlternatives(false);
                    setVipInitialDetail(null);
                }}
                onOpenChat={() => {
                    setShowVIPAlternatives(false);
                    setShowChat(true);
                }}
                onGoToClaims={() => {
                    setShowVIPAlternatives(false);
                    setShowCancellation(false); // Cierre final para ir a firma
                    setTab('Vault');
                    
                    // Delay para asegurar que los Modals se cierren antes de la transición
                    setTimeout(() => {
                        navigation.navigate('Vault'); // NAVEGACIÓN REAL
                    }, 300);
                    
                    setPendingVIPScroll(true);
                }}
                setExtraDocs={setExtraDocs}
                setHasNewDoc={setHasNewDoc}
                initialDetailView={vipInitialDetail}
            />

            <CancellationProtocol
                visible={showCancellation}
                flightData={flightData}
                onClose={() => setShowCancellation(false)}
                onOpenChat={() => {
                    setShowCancellation(false);
                    setShowChat(true);
                }}
                onGoToClaims={() => {
                    // Abrir el borrador en VIPAlternatives
                    setVipInitialDetail('claim');
                    setShowVIPAlternatives(true);
                }}
                onOpenVIP={(detail?: string) => {
                    setVipInitialDetail(detail || 'flight');
                    setShowVIPAlternatives(true);
                }}
                onGoToSubscription={() => {
                    setShowCancellation(false);
                    setTimeout(() => {
                        navigation.navigate('VIP');
                    }, 300);
                }}
            />

            <PrivateVaultScreen />

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
