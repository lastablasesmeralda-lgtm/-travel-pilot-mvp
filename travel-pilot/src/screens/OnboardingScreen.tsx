import React, { useRef, useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, Dimensions, FlatList, Animated, Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        icon: '💎',
        title: 'Tu Escudo de Viaje',
        subtitle: 'Toda la inteligencia de tu trayecto en un solo vistazo. Controla el clima y el estado de tus vuelos con precisión militar.\n\nEs tu centro de mando personalizado para una experiencia VIP sin sobresaltos.',
        accent: '#D4AF37',
        animType: 'pulse',
    },
    {
        id: '2',
        icon: '✈️',
        title: 'Radar de Vuelos OORO',
        subtitle: 'Monitorea cualquier vuelo en tiempo real. Observa cómo nuestra IA vigila cada minuto de tu trayecto con registros de actividad.\n\nPrecisión absoluta para que siempre sepas qué está haciendo tu asistente por ti.',
        accent: '#D4AF37',
        animType: 'fly',
    },
    {
        id: '3',
        icon: '🛡️',
        title: 'Bóveda de Seguridad',
        subtitle: 'Tus pasaportes y billetes, protegidos con encriptación de alta seguridad. Generamos tus reclamaciones legales de forma automática.\n\nProtección total y gestión de compensaciones de hasta 600€ en la palma de tu mano.',
        accent: '#D4AF37',
        animType: 'alarm',
    },
    {
        id: '4',
        icon: '👑',
        title: 'Perfil VIP Elite',
        subtitle: 'Tú tienes el mando. Configura cómo quieres que la IA responda ante imprevistos: modo VIP, Económico o Confort.\n\nPersonaliza tu identidad digital y deja que Travel-Pilot se adapte a tu estilo de vida único.',
        accent: '#D4AF37',
        animType: 'sparkle',
    },
];

// Animated icon component
function AnimatedIcon({ icon, accent, animType, isActive }: {
    icon: string; accent: string; animType: string; isActive: boolean;
}) {
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const flyAnim = useRef(new Animated.Value(0)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const glowAnim = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        if (!isActive) return;

        if (animType === 'pulse') {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.15, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                ])
            ).start();
        }

        if (animType === 'fly') {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(flyAnim, { toValue: -12, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                    Animated.timing(flyAnim, { toValue: 12, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                ])
            ).start();
        }

        if (animType === 'alarm') {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(rotateAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
                    Animated.timing(rotateAnim, { toValue: -1, duration: 100, useNativeDriver: true }),
                    Animated.timing(rotateAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
                    Animated.timing(rotateAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
                    Animated.delay(2000),
                ])
            ).start();
        }

        if (animType === 'sparkle') {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.2, duration: 600, easing: Easing.elastic(2), useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                    Animated.delay(1000),
                ])
            ).start();
        }

        // Glow animation for all
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, { toValue: 0.6, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
                Animated.timing(glowAnim, { toValue: 0.3, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
            ])
        ).start();

    }, [isActive, animType]);

    const spin = rotateAnim.interpolate({
        inputRange: [-1, 1],
        outputRange: ['-8deg', '8deg'],
    });

    const bgColor = glowAnim.interpolate({
        inputRange: [0.3, 0.6],
        outputRange: [`${accent}15`, `${accent}30`],
    });

    return (
        <Animated.View style={{
            width: 130, height: 130, borderRadius: 65,
            backgroundColor: bgColor,
            justifyContent: 'center', alignItems: 'center',
            marginBottom: 40,
            borderWidth: 1,
            borderColor: `${accent}40`,
        }}>
            {/* Orbital ring */}
            <View style={{
                position: 'absolute',
                width: 150, height: 150, borderRadius: 75,
                borderWidth: 1, borderColor: `${accent}15`,
            }} />
            <View style={{
                position: 'absolute',
                width: 170, height: 170, borderRadius: 85,
                borderWidth: 1, borderColor: `${accent}08`,
            }} />

            <Animated.Text style={{
                fontSize: 57,
                transform: [
                    { scale: pulseAnim },
                    { translateY: animType === 'fly' ? flyAnim : 0 },
                    { rotate: animType === 'alarm' ? spin : '0deg' },
                ],
            }}>
                {icon}
            </Animated.Text>
        </Animated.View>
    );
}

interface OnboardingScreenProps {
    onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const scrollX = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(1)).current;

    const handleNext = () => {
        if (currentIndex < SLIDES.length - 1) {
            // Fade out, scroll, fade in
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
            paddingHorizontal: 30,
        }}>
            {/* BACK GLOW BLOBS */}
            <View style={{ position: 'absolute', top: '15%', width: 300, height: 300, borderRadius: 150, backgroundColor: item.accent, opacity: 0.1, filter: 'blur(100px)' as any }} />
            <View style={{ position: 'absolute', bottom: '20%', right: -50, width: 250, height: 250, borderRadius: 125, backgroundColor: item.accent, opacity: 0.05, filter: 'blur(80px)' as any }} />

            <AnimatedIcon
                icon={item.icon}
                accent={item.accent}
                animType={item.animType}
                isActive={currentIndex === index}
            />

            <View style={{
                width: '100%',
                backgroundColor: 'rgba(255,255,255,0.03)',
                padding: 30,
                borderRadius: 32,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.07)',
                alignItems: 'center'
            }}>
                <Text style={{
                    color: '#FFF',
                    fontSize: 32,
                    fontWeight: '900',
                    textAlign: 'center',
                    marginBottom: 16,
                    letterSpacing: -1,
                }}>
                    {item.title}
                </Text>

                <Text style={{
                    color: '#B0B0B0',
                    fontSize: 16,
                    textAlign: 'center',
                    lineHeight: 26,
                    fontWeight: '400'
                }}>
                    {item.subtitle}
                </Text>
            </View>
        </View>
    );

    const isLastSlide = currentIndex === SLIDES.length - 1;

    return (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
            {/* Top Badge */}
            <View style={{ position: 'absolute', top: 60, width: '100%', alignItems: 'center', zIndex: 10 }}>
                <View style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#D4AF37' }}>
                    <Text style={{ color: '#D4AF37', fontSize: 11, fontWeight: '900', letterSpacing: 4 }}>TRAVEL-PILOT VIP</Text>
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
