import React, { useRef, useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, Dimensions, FlatList, Animated, Easing, Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        image: require('../../assets/onboarding1.jpg'), // Intel/Inicio
        title: 'ESTO NO ES UNA APP DE VIAJES',
        subtitle: 'Las apps normales te informan de un problema. Travel-Pilot te da las herramientas para resolverlo en segundos.\n\nEs la primera app del mundo que detecta y gestiona lo que falla en tu viaje.',
        accent: '#9333EA', // Púrpura (Intel)
    },
    {
        id: '2',
        image: require('../../assets/onboarding2.jpg'), // Radar/Vuelos
        title: 'SOLO NECESITAS TU VUELO',
        subtitle: 'Introduce el número de vuelo (ej: IB3166).\n\nA partir de ese momento, mi IA estará atenta 24h a cada detalle. Tú olvídate de todo.',
        accent: '#3B82F6', // Azul (Radar)
    },
    {
        id: '3',
        image: require('../../assets/onboarding3.jpg'), // Vault/Docs
        title: '¿RETRASO? NOSOTROS ACTUAMOS',
        subtitle: 'Si tu vuelo se retrasa, la IA:\n• Coordina con tu hotel para proteger tu reserva.\n• Encuentra tus mejores alternativas.\n• Prepara tu reclamación de hasta 600€.\nTodo listo. Tú decides en segundos.',
        accent: '#EF4444', // Rojo (Vault)
    },
    {
        id: '4',
        image: require('../../assets/onboarding4.jpg'), // Bio/Perfil
        title: 'EL ESQUEMA DE RESCATE',
        subtitle: 'Mi IA detectará cualquier incidencia y actuará basándose en tu prioridad predefinida:\n\n💎 PRIORIDAD CONFORT — Reubicación de élite y acceso a salas VIP.\n💰 PRIORIDAD REEMBOLSO — Máxima indemnización económica por ley.\n\nTodo gestionado. Tú solo decides.',
        accent: '#D4AF37', // Dorado de status
    },
    {
        id: '5',
        image: require('../../assets/onboarding5.jpg'), // VIP
        title: 'UNIVERSO VIP EXCLUSIVE',
        subtitle: 'Cuando tu vuelo falla, la IA actúa por ti.\n\n• Reclamaciones EU261 automáticas hasta 600€.\n• Planes de contingencia personalizados a tu perfil.\n• Asistente IA proactivo: te avisamos antes de que lo sepa la aerolínea.\n• Voz premium y acceso anticipado a nuevas funciones.\n\nTodo gestionado. Tú solo decides.',
        accent: '#D4AF37', // Dorado (VIP)
    },
    {
        id: '6',
        image: require('../../assets/onboarding5.jpg'), // Placeholder
        title: 'GUÍA DE INICIO RÁPIDO',
        subtitle: '1️⃣ PERFIL 👤\nElige tu Nivel. (VIP: La IA avisa automáticamente al hotel, redacta reclamaciones y asiste tus reubicaciones).\n\n2️⃣ DOCS 🔐\nPulsa "ACTUALIZAR CON MIS CORREOS" para importar reservas y billetes.\n\n3️⃣ ESCENARIOS AVANZADOS 🚀\n¿Quieres ver el potencial total? Prueba estos códigos en el Radar:\n• DESVIO-VLC (Cambio de ruta)\n• JET-PRIVADO (Falla total / Emirates)\n• RETRASO-60 (Incidencia menor)\n• VUELO-HISTORIAL (Control post-vuelo)',
        accent: '#10B981', // Verde Esmeralda
    },
];

interface OnboardingScreenProps {
    onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isDisclaimerAccepted, setIsDisclaimerAccepted] = useState<boolean | null>(null);
    const flatListRef = useRef<FlatList>(null);
    const scrollX = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const checkDisclaimer = async () => {
            try {
                const accepted = await AsyncStorage.getItem('disclaimerOnboardingAccepted');
                setIsDisclaimerAccepted(accepted === 'true');
            } catch (e) {
                setIsDisclaimerAccepted(false);
            }
        };
        checkDisclaimer();
    }, []);

    const handleAcceptDisclaimer = async () => {
        try {
            await AsyncStorage.setItem('disclaimerOnboardingAccepted', 'true');
            setIsDisclaimerAccepted(true);
        } catch (e) {
            setIsDisclaimerAccepted(true); // Fallback suave
        }
    };

    const handleNext = () => {
        if (currentIndex < SLIDES.length - 1) {
            Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
                flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
                setCurrentIndex(currentIndex + 1);
                Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
            });
        } else {
            handleFinish();
        }
    };

    const handleFinish = async () => {
        await AsyncStorage.setItem('hasSeenOnboarding', 'true');
        onComplete();
    };

    const renderSlide = ({ item, index }: { item: typeof SLIDES[0]; index: number }) => (
        <View style={{
            width,
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 25,
        }}>
            {/* Icono en Tarjeta 3D */}
            <View style={{
                height: item.id === '6' ? '18%' : '42%',
                width: '100%',
                borderRadius: 40,
                backgroundColor: 'rgba(255,255,255,0.02)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.08)',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: item.id === '6' ? 15 : 30,
                overflow: 'hidden'
            }}>
                {item.id === '6' ? (
                    <Text style={{ fontSize: 75 }}>🚀</Text>
                ) : (
                    <Image
                        source={item.image}
                        style={{ width: '85%', height: '85%' }}
                        resizeMode="contain"
                    />
                )}
            </View>

            {/* Texto Dinámico Premium */}
            <View style={{ width: '100%', alignItems: 'center', paddingHorizontal: 10 }}>
                <Text style={{
                    color: '#FFF',
                    fontSize: 28,
                    fontWeight: '900',
                    textAlign: 'center',
                    marginBottom: 15,
                    letterSpacing: -0.5
                }}>
                    {item.title}
                </Text>

                <Text style={{
                    color: '#B0B0B0',
                    fontSize: item.id === '6' ? 14 : 16,
                    textAlign: 'left',
                    lineHeight: item.id === '6' ? 22 : 24,
                    fontWeight: '400',
                    paddingHorizontal: item.id === '6' ? 5 : 10
                }}>
                    {item.subtitle}
                </Text>
            </View>
        </View>
    );

    if (isDisclaimerAccepted === null) return null;

    if (!isDisclaimerAccepted) {
        return (
            <View style={{ flex: 1, backgroundColor: '#000', paddingHorizontal: 25, justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ width: '100%', alignItems: 'center' }}>
                    {/* Icono Disclaimer */}
                    <View style={{
                        height: 200,
                        width: '100%',
                        borderRadius: 40,
                        backgroundColor: 'rgba(255,255,255,0.02)',
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.08)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 30,
                    }}>
                        <Text style={{ fontSize: 80 }}>🛡️</Text>
                    </View>

                    <Text style={{
                        color: '#FFF',
                        fontSize: 32,
                        fontWeight: '900',
                        textAlign: 'center',
                        marginBottom: 15,
                        letterSpacing: -1
                    }}>
                        Antes de empezar
                    </Text>

                    <Text style={{
                        color: '#B0B0B0',
                        fontSize: 16,
                        textAlign: 'center',
                        lineHeight: 24,
                        marginBottom: 40,
                        paddingHorizontal: 15
                    }}>
                        Travel-Pilot usa inteligencia artificial para informarte y guiarte en tiempo real.{"\n\n"}
                        Las gestiones automáticas como avisar al hotel o preparar reclamaciones siempre requieren tu confirmación final.{"\n\n"}
                        Nunca actuamos sin que lo sepas. Tú siempre tienes el control.
                    </Text>

                    <TouchableOpacity
                        onPress={handleAcceptDisclaimer}
                        style={{
                            backgroundColor: '#9333EA',
                            width: '100%',
                            paddingVertical: 20,
                            borderRadius: 16,
                            alignItems: 'center',
                            shadowColor: '#9333EA',
                            shadowOpacity: 0.4,
                            shadowRadius: 15,
                            elevation: 10
                        }}
                    >
                        <Text style={{ color: '#FFF', fontSize: 17, fontWeight: '900', letterSpacing: 1 }}>ENTENDIDO</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const isLastSlide = currentIndex === SLIDES.length - 1;

    return (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
            {/* Top Badge */}
            <View style={{ position: 'absolute', top: 60, width: '100%', alignItems: 'center', zIndex: 10 }}>
                <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#444' }}>
                    <Text style={{ color: '#AAA', fontSize: 11, fontWeight: '900', letterSpacing: 3 }}>TRAVEL-PILOT AI</Text>
                </View>
            </View>

            {/* Skip button */}
            <TouchableOpacity
                onPress={handleFinish}
                style={{
                    position: 'absolute', top: 55, right: 10, zIndex: 20,
                    paddingHorizontal: 16, paddingVertical: 8,
                }}
            >
                <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 'bold' }}>SALTAR</Text>
            </TouchableOpacity>

            {/* Slides */}
            <FlatList
                ref={flatListRef}
                data={SLIDES}
                renderItem={renderSlide}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                bounces={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false }
                )}
                onMomentumScrollEnd={(e) => {
                    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
                    setCurrentIndex(idx);
                }}
            />

            {/* Bottom section */}
            <View style={{
                paddingHorizontal: 40,
                paddingBottom: 60,
                alignItems: 'center',
            }}>
                {/* Animated Dots */}
                <View style={{ flexDirection: 'row', marginBottom: 30 }}>
                    {SLIDES.map((_, i) => (
                        <View
                            key={i}
                            style={{
                                width: currentIndex === i ? 28 : 8,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: currentIndex === i ? SLIDES[currentIndex].accent : '#222',
                                marginHorizontal: 4,
                                // Shadow glow for active dot
                                ...(currentIndex === i ? {
                                    shadowColor: SLIDES[currentIndex].accent,
                                    shadowOffset: { width: 0, height: 0 },
                                    shadowOpacity: 0.6,
                                    shadowRadius: 8,
                                    elevation: 8,
                                } : {}),
                            }}
                        />
                    ))}
                </View>

                {/* Beta Badge */}
                {isLastSlide && (
                    <Text style={{
                        color: '#888',
                        fontSize: 11,
                        marginBottom: 15,
                        textAlign: 'center',
                        fontWeight: '500',
                        letterSpacing: 0.5
                    }}>
                        Fase beta gratuita. Sin tarjeta requerida.
                    </Text>
                )}

                {/* Button */}
                <TouchableOpacity
                    onPress={handleNext}
                    activeOpacity={0.8}
                    style={{
                        backgroundColor: SLIDES[currentIndex].accent,
                        width: '100%',
                        paddingVertical: 18,
                        borderRadius: 16,
                        alignItems: 'center',
                        // Button glow
                        shadowColor: SLIDES[currentIndex].accent,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.4,
                        shadowRadius: 12,
                        elevation: 8,
                    }}
                >
                    <Text style={{
                        color: '#FFF',
                        fontSize: 17,
                        fontWeight: '900',
                        letterSpacing: 0.5,
                    }}>
                        {isLastSlide ? 'COMENZAR' : 'SIGUIENTE'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
