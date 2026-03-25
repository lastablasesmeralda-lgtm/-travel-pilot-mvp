import React from 'react';
import { View, Text, TouchableOpacity, Animated, Modal, TextInput, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { s } from './styles';
import { useAppContext } from './context/AppContext';
import { BACKEND_URL } from '../config';

export default function GlobalOverlays() {
    const {
        user, showSOSMenu, setShowSOSMenu, speak, stopSpeak, setLegalShieldActive, setCompensationEligible,
        setTab, setShowChat, showChat, isSpeaking, waveAnim, messages, isTyping, inputText, setInputText,
        handleSendMessage, scrollViewRef, viewDoc, isScanning, setViewDoc, scanAnim, selectedPlan, setSelectedPlan, showSOS, setShowSOS,
        isGenerating, loadingStep, apiPlan, setApiPlan, setPlanes, setShowBrowser, browserLogs, showBrowser,
        clearMessages, availableVoices, selectedVoice, setSelectedVoice,
        isDictating, startDictation, stopDictation, userPhone,
        setSelectedRescuePlan, selectedRescuePlan
    } = useAppContext();

    const [showVoiceMenu, setShowVoiceMenu] = React.useState(false);

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
                                    Alert.alert('AVISO AL HOTEL', 'Travel-Pilot contactará al hotel para avisar de tu llegada tardía y asegurar tu habitación.', [
                                        {
                                            text: 'AVISAR AHORA', onPress: async () => {
                                                speak('Iniciando contacto con el alojamiento. Tu habitación será asegurada.');
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
                                                        Alert.alert('ÉXITO', 'El hotel ha recibido el aviso y ha confirmado tu reserva.');
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
                            { icon: '✈️', title: 'CONTACTAR AEROLÍNEA', sub: 'Línea directa de tu compañía aérea', color: '#007AFF', action: () => { setShowSOSMenu(false); speak('Conectando con el centro de atención al cliente de tu aerolínea.'); Alert.alert('AEROLÍNEA', 'Contactando con el servicio de atención al cliente...'); } },
                            { icon: '🏥', title: 'EMERGENCIA MÉDICA', sub: 'Localizar hospitales y farmacias cercanas', color: '#FF3B30', action: () => { setShowSOSMenu(false); speak('Localizando servicios médicos cercanos.'); Alert.alert('EMERGENCIA', 'Buscando servicios médicos...'); } },
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

            {/* CHAT IA */}
            <Modal visible={showChat} animationType="slide">
                <SafeAreaProvider>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
                        <SafeAreaView style={{ flex: 1 }}>
                            <View style={s.chatHead}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 19 }}>🧠 ASISTENTE IA</Text>
                                    {isSpeaking && (
                                        <Animated.View style={{ flexDirection: 'row', marginLeft: 15, opacity: waveAnim }}>
                                            <View style={{ width: 3, height: 15, backgroundColor: '#AF52DE', borderRadius: 2, marginRight: 3 }} />
                                            <View style={{ width: 3, height: 25, backgroundColor: '#AF52DE', borderRadius: 2, marginRight: 3 }} />
                                            <View style={{ width: 3, height: 15, backgroundColor: '#AF52DE', borderRadius: 2 }} />
                                        </Animated.View>
                                    )}
                                    <TouchableOpacity onPress={() => setShowVoiceMenu(!showVoiceMenu)} style={{ marginLeft: 10 }}>
                                        <Text style={{ fontSize: 18 }}>🎙️</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <TouchableOpacity 
                                        onPress={() => { clearMessages(); stopSpeak(); }} 
                                        style={{ marginRight: 20, backgroundColor: '#222', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}
                                    >
                                        <Text style={{ color: '#999', fontWeight: 'bold', fontSize: 10 }}>BORRAR</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setShowChat(false)}><Text style={{ color: '#AF52DE', fontWeight: 'bold' }}>CERRAR</Text></TouchableOpacity>
                                </View>
                            </View>

                            {showVoiceMenu && (
                                <View style={{ backgroundColor: '#111', padding: 10, borderBottomWidth: 1, borderColor: '#222' }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <Text style={{ color: '#E0E0E0', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 }}>SELECCIONAR VOZ DEL ASISTENTE</Text>
                                    </View>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        {availableVoices
                                            .slice(0, 4) // SOLO 4 VOCES: Máxima exclusividad
                                            .map((v: any, index: number) => {
                                                let label = "";
                                                let isPremium = false;

                                                if (index === 0) { label = 'Autonoe'; isPremium = true; }
                                                else if (index === 1) { label = 'Enceladus'; isPremium = true; }
                                                else if (index === 2) { label = 'Jorge'; isPremium = false; }
                                                else { label = 'Javier'; isPremium = false; }

                                                return (
                                                    <TouchableOpacity 
                                                        key={v.identifier}
                                                        onPress={() => { setSelectedVoice(v.identifier); speak('He cambiado mi configuración de voz.'); }} 
                                                        style={{ 
                                                            backgroundColor: selectedVoice === v.identifier ? '#AF52DE' : '#1A1A1A', 
                                                            paddingHorizontal: 16, 
                                                            paddingVertical: 10, 
                                                            borderRadius: 12, 
                                                            marginRight: 12,
                                                            borderWidth: 2,
                                                            borderColor: selectedVoice === v.identifier ? '#FFF' : (isPremium ? '#E0E0E0' : '#333')
                                                        }}
                                                    >
                                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                            <Text style={{ color: '#E0E0E0', fontSize: 13, fontWeight: isPremium ? 'bold' : '500' }}>{label}</Text>
                                                            {isPremium && <Text style={{ fontSize: 10, marginLeft: 8 }}>🔒</Text>}
                                                        </View>
                                                        {isPremium && <Text style={{ color: '#888', fontSize: 8, marginTop: 2, fontWeight: 'bold' }}>VERSION PREMIUM</Text>}
                                                    </TouchableOpacity>
                                                );
                                            })}
                                    </ScrollView>
                                </View>
                            )}
                            <ScrollView ref={scrollViewRef} style={{ flex: 1, padding: 15 }} onContentSizeChange={() => scrollViewRef.current?.scrollToEnd()}>
                                {messages.map((m: any) => (
                                    <View key={m.id} style={{ alignSelf: m.isUser ? 'flex-end' : 'flex-start', backgroundColor: m.isUser ? '#AF52DE' : '#111', padding: 15, borderRadius: 15, marginBottom: 10, maxWidth: '80%', borderWidth: m.isUser ? 0 : 1, borderColor: '#222' }}>
                                        <Text style={{ color: '#FFF', fontSize: 15 }}>{m.text}</Text>
                                    </View>
                                ))}
                                {isTyping && (
                                    <View style={{ alignSelf: 'flex-start', backgroundColor: '#111', padding: 15, borderRadius: 15, marginBottom: 10, borderWidth: 1, borderColor: '#222', flexDirection: 'row' }}>
                                        <ActivityIndicator size="small" color="#AF52DE" />
                                        <Text style={{ color: '#B0B0B0', fontSize: 13, marginLeft: 10, fontStyle: 'italic' }}>Analizando...</Text>
                                    </View>
                                )}
                            </ScrollView>
                            <View style={s.chatInputWrap}>
                                <TextInput style={s.chatInput} placeholder={"Escribe o pulsa 🎙️ en tu teclado para dictar"} placeholderTextColor="#666" value={inputText} onChangeText={setInputText} />
                                <TouchableOpacity style={s.chatBtn} onPress={handleSendMessage}><Text style={{ color: '#FFF' }}>➤</Text></TouchableOpacity>
                            </View>
                        </SafeAreaView>
                    </KeyboardAvoidingView>
                </SafeAreaProvider>
            </Modal>

            {/* PLANES CONTINGENCIA (RADAR) */}
            <Modal visible={!!user && showSOS} transparent animationType="fade">
                <View style={s.mf}>
                    <SafeAreaView style={s.mc}>
                        <Text style={s.mt}>OPCIONES DE VIAJE AI</Text>
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
                                        <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold' }}>✨ SUGERENCIA DEL ASISTENTE:</Text>
                                        <Text style={{ color: '#FF9500', fontSize: 11, marginTop: 4 }}>• {apiPlan.impact.hotelAlert}</Text>
                                    </View>
                                )}
                                <Text style={{ color: '#B0B0B0', fontSize: 11, textAlign: 'center', marginBottom: 10 }}>HE ENCONTRADO 3 OPCIONES:</Text>
                                <View style={{ width: '100%', marginTop: 20 }}>
                                    {(apiPlan?.options || []).map((opt: any, idx: number) => (
                                        <TouchableOpacity
                                            key={idx}
                                            style={[s.bt, { backgroundColor: opt.type === 'RAPIDO' ? '#FF9500' : opt.type === 'BARATO' ? '#34C759' : '#AF52DE', marginTop: idx > 0 ? 10 : 0 }]}
                                                onPress={() => {
                                                    const msg = `Análisis de ruta ${opt.title}. ${opt.description}. El coste estimado es de ${opt.estimatedCost} euros.`;
                                                    speak(msg);
                                                    setSelectedRescuePlan(opt.title);
                                                    setSelectedPlan(opt);
                                                    setShowSOS(false);
                                                    setShowBrowser(true);
                                                }}
                                        >
                                            <Text style={s.btx}>{opt.type}: {opt.title}</Text>
                                        </TouchableOpacity>
                                    ))}
                                    <TouchableOpacity onPress={() => { stopSpeak(); setShowSOS(false); setSelectedPlan(null); }} style={{ marginTop: 30, alignItems: 'center', paddingVertical: 10 }}><Text style={{ color: '#999' }}>CANCELAR / CERRAR</Text></TouchableOpacity>
                                </View>
                            </>
                        )}
                    </SafeAreaView>
                </View>
            </Modal >

            <Modal visible={showBrowser} transparent animationType="fade" >
                <View style={s.mf}>
                    <SafeAreaView style={[s.mc, { width: '90%', height: '80%', padding: 0, overflow: 'hidden' }]}>
                        <View style={{ backgroundColor: '#222', padding: 10, flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ flex: 1, backgroundColor: '#333', borderRadius: 4, padding: 4 }}><Text style={{ color: '#AAA', fontSize: 11, textAlign: 'center' }}>agent-executor.internal / browser-use</Text></View>
                        </View>
                        <View style={{ flex: 1, backgroundColor: '#000', padding: 20 }}>
                            <Text style={{ color: '#27C93F', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 12 }}>{browserLogs.join('\n')}</Text>
                            <View style={{ marginTop: 40, alignItems: 'center' }}><ActivityIndicator color="#27C93F" size="large" /><Text style={{ color: '#27C93F', marginTop: 15, fontWeight: 'bold' }}>REALIZANDO GESTIONES POR TI...</Text></View>
                        </View>
                        <TouchableOpacity style={{ padding: 15, backgroundColor: '#27C93F', alignItems: 'center' }} onPress={() => { setShowBrowser(false); stopSpeak(); }}><Text style={{ color: '#000', fontWeight: 'bold' }}>FINALIZAR Y VOLVER</Text></TouchableOpacity>
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
                        <View style={{ width: '100%', height: 300 }}>
                            {isScanning && <Animated.View style={[s.laser, { transform: [{ translateY: scanAnim }] }]} />}
                            <Image 
                                source={{ uri: viewDoc?.i }} 
                                resizeMode="contain"
                                style={{ width: '100%', height: '100%', opacity: isScanning ? 0.3 : 1 }} 
                            />
                        </View>
                        <View style={{ padding: 20 }}>
                            <Text style={{ color: '#FFF', textAlign: 'center' }}>{isScanning ? 'ESCANEANDO FIRMA...' : 'VERIFICACIÓN COMPLETA'}</Text>
                            <TouchableOpacity style={s.bt} onPress={() => setViewDoc(null)}>
                                <Text style={{ color: '#AF52DE' }}>CERRAR</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </>
    );
}
