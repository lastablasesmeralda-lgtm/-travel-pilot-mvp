import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, ScrollView, Platform, ActivityIndicator, TextInput, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';
import { s } from '../styles';

export default function ChatView() {
    const {
        showChat, setShowChat, isSpeaking, waveAnim, messages, isTyping, inputText, setInputText,
        handleSendMessage, scrollViewRef, clearMessages, stopSpeak, availableVoices,
        selectedVoice, setSelectedVoice, speak
    } = useAppContext();

    const [showVoiceMenu, setShowVoiceMenu] = React.useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    // Escuchar eventos reales del teclado
    useEffect(() => {
        const showSub = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            (e) => {
                setKeyboardHeight(e.endCoordinates.height);
                setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 100);
            }
        );
        const hideSub = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setKeyboardHeight(0)
        );
        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    if (!showChat) return null;

    return (
        <View style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
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
                        <TouchableOpacity onPress={() => setShowChat(false)}>
                            <Text style={{ color: '#AF52DE', fontWeight: 'bold' }}>CERRAR</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {showVoiceMenu && (
                    <View style={{ backgroundColor: '#111', padding: 10, borderBottomWidth: 1, borderColor: '#222' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <Text style={{ color: '#E0E0E0', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 }}>SELECCIONAR VOZ DEL ASISTENTE</Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {availableVoices
                                .slice(0, 4)
                                .map((v: any, index: number) => {
                                    const label = v.humanName || `Asistente ${index + 1}`;
                                    const isPremium = v.isPremium || false;

                                    return (
                                        <TouchableOpacity 
                                            key={v.uniqueId || v.identifier}
                                            onPress={() => { setSelectedVoice(v.identifier); speak('He cambiado mi configuración de voz.', v.identifier); }} 
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

                <ScrollView 
                    ref={scrollViewRef} 
                    style={{ flex: 1, padding: 15 }} 
                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd()}
                    keyboardShouldPersistTaps="handled"
                >
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

                <View style={{ paddingHorizontal: 20, paddingBottom: 6 }}>
                    <Text style={{ fontSize: 10, color: '#888', textAlign: 'center', fontWeight: '500' }}>
                         ⓘ El asistente puede cometer errores.{"\n"}Verifica siempre las decisiones importantes.
                    </Text>
                </View>

                <View style={[s.chatInputWrap, { marginBottom: keyboardHeight > 0 ? keyboardHeight - (Platform.OS === 'ios' ? 34 : 0) : 20 }]}>
                    <TextInput 
                        style={s.chatInput} 
                        placeholder={"Escribe o pulsa 🎙️ en tu teclado para dictar"} 
                        placeholderTextColor="#666" 
                        value={inputText} 
                        onChangeText={setInputText}
                        onFocus={() => setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 350)}
                    />
                    <TouchableOpacity style={s.chatBtn} onPress={handleSendMessage}>
                        <Text style={{ color: '#FFF' }}>➤</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}
