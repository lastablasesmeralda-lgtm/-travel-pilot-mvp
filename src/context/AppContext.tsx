import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Alert, Animated, Keyboard } from 'react-native';
import * as Speech from 'expo-speech';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../firebaseConfig';
import { BACKEND_URL } from '../../config';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

// Eliminamos el handler global que puede causar crash en Expo Go Android SDK 53+

type AppContextType = any; // Lo dejamos genérico de momento para agilizar

export const AppContext = createContext<AppContextType>(null);

export const AppProvider = ({ children }) => {
    // AUTH / USUARIO
    const [user, setUser] = useState<any>(null);
    const [authEmail, setAuthEmail] = useState('');
    const [authPassword, setAuthPassword] = useState('');
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const [authLoading, setAuthLoading] = useState(false);

    // ESTADOS PRINCIPALES APP
    const [tab, setTab] = useState('intel');
    const [ticks, setTicks] = useState(0);
    const [showSOS, setShowSOS] = useState(false);
    const [showSOSMenu, setShowSOSMenu] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [viewDoc, setViewDoc] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const scanAnim = useRef(new Animated.Value(0)).current;
    const sosPulse = useRef(new Animated.Value(1)).current;
    const scrollViewRef = useRef<any>(null);

    // NUEVOS ESTADOS AÑADIDOS
    const [showChat, setShowChat] = useState(false);
    const [showBrowser, setShowBrowser] = useState(false);
    const [browserLogs, setBrowserLogs] = useState([]);
    const [legalShieldActive, setLegalShieldActive] = useState(false);
    const [claims, setClaims] = useState([
        { id: 'C1', aerolinea: 'British Airways', estado: 'GENERANDO EXPEDIENTE', compensacion: '600€' }
    ]);
    const [inputText, setInputText] = useState('');
    const [messages, setMessages] = useState([
        { id: '1', text: 'TRAVEL-PILOT AI CONNECTED. ¿En qué te puedo ayudar, operativo?', isUser: false }
    ]);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const waveAnim = useRef(new Animated.Value(0)).current;
    const [compensationEligible, setCompensationEligible] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [apiPlan, setApiPlan] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [expoPushToken, setExpoPushToken] = useState('');
    const [availableVoices, setAvailableVoices] = useState([]);
    const [selectedVoice, setSelectedVoice] = useState(null);
    const [loadingStep, setLoadingStep] = useState(0);
    const [prefetchedData, setPrefetchedData] = useState(null);
    const [isPrefetching, setIsPrefetching] = useState(false);
    const [flightInput, setFlightInput] = useState('');
    const [flightData, setFlightData] = useState<any>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [agentLogs, setAgentLogs] = useState<any[]>([]);
    const [myFlights, setMyFlights] = useState<any[]>([]);
    const [myTrips, setMyTrips] = useState<any[]>([]);
    const [weather, setWeather] = useState({ temp: '22', condition: 'Cargando...', icon: '🌤️', city: 'Tu Destino' });

    // ESTADO DE PLANES Y CRISIS RECUPERADO
    const [planes, setPlanes] = useState([
        { id: '1', destino: 'PARÍS', status: 'OK', hora: 0, img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=500', co: '48.85 N, 2.35 E' },
        { id: '2', destino: 'TOKIO', status: 'CRITICAL', hora: 8, img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=500', co: '35.67 N, 139.65 E' }
    ]);

    // EFECTOS INICIALES
    useEffect(() => {
        const timer = setInterval(() => setTicks(t => t + 1), 100);
        Animated.loop(
            Animated.sequence([
                Animated.timing(sosPulse, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
                Animated.timing(sosPulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
            ])
        ).start();

        (async () => {
            const voices = await Speech.getAvailableVoicesAsync();
            const spanishVoices = voices.filter(v => v.language.startsWith('es'));
            setAvailableVoices(spanishVoices);
            if (spanishVoices.length > 0) {
                const premium = spanishVoices.find(v => v.name.toLowerCase().includes('premium') || v.name.toLowerCase().includes('enhanced'));
                setSelectedVoice(premium ? premium.identifier : spanishVoices[0].identifier);
            }
        })();
        // Configurar notificaciones solo si NO es Expo Go en Android
        if (Constants.appOwnership !== 'expo') {
            Notifications.setNotificationHandler({
                handleNotification: async () => ({
                    shouldShowAlert: true,
                    shouldPlaySound: true,
                    shouldSetBadge: false,
                    shouldShowBanner: true,
                    shouldShowList: true,
                }),
            });
        }

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const sub = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser?.email) {
                loadMyFlights(firebaseUser.email);
                loadMyTrips(firebaseUser.email);
                registerForPushNotificationsAsync(firebaseUser.email);
            }
        });
        return () => sub();
    }, []);

    const registerForPushNotificationsAsync = async (email: string) => {
        if (!Device.isDevice) return;
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') return;

        try {
            const token = (await Notifications.getExpoPushTokenAsync({
                projectId: Constants.expoConfig?.extra?.eas?.projectId || 'd63abcdb-7fed-46b7-8d1f-5d7a72d98550',
            })).data;
            setExpoPushToken(token);

            // Registrar en el backend
            await fetch(`${BACKEND_URL}/api/registerPushToken`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    token,
                    deviceName: `${Device.brand} ${Device.modelName}`
                })
            });
        } catch (e) {
            console.error("Error obteniendo push token:", e);
        }
    };

    useEffect(() => {
        if (!user) return;
        if (planes.some((p: any) => p.status === 'CRITICAL')) setCompensationEligible(true);
        if (tab === 'radar') {
            prefetchPlan();
        }
    }, [user, planes, tab]);

    // FUNCIONES DE RED LOCAL Y AUTH
    const handleRegister = async () => {
        if (!authEmail || !authPassword) return Alert.alert('Registro', 'Introduce email y contraseña.');
        try { setAuthLoading(true); await createUserWithEmailAndPassword(auth, authEmail, authPassword); Alert.alert('Registro', 'Éxito.'); }
        catch (e: any) { Alert.alert('Error', e.message); } finally { setAuthLoading(false); }
    };

    const handleLogin = async () => {
        if (!authEmail || !authPassword) return Alert.alert('Login', 'Introduce email y contraseña.');
        try { setAuthLoading(true); await signInWithEmailAndPassword(auth, authEmail, authPassword); }
        catch (e: any) { Alert.alert('Error', e.message); } finally { setAuthLoading(false); }
    };

    const handleLogout = async () => { await signOut(auth); };

    const speak = (text) => {
        setIsSpeaking(true);
        Animated.loop(
            Animated.sequence([
                Animated.timing(waveAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
                Animated.timing(waveAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
            ])
        ).start();
        Speech.speak(text, { language: 'es-ES', voice: selectedVoice, onDone: () => stopSpeak() });
    };

    const stopSpeak = () => { Speech.stop(); setIsSpeaking(false); waveAnim.stopAnimation(); };

    const formatTime = (iso: string | null) => {
        if (!iso) return '--:--';
        try { const d = new Date(iso); return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0'); } catch { return '--:--'; }
    };

    const getStatusColor = (status: string) => {
        if (status === 'active' || status === 'scheduled') return '#4CD964';
        if (status === 'landed') return '#4CD964';
        if (status === 'cancelled') return '#FF3B30';
        return '#FF9500';
    };

    const getStatusLabel = (status: string, delay: number) => {
        if (delay > 0) return `RETRASADO +${delay} MIN`;
        if (status === 'active') return 'EN VUELO';
        if (status === 'scheduled') return 'PROGRAMADO';
        return status?.toUpperCase() || 'DESCONOCIDO';
    };

    const prefetchPlan = async () => {
        if (prefetchedData || isPrefetching) return;
        setIsPrefetching(true);
        try {
            const response = await fetch(`${BACKEND_URL}/api/monitorFlight`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ flightId: flightInput.trim() || 'TP404' }) });
            const data = await response.json();
            if (data.contingencyPlan) setPrefetchedData(data.contingencyPlan);
        } catch (e) { } finally { setIsPrefetching(false); }
    };

    const searchFlight = async () => {
        const code = flightInput.trim();
        if (!code) return;
        setIsSearching(true); setSearchError(null); setFlightData(null); setPrefetchedData(null);
        try {
            const response = await fetch(`${BACKEND_URL}/api/flightInfo?flight=${code}`);
            if (!response.ok) {
                const err = await response.json();
                setSearchError(err.error || 'Vuelo no encontrado');
                return;
            }
            setFlightData(await response.json());
            prefetchPlan();
        } catch (e) {
            setSearchError('Error de conexión con el servidor. Revisa el túnel ngrok.');
            console.error(e);
        } finally { setIsSearching(false); }
    };

    const showPlan = () => {
        if (prefetchedData) { setApiPlan(prefetchedData); setShowSOS(true); }
        else { fetchContingencyPlan(); }
    };

    const fetchContingencyPlan = async () => {
        setIsGenerating(true); setApiPlan(null); setShowSOS(true); setLoadingStep(0);
        let intv = setInterval(() => setLoadingStep(p => (p + 1) % 4), 800);
        try {
            const response = await fetch(`${BACKEND_URL}/api/monitorFlight`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ flightId: flightInput.trim() || 'TP404' })
            });
            const data = await response.json();
            if (data.contingencyPlan) {
                setApiPlan(data.contingencyPlan);
                setPrefetchedData(data.contingencyPlan);
            } else {
                throw new Error("No hay plan en la respuesta");
            }
        } catch (e) {
            console.error("Error IA:", e);
            setApiPlan({
                options: [
                    { type: 'RÁPIDO', title: 'Ruta Táctica Prioritaria', description: 'Vuelo directo de sustitución gestionado bajo protocolo de urgencia.', estimatedCost: 850 },
                    { type: 'ECONÓMICO', title: 'Optimización de Reembolso', description: 'Gestión legal EU261 activa combinada con conexión de bajo coste.', estimatedCost: 150 },
                    { type: 'CONFORT', title: 'Protocolo de Descanso Élite', description: 'Noche en hotel seleccionado y salida programada para mañana.', estimatedCost: 300 }
                ],
                impact: { hotelAlert: "He asegurado tu reserva de alojamiento. Sin riesgo de cancelación." }
            });
        } finally { setIsGenerating(false); clearInterval(intv); }
    };

    const fetchAgentLogs = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/logs`);
            const data = await response.json();
            if (Array.isArray(data)) setAgentLogs(data);
        } catch (e) {
            console.error('[Frontend] Error fetching logs:', e);
        }
    };

    const handleSendMessage = () => {
        const text = inputText.trim(); if (!text) return;
        setMessages(prev => [...prev, { id: Date.now().toString(), text, isUser: true }]);
        setInputText(''); Keyboard.dismiss();
        (async () => {
            setIsTyping(true);
            try {
                const response = await fetch(`${BACKEND_URL}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
                const data = await response.json();
                const aiText = data.text || "Lo siento, mi conexión táctica ha fallado.";
                setMessages(prev => [...prev, { id: Date.now().toString(), text: aiText, isUser: false }]);
                speak(aiText);
            } catch (error: any) {
                console.error("[Frontend] Chat Error Details:", error);
                const errorMsg = "Error de comunicación con el núcleo Gemini. Revisa la consola o la API Key.";
                setMessages(prev => [...prev, { id: Date.now().toString(), text: errorMsg, isUser: false }]);
                speak("Error de conexión táctica.");
            } finally { setIsTyping(false); }
        })();
    };



    const saveMyFlight = async (flightNumber: string, alias?: string) => {
        if (!user?.email) return Alert.alert('Error', 'Inicia sesión primero');
        try {
            const response = await fetch(`${BACKEND_URL}/api/myFlights`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail: user.email, flightNumber, alias })
            });
            const data = await response.json();
            if (data.success) {
                Alert.alert('✅ Vuelo guardado', `${flightNumber} añadido a tus vuelos`);
                loadMyFlights(user.email);
            }
        } catch (e) {
            console.error('[Frontend] Error saving flight:', e);
        }
    };

    const loadMyFlights = async (email: string) => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/myFlights?email=${email}`);
            const data = await response.json();
            if (Array.isArray(data)) setMyFlights(data);
        } catch (e) {
            console.error('[Frontend] Error loading flights:', e);
        }
    };

    const removeMyFlight = async (id: string) => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/myFlights?id=${id}`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success && user?.email) loadMyFlights(user.email);
        } catch (e) {
            console.error('[Frontend] Error removing flight:', e);
        }
    };

    const loadMyTrips = async (email: string) => {
        try {
            const resp = await fetch(`${BACKEND_URL}/api/trips?email=${email}`);
            const data = await resp.json();
            if (Array.isArray(data)) setMyTrips(data);
        } catch (e) {
            console.error("Error cargando mis viajes:", e);
        }
    };

    const saveTrip = async (title: string, destination: string, startDate?: string, endDate?: string) => {
        if (!user?.email) return Alert.alert('Error', 'Inicia sesión primero');
        try {
            const resp = await fetch(`${BACKEND_URL}/api/trips`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail: user.email, title, destination, startDate, endDate })
            });
            const data = await resp.json();
            if (data.id) {
                Alert.alert('Éxito', 'Viaje creado correctamente');
                loadMyTrips(user.email);
            }
        } catch (e: any) {
            console.error("Error guardando viaje:", e);
            Alert.alert('Error de conexión', `No se pudo crear el viaje: ${e.message}. Verifica que el backend esté corriendo.`);
        }
    };

    const removeTrip = async (id: string) => {
        try {
            await fetch(`${BACKEND_URL}/api/trips?id=${id}`, { method: 'DELETE' });
            if (user?.email) loadMyTrips(user.email);
        } catch (e) {
            console.error("Error eliminando viaje:", e);
        }
    };

    const fetchWeather = async (location?: string) => {
        try {
            const dest = location || (myTrips.length > 0 ? myTrips[0].destination : 'London');
            const resp = await fetch(`${BACKEND_URL}/api/weather?location=${encodeURIComponent(dest)}`);
            const data = await resp.json();
            if (data.temp) setWeather(data);
        } catch (e) {
            console.error("Error cargando clima:", e);
        }
    };

    useEffect(() => {
        if (myTrips.length > 0) {
            // El destino suele guardarse como "Token | Japan" o similar
            const dest = myTrips[0].destination || myTrips[0].title.split('|')[1]?.trim() || myTrips[0].title;
            fetchWeather(dest);
        }
    }, [myTrips]);

    const value = {
        user, authEmail, setAuthEmail, authPassword, setAuthPassword, authMode, setAuthMode, authLoading,
        handleLogin, handleRegister, handleLogout,
        tab, setTab, showSOS, setShowSOS, showSOSMenu, setShowSOSMenu,
        selectedPlan, setSelectedPlan, viewDoc, setViewDoc, isScanning, setIsScanning, scanAnim, sosPulse,
        showChat, setShowChat, showBrowser, setShowBrowser, browserLogs, setBrowserLogs, legalShieldActive, setLegalShieldActive,
        claims, setClaims, inputText, setInputText, messages, setMessages, isSpeaking, waveAnim, compensationEligible, setCompensationEligible,
        isGenerating, apiPlan, setApiPlan, isTyping, availableVoices, selectedVoice, setSelectedVoice, loadingStep, flightInput, setFlightInput,
        flightData, isSearching, searchError, planes, setPlanes, searchFlight, showPlan, fetchContingencyPlan, handleSendMessage,
        agentLogs, fetchAgentLogs,
        myFlights, saveMyFlight, loadMyFlights, removeMyFlight,
        myTrips, saveTrip, loadMyTrips, removeTrip,
        weather, fetchWeather,
        speak, stopSpeak, formatTime, getStatusColor, getStatusLabel, scrollViewRef
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
