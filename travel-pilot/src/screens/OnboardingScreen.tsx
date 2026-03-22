import React, { useRef, useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, Dimensions, FlatList, Animated, Easing, Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        image: require('../../assets/onboarding1.jpg'),
        title: 'Esto no es una app de viajes',
        subtitle: 'Las apps normales te informan de un problema. Travel-Pilot lo resuelve por ti.\n\nEs la primera app del mundo que actúa cuando algo va mal en tu viaje.',
        accent: '#9333EA', // Purple
    },
    {
        id: '2',
        image: require('../../assets/onboarding2.jpg'),
        title: 'Tú solo eliges',
        subtitle: 'Te presentaremos 3 opciones personalizadas:\n\n🔴 Rápido — Llegar cuanto antes.\n🟢 Económico — Ahorrar dinero.\n🟣 Confort — Descansar y volar mañana.',
        accent: '#22C55E', // Green
    },
    {
        id: '3',
        image: require('../../assets/onboarding3.jpg'),
        title: 'Solo necesitas tu vuelo',
        subtitle: 'Ve a la pestaña VUELOS y escribe tu número de vuelo (ej: IB3166).\n\nA partir de ese momento, la IA vigila tu vuelo las 24 horas. Tú no tienes que hacer nada más.',
        accent: '#3B82F6', // Blue
    },
    {
        id: '4',
        image: require('../../assets/onboarding4.jpg'),
        title: '¿Retraso? Nosotros actuamos',
        subtitle: 'Si tu vuelo se retrasa, la IA:\n\n• Llama a tu hotel para avisar.\n• Busca vuelos alternativos.\n• Reclama tu compensación (hasta 600€).\n\nTodo automático. Sin que tú hagas nada.',
        accent: '#EF4444', // Red
    },
];

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
            {/* Imagen que ocupa todo el espacio central (ya contiene el texto) */}
            <View style={{
                flex: 1,
                width: '100%',
                borderRadius: 30,
                overflow: 'hidden',
                marginBottom: 20,
            }}>
                <Image 
                    source={item.image} 
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="contain" // Contain para asegurar que no se corte el texto de la imagen
                />
            </View>
        </View>
    );

    const isLastSlide = currentIndex === SLIDES.length - 1;

    return (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
            {/* Top Badge */}
            <View style={{ position: 'absolute', top: 60, width: '100%', alignItems: 'center', zIndex: 10 }}>
                <View style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#D4AF37' }}>
                    <Text style={{ color: '#D4AF37', fontSize: 11, fontWeight: '900', letterSpacing: 3 }}>TRAVEL-PILOT VIP</Text>
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
