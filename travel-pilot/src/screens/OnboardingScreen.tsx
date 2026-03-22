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
        subtitle: 'Las apps normales te informan de un problema. Travel-Pilot lo resuelve por ti.\n\nEs la primera app del mundo que actúa cuando algo va mal.',
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
        subtitle: 'Mi IA gestiona alternativas, avisa a tu hotel y lanza reclamación legal de forma autónoma. Un clic y respiro.',
        accent: '#EF4444', // Rojo (Vault)
    },
    {
        id: '4',
        image: require('../../assets/onboarding4.jpg'), // Bio/Perfil
        title: 'TÚ SOLO ELIGES',
        subtitle: 'Tres modos inteligentes:\n\n🔵 OPCIÓN EQUILIBRADA — Máximo balance.\n🔴 OPCIÓN RÁPIDA — Llegar lo antes posible.\n🟢 OPCIÓN ECONÓMICA — Ahorro total.\n\nTú decides la prioridad y mi IA hace el resto.',
        accent: '#22C55E', // Verde (Bio)
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
            {/* Icono en Tarjeta 3D */}
            <View style={{
                height: '42%',
                width: '100%',
                borderRadius: 40,
                backgroundColor: 'rgba(255,255,255,0.02)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.08)',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 30,
                overflow: 'hidden'
            }}>
                <Image 
                    source={item.image} 
                    style={{ width: '85%', height: '85%' }}
                    resizeMode="contain"
                />
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
                    fontSize: 16,
                    textAlign: 'center',
                    lineHeight: 24,
                    fontWeight: '400',
                    paddingHorizontal: 10
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
