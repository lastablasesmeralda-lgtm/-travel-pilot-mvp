import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import { useAppContext } from '../context/AppContext';
import { getEU261Amount } from '../utils/flightUtils';

interface VIPAlternativesProps {
    visible: boolean;
    onClose: () => void;
    flightData: any;
    onOpenChat: () => void;
    onGoToClaims: () => void;
    speak?: (text: string) => void;
    setExtraDocs: (fn: any) => void;
    setHasNewDoc: (val: boolean) => void;
    initialDetailView?: string | null;
}

const fmt = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

export default function VIPAlternatives({
    visible, onClose, flightData, onOpenChat, onGoToClaims, speak, setExtraDocs, setHasNewDoc, initialDetailView
}: VIPAlternativesProps) {
    const { setChatOrigin, travelProfile } = useAppContext();
    const [detailView, setDetailView] = useState<string | null>(null);

    // Sincronizar el detalle solicitado al abrir
    React.useEffect(() => {
        if (visible && initialDetailView) {
            setDetailView(initialDetailView);
        } else if (!visible) {
            setDetailView(null);
        }
    }, [visible, initialDetailView]);

    const depIata = flightData?.departure?.iata || 'MAD';
    const arrIata = flightData?.arrival?.iata || 'CDG';
    const airline = flightData?.airline || 'Iberia';
    const now = new Date();
    const altDep = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const altArr = new Date(altDep.getTime() + 2.5 * 60 * 60 * 1000);

    const handleClose = () => {
        setDetailView(null);
        onClose();
    };

    // Base de datos de teléfonos de atención al cliente (España)
    const airlinePhones: Record<string, string> = {
        'iberia': '+34901111500',
        'vueling': '+34931518158',
        'air europa': '+34912010140',
        'ryanair': '+34916978453',
        'easyjet': '+34902599900',
        'wizz air': '+34918755775',
        'lufthansa': '+34900993940',
        'air france': '+34900900370',
        'klm': '+34900100049',
        'british airways': '+34910507585',
        'turkish airlines': '+34917457960',
        'tap air portugal': '+34808205700',
        'brussels airlines': '+34900100140',
    };

    const getAirlinePhone = (airlineName: string): string => {
        if (!airlineName) return '+34901111500';
        const key = airlineName.toLowerCase();
        for (const [name, phone] of Object.entries(airlinePhones)) {
            if (key.includes(name)) return phone;
        }
        return '+34901111500'; // Iberia como fallback
    };

    const airlinePhone = getAirlinePhone(airline);
    const formattedPhone = airlinePhone.replace(/(\+34)(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4');

    // ─── FLIGHT DETAIL ───
    const renderFlightDetail = () => (
        <Modal visible={detailView === 'flight'} transparent animationType="fade">
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.97)', justifyContent: 'center', padding: 20 }}>
                <View style={{ backgroundColor: '#111', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#D4AF37' }}>
                    <View style={{ backgroundColor: 'rgba(212,175,55,0.08)', padding: 25, borderBottomWidth: 1, borderBottomColor: 'rgba(212,175,55,0.15)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View>
                            <Text style={{ color: '#D4AF37', fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 6 }}>📞 REUBICACIÓN INMEDIATA</Text>
                            <Text style={{ color: '#FFF', fontSize: 22, fontWeight: '900' }}>Llama a {airline}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setDetailView(null)} style={{ padding: 10 }}>
                            <Text style={{ color: '#D4AF37', fontSize: 16 }}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView
                        style={{ maxHeight: 480 }}
                        contentContainerStyle={{ padding: 25, paddingBottom: 50 }}
                        showsVerticalScrollIndicator={true}
                        indicatorStyle="white"
                        persistentScrollbar={true}
                    >

                        <View style={{ backgroundColor: '#0A0A0A', borderRadius: 14, padding: 16, marginBottom: 20 }}>
                            <Text style={{ color: '#999', fontSize: 11, lineHeight: 18 }}>
                                Tu derecho a reubicación en otro vuelo es inmediato según el Reglamento EU261. Llama ahora a {airline} y pide ser reubicado en el siguiente vuelo disponible hacia {arrIata}. Mientras hablas, tu asistente puede guiarte en tiempo real.
                            </Text>
                        </View>

                        <View style={{ backgroundColor: '#0A0A0A', borderRadius: 14, padding: 16, marginBottom: 20 }}>
                            {[
                                { label: 'QUÉ PEDIR', value: `Reubicación en próximo vuelo a ${arrIata}` },
                                { label: 'TU DERECHO', value: 'EU261 — Reubicación gratuita' },
                                { label: 'TELÉFONO', value: formattedPhone },
                            ].map((item, idx) => (
                                <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: idx < 2 ? 1 : 0, borderBottomColor: '#1A1A1A' }}>
                                    <Text style={{ color: '#666', fontSize: 10, fontWeight: '900', letterSpacing: 1 }}>{item.label}</Text>
                                    <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700', maxWidth: '55%', textAlign: 'right' }}>{item.value}</Text>
                                </View>
                            ))}
                        </View>

                        <TouchableOpacity
                            onPress={() => {
                                const { Linking } = require('react-native');
                                Linking.openURL(`tel:${airlinePhone}`);
                            }}
                            style={{ backgroundColor: '#D4AF37', padding: 16, borderRadius: 14, alignItems: 'center', marginBottom: 12 }}>
                            <Text style={{ color: '#000', fontWeight: '900', fontSize: 14 }}>📞 LLAMAR A {airline.toUpperCase()}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                setDetailView(null);
                                setChatOrigin('vip');
                                handleClose();
                                setTimeout(() => onOpenChat(), 400);
                            }}
                            style={{ backgroundColor: 'rgba(175,82,222,0.15)', padding: 16, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: '#AF52DE', marginBottom: 20 }}>
                            <Text style={{ color: '#AF52DE', fontWeight: '900', fontSize: 14 }}>💬 ABRIR ASISTENTE DURANTE LA LLAMADA</Text>
                        </TouchableOpacity>

                        {/* SECCIÓN TREN / TIERRA */}
                        <View style={{ marginTop: 10, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#1A1A1A' }}>
                            <Text style={{ color: '#D4AF37', fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 8 }}>🚢 OTRAS VÍAS DE TRAYECTO</Text>
                            <Text style={{ color: '#666', fontSize: 11, lineHeight: 17, marginBottom: 16 }}>
                                Si prefieres continuar tu viaje por tierra, tu asistente puede localizar la mejor combinación en Tren de Alta Velocidad o Transfer privado para llegar a {arrIata}.
                            </Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setDetailView(null);
                                    setChatOrigin('vip');
                                    handleClose();
                                    setTimeout(() => onOpenChat(), 400);
                                }}
                                style={{ backgroundColor: '#0A0A0A', padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#333' }}>
                                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 13 }}>BUSCAR TREN O TRANSFER VIP →</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>

                    <TouchableOpacity onPress={() => setDetailView(null)} style={{ padding: 18, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#1A1A1A' }}>
                        <Text style={{ color: '#FF3B30', fontSize: 13, fontWeight: 'bold' }}>VOLVER</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );


    // ─── CLAIM DRAFT DETAIL ───
    const renderClaimDraft = () => (
        <Modal visible={detailView === 'claim'} transparent animationType="fade">
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.97)', justifyContent: 'center', padding: 20 }}>
                <View style={{ backgroundColor: '#111', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#4CD964' }}>
                    <View style={{ backgroundColor: 'rgba(76,217,100,0.06)', padding: 25, borderBottomWidth: 1, borderBottomColor: 'rgba(76,217,100,0.15)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View>
                            <Text style={{ color: '#4CD964', fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 6 }}>⚖️ INFO RECOPILADA</Text>
                            <Text style={{ color: '#FFF', fontSize: 22, fontWeight: '900' }}>Reclamación EU261</Text>
                        </View>
                        <TouchableOpacity onPress={() => setDetailView(null)} style={{ padding: 10 }}>
                            <Text style={{ color: '#4CD964', fontSize: 16 }}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={{ maxHeight: 650 }} contentContainerStyle={{ padding: 25 }}>
                        <View style={{ backgroundColor: '#0A0A0A', borderRadius: 14, padding: 16, marginBottom: 20 }}>
                            {[
                                { label: 'VUELO', value: flightData?.flight?.iata || 'IB3166' },
                                { label: 'AEROLÍNEA', value: airline },
                                { label: 'RUTA', value: `${depIata} → ${arrIata}` },
                                { label: 'RETRASO', value: `${flightData?.departure?.delay || 185} min` },
                                { label: 'COMPENSACIÓN', value: getEU261Amount(flightData) },
                                { label: 'ESTADO', value: 'EU261 ELEGIBLE' },
                            ].map((item, idx) => (
                                <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: idx < 5 ? 1 : 0, borderBottomColor: '#1A1A1A' }}>
                                    <Text style={{ color: '#666', fontSize: 10, fontWeight: '900', letterSpacing: 1 }}>{item.label}</Text>
                                    <Text style={{ color: idx === 5 ? '#4CD964' : '#FFF', fontSize: 12, fontWeight: '700' }}>{item.value}</Text>
                                </View>
                            ))}
                        </View>

                        <View style={{ backgroundColor: 'rgba(76,217,100,0.06)', padding: 14, borderRadius: 12, borderWidth: 0.5, borderColor: 'rgba(76,217,100,0.2)', marginBottom: 20 }}>
                            <Text style={{ color: '#4CD964', fontSize: 11, fontWeight: '800', marginBottom: 6 }}>Informe legal preparado:</Text>
                            <Text style={{ color: '#999', fontSize: 11, lineHeight: 17 }}>
                                Estimados señores de {airline}. Tras la incidencia detectada en el vuelo {flightData?.flight?.iata || 'IB3166'} entre {depIata} y {arrIata}, con un retraso verificado de más de 3 horas, procedemos a formalizar la solicitud de compensación de acuerdo al Reglamento (CE) 261/2004. Como pasajero con derecho a asistencia, adjunto los detalles recopilados por Travel-Pilot para su inmediata tramitación.
                            </Text>
                        </View>

                        <TouchableOpacity
                            onPress={onGoToClaims}
                            style={{ backgroundColor: '#4CD964', padding: 18, borderRadius: 16, alignItems: 'center' }}>
                            <Text style={{ color: '#000', fontWeight: '900', fontSize: 15, letterSpacing: 0.5 }}>PROCEDER A LA FIRMA DIGITAL</Text>
                        </TouchableOpacity>
                    </ScrollView>

                    <TouchableOpacity onPress={travelProfile === 'standard' ? handleClose : () => setDetailView(null)} style={{ padding: 18, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#1A1A1A' }}>
                        <Text style={{ color: '#FF3B30', fontSize: 13, fontWeight: 'bold' }}>VOLVER</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    // ─── LOUNGE DETAIL ───
    const renderLoungeDetail = () => (
        <Modal visible={detailView === 'lounge'} transparent animationType="fade">
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.97)', justifyContent: 'center', padding: 20 }}>
                <View style={{ backgroundColor: '#111', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#AF52DE' }}>
                    <View style={{ backgroundColor: 'rgba(175,82,222,0.06)', padding: 25, borderBottomWidth: 1, borderBottomColor: 'rgba(175,82,222,0.15)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View>
                            <Text style={{ color: '#AF52DE', fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 6 }}>🥂 EXCLUSIVO VIP</Text>
                            <Text style={{ color: '#FFF', fontSize: 22, fontWeight: '900' }}>Salas VIP y Confort</Text>
                        </View>
                        <TouchableOpacity onPress={travelProfile === 'standard' ? handleClose : () => setDetailView(null)} style={{ padding: 10 }}>
                            <Text style={{ color: '#AF52DE', fontSize: 16 }}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView
                        style={{ maxHeight: 580 }}
                        contentContainerStyle={{ padding: 25, paddingBottom: 40 }}
                        showsVerticalScrollIndicator={true}
                        indicatorStyle="white"
                        persistentScrollbar={true}
                    >
                        <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800', marginBottom: 14 }}>Espera con la máxima comodidad</Text>
                        <Text style={{ color: '#888', fontSize: 13, lineHeight: 20, marginBottom: 20 }}>
                            Como pasajero VIP, tienes acceso a servicios exclusivos mientras esperas tu próximo vuelo. Hemos localizado las mejores opciones en {depIata}:
                        </Text>

                        {[
                            { icon: '🛋️', title: 'Acceso a Salas VIP', desc: 'Sigue las señales hacia "Sala VIP" en tu terminal. Tienes derecho a solicitar acceso prioritario por incidencia prolongada.' },
                            { icon: '🚿', title: 'Áreas de Descanso', desc: 'Zonas silenciosas con duchas y camas disponibles para esperas superiores a 4 horas.' },
                            { icon: '☕', title: 'Catering Premium', desc: 'Comida y bebida ilimitada incluida en las áreas de cortesía para socios.' },
                        ].map((item, idx) => (
                            <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, backgroundColor: '#0A0A0A', padding: 14, borderRadius: 12 }}>
                                <Text style={{ fontSize: 20, marginRight: 12, marginTop: 2 }}>{item.icon}</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '800' }}>{item.title}</Text>
                                    <Text style={{ color: '#777', fontSize: 11, marginTop: 3, lineHeight: 16 }}>{item.desc}</Text>
                                </View>
                            </View>
                        ))}

                        <TouchableOpacity
                            onPress={() => {
                                setDetailView(null);
                                setChatOrigin('vip');
                                handleClose();
                                setTimeout(() => onOpenChat(), 400);
                            }}
                            style={{ backgroundColor: 'rgba(175,82,222,0.15)', padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#AF52DE', marginTop: 10 }}>
                            <Text style={{ color: '#AF52DE', fontWeight: '900', fontSize: 13 }}>📍 PEDIR UBICACIÓN EXACTA AL ASISTENTE</Text>
                        </TouchableOpacity>
                    </ScrollView>

                    <TouchableOpacity onPress={() => setDetailView(null)} style={{ padding: 18, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#1A1A1A' }}>
                        <Text style={{ color: '#AF52DE', fontSize: 13, fontWeight: 'bold' }}>✓ CONFIRMAD</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    // ─── WAITING COVERAGE DETAIL ───
    const renderPlanB = () => (
        <Modal visible={detailView === 'planB'} transparent animationType="fade">
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.97)', justifyContent: 'center', padding: 20 }}>
                <View style={{ backgroundColor: '#111', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#5AC8FA' }}>
                    <View style={{ backgroundColor: 'rgba(90,200,250,0.06)', padding: 25, borderBottomWidth: 1, borderBottomColor: 'rgba(90,200,250,0.15)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View>
                            <Text style={{ color: '#5AC8FA', fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 6 }}>🛡️ COBERTURA TOTAL</Text>
                            <Text style={{ color: '#FFF', fontSize: 22, fontWeight: '900' }}>Derechos de asistencia</Text>
                        </View>
                        <TouchableOpacity onPress={travelProfile === 'standard' ? handleClose : () => setDetailView(null)} style={{ padding: 10 }}>
                            <Text style={{ color: '#5AC8FA', fontSize: 16 }}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={{ maxHeight: 580 }} contentContainerStyle={{ padding: 25 }} showsVerticalScrollIndicator={true} indicatorStyle="white" persistentScrollbar={true}>
                        <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800', marginBottom: 14 }}>Tus derechos mientras esperas</Text>
                        <Text style={{ color: '#888', fontSize: 13, lineHeight: 20, marginBottom: 20 }}>
                            Si prefieres esperar a que tu vuelo original opere, tus derechos siguen protegidos. La aerolínea está obligada a cubrir lo siguiente:
                        </Text>

                        {[
                            { icon: '🍽️', title: 'Comida y bebida', desc: 'Proporcionada por la aerolínea durante la espera.' },
                            { icon: '📱', title: 'Comunicaciones', desc: 'Acceso a llamadas, email o fax (2 usos mínimo).' },
                            { icon: '🏨', title: 'Hotel si es necesario', desc: 'Si la espera requiere pernocta, hotel + traslado incluido.' },
                            { icon: '💶', title: 'Compensación económica', desc: 'Tu reclamación EU261 sigue activa e independiente.' },
                        ].map((item, idx) => (
                            <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, backgroundColor: '#0A0A0A', padding: 14, borderRadius: 12 }}>
                                <Text style={{ fontSize: 20, marginRight: 12, marginTop: 2 }}>{item.icon}</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '800' }}>{item.title}</Text>
                                    <Text style={{ color: '#777', fontSize: 11, marginTop: 3, lineHeight: 16 }}>{item.desc}</Text>
                                </View>
                            </View>
                        ))}

                        <View style={{ backgroundColor: 'rgba(90,200,250,0.06)', padding: 14, borderRadius: 12, borderWidth: 0.5, borderColor: 'rgba(90,200,250,0.2)', marginBottom: 20 }}>
                            <Text style={{ color: '#999', fontSize: 11, lineHeight: 17 }}>
                                Conserva todos los tickets, facturas y comprobantes. Son necesarios para incluirlos en la reclamación y maximizar tu compensación.
                            </Text>
                        </View>

                    </ScrollView>

                    {/* Pista visual de scroll */}
                    <View style={{ alignItems: 'center', paddingVertical: 6, backgroundColor: '#111', borderTopWidth: 1, borderTopColor: '#1A1A1A' }}>
                        <Text style={{ color: '#5AC8FA', fontSize: 10, fontWeight: '700', letterSpacing: 1, opacity: 0.6 }}>↓ DESLIZA PARA VER MÁS ↓</Text>
                    </View>

                    <TouchableOpacity onPress={travelProfile === 'standard' ? handleClose : () => setDetailView(null)} style={{ padding: 18, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#1A1A1A' }}>
                        <Text style={{ color: '#5AC8FA', fontSize: 13, fontWeight: 'bold' }}>✓ CONFIRMADO</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    // ─── MAIN SCREEN ───
    return (
        <>
            <Modal visible={visible} animationType="slide">
                <View style={{ flex: 1, backgroundColor: '#050505' }}>
                    {/* HEADER */}
                    <View style={{ paddingTop: 60, paddingHorizontal: 24, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(212,175,55,0.12)' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <View style={{ flex: 1, marginRight: 15 }}>
                                <Text style={{ color: '#D4AF37', fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 8 }}>💎 TU ASISTENTE PERSONAL</Text>
                                <Text style={{ color: '#FFF', fontSize: 22, fontWeight: '900', letterSpacing: 0.3 }}>TUS OPCIONES</Text>
                                <Text style={{ color: '#777', fontSize: 12, marginTop: 10, lineHeight: 18 }}>
                                    Hemos seleccionado lo mejor para tu situación. Elige la opción que más te convenga.
                                </Text>
                            </View>
                            <TouchableOpacity onPress={handleClose} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333' }}>
                                <Text style={{ color: '#D4AF37', fontSize: 16, fontWeight: 'bold' }}>✕</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 50 }}>
                        {travelProfile === 'premium' ? (
                            <>
                                {/* ── MAIN CARD: VUELO ALTERNATIVO ── */}
                                <View style={{
                                    backgroundColor: '#0F0F0F', borderRadius: 22, padding: 24, marginBottom: 20,
                                    borderWidth: 1.5, borderColor: '#D4AF37',
                                    shadowColor: '#D4AF37', shadowOpacity: 0.12, shadowRadius: 25, shadowOffset: { width: 0, height: 6 },
                                }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
                                        <View style={{ backgroundColor: 'rgba(212,175,55,0.12)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 0.5, borderColor: 'rgba(212,175,55,0.5)' }}>
                                            <Text style={{ color: '#D4AF37', fontSize: 9, fontWeight: '900', letterSpacing: 1.5 }}>★ RECOMENDADA PARA TI</Text>
                                        </View>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                                        <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(212,175,55,0.08)', justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
                                            <Text style={{ fontSize: 26 }}>✈️</Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '900' }}>Vuelo alternativo prioritario</Text>
                                            <Text style={{ color: '#D4AF37', fontSize: 11, fontWeight: '600', marginTop: 3 }}>Prioridad asignada por el asistente</Text>
                                        </View>
                                    </View>
                                    <Text style={{ color: '#999', fontSize: 13, lineHeight: 20, marginBottom: 22 }}>
                                        Menor tiempo de espera. Opción recomendada por disponibilidad y margen de conexión.
                                    </Text>
                                    <TouchableOpacity onPress={() => setDetailView('flight')} style={{ backgroundColor: '#D4AF37', padding: 16, borderRadius: 14, alignItems: 'center' }}>
                                        <Text style={{ color: '#000', fontWeight: '900', fontSize: 14, letterSpacing: 0.5 }}>VER PROPUESTA</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* ── SEPARATOR ── */}
                                <Text style={{ color: '#444', fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 14, marginTop: 6 }}>OTRAS VÍAS DISPONIBLES</Text>

                                {/* ── CARD 2: RECLAMACIÓN PREPARADA ── */}
                                <TouchableOpacity
                                    onPress={() => setDetailView('claim')}
                                    activeOpacity={0.7}
                                    style={{ backgroundColor: '#0F0F0F', borderRadius: 18, padding: 20, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#4CD964', borderWidth: 1, borderColor: '#1A1A1A' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                                        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(76,217,100,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                            <Text style={{ fontSize: 20 }}>📋</Text>
                                        </View>
                                        <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '800', flex: 1 }}>Reclamación preparada</Text>
                                    </View>
                                    <Text style={{ color: '#888', fontSize: 12, lineHeight: 18, marginBottom: 14, marginLeft: 52 }}>
                                        Tu incidencia ya está resumida para revisión y envío.
                                    </Text>
                                    <View style={{ marginLeft: 52 }}>
                                        <View style={{ backgroundColor: 'rgba(76,217,100,0.12)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, alignSelf: 'flex-start' }}>
                                            <Text style={{ color: '#4CD964', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 }}>VER SIGUIENTES PASOS →</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>

                                {/* ── CARD 3: SALAS VIP Y CONFORT ── */}
                                <TouchableOpacity
                                    onPress={() => setDetailView('lounge')}
                                    activeOpacity={0.7}
                                    style={{ backgroundColor: '#0F0F0F', borderRadius: 18, padding: 20, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#AF52DE', borderWidth: 1, borderColor: '#1A1A1A' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                                        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(175,82,222,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                            <Text style={{ fontSize: 20 }}>🥂</Text>
                                        </View>
                                        <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '800', flex: 1 }}>Salas VIP y Confort</Text>
                                    </View>
                                    <Text style={{ color: '#888', fontSize: 12, lineHeight: 18, marginBottom: 14, marginLeft: 52 }}>
                                        Disfruta de la mejor comodidad mientras esperas tu vuelo.
                                    </Text>
                                    <View style={{ marginLeft: 52 }}>
                                        <View style={{ backgroundColor: 'rgba(175,82,222,0.12)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, alignSelf: 'flex-start' }}>
                                            <Text style={{ color: '#AF52DE', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 }}>LOCALIZAR SALA VIP →</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>

                                {/* ── CARD 4: COBERTURA Y ASISTENCIA ── */}
                                <TouchableOpacity
                                    onPress={() => setDetailView('planB')}
                                    activeOpacity={0.7}
                                    style={{ backgroundColor: '#0F0F0F', borderRadius: 18, padding: 20, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#5AC8FA', borderWidth: 1, borderColor: '#1A1A1A' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                                        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(90,200,250,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                            <Text style={{ fontSize: 20 }}>ℹ️</Text>
                                        </View>
                                        <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '800', flex: 1 }}>Asistencia y Cobertura</Text>
                                    </View>
                                    <Text style={{ color: '#888', fontSize: 12, lineHeight: 18, marginBottom: 14, marginLeft: 52 }}>
                                        Descubre tus derechos de alimentación y alojamiento garantizados por ley.
                                    </Text>
                                    <View style={{ marginLeft: 52 }}>
                                        <View style={{ backgroundColor: 'rgba(90,200,250,0.12)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, alignSelf: 'flex-start' }}>
                                            <Text style={{ color: '#5AC8FA', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 }}>VER DERECHOS →</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <View style={{ padding: 40, alignItems: 'center', marginTop: 40 }}>
                                <View style={{ padding: 25, borderRadius: 20, backgroundColor: '#0A0A0A', borderStyle: 'dotted', borderWidth: 1, borderColor: '#333' }}>
                                    <Text style={{ color: '#555', textAlign: 'center', fontSize: 13, lineHeight: 22 }}>
                                        Este canal de asistencia experta está gestionado por inteligencia humana Elite. Pulsa en la equis para regresar a tu panel general.
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Footer */}
                        <View style={{ marginTop: 20, alignItems: 'center', opacity: 0.5 }}>
                            <Text style={{ color: '#D4AF37', fontSize: 9, fontWeight: '900', letterSpacing: 1.5 }}>TRAVEL-PILOT · SERVICIO ÉLITE</Text>
                        </View>
                    </ScrollView>
                </View>
            </Modal>

            {renderFlightDetail()}
            {renderLoungeDetail()}
            {renderClaimDraft()}
            {renderPlanB()}
        </>
    );
}
