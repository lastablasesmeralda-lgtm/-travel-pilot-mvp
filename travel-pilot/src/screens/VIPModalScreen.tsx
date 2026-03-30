import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import { useAppContext } from '../context/AppContext';
import { s } from '../styles';

const { width } = Dimensions.get('window');

interface VIPModalScreenProps {
    onClose?: () => void;
    onActivate?: () => void;
}

export default function VIPModalScreen({ onClose, onActivate }: VIPModalScreenProps) {
    const { travelProfile, setTravelProfile } = useAppContext();

    const benefits = [
        {
            icon: '⚖️',
            title: 'Escudo Legal Automático',
            desc: 'Generamos tu reclamación EU261 de hasta 600€ al instante, sin formularios ni burocracia.',
        },
        {
            icon: '🤖',
            title: 'IA de Respuesta Inmediata',
            desc: 'Sin esperas. Tu asistente analiza tu situación y genera un plan personalizado en segundos.',
        },
        {
            icon: '✈️',
            title: 'Planes de Contingencia VIP',
            desc: 'Tres opciones claras ante cualquier imprevisto: vuelo alternativo, hotel o reembolso. Tú decides.',
        },
        {
            icon: '🔔',
            title: 'Vigilancia Proactiva 24h',
            desc: 'Te avisamos antes de que lo sepa la aerolínea. Monitoreo continuo de tu vuelo en tiempo real.',
        },
        {
            icon: '🔒',
            title: 'Bóveda de Documentos Segura',
            desc: 'Pasaportes, billetes y reservas encriptados y accesibles sin conexión desde cualquier lugar.',
        },
    ];

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 150 }}>
            {/* Header con Imagen */}
            <View style={styles.header}>
                <Image 
                    source={require('../../assets/onboarding5.png')} 
                    style={styles.headerImage}
                    resizeMode="cover"
                />
                <View style={styles.overlay}>
                    <TouchableOpacity onPress={onClose} style={{ position: 'absolute', top: 50, right: 25, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.5)', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
                        <Text style={{ color: '#FFF', fontSize: 18 }}>✕</Text>
                    </TouchableOpacity>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>ACCESO EXCLUSIVO</Text>
                    </View>
                    <Text style={styles.title}>UNIVERSO VIP</Text>
                    <Text style={styles.subtitle}>La experiencia definitiva para el viajero invencible</Text>
                </View>
            </View>

            {/* Lista de Beneficios */}
            <View style={styles.content}>
                {benefits.map((b, i) => (
                    <View key={i} style={styles.benefitCard}>
                        <View style={styles.iconContainer}>
                            <Text style={styles.icon}>{b.icon}</Text>
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.benefitTitle}>{b.title}</Text>
                            <Text style={styles.benefitDesc}>{b.desc}</Text>
                        </View>
                    </View>
                ))}
            </View>

            {/* Suscripción */}
            <View style={styles.footer}>
                <TouchableOpacity 
                    style={[styles.subscribeButton, travelProfile === 'premium' && { backgroundColor: '#222', borderColor: '#D4AF37', borderWidth: 1 }]}
                    onPress={() => {
                        if (travelProfile === 'premium') {
                            if (onClose) onClose();
                        } else {
                            setTravelProfile('premium');
                            if (onActivate) onActivate();
                        }
                    }}
                >
                    <Text style={[styles.subscribeText, travelProfile === 'premium' && { color: '#D4AF37' }]}>
                        {travelProfile === 'premium' ? 'ESTOY PROTEGIDO (ENTENDIDO)' : 'ACTIVA TU STATUS VIP — 4.99€/mes'}
                    </Text>
                </TouchableOpacity>
                <Text style={styles.legalText}>Cancela en cualquier momento. Sujeto a términos y condiciones.</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A0A',
    },
    header: {
        height: 350,
        width: '100%',
    },
    headerImage: {
        width: '100%',
        height: '100%',
        opacity: 0.6,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
        padding: 30,
        paddingBottom: 40,
    },
    badge: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(212, 175, 55, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#D4AF37',
        marginBottom: 15,
    },
    badgeText: {
        color: '#D4AF37',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 2,
    },
    title: {
        color: '#FFF',
        fontSize: 38,
        fontWeight: '900',
        letterSpacing: -1,
    },
    subtitle: {
        color: '#B0B0B0',
        fontSize: 16,
        marginTop: 8,
        lineHeight: 22,
    },
    content: {
        padding: 20,
        marginTop: 10,
    },
    benefitCard: {
        flexDirection: 'row',
        backgroundColor: '#111',
        borderRadius: 20,
        padding: 20,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#1A1A1A',
        alignItems: 'center'
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.03)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.1)'
    },
    icon: {
        fontSize: 24,
    },
    textContainer: {
        flex: 1,
    },
    benefitTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    benefitDesc: {
        color: '#888',
        fontSize: 13,
        lineHeight: 18,
    },
    footer: {
        padding: 20,
        alignItems: 'center',
    },
    subscribeButton: {
        backgroundColor: '#D4AF37',
        width: '100%',
        paddingVertical: 20,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
        elevation: 8,
    },
    subscribeText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    legalText: {
        color: '#888',
        fontSize: 10,
        marginTop: 15,
        textAlign: 'center'
    }
});
