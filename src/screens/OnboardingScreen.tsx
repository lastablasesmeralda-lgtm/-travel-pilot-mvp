import React, { useRef, useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, Dimensions, FlatList, Animated, Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        icon: '🛡️',
        title: 'Esto no es una app de viajes',
        subtitle: 'Las apps normales te informan de un problema.\nTravel-Pilot lo resuelve por ti.\n\nEs la primera app del mundo que actúa\ncuando algo va mal en tu viaje.',
        accent: '#AF52DE',
        // Animation: pulsing shield
        animType: 'pulse',
    },
    {
        id: '2',
        icon: '✈️',
        title: 'Solo necesitas tu vuelo',
        subtitle: 'Ve a la pestaña VUELOS y escribe\ntu número de vuelo (ej: IB3166).\n\nA partir de ese momento, la IA vigila\ntu vuelo las 24 horas. Tú no tienes\nque hacer nada más.',
        accent: '#007AFF',
        // Animation: flying plane
        animType: 'fly',
    },
    {
        id: '3',
        icon: '🚨',
        title: '¿Retraso? Nosotros actuamos',
        subtitle: 'Si tu vuelo se retrasa, la IA:\n\n• Llama a tu hotel para avisar.\n• Busca vuelos alternativos.\n• Reclama tu compensación legal (hasta 600€).\n\nTodo automático. Sin que tú hagas nada.',
        accent: '#FF3B30',
        // Animation: alarm pulse
        animType: 'alarm',
    },
    {
        id: '4',
        icon: '⚡',
        title: 'Tú solo eliges',
        subtitle: 'Te presentaremos 3 opciones personalizadas:\n\n🔴 Rápido — Llegar cuanto antes.\n🟢 Económico — Ahorrar dinero.\n🟣 Confort — Descansar y volar mañana.\n\n📖 En PERFIL tienes la guía completa.',
        accent: '#27C93F',
        // Animation: sparkle
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
            paddingHorizontal: 40,
        }}>
            <AnimatedIcon
                icon={item.icon}
                accent={item.accent}
                animType={item.animType}
                isActive={currentIndex === index}
            />

            <Text style={{
                color: '#FFF',
                fontSize: 27,
                fontWeight: '900',
                textAlign: 'center',
                marginBottom: 20,
                letterSpacing: -0.5,
            }}>
                {item.title}
            </Text>

            <Text style={{
                color: '#B0B0B0',
                fontSize: 15,
                textAlign: 'center',
                lineHeight: 24,
            }}>
                {item.subtitle}
            </Text>
        </View>
    );

    const isLastSlide = currentIndex === SLIDES.length - 1;

    return (
        <View style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
            {/* Skip button */}
            <TouchableOpacity
                onPress={handleFinish}
                style={{
                    position: 'absolute', top: 60, right: 24, zIndex: 10,
                    paddingHorizontal: 16, paddingVertical: 8,
                }}
            >
                <Text style={{ color: '#B0B0B0', fontSize: 14, fontWeight: '600' }}>SALTAR</Text>
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
