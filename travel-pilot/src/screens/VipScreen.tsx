import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const VipScreen = ({ onClose, onActivate }: { onClose: () => void, onActivate: () => void }) => {
    const fadeAnim = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    }, []);

    const features = [
        { icon: 'shield-checkmark-outline', title: 'Guardián de Vuelos AI', desc: 'Monitorización táctica 24/7.' },
        { icon: 'mic-outline', title: 'Voz Humana Gemini HD', desc: 'Comunicación fluida y natural.' },
        { icon: 'document-text-outline', title: 'Gestión de Reclamaciones', desc: 'Recupera hasta 600€ automáticamente.' },
        { icon: 'flash-outline', title: 'Asistente Proactivo', desc: 'Soluciones antes de que ocurra el problema.' }
    ];

    return (
        <Animated.View style={[s.modal, { opacity: fadeAnim }]}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }]} />
            
            <View style={s.container}>
                <TouchableOpacity onPress={onClose} style={s.closeBtn}>
                    <Ionicons name="close-outline" size={32} color="rgba(255,255,255,0.5)" />
                </TouchableOpacity>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                    <View style={s.header}>
                        <View style={s.logoRing}>
                            <Ionicons name="diamond-outline" size={32} color="#D4AF37" />
                        </View>
                        <Text style={s.title}>MODO VIP</Text>
                        <Text style={s.subtitle}>ACCESO TOTAL AL ASISTENTE TÁCTICO</Text>
                    </View>

                    <View style={s.featureList}>
                        {features.map((f, i) => (
                            <View key={i} style={s.card}>
                                <View style={s.iconBox}>
                                    <Ionicons name={f.icon as any} size={22} color="#D4AF37" />
                                </View>
                                <View style={s.cardTxt}>
                                    <Text style={s.cardTitle}>{f.title.toUpperCase()}</Text>
                                    <Text style={s.cardDesc}>{f.desc}</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    <View style={s.priceBox}>
                        <Text style={s.priceTitle}>SUSCRIPCIÓN ANUAL</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                            <Text style={s.currency}>€</Text>
                            <Text style={s.price}>39.99</Text>
                            <Text style={s.period}>/ año</Text>
                        </View>
                        <Text style={s.savedTxt}>Ahorra un 40% respecto al plan mensual.</Text>
                    </View>

                    <TouchableOpacity onPress={onActivate} style={s.mainBtn}>
                        <LinearGradient colors={['#D4AF37', '#B8860B']} start={[0, 0]} end={[1, 0]} style={s.gradBtn}>
                            <Text style={s.btnTxt}>ACTIVAR PROTECCIÓN TOTAL</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <Text style={s.privacy}>Cancelación flexible. Términos VIP aplicables.</Text>
                </ScrollView>
            </View>
        </Animated.View>
    );
};

const s = StyleSheet.create({
    modal: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 },
    container: { flex: 1, paddingTop: 60, paddingHorizontal: 30 },
    closeBtn: { alignSelf: 'flex-end', marginBottom: 10 },
    scroll: { alignItems: 'center', paddingBottom: 60 },
    header: { alignItems: 'center', marginBottom: 40 },
    logoRing: { width: 70, height: 70, borderRadius: 35, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    title: { color: '#FFF', fontSize: 24, fontWeight: '900', letterSpacing: 4 },
    subtitle: { color: '#D4AF37', fontSize: 10, fontWeight: 'bold', marginTop: 10, letterSpacing: 2 },
    featureList: { width: '100%', gap: 15, marginBottom: 40 },
    card: { flexDirection: 'row', backgroundColor: '#080808', borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 0.5, borderColor: 'rgba(212, 175, 55, 0.15)' },
    iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(212,175,55,0.05)', justifyContent: 'center', alignItems: 'center' },
    cardTxt: { marginLeft: 20, flex: 1 },
    cardTitle: { color: '#FFF', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
    cardDesc: { color: '#666', fontSize: 11, marginTop: 4, lineHeight: 15 },
    priceBox: { alignItems: 'center', marginBottom: 40 },
    priceTitle: { color: '#555', fontSize: 9, fontWeight: 'bold', marginBottom: 12, letterSpacing: 3 },
    price: { color: '#FFF', fontSize: 52, fontWeight: '900' },
    currency: { color: '#FFF', fontSize: 24, fontWeight: '900', marginRight: 8 },
    period: { color: '#555', fontSize: 14, fontWeight: '900', marginLeft: 8 },
    savedTxt: { color: '#D4AF37', fontSize: 10, marginTop: 10, fontWeight: '900', letterSpacing: 1 },
    mainBtn: { width: '100%', height: 60, borderRadius: 12, overflow: 'hidden' },
    gradBtn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    btnTxt: { color: '#000', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
    privacy: { color: '#333', fontSize: 9, marginTop: 25, textAlign: 'center' }
});

export default VipScreen;
