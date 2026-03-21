import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const VipScreen = ({ onClose, onActivate }: { onClose: () => void, onActivate: () => void }) => {
    const fadeAnim = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, []);

    const features = [
        { icon: 'shield-checkmark', title: 'Guardián de Vuelos AI', desc: 'Monitorización 24/7 de tus rutas.' },
        { icon: 'mic', title: 'Voz Humana Gemini HD', desc: 'Siente que hablas con una persona de verdad.' },
        { icon: 'document-text', title: 'Reclamaciones Ilimitadas', desc: 'Gestión legal automática de hasta 600€.' },
        { icon: 'flash', title: 'Asistente Proactivo', desc: 'Tu IA se adelanta a los problemas antes que tú.' }
    ];

    return (
        <Animated.View style={[s.modal, { opacity: fadeAnim }]}>
            <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
            
            <View style={s.container}>
                <TouchableOpacity onPress={onClose} style={s.closeBtn}>
                    <Ionicons name="close" size={28} color="#FFF" />
                </TouchableOpacity>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                    <View style={s.header}>
                        <LinearGradient colors={['#D4AF37', '#B8860B']} style={s.diamond}>
                            <Ionicons name="diamond" size={40} color="#000" />
                        </LinearGradient>
                        <Text style={s.title}>TRAVEL PILOT VIP</Text>
                        <Text style={s.subtitle}>Desbloquea el poder total de tu asistente táctico.</Text>
                    </View>

                    <View style={s.featureList}>
                        {features.map((f, i) => (
                            <View key={i} style={s.card}>
                                <View style={s.iconBox}>
                                    <Ionicons name={f.icon as any} size={24} color="#D4AF37" />
                                </View>
                                <View style={s.cardTxt}>
                                    <Text style={s.cardTitle}>{f.title}</Text>
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
                            <Text style={s.btnTxt}>ACTIVA TU PILOTO AUTOMÁTICO</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <Text style={s.privacy}>Cancela cuando quieras. Aplican términos y condiciones.</Text>
                </ScrollView>
            </View>
        </Animated.View>
    );
};

const s = StyleSheet.create({
    modal: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 },
    container: { flex: 1, paddingTop: 60, paddingHorizontal: 25 },
    closeBtn: { alignSelf: 'flex-end', padding: 10 },
    scroll: { alignItems: 'center', paddingBottom: 50 },
    header: { alignItems: 'center', marginBottom: 30 },
    diamond: { width: 80, height: 80, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 20, transform: [{ rotate: '45deg' }] },
    title: { color: '#FFF', fontSize: 28, fontWeight: 'bold', letterSpacing: 1.5, marginTop: 15 },
    subtitle: { color: '#B0B0B0', fontSize: 13, textAlign: 'center', marginTop: 8 },
    featureList: { width: '100%', gap: 12, marginBottom: 35 },
    card: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 18, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    iconBox: { width: 45, height: 45, borderRadius: 12, backgroundColor: 'rgba(212,175,55,0.1)', justifyContent: 'center', alignItems: 'center' },
    cardTxt: { marginLeft: 15, flex: 1 },
    cardTitle: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
    cardDesc: { color: '#888', fontSize: 12, marginTop: 2 },
    priceBox: { alignItems: 'center', marginBottom: 30 },
    priceTitle: { color: '#D4AF37', fontSize: 11, fontWeight: 'bold', marginBottom: 10, letterSpacing: 2 },
    price: { color: '#FFF', fontSize: 48, fontWeight: '900' },
    currency: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginRight: 5 },
    period: { color: '#888', fontSize: 18, marginLeft: 5 },
    savedTxt: { color: '#44BB44', fontSize: 11, marginTop: 5, fontWeight: 'bold' },
    mainBtn: { width: '100%', height: 65, borderRadius: 20, overflow: 'hidden', elevation: 10, shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10 },
    gradBtn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    btnTxt: { color: '#000', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
    privacy: { color: '#555', fontSize: 10, marginTop: 20, textAlign: 'center' }
});

export default VipScreen;
