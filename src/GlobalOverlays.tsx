import React from 'react';
import { View, Text, TouchableOpacity, Animated, Modal, TextInput, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { s } from './styles';
import { useAppContext } from './context/AppContext';

export default function GlobalOverlays() {
    const {
        user, showSOSMenu, setShowSOSMenu, speak, stopSpeak, setLegalShieldActive, setCompensationEligible,
        setTab, setShowChat, showChat, isSpeaking, waveAnim, messages, isTyping, inputText, setInputText,
        handleSendMessage, scrollViewRef, viewDoc, isScanning, setViewDoc, scanAnim, selectedPlan, setSelectedPlan, showSOS, setShowSOS,
        isGenerating, loadingStep, apiPlan, setApiPlan, setPlanes, setShowBrowser, browserLogs, showBrowser
    } = useAppContext();

    if (!user) return null;

    return (
        <>
            {/* MODAL SOS — ACCIONES RÁPIDAS DE EMERGENCIA */}
            <Modal visible={showSOSMenu} transparent animationType="fade">
                <View style={[s.mf]}>
                    <SafeAreaView style={[s.mc, { width: '90%' }]}>
                        <Text style={{ color: '#FF3B30', fontSize: 22, fontWeight: '900', marginBottom: 5 }}>🚨 SOS</Text>
                        <Text style={{ color: '#666', fontSize: 11, marginBottom: 20 }}>ACCIONES RÁPIDAS DE EMERGENCIA</Text>

                        {[
                            { icon: '📞', title: 'LLAMAR AL HOTEL', sub: 'Notificar llegada tardía automáticamente', color: '#AF52DE', action: () => { setShowSOSMenu(false); Alert.alert('LLAMADA AL HOTEL', 'Travel-Pilot contactará al hotel para informar de tu llegada tardía.', [{ text: 'LLAMAR AHORA', onPress: async () => { speak('Iniciando contacto con el alojamiento para asegurar tu reserva. Por favor, espera un momento.'); try { const res = await fetch(`http://192.168.1.128:3000/api/notifyHotel`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hotelPhone: "+34600000000", passengerName: user?.email?.split('@')[0] || "Operativo", delayMinutes: apiPlan?.impact?.delayMinutes || 210 }) }); const data = await res.json(); if (res.ok) { Alert.alert('ÉXITO', 'El hotel ha sido notificado correctamente.'); } else { Alert.alert('AVISO', data.error || 'No se pudo contactar con el hotel.'); } } catch (e) { Alert.alert('ERROR', 'Fallo de conexión al llamar al hotel.'); } } }, { text: 'CANCELAR', style: 'cancel' }]); } },
                            { icon: '✈️', title: 'CONTACTAR AEROLÍNEA', sub: 'Línea directa de tu compañía aérea', color: '#007AFF', action: () => { setShowSOSMenu(false); Alert.alert('AEROLÍNEA', 'Contactando con el servicio de atención al cliente de la aerolínea...'); } },
                            { icon: '🏥', title: 'EMERGENCIA MÉDICA', sub: 'Localizar hospitales y farmacias cercanas', color: '#FF3B30', action: () => { setShowSOSMenu(false); Alert.alert('EMERGENCIA MÉDICA', 'Buscando servicios médicos cercanos a tu ubicación...'); } },
                            { icon: '🛡️', title: 'ESCUDO LEGAL EU261', sub: 'Reclamar compensación por retraso', color: '#27C93F', action: () => { setShowSOSMenu(false); setLegalShieldActive(true); setCompensationEligible(true); setTab('Vault'); speak('Protección legal activada. Estoy preparando la documentación necesaria para reclamar tu indemnización.'); } },
                            { icon: '💬', title: 'HABLAR CON LA IA', sub: 'Asistente táctico en tiempo real', color: '#AF52DE', action: () => { setShowSOSMenu(false); setShowChat(true); } },
                        ].map((item, i) => (
                            <TouchableOpacity key={i} onPress={item.action} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 14, borderRadius: 14, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: item.color, width: '100%' }}>
                                <Text style={{ fontSize: 22, marginRight: 12 }}>{item.icon}</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 13 }}>{item.title}</Text>
                                    <Text style={{ color: '#666', fontSize: 10 }}>{item.sub}</Text>
                                </View>
                                <Text style={{ color: '#444', fontSize: 16 }}>›</Text>
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity onPress={() => setShowSOSMenu(false)} style={{ marginTop: 15, paddingVertical: 10 }}>
                            <Text style={{ color: '#666', fontSize: 12 }}>CERRAR</Text>
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
                                    <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 18 }}>🧠 TERMINAL IA</Text>
                                    {isSpeaking && (
                                        <Animated.View style={{ flexDirection: 'row', marginLeft: 15, opacity: waveAnim }}>
                                            <View style={{ width: 3, height: 15, backgroundColor: '#AF52DE', borderRadius: 2, marginRight: 3 }} />
                                            <View style={{ width: 3, height: 25, backgroundColor: '#AF52DE', borderRadius: 2, marginRight: 3 }} />
                                            <View style={{ width: 3, height: 15, backgroundColor: '#AF52DE', borderRadius: 2 }} />
                                        </Animated.View>
                                    )}
                                </View>
                                <TouchableOpacity onPress={() => setShowChat(false)}><Text style={{ color: '#AF52DE', fontWeight: 'bold' }}>CERRAR</Text></TouchableOpacity>
                            </View>
                            <ScrollView ref={scrollViewRef} style={{ flex: 1, padding: 15 }} onContentSizeChange={() => scrollViewRef.current?.scrollToEnd()}>
                                {messages.map((m: any) => (
                                    <View key={m.id} style={{ alignSelf: m.isUser ? 'flex-end' : 'flex-start', backgroundColor: m.isUser ? '#AF52DE' : '#111', padding: 15, borderRadius: 15, marginBottom: 10, maxWidth: '80%', borderWidth: m.isUser ? 0 : 1, borderColor: '#222' }}>
                                        <Text style={{ color: '#FFF', fontSize: 14 }}>{m.text}</Text>
                                    </View>
                                ))}
                                {isTyping && (
                                    <View style={{ alignSelf: 'flex-start', backgroundColor: '#111', padding: 15, borderRadius: 15, marginBottom: 10, borderWidth: 1, borderColor: '#222', flexDirection: 'row' }}>
                                        <ActivityIndicator size="small" color="#AF52DE" />
                                        <Text style={{ color: '#666', fontSize: 12, marginLeft: 10, fontStyle: 'italic' }}>Analizando...</Text>
                                    </View>
                                )}
                            </ScrollView>
                            <View style={s.chatInputWrap}>
                                <TextInput style={s.chatInput} placeholder="INGRESE COMANDO A LA IA..." placeholderTextColor="#666" value={inputText} onChangeText={setInputText} />
                                <TouchableOpacity style={s.chatBtn} onPress={handleSendMessage}><Text style={{ color: '#FFF' }}>➤</Text></TouchableOpacity>
                            </View>
                        </SafeAreaView>
                    </KeyboardAvoidingView>
                </SafeAreaProvider>
            </Modal>

            {/* PLANES CONTINGENCIA (RADAR) */}
            <Modal visible={!!user && (!!selectedPlan || showSOS)} transparent animationType="fade">
                <View style={s.mf}>
                    <SafeAreaView style={s.mc}>
                        <Text style={s.mt}>ESTUDIO DE ALTERNATIVAS (IA)</Text>
                        {isGenerating ? (
                            <View style={{ marginVertical: 30, alignItems: 'center' }}>
                                <ActivityIndicator size="large" color="#AF52DE" />
                                <Text style={{ color: '#AF52DE', marginTop: 15, fontWeight: 'bold', fontSize: 12 }}>
                                    {loadingStep === 0 && "CONECTANDO CON LA INTELIGENCIA ARTIFICIAL..."}
                                    {loadingStep === 1 && "REVISANDO TU ALOJAMIENTO..."}
                                    {loadingStep === 2 && "CALCULANDO RUTAS TÁCTICAS..."}
                                    {loadingStep === 3 && "SINCRONIZANDO TUS DOCUMENTOS..."}
                                </Text>
                            </View>
                        ) : (
                            <>
                                {apiPlan?.impact && (
                                    <View style={{ backgroundColor: '#111', width: '100%', padding: 12, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: apiPlan.impact.potentialLoss > 0 ? '#FF3B30' : '#4CD964' }}>
                                        <Text style={{ color: '#FFF', fontSize: 11, fontWeight: 'bold' }}>🛡️ INFORME DE SITUACIÓN:</Text>
                                        <Text style={{ color: '#FF3B30', fontSize: 10, marginTop: 4 }}>• {apiPlan.impact.hotelAlert}</Text>
                                    </View>
                                )}
                                <Text style={{ color: '#666', fontSize: 10, textAlign: 'center', marginBottom: 10 }}>HE CALCULADO 3 RUTAS DISPONIBLES:</Text>
                                <View style={{ width: '100%', marginTop: 20 }}>
                                    {(apiPlan?.options || []).map((opt: any, idx: number) => (
                                        <TouchableOpacity
                                            key={idx}
                                            style={[s.bt, { backgroundColor: opt.type === 'RAPIDO' ? '#FF3B30' : opt.type === 'BARATO' ? '#34C759' : '#AF52DE', marginTop: idx > 0 ? 10 : 0 }]}
                                            onPress={() => {
                                                const msg = `Análisis de ruta ${opt.title}. ${opt.description}. El coste estimado es de ${opt.estimatedCost} euros.`;
                                                speak(msg);
                                                setPlanes((prev: any) => prev.map((p: any) => p.destino === 'TOKIO' ? { ...p, status: 'OK' } : p));
                                                Alert.alert("MOTOR DE PLANIFICACIÓN", msg, [
                                                    { text: "APROBAR ACCIÓN AUTÓNOMA", onPress: () => setShowBrowser(true) },
                                                    { text: "CANCELAR", style: 'cancel', onPress: () => stopSpeak() }
                                                ]);
                                                // setShowSOS(false); // In global overlay we don't have direct access if we moved state, but we mapped it in context
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
                            <View style={{ flex: 1, backgroundColor: '#333', borderRadius: 4, padding: 4 }}><Text style={{ color: '#AAA', fontSize: 10, textAlign: 'center' }}>agent-executor.internal / browser-use</Text></View>
                        </View>
                        <View style={{ flex: 1, backgroundColor: '#000', padding: 20 }}>
                            <Text style={{ color: '#27C93F', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 11 }}>{browserLogs.join('\n')}</Text>
                            <View style={{ marginTop: 40, alignItems: 'center' }}><ActivityIndicator color="#27C93F" size="large" /><Text style={{ color: '#27C93F', marginTop: 15, fontWeight: 'bold' }}>AGENTE TRABAJANDO...</Text></View>
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
                        Animated.timing(scanAnim, { toValue: 280, duration: 2000, useNativeDriver: true }),
                        Animated.timing(scanAnim, { toValue: 0, duration: 2000, useNativeDriver: true })
                    ])
                ).start();
            }}>
                <View style={s.mf}>
                    <View style={[s.mc, { backgroundColor: '#000', padding: 0, overflow: 'hidden' }]}>
                        <View style={{ width: '100%', height: 300 }}>
                            {isScanning && <Animated.View style={[s.laser, { transform: [{ translateY: scanAnim }] }]} />}
                            <Image source={{ uri: viewDoc?.i }} style={{ width: '100%', height: '100%', opacity: isScanning ? 0.3 : 1 }} />
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
