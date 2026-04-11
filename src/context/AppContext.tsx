import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Alert, Animated, Keyboard, Vibration } from 'react-native';
import * as Speech from 'expo-speech';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, sendEmailVerification } from 'firebase/auth';
import { auth, db } from '../../firebaseConfig';
import { BACKEND_URL } from '../../config';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Audio } from 'expo-av';
import { getEU261Amount } from '../utils/flightUtils';

type AppContextType = any;
export const IS_BETA = true; // Cambiar a true para betas/testing
export const AppContext = createContext<AppContextType>(null);

export const AppProvider = ({ children }) => {
  // AUTH / USUARIO
  const [user, setUser] = useState<any>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authName, setAuthName] = useState('');
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
  const [browserLogs, setBrowserLogs] = useState<any[]>([]);
  const [legalShieldActive, setLegalShieldActive] = useState(false);
  const [showCancellation, setShowCancellation] = useState(false);
  const [claims, setClaims] = useState<any[]>([
    {
      id: 'C-VLG8321',
      aerolinea: 'Vueling',
      vuelo: 'VY8321',
      ruta: 'BCN > ORY',
      estado: 'EN REVISIÓN LEGAL',
      compensacion: '250',
    },
    {
      id: 'C-RYR992',
      aerolinea: 'Ryanair',
      vuelo: 'FR992',
      ruta: 'MAD > STN',
      estado: 'PRESENTADA AL AEROLÍNEA',
      compensacion: '400',
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<any[]>([
    { id: '1', text: 'TRAVEL-PILOT CONECTADO. Hola, soy tu asistente. ¿En qué te puedo ayudar hoy?', isUser: false }
  ]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const waveAnim = useRef(new Animated.Value(0)).current;
  const [compensationEligible, setCompensationEligible] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiPlan, setApiPlan] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [compBannerDismissed, setCompBannerDismissed] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState('');
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [prefetchedData, setPrefetchedData] = useState<any>(null);
  const [isPrefetching, setIsPrefetching] = useState(false);
  const [flightInput, setFlightInput] = useState('');
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [hasNewDoc, setHasNewDoc] = useState(false);
  const demoItems = [
    {
      id: 'demo-passport-premium',
      t: 'PASAPORTE',
      s: 'DOC #ES-992182-B // VERIFICADO',
      i: require('../../assets/pasaporte_puro.jpg'),
      source: 'MANUAL',
      icon: '🛂',
      verified: true,
      isDemo: true,
    },
    {
      id: 'demo-boarding-premium',
      t: 'TARJETA EMBARQUE',
      s: 'VUELO IB3166 // MAD -> CDG',
      i: require('../../assets/tarjeta_embarque_pura.jpg'),
      source: 'GMAIL',
      icon: '🎫',
      verified: true,
      isDemo: true,
    },
    {
      id: 'demo-hotel-premium',
      t: 'RESERVA HOTEL',
      s: 'CONF: #88291-TX // MADRID',
      i: require('../../assets/reserva_hotel_pura.jpg'),
      source: 'OUTLOOK',
      icon: '🛌',
      verified: true,
      isDemo: true,
    }
  ];

  const [extraDocs, setExtraDocs] = useState<any[]>(demoItems);
  const [flightData, setFlightData] = useState<any>(null);
  const [activeSearches, setActiveSearches] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [agentLogs, setAgentLogs] = useState<any[]>([]);
  const [myFlights, setMyFlights] = useState<any[]>([]);
  const [myTrips, setMyTrips] = useState<any[]>([]);
  const [weatherMap, setWeatherMap] = useState<Record<string, any>>({});
  const [isDictating, setIsDictating] = useState(false);
  const [userPhone, setUserPhone] = useState('');
  const [hasSeenPlan, setHasSeenPlan] = useState(false);
  const [selectedRescuePlan, setSelectedRescuePlan] = useState<string | null>(null);
  const [lastSearchId, setLastSearchId] = useState<number>(0);
  const [isReplayingTutorial, setIsReplayingTutorial] = useState(false);
  const [travelProfile, setTravelProfile] = useState<'budget' | 'balanced' | 'fast' | 'premium'>('budget');
  const [pendingVIPRedirect, setPendingVIPRedirect] = useState(false);
  const [chatOrigin, setChatOrigin] = useState<'global' | 'vip' | null>(null);
  const [pendingVIPScroll, setPendingVIPScroll] = useState(false);
  const [showVIPAlternatives, setShowVIPAlternatives] = useState(false);
  
  // Limpieza inicial para Beta (si no hay ahorros guardados, forzar 0)
  const [savedTime, setSavedTime] = useState(0);
  const [recoveredMoney, setRecoveredMoney] = useState(0);
  const [showPrivateVault, setShowPrivateVault] = useState(false);
  const [vaultPin, setVaultPin] = useState(''); // PIN de la bóveda privada

  // EFECTOS INICIALES / WAKE UP BACKEND
  useEffect(() => {
    wakeUpBackend();
    // Re-intentar cada 5 minutos mientras la app esté abierta para evitar que Render se duerma
    const interval = setInterval(wakeUpBackend, 300000);
    return () => clearInterval(interval);
  }, []);

  const wakeUpBackend = async () => {
    try {
      console.log('📡 [AppContext] Despertando servidor en la nube...');
      // Pings ligeros a diferentes endpoints para asegurar que la instancia despierta
      fetch(`${BACKEND_URL}/api/logs`, { headers: { 'ngrok-skip-browser-warning': 'true' } }).catch(() => {});
      fetch(`${BACKEND_URL}/api/weather?location=Madrid`, { headers: { 'ngrok-skip-browser-warning': 'true' } }).catch(() => {});
    } catch (e) {}
  };

  const masterReset = async () => {
    try {
      // 1. Limpiar Estados de React
      setMyFlights([]);
      setMyTrips([]);
      setClaims([
        { id: 'C-VLG8321', aerolinea: 'Vueling', vuelo: 'VY8321', ruta: 'BCN > ORY', estado: 'EN REVISIÓN LEGAL', compensacion: '250' },
        { id: 'C-RYR992', aerolinea: 'Ryanair', vuelo: 'FR992', ruta: 'MAD > STN', estado: 'PRESENTADA AL AEROLÍNEA', compensacion: '400' }
      ]);
      setExtraDocs(demoItems);
      setSavedTime(0);
      setRecoveredMoney(0);
      setFlightData(null);
      setFlightInput('');
      setMessages([{ id: '1', text: 'TRAVEL-PILOT REINICIADO. Modo Beta activado. ¿En qué puedo ayudarte?', isUser: false }]);
      setTravelProfile('budget');
      setUserPhone('');
      setDismissedClaims([]);
      setHasSeenPlan(false);
      setSelectedRescuePlan(null);
      
      // 2. Limpiar AsyncStorage (Nuclear)
      const keys = [
        'lastFlightData', 'lastFlightInput', 'activeSearches', 
        'offline_claims', 'offline_extraDocs', 'savedTime', 
        'recoveredMoney', 'travelProfile', 'userPhone',
        'offline_dismissedClaims', 'hasSeenOnboarding', 'hasSeenPlan',
        'disclaimerOnboardingAccepted', 'vaultPin', 'selectedVoice'
      ];
      await AsyncStorage.multiRemove(keys);
      setVaultPin('');
      setSelectedVoice(null);

      Alert.alert("🔄 RESET MAESTRO", "Limpieza nuclear completada. El sistema está 100% puro para la siguiente prueba Beta.");
    } catch (e) {
      console.error("Error en Master Reset:", e);
    }
  };

  // ✅ CARGA UNIFICADA (AsyncStorage) — Solución a pérdida de datos (Vuelo/Bóveda)
  useEffect(() => {
    const loadAppState = async () => {
      try {
        const keys = [
          'lastFlightData', 'offline_extraDocs', 'savedTime', 
          'recoveredMoney', 'travelProfile', 'vaultPin', 'userPhone',
          'activeSearches', 'offline_claims', 'offline_dismissedClaims', 
          'chatOrigin', 'hasSeenOnboarding', 'selectedVoice'
        ];
        const results = await AsyncStorage.multiGet(keys);
        const stores = Object.fromEntries(results);

        if (stores.lastFlightData) {
          const cachedData = JSON.parse(stores.lastFlightData);
          setFlightData({ ...cachedData, isFromCache: true }); // Marcamos como caché
        }

        let finalDocs = [...demoItems];
        if (stores.offline_extraDocs) {
          try {
            const saved = JSON.parse(stores.offline_extraDocs);
            if (Array.isArray(saved) && saved.length > 0) {
              const savedIds = saved.map((d: any) => d.id);
              const uniqueDemos = demoItems.filter(d => !savedIds.includes(d.id));
              finalDocs = [...uniqueDemos, ...saved];
            }
          } catch (e) {}
        }
        setExtraDocs(finalDocs);

        if (stores.travelProfile) setTravelProfile(stores.travelProfile as any);
        if (stores.savedTime) setSavedTime(parseFloat(stores.savedTime));
        if (stores.recoveredMoney) setRecoveredMoney(parseFloat(stores.recoveredMoney));
        if (stores.vaultPin) setVaultPin(stores.vaultPin);
        if (stores.userPhone) setUserPhone(stores.userPhone);
        if (stores.activeSearches) setActiveSearches(JSON.parse(stores.activeSearches));
        if (stores.offline_claims) {
          const sc = JSON.parse(stores.offline_claims);
          if (Array.isArray(sc)) setClaims(sc);
        }
        if (stores.offline_dismissedClaims) setDismissedClaims(JSON.parse(stores.offline_dismissedClaims));
        if (stores.chatOrigin) setChatOrigin(stores.chatOrigin as any);
        if (stores.selectedVoice) setSelectedVoice(stores.selectedVoice);
        
        if (stores.hasSeenOnboarding === 'true') {
          setHasSeenOnboarding(true);
        } else {
          setHasSeenOnboarding(false);
        }

      } catch (err) {
        console.error("Error carga:", err);
      } finally {
        setIsStorageReady(true);
      }
    };
    loadAppState();
  }, []);


  // Guardar ahorros cuando cambien
  useEffect(() => {
    AsyncStorage.setItem('savedTime', savedTime.toString());
    AsyncStorage.setItem('recoveredMoney', recoveredMoney.toString());
  }, [savedTime, recoveredMoney]);

  // ESTADO DE PLANES Y CRISIS RECUPERADO
  const [planes, setPlanes] = useState<any[]>([
    { id: '1', destino: 'PARÍS', status: 'OK', hora: 0, img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=500', co: '48.85 N, 2.35 E' },
    { id: '2', destino: 'TOKIO', status: 'OK', hora: 8, img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=500', co: '35.67 N, 139.65 E' }
  ]);

  const [dismissedClaims, setDismissedClaims] = useState<string[]>([]);

  // ✅ PERSISTENCIA DE VUELO EN ASYNCSTORAGE
  const [isStorageReady, setIsStorageReady] = useState(false);

  // La carga ahora se realiza de forma unificada arriba para evitar colisiones.


  // Guardar código de vuelo cuando cambia (solo si ya cargo)
  useEffect(() => {
    if (isStorageReady) {
      if (flightInput !== '') {
        AsyncStorage.setItem('lastFlightInput', flightInput);
      } else {
        AsyncStorage.removeItem('lastFlightInput');
      }
    }
  }, [flightInput, isStorageReady]);

  // Guardar datos de vuelo cuando cambian (solo si ya cargo)
  useEffect(() => {
    if (isStorageReady) {
      if (flightData) {
        AsyncStorage.setItem('lastFlightData', JSON.stringify(flightData));
      } else {
        AsyncStorage.removeItem('lastFlightData');
      }
    }
  }, [flightData, isStorageReady]);

  // Guardar búsquedas activas
  useEffect(() => {
    if (isStorageReady) {
      AsyncStorage.setItem('activeSearches', JSON.stringify(activeSearches));
    }
  }, [activeSearches, isStorageReady]);

  // Guardar rest de datos al cambiar
  useEffect(() => {
    if (isStorageReady) {
      AsyncStorage.setItem('offline_claims', JSON.stringify(claims));
    }
  }, [claims, isStorageReady]);

  useEffect(() => {
    if (isStorageReady) {
      AsyncStorage.setItem('savedTime', savedTime.toString());
    }
  }, [savedTime, isStorageReady]);

  useEffect(() => {
    if (isStorageReady) {
      AsyncStorage.setItem('recoveredMoney', recoveredMoney.toString());
    }
  }, [recoveredMoney, isStorageReady]);

  useEffect(() => {
    if (isStorageReady) {
      AsyncStorage.setItem('offline_dismissedClaims', JSON.stringify(dismissedClaims));
    }
  }, [dismissedClaims, isStorageReady]);

  useEffect(() => {
    if (isStorageReady) {
      AsyncStorage.setItem('offline_extraDocs', JSON.stringify(extraDocs));
    }
  }, [extraDocs, isStorageReady]);

  useEffect(() => {
    if (isStorageReady) {
      AsyncStorage.setItem('userPhone', userPhone);
    }
  }, [userPhone, isStorageReady]);

  useEffect(() => {
    if (isStorageReady) {
      AsyncStorage.setItem('travelProfile', travelProfile);
    }
  } , [travelProfile, isStorageReady]);

  useEffect(() => {
    if (isStorageReady) {
      if (chatOrigin) {
        AsyncStorage.setItem('chatOrigin', chatOrigin);
      } else {
        AsyncStorage.removeItem('chatOrigin');
      }
    }
  }, [chatOrigin, isStorageReady]);

  // PERSISTENCIA DEL PIN DE LA BÓVEDA
  useEffect(() => {
    if (isStorageReady && vaultPin !== '') {
      AsyncStorage.setItem('vaultPin', vaultPin);
    }
  }, [vaultPin, isStorageReady]);

  // PERSISTENCIA DE LA VOZ SELECCIONADA
  useEffect(() => {
    if (isStorageReady) {
      if (selectedVoice) {
        AsyncStorage.setItem('selectedVoice', selectedVoice);
      } else {
        AsyncStorage.removeItem('selectedVoice');
      }
    }
  }, [selectedVoice, isStorageReady]);

  // ============================================================
  // MONITORIZACIÓN PROACTIVA (APLAZADA A PRODUCCIÓN)
  // ============================================================
    // NOTA: El polling cada 5 min consume rápidamente las 100 llamadas/mes de AviationStack.
    // Actualmente deshabilitado según petición del usuario.
    // Para la versión final (Android/iOS) se usará el sistema de Webhooks (Push) de AeroDataBox.
    const lastKnownDelay = useRef<number>(0);

    useEffect(() => {
        if (!flightData?.flightNumber) {
            lastKnownDelay.current = 0;
            return;
        }

        lastKnownDelay.current = flightData.departure?.delay || 0;

        // Aquí iba el setInterval para el polling. Eliminado para no consumir cuotas.
        
    }, [flightData?.flightNumber, flightData?.departure?.delay]);

  // EFECTOS INICIALES
  useEffect(() => {
    const timer = setInterval(() => setTicks(t => t + 1), 100);
    Animated.loop(
      Animated.sequence([
        Animated.timing(sosPulse, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
        Animated.timing(sosPulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    const initVoices = async () => {
      let voices: any[] = [];
      try {
        voices = await Speech.getAvailableVoicesAsync();
      } catch (e) {
        console.warn('Error fetching native voices', e);
      }
      
      // Buscar voces en español (incluyendo variantes MX, US, etc.)
      let esVoices = voices.filter(v => v.language && v.language.startsWith('es'));
      
      const internalFallback = [
        { identifier: 'es-es-x-eed-network', name: 'es-es-x-eed-network', language: 'es-ES', quality: 'Enhanced' },
        { identifier: 'es-es-x-eea-network', name: 'es-es-x-eea-network', language: 'es-ES', quality: 'Enhanced' },
        { identifier: 'es-us-x-esc-network', name: 'es-us-x-esc-network', language: 'es-US', quality: 'Enhanced' },
        { identifier: 'es-us-x-esf-network', name: 'es-us-x-esf-network', language: 'es-US', quality: 'Enhanced' }
      ];

      if (!esVoices || esVoices.length === 0) {
        console.log("No native spanish voices found, using internal emergency pool...");
        esVoices = internalFallback;
      }

      // Ordenar para priorizar voces de Alta Definición (Evitar el efecto "Radio de la IA")
      esVoices.sort((a, b) => {
          const idA = (a.identifier || '').toLowerCase();
          const idB = (b.identifier || '').toLowerCase();
          let scoreA = 0; let scoreB = 0;

          // Premiar voces HD/Network
          if (idA.includes('network') || a.quality === 'Enhanced') scoreA += 10;
          if (idB.includes('network') || b.quality === 'Enhanced') scoreB += 10;

          // Penalizar voces robóticas/locales muy comprimidas
          if (idA.includes('local') || idA.includes('compact')) scoreA -= 5;
          if (idB.includes('local') || idB.includes('compact')) scoreB -= 5;

          return scoreB - scoreA;
      });

      // Mapeo dinámico y traducción de identificadores nativos (iOS/Android)
      const categorizedVoices = esVoices.map(v => {
        let gender = 'unknown';
        const id = ((v.identifier || '') + ' ' + (v.name || '')).toLowerCase();

        // Clasificación absoluta basada en el hardware y feedback del usuario
        // Femeninas: a, c, e / Masculinas: b, d, f (Patrón común en Android/Google)
        if (id.includes('monica') || id.includes('clara') || id.includes('paulina') || id.includes('luciana') || id.includes('helena') ||
          id.includes('-esa') || id.includes('-esc') || id.includes('-ese') || id.includes('female') || id.includes('mujer') ||
          id.includes('-eea') || id.includes('-eec') || id.includes('-eee')) {
          gender = 'female';
        } else if (id.includes('juan') || id.includes('carlos') || id.includes('jorge') || id.includes('diego') ||
          id.includes('manuel') || id.includes('pablo') || id.includes('-esd') || id.includes('-esf') || id.includes('male') || id.includes('hombre') ||
          id.includes('-eeb') || id.includes('-eed') || id.includes('-eef')) {
          gender = 'male';
        }
        return { ...v, gender };
      });

      const males = categorizedVoices.filter(v => v.gender === 'male');
      const females = categorizedVoices.filter(v => v.gender === 'female');
      const unknowns = categorizedVoices.filter(v => v.gender === 'unknown');

      // Si el SO no tiene suficientes de un género, pedimos prestado del otro
      const fPool = females.length > 0 ? females : (males.length > 0 ? males : unknowns);
      const mPool = males.length > 0 ? males : (females.length > 0 ? females : unknowns);

      // Separar por acento para la asignación Premium (Español de España: es-ES)
      const esEsFemales = fPool.filter((v: any) => v.language === 'es-ES' || (v.identifier || '').toLowerCase().includes('es-es'));
      const otherFemales = fPool.filter((v: any) => v.language !== 'es-ES' && !(v.identifier || '').toLowerCase().includes('es-es'));

      const esEsMales = mPool.filter((v: any) => v.language === 'es-ES' || (v.identifier || '').toLowerCase().includes('es-es'));
      const otherMales = mPool.filter((v: any) => v.language !== 'es-ES' && !(v.identifier || '').toLowerCase().includes('es-es'));

      // Premium usa español de España prioritariamente
      const premiumFemalePool = esEsFemales.length > 0 ? esEsFemales : fPool;
      const premiumMalePool = esEsMales.length > 0 ? esEsMales : mPool;

      // Gratuitos usan variantes de otras regiones (Latam, etc.) para aportar variedad, o repiten si no hay
      const freeFemalePool = otherFemales.length > 0 ? otherFemales : fPool;
      const freeMalePool = otherMales.length > 0 ? otherMales : mPool;

      // Instanciación forzosa y blindada de los 4 roles (Nombres nuevos)
      const luciaV = { ...(freeFemalePool[0] || fPool[0] || esVoices[0]), humanName: 'Lucía', isPremium: false };
      const javierV = { ...(freeMalePool[0] || mPool[0] || esVoices[0]), humanName: 'Javier', isPremium: false };

      // Premium (Acento es-ES garantizado si existe en el OS)
      // Si la voz libre cogió la misma (ej. solo hay 1 voz de mujer), forzamos a pillar el índice 1 del fPool si existe
      const fPremVoice = premiumFemalePool[0]?.identifier === luciaV.identifier && premiumFemalePool.length > 1 ? premiumFemalePool[1] : (premiumFemalePool[0] || fPool[0]);
      const claraV = { ...(fPremVoice || esVoices[0]), humanName: 'Clara', isPremium: true };

      const mPremVoice = premiumMalePool[0]?.identifier === javierV.identifier && premiumMalePool.length > 1 ? premiumMalePool[1] : (premiumMalePool[0] || mPool[0]);
      const marcoV = { ...(mPremVoice || esVoices[0]), humanName: 'Marco', isPremium: true };

      const roles = [luciaV, javierV, claraV, marcoV];

      // Insertamos uniqueId para evitar quejas de React si usamos la misma voz 2 veces
      const visibleRoles = roles.map((r, i) => ({ ...r, uniqueId: (r.identifier || 'v') + '_' + i }));

      setAvailableVoices(visibleRoles);

      if (visibleRoles.length > 0 && !selectedVoice) {
        // Javier por defecto si existe, si no, Lucía
        const defaultVoiceId = javierV.identifier || visibleRoles[0].identifier;
        setSelectedVoice(defaultVoiceId);
      }
    };

    initVoices();
    const retry = setTimeout(initVoices, 3500);

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('tactical', {
        name: 'Alertas Tácticas',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 200, 500, 200, 1000], // Patrón táctico: doble rápido + uno largo
        lightColor: '#FF3B30',
      });
    }

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    return () => {
      clearInterval(timer);
      clearTimeout(retry);
    };
  }, []);

  // SIMULACIÓN DE LOGS DEL NAVEGADOR ASISTENTE (EN TIEMPO REAL CON MOTOR SSE)
  useEffect(() => {
    let xhr: XMLHttpRequest | null = null;

    if (showBrowser && selectedPlan) {
      setBrowserLogs([]);
      
      const destCity = flightData?.arrival?.airport || "tu destino";
      const pType = selectedPlan?.type || "General";
      
      const hotelMatch = selectedPlan?.title?.match(/en\s([A-Za-z\s]+)/i);
      const hName = hotelMatch ? hotelMatch[1] : "Alojamiento Óptimo";

      const fId = flightData?.flightNumber || "";
      const depCity = flightData?.departure?.iata || flightData?.departure?.airport || "";
      const arrCity = flightData?.arrival?.iata || flightData?.arrival?.airport || "";
      const url = `${BACKEND_URL}/api/executePlan?flightId=${encodeURIComponent(fId)}&planType=${encodeURIComponent(pType)}&destination=${encodeURIComponent(destCity)}&hotelName=${encodeURIComponent(hName)}&depCity=${encodeURIComponent(depCity)}&arrCity=${encodeURIComponent(arrCity)}`;
      
      xhr = new XMLHttpRequest();
      xhr.open('GET', url);
      xhr.timeout = 25000; // Aumentado a 25s para dar tiempo a Render a arrancar
      xhr.setRequestHeader('Accept', 'text/event-stream');
      xhr.setRequestHeader('ngrok-skip-browser-warning', 'true');
      
      // Logs iniciales de sistema para dar feedback inmediato
      setBrowserLogs([
        '🚀 [Sistema] Iniciando Motor de Ejecución en la nube...',
        '🔒 Estableciendo túnel de seguridad AES-256...',
        '📡 Contactando con la red global de Travel-Pilot...'
      ]);

      const demoTimer = setTimeout(() => {
        if (browserLogs.length <= 3) {
          setBrowserLogs(prev => [
            ...prev, 
            '⏳ El servidor está despertando (esto puede tardar unos segundos)...',
            '🤖 Preparando agentes de búsqueda en tiempo real...',
          ]);
        }
      }, 5000);

      let seenBytes = 0;
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 3 || xhr.readyState === 4) {
          clearTimeout(demoTimer);
          
          if (!xhr) return;
          const newData = xhr.responseText.substring(seenBytes);
          seenBytes = xhr.responseText.length;
          
          if (newData.trim().length > 0) {
              const lines = newData.split('\n');
              for (let line of lines) {
                 if (line.startsWith('data: ')) {
                    try {
                        const payload = line.substring(6).trim();
                        if (payload.startsWith('{')) {
                            const parsed = JSON.parse(payload);
                            if (parsed.log) {
                                 setBrowserLogs(prev => [...prev, parsed.log]);
                            }
                            if (parsed.done && xhr) {
                                xhr.abort();
                            }
                        }
                    } catch(e) {
                        // Ignorar errores de parseo parcial de chunks
                    } 
                 }
              }
          }
        }
      };

      xhr.ontimeout = () => {
        setBrowserLogs(prev => [...prev, '⚠️ [Timeout] El servidor está tardando en responder. Utiliza "Compartir" para una gestión manual inmediata si tienes prisa.']);
        // No llamamos a wakeUpBackend recursivamente sin límite para evitar bloqueos
      };

      xhr.onerror = () => {
         setBrowserLogs(prev => [...prev, '❌ [Error] Servicio temporalmente indisponible. Protocolo Élite sugerido: Usa la opción COMPARTIR.']);
      };
      
      xhr.send();
      
    } else if (!showBrowser && !isExtracting) {
      setBrowserLogs([]);
    }

    return () => {
        if (xhr) {
            xhr.abort();
            xhr = null;
        }
    };
  }, [showBrowser, selectedPlan, flightData]);

  useEffect(() => {
    const sub = onAuthStateChanged(auth, async (firebaseUser) => {
      // Si el usuario cambia o se desloguea, LIMPIEZA ATÓMICA Y DE DISCO
      if (!firebaseUser || (user && firebaseUser.uid !== user.uid)) {
        setMyFlights([]);
        setClaims([
            {
              id: 'C-VLG8321',
              aerolinea: 'Vueling',
              vuelo: 'VY8321',
              ruta: 'BCN > ORY',
              estado: 'EN REVISIÓN LEGAL',
              compensacion: '250',
            },
            {
              id: 'C-RYR992',
              aerolinea: 'Ryanair',
              vuelo: 'FR992',
              ruta: 'MAD > STN',
              estado: 'PRESENTADA AL AEROLÍNEA',
              compensacion: '400',
            }
        ]); 
        setExtraDocs(demoItems); 
        setAgentLogs([]);
        const firstName = (user?.displayName || user?.email || 'Viajero').trim().split(/[.\s_-]+/)[0];
    setMessages([{ id: '1', text: `MODO ELITE ACTIVADO. Hola ${firstName}, soy tu asistente inteligente de Travel-Pilot. ¿En qué puedo ayudarte hoy?`, isUser: false }]);
        setApiPlan(null);
        setFlightData(null);
        setFlightInput('');
        setMyTrips([]);
        setUserPhone(''); 
        setHasSeenOnboarding(false); // Reset para que el próximo vea el Onboarding
        setTravelProfile('budget');
        setSavedTime(0);
        setRecoveredMoney(0);
        setSelectedRescuePlan(null);

        // Formatear memoria del móvil para este dispositivo
        await AsyncStorage.multiRemove([
            'lastFlightData', 'lastFlightInput', 'activeSearches', 
            'offline_claims', 'offline_myFlights', 'offline_myTrips', 
            'offline_extraDocs', 'userPhone', 'hasSeenOnboarding',
            'travelProfile', 'savedTime', 'recoveredMoney', 'hasSeenPlan',
            'disclaimerOnboardingAccepted'
        ]);
        console.log("🛡️ [Privacidad] Memoria local formateada al 100% para nueva cuenta.");
      }

      if (firebaseUser?.email) {
        loadMyFlights(firebaseUser.email);
        loadMyTrips(firebaseUser.email);
        registerForPushNotificationsAsync(firebaseUser.email);
        
      }
      setUser(firebaseUser);
    });

    return () => {
      sub();
    };
  }, []);

  const recordingRef = useRef<Audio.Recording | null>(null);

  const startDictation = async () => {
    try {
      console.log("[Audio] Iniciando flujo de grabación...");
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('AVISO DE PERMISOS', 'Para poder hablar con el asistente de voz, Travel-Pilot necesita permiso para acceder a tu micrófono. Por favor, acéptalo en los ajustes si no aparece el menú.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });

      // Limpiar grabación anterior si existe
      if (recordingRef.current) {
        try { await recordingRef.current.stopAndUnloadAsync(); } catch (e) { }
        recordingRef.current = null;
      }

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setIsDictating(true);
      Vibration.vibrate(50);
      console.log("[Audio] Grabación en curso...");
    } catch (e: any) {
      console.error('[Voice Start Error]:', e);
      setIsDictating(false);
      Alert.alert('ERROR DE HARDWARE', 'No se ha podido activar el micrófono.');
    }
  };

  const stopDictation = async () => {
    try {
      if (!recordingRef.current) {
        setIsDictating(false);
        return;
      }

      console.log("[Audio] Deteniendo grabación...");
      setIsDictating(false);

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (uri) {
        setIsTyping(true);
        console.log("[Audio] Analizando voz...");
        const formData = new FormData();
        // @ts-ignore
        formData.append('audio', {
          uri,
          name: 'audio.m4a',
          type: 'audio/mp4'
        });

        try {
          const res = await fetch(`${BACKEND_URL}/api/transcribe`, {
            method: 'POST',
            body: formData,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'multipart/form-data',
            },
          });

          if (!res.ok) throw new Error(`HTTP ${res.status}`);

          const data = await res.json();
          if (data.text && data.text.trim().length > 0) {
            setInputText(data.text);
            Vibration.vibrate(50);
          } else {
            console.warn("[Audio] Respuesta vacía del servidor.");
            Alert.alert('ASISTENTE', 'No he podido entender tus palabras. ¿Puedes repetirlo un poco más claro?');
          }
        } catch (e: any) {
          console.error("[Audio] Error en transcripción:", e);
          Alert.alert('CONEXIÓN', 'No he podido procesar el audio. Revisa tu conexión a internet.');
        }
      }
    } catch (e: any) {
      console.error('[Voice Stop Error]:', e);
    } finally {
      setIsTyping(false);
      setIsDictating(false);
    }
  };

  const registerForPushNotificationsAsync = async (email: string) => {
    if (!Device.isDevice) return;
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;

    if (Constants.appOwnership === 'expo') {
      console.log("Expo Go detectado: Saltando token remoto (Las notificaciones locales seguirán funcionando)");
      return;
    }

    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId || '71acd23d-946c-4b17-8637-2e7eae12016f';
      const token = (await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      })).data;
      setExpoPushToken(token);

      await fetch(`${BACKEND_URL}/api/registerPushToken`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          token,
          deviceName: `${Device.brand} ${Device.modelName}`
        })
      }).catch(e => console.log('Silencioso: error red token push'));
    } catch (e) {
      // SILENCIADO INTENCIONALMENTE: En Expo Go o sin configuración EAS, esto suele fallar y asusta al usuario.
      console.log("Silencioso: No se pudo obtener el token push remoto, pero las locales funcionarán.");
    }
  };

  const simulatePushNotification = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Debes permitir las notificaciones para probar esta función.');
        return;
      }
    } catch (e) {
      console.log('Error pidiendo permisos rápidos', e);
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: (flightData?.departure?.delay || 0) >= 180 ? "🚨 CRISIS: Retraso Crítico" : "⚠️ AVISO: Incidencia de Vuelo",
        body: (flightData?.departure?.delay || 0) >= 180
          ? `Tu vuelo tiene +3h de retraso. He preparado tu rescate. Pulsa para solucionarlo.`
          : `Retraso de ${(flightData?.departure?.delay || 0)} min detectado. He preparado tu plan de asistencia. Pulsa para verlo.`,
        sound: true,
        vibrate: [0, 500, 200, 500],
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5,
        channelId: 'tactical'
      },
    });

    // Forzar vibración a nivel de hardware (Por si el SO bloquea la de la notificación)
    setTimeout(() => {
      Vibration.vibrate([0, 500, 200, 500]);
    }, 5000);

    Alert.alert(
      "Simulación Iniciada",
      "1. Cierra esta ventana.\n2. Inmediatamente vete al menú inicio de tu teléfono (sin cerrar la app del todo).\n3. Espera 5 segundos."
    );
    console.log("[Push] Local notification scheduled in 5 seconds");
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
    if (!authEmail) return Alert.alert('Registro', 'Por favor, introduce tu email.');
    if (!authPassword) return Alert.alert('Registro', 'Por favor, crea una contraseña.');
    if (authPassword.length < 6) return Alert.alert('Seguridad', 'La contraseña debe tener al menos 6 caracteres.');
    if (!authName) return Alert.alert('Registro', 'Por favor, introduce tu nombre completo.');
    if (authMode === 'register' && !userPhone) return Alert.alert('Registro', 'El teléfono SOS es obligatorio para poder avisarte de retrasos críticos.');

    try {
      setAuthLoading(true);
      const cred = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
      await updateProfile(cred.user, { displayName: authName });
      
      // FORZAR ONBOARDING PARA NUEVO USUARIO
      await AsyncStorage.removeItem('hasSeenOnboarding');
      setHasSeenOnboarding(false);
      
      // ENVÍO DE VERIFICACIÓN (Seguridad)
      await sendEmailVerification(cred.user);

      // PERSISTENCIA EN BACKEND (Supabase)
      await fetch(`${BACKEND_URL}/api/registerUser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authEmail,
          name: authName,
          phone: userPhone
        })
      });

      Alert.alert('Registro', '¡Bienvenido! Hemos enviado un enlace de confirmación a tu email. Por favor, verifícalo para activar tu Escudo Legal.');
    }
    catch (e: any) { Alert.alert('Error', e.message); } finally { setAuthLoading(false); }
  };

  const handleLogin = async () => {
    if (!authEmail || !authPassword) return Alert.alert('Login', 'Introduce email y contraseña.');
    try { 
      setAuthLoading(true); 
      await signInWithEmailAndPassword(auth, authEmail, authPassword); 
      
      // SI LOGUEA, YA NO NECESITA ONBOARDING (Aseguramos persistencia)
      setHasSeenOnboarding(true);
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    }
    catch (e: any) { Alert.alert('Error', e.message); } finally { setAuthLoading(false); }
  };

  const handleLogout = async () => { await signOut(auth); };

  const playVipAudio = async (voiceName: string) => {
    try {
      let soundAsset = null;
      if (voiceName === 'Clara') soundAsset = require('../../assets/audio/clara_intro.mp3');
      if (voiceName === 'Marco') soundAsset = require('../../assets/audio/marco_intro.mp3');

      if (soundAsset) {
        const { sound } = await Audio.Sound.createAsync(soundAsset);
        await sound.playAsync();
        // Limpieza automática tras sonar
        sound.setOnPlaybackStatusUpdate((status: any) => {
          if (status.didJustFinish) sound.unloadAsync();
        });
        return true; 
      }
    } catch (e) {
      console.warn("[VIP-AUDIO] Error reproduciendo audio real:", e);
    }
    return false;
  };

  const speak = async (text: string, overrideVoiceId?: string) => {
    setIsSpeaking(true);
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(waveAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ])
    ).start();

    const voiceId = overrideVoiceId || selectedVoice;
    const voiceObj = availableVoices.find(v => v.identifier === voiceId);
    const isVoiceAvailable = !!voiceObj;

    // LÓGICA VIP: Si estamos diciendo la frase de presentación y es una voz VIP
    if (text.includes("soy Clara") || text.includes("soy tu asistente") || text.includes("Marco aquí")) {
      if (voiceObj?.humanName === 'Clara' || voiceObj?.humanName === 'Marco') {
        const success = await playVipAudio(voiceObj.humanName);
        if (success) {
          // Si el audio real funcionó, no necesitamos que hable el bot
          setTimeout(() => {
            setIsSpeaking(false);
            waveAnim.stopAnimation();
          }, 4000); // Duración estimada de la frase corta
          return;
        }
      }
    }
    
    Speech.speak(text, { 
      language: 'es-ES', 
      voice: isVoiceAvailable ? voiceId! : undefined,
      onDone: () => onSpeechDone(),
      onError: (e) => {
        console.warn("[Speech] Error detectado, reintentando con voz nativa...", e);
        onSpeechDone();
      }
    });
  };

  const onSpeechDone = () => {
    setIsSpeaking(false);
    waveAnim.stopAnimation();
  };

  const stopSpeak = () => { Speech.stop(); onSpeechDone(); };

  const clearMessages = () => {
    setMessages([{ id: '1', text: "Hola, estoy a tu escucha. ¿En qué puedo ayudarte?", isUser: false }]);
  };

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
      const response = await fetch(`${BACKEND_URL}/api/monitorFlight`, { 
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }, 
        body: JSON.stringify({ flightId: flightInput.trim() || 'TP404' }) 
      });
      const data = await response.json();
      if (data.contingencyPlan) {
        // LIMPIEZA DINÁMICA + FILTRO EJECUTIVO FORZOSO
        const cleanOptions = (data.contingencyPlan.options || []).map((o: any) => {
          let title = (o.title || '').replace(/\+\d+€/g, '').replace(/\d+€/g, '').replace(/€/g, '').trim();
          let desc = (o.description || '').replace(/\d+€/g, '').replace(/€/g, '').trim();
          
          if (travelProfile === 'premium') {
             if (o.type === 'RÁPIDO') { title = 'PROTOCOLO JET / PRIORIDAD MÁXIMA'; desc = 'Reubicación inmediata en flotas preferentes para cumplir con tu agenda.'; }
             if (o.type === 'ECONÓMICO') { title = 'RECLAMACIÓN ELITE (GESTIÓN CERO)'; desc = 'Recuperación de tus fondos legales gestionada por nuestro departamento jurídico.'; }
             if (o.type === 'CONFORT') { title = 'ESTANCIA LUXURY GARANTIZADA'; desc = 'Acceso a los mejores hoteles de la zona y traslados transfer privados.'; }
          }
          
          return { ...o, title, description: desc, estimatedCost: 0 };
        });
        setPrefetchedData({ ...data.contingencyPlan, options: cleanOptions });
      }
    } catch (e) { } finally { setIsPrefetching(false); }
  };

  const searchFlight = async (manualCode?: string | any) => {
    // Si manualCode es un evento (de un onPress), lo ignoramos y usamos flightInput
    const code = (typeof manualCode === 'string') ? manualCode.trim() : flightInput.trim();
    if (!code) return;

    // LÍMITE GRATUITO: Solo 1 vuelo simultáneo para usuarios no-VIP
    const isNewFlight = !activeSearches.find(f => f.flightNumber === code.toUpperCase());
    if (travelProfile !== 'premium' && activeSearches.length >= 1 && isNewFlight) {
      Alert.alert(
        'LÍMITE ALCANZADO',
        'Con el plan gratuito solo puedes vigilar 1 vuelo a la vez. Actualiza a VIP para vigilar vuelos ilimitados simultáneamente.',
        [
          { text: 'CANCELAR', style: 'cancel' },
          { text: 'VER VIP', onPress: () => setPendingVIPRedirect(true) }
        ]
      );
      return;
    }

    // 1) LIMPIAR TODO del circuito anterior para evitar conflictos
    stopSpeak();
    setShowSOS(false);
    setSearchError(null);
    setIsSearching(true);
    wakeUpBackend(); // Ping proactivo para despertar la nube
    try {
      // 1.5) PREPARAR LOGS (En segundo plano, sin saltar de pantalla)
      setBrowserLogs([`[SISTEMA] Iniciando interceptación táctica: Vuelo ${code.toUpperCase()}...`]);
      
      // Simulación de pasos iniciales para feedback en UI local
      setTimeout(() => setBrowserLogs(prev => [...prev, '🌐 Conectando con nodos de la Red Global de Aviación...']), 400);
      setTimeout(() => setBrowserLogs(prev => [...prev, '🔐 Solicitando acceso a registros transpondedores...']), 1200);
      setTimeout(() => setBrowserLogs(prev => [...prev, `🔍 Escaneando bases de datos en busca de '${code.toUpperCase()}'...`]), 2200);
      setTimeout(() => setBrowserLogs(prev => [...prev, '📡 Estableciendo enlace con satélites Inmarsat...']), 3200);
      setTimeout(() => setBrowserLogs(prev => [...prev, '⏳ Especialista IA analizando vectores de llegada...']), 4500);

      const response = await fetch(`${BACKEND_URL}/api/flightInfo?flight=${code}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });

      if (!response.ok) {
        const err = await response.json();
        setBrowserLogs(prev => [...prev, `❌ ERROR CRÍTICO: El vuelo ${code.toUpperCase()} no ha sido localizado en la red.`]);
        setSearchError(err.error || 'Vuelo no encontrado');
        return;
      }
      
      const data = await response.json();
      setBrowserLogs(prev => [
        ...prev, 
        `✅ ENLACE ESTABLECIDO. Datos recibidos de la flota de ${data.airline || 'la operadora'}.`,
        `📊 ESTADA ACTUAL: ${data.status === 'cancelled' ? '🚨 CANCELADO' : '⚠️ RETRASADO'}.`,
        `🧠 MODO RESCATE: Iniciando cálculo de alternativas VIP para el tramo ${data.departure?.iata} > ${data.arrival?.iata}...`,
        `📑 Generando expediente legal para reclamación EU261 de hasta ${getEU261Amount(data)}...`
      ]);
      setFlightData(data);
      // INCREMENTO DE AHORRO: Buscar un vuelo ahorra al menos 15 mins (0.25h) de burocracia
      setSavedTime(prev => prev + 0.25);

      // 3) AÑADIR A BÚSQUEDAS ACTIVAS
      setActiveSearches(prev => {
        const exists = prev.find(f => f.flightNumber === data.flightNumber);
        if (exists) return [data, ...prev.filter(f => f.flightNumber !== data.flightNumber)];
        return [data, ...prev];
      });

      // 4) GENERAR EXPEDIENTE LEGAL (silencioso, sin voz aquí)
      const effectiveDelay = data.departure?.delay || data.delayMinutes || 0;
      if (effectiveDelay >= 180 || data.status === 'cancelled') {
        setCompensationEligible(true);
        setClaims(prevBase => {
          const prev = prevBase.filter(c => c.vuelo !== data.flightNumber);
          const newClaim = {
            id: `C-${data.flightNumber}-${Date.now()}`,
            aerolinea: data.airline || 'Aerolínea',
            vuelo: data.flightNumber,
            ruta: `${data.departure?.iata} > ${data.arrival?.iata}`,
            estado: 'EXPEDIENTE PREPARADO',
            status: data.status || 'delayed',
            delayActual: effectiveDelay,
            compensacion: getEU261Amount(data),
            isDynamic: true
          };
          // INCREMENTO DE AHORRO: Generar una reclamación recupera dinero real
          setRecoveredMoney(prev => prev + parseFloat(getEU261Amount(data).replace('€', '')));
          setSavedTime(prev => prev + 1); // Generar la reclamación ahorra 1h de papeleo
          return [newClaim, ...prev];
        });
      }

      // 5) UNA SOLA VOZ — el resumen completo de la situación adaptado al perfil
      const delay = data.departure?.delay || data.delayMinutes || 0;
      let finalSpeech = ''

      if (data.status === 'cancelled') {
        if (travelProfile === 'premium') {
          finalSpeech = 'Vuelo cancelado. Tranquilo, ya he bloqueado una ruta alternativa y asegurado tu reembolso. Revisa tus opciones VIP.';
        } else {
          finalSpeech = 'Vuelo cancelado. He preparado tu reclamación legal y el reembolso. Tienes los detalles en pantalla.';
        }
      } else if (delay > 180) {
        if (travelProfile === 'premium') {
          finalSpeech = 'Retraso crítico. Descuida, ya gestiono tu compensación y he activado tu acceso a la Sala VIP. Relájate.';
        } else {
          finalSpeech = 'Retraso importante. Tienes derecho a indemnización. He generado tu reclamación oficial, revísala en pantalla.';
        }
      } else if (delay > 60) {
        if (travelProfile === 'premium') {
          finalSpeech = 'Retraso detectado. He preparado tu pase VIP y manutención por si la espera se alarga. Te aviso.';
        } else {
          finalSpeech = 'Retraso detectado. Si supera las 2 horas, solicita tus vales de comida. Sigo vigilando tu vuelo.';
        }
      }

      if (!finalSpeech) {
        finalSpeech = 'He detectado una incidencia en tu vuelo. Abre el chat con tu asistente para que analice tu situación específica.'
      }
      if (finalSpeech) speak(finalSpeech, selectedVoice)

      // 6) LA VENTANA DE CRISIS LA ABRE GlobalOverlays automáticamente
      //    (ya tiene el auto-trigger que se resetea con cada nuevo vuelo)

      setTimeout(() => {
         setBrowserLogs(prev => [...prev, `✅ Protocolo finalizado. Plan de contingencia desplegado.`]);
      }, 3000);

      setLastSearchId(prev => prev + 1);
    } catch (e) {
      setBrowserLogs(prev => [...prev, `❌ Fallo crítico en el motor de ejecución: Error de conexión.`]);
      setSearchError('Error de conexión con el servidor. Revisa el túnel ngrok.');
      console.error(e);
    } finally { setIsSearching(false); }
  };

  const clearFlight = () => {
    setFlightInput('');
    setFlightData(null);
    setSearchError(null);
    setActiveSearches([]); // Opcionalmente podemos dejar que esto solo borre el input
    AsyncStorage.removeItem('lastFlightInput');
    AsyncStorage.removeItem('lastFlightData');
    AsyncStorage.removeItem('activeSearches');
  };

  const removeActiveSearch = (flightNumber: string) => {
    setActiveSearches(prev => {
      const updated = prev.filter(f => f.flightNumber !== flightNumber);
      // Si borramos el que está en flightData, actualizamos flightData al siguiente o null
      if (flightData?.flightNumber === flightNumber) {
        setFlightData(updated.length > 0 ? updated[0] : null);
      }
      return updated;
    });
  };

  const showPlan = () => {
    Vibration.vibrate(50);
    setHasSeenPlan(true);
    if (prefetchedData) { setApiPlan(prefetchedData); setShowSOS(true); }
    else { fetchContingencyPlan(); }
  };

  const fetchContingencyPlan = async () => {
    // Plan local instantáneo: se muestra YA, sin esperar a la IA
    const allOptions: any[] = [
      { type: 'RÁPIDO', title: 'Ruta Alternativa Urgente', description: 'Vuelo directo de sustitución gestionado de forma prioritaria para evitar esperas.' },
      { type: 'ECONÓMICO', title: 'Gestión de Reembolso Inteligente', description: 'Trámite legal EU261 activo combinado con la mejor conexión de bajo coste disponible.' },
      { type: 'CONFORT', title: 'Plan de Estancia y Descanso', description: 'Noche en hotel seleccionado y salida programada para mañana con total comodidad.' }
    ];

    let finalOptions = allOptions;

    const instantPlan = {
      options: allOptions,
      impact: { hotelAlert: "He asegurado tu reserva de alojamiento. Sin riesgo de cancelación." }
    };

    if (travelProfile !== 'premium') {
      const econOption = instantPlan.options.find(
        (o: any) => o.type === 'ECONÓMICO'
      );
      const lockedCard = {
        type: 'VIP_LOCKED',
        title: '2 opciones más disponibles en VIP',
        description: 'Desbloquea la opción RÁPIDA y CONFORT con planes personalizados y gestión prioritaria.',
        actionType: 'locked'
      };
      setApiPlan({ ...instantPlan, options: [econOption, lockedCard] });
    } else {
      // MODO VIP: Única tarjeta maestra resolutiva (OPCIÓN 3 seleccionada por el usuario)
      const masterVIPOption = {
        type: 'RÁPIDO', 
        title: 'PROTOCOLO DE RESCATE PREMIUM', 
        description: 'Acceso directo a tu panel personalizado de alternativas. Vuelos, salas VIP y expedientes legales listos para ejecución inmediata.',
        aiReasoning: 'Protocolo Integral Activado: He unificado todas las vías de solución en tu panel de mando personal.',
        voiceScriptFinal: 'Protocolo de Rescate Premium activado. He analizado todas las alternativas y he preparado tu panel de mando personalizado. Tú tienes la última palabra.'
      };
      setApiPlan({ ...instantPlan, options: [masterVIPOption] });
    }
    setShowSOS(true); setHasSeenPlan(true); setIsGenerating(false);
    setSavedTime(prev => prev + 0.5); // Generar un plan ahorra 30 mins

    // En segundo plano: si la IA responde con algo mejor, se actualiza en silencio
    try {
      const response = await fetch(`${BACKEND_URL}/api/monitorFlight`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ 
          flightId: flightInput.trim() || 'TP404',
          travelProfile: travelProfile 
        })
      });
      const data = await response.json();
      if (data.contingencyPlan) {
        // LIMPIEZA DINÁMICA + FILTRO EJECUTIVO FORZOSO
        const cleanOptions = (data.contingencyPlan.options || []).map((o: any) => {
          let title = (o.title || '').replace(/\+\d+€/g, '').replace(/\d+€/g, '').replace(/€/g, '').trim();
          let desc = (o.description || '').replace(/\d+€/g, '').replace(/€/g, '').trim();
          
          if (travelProfile === 'premium') {
             // Reducimos a la tarjeta maestra si es VIP
             return {
                ...o,
                type: 'RÁPIDO',
                title: 'PROTOCOLO DE RESCATE PREMIUM',
                description: 'Acceso directo a tu panel personalizado de alternativas. Vuelos, salas VIP y expedientes legales listos para ejecución inmediata.',
                estimatedCost: 0
             };
          }
          
          return { ...o, title, description: desc, estimatedCost: 0 };
        });

        // Aseguramos que solo haya una opción si es VIP
        const finalOptions = travelProfile === 'premium' ? [cleanOptions[0]] : cleanOptions;
        
        setApiPlan({ ...data.contingencyPlan, options: finalOptions });
      }
    } catch (e) {
      console.error("Error IA (plan local ya visible):", e);
    }
  };

  const fetchAgentLogs = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/logs`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      const data = await response.json();
      if (Array.isArray(data)) setAgentLogs(data);
    } catch (e) {
      console.error('[Frontend] Error fetching logs:', e);
    }
  };

  const clearAgentLogs = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/logs`, { 
        method: 'DELETE',
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      setAgentLogs([]);
      setApiPlan(null);
      setHasSeenPlan(false);
      setPrefetchedData(null);
      setIsGenerating(false);
      setFlightData(null); // Reseteo total de datos de vuelo
      setFlightInput('');  // Limpieza del campo de búsqueda
      setMyFlights([]);   // Limpieza de vuelos locales guardados
      setSearchError(null);
      setSavedTime(0); // Reset savedTime on clearing logs
      setRecoveredMoney(0); // Reset recoveredMoney on clearing logs

      // Limpieza atómica de AsyncStorage
      await AsyncStorage.multiRemove([
        'lastFlightData',
        'lastFlightInput',
        'offline_agentLogs',
        'offline_myFlights'
      ]);

      Alert.alert('✅ COMPLETADO', 'Historial, de demos y planes de la IA vaciados correctamente.');
    } catch (e) {
      console.error('[Frontend] Error clearing logs:', e);
    }
  };

  const handleSendMessage = (directText?: string | any) => {
    const text = (typeof directText === 'string' ? directText : inputText).trim(); if (!text) return;
    const newMessage = { id: Date.now().toString(), text, isUser: true };
    const history = [...messages, newMessage];
    setMessages(history);
    setInputText(''); Keyboard.dismiss();

    (async () => {
      setIsTyping(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s for Gemini

      // Saneamiento estructural
      let safeHistory = history.slice(-10);
      while (safeHistory.length > 0 && !safeHistory[0].isUser) {
        safeHistory.shift();
      }

      try {
        const activeFlight = flightData?.flightNumber || flightInput.trim() || undefined;
        console.log(`[Chat] Enviando a backend: ${text} | Vuelo: ${activeFlight}`);

        const response = await fetch(`${BACKEND_URL}/api/chat`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
          body: JSON.stringify({
            text,
            history: safeHistory,
            flightId: activeFlight,
            travelProfile: travelProfile,
            flightContext: flightData ? {
              flightNumber: flightData.flightNumber,
              airline: flightData.airline,
              status: flightData.status,
              departureAirport: flightData.departure?.airport,
              arrivalAirport: flightData.arrival?.airport,
              delayMinutes: flightData.departure?.delay || 0,
            } : undefined,
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        const data = await response.json();
        
        if (data.text) {
            setMessages(prev => [...prev, { id: Date.now().toString(), text: data.text, isUser: false }]);
            speak(data.text);

            // ACCIÓN DINÁMICA: Si la IA dice que ha creado un documento, lo creamos de verdad en la Bóveda
            const responseLower = data.text.toLowerCase();
            if (responseLower.includes('he generado') || responseLower.includes('he creado') || responseLower.includes('plan de vuelos')) {
               const flightNum = flightData?.flightNumber || 'IB3166';
               const airport = flightData?.arrival?.airport || 'Destino';
               
               const chatDoc = {
                 id: `chat_doc_${Date.now()}`,
                 t: responseLower.includes('plan') ? `PLAN DE VUELOS ALTERNATIVOS ${flightNum}` : 'DOCUMENTO DE ASISTENCIA IA',
                 s: `Generado por IA el ${new Date().toLocaleDateString()} // Ref: ${flightNum}-${airport}`,
                 i: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400', // Imagen genérica de documento/laptop
                 source: 'ASISTENTE IA',
                 icon: '📄',
                 verified: true,
               };

               setTimeout(() => {
                 setExtraDocs((prev: any) => [chatDoc, ...prev]);
                 setHasNewDoc(true);
                 console.log("📄 [IA Action] Documento inyectado en la Bóveda desde el Chat.");
               }, 1000);
            }
        } else {
            throw new Error("Respuesta vacía del servidor.");
        }
      } catch (error: any) {
        clearTimeout(timeoutId);
        console.error("[Frontend] Chat Error:", error);
        let errorMsg = "¿Me lo puedes repetir? Tengo un problema de conexión temporal.";
        if (error.name === 'AbortError') errorMsg = "Sigo pensando tu respuesta, pero mi conexión ha tardado demasiado. Prueba de nuevo.";
        setMessages(prev => [...prev, { id: Date.now().toString(), text: errorMsg, isUser: false }]);
      } finally { 
        setIsTyping(false); 
      }
    })();
  };

  const saveMyFlight = async (flightNumber: string, alias?: string) => {
    if (!user?.email) return Alert.alert('Error', 'Inicia sesión primero');
    try {
      const response = await fetch(`${BACKEND_URL}/api/myFlights`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
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
      const response = await fetch(`${BACKEND_URL}/api/myFlights?email=${email}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      if (!response.ok) throw new Error("Network response not ok");
      const data = await response.json();
      if (Array.isArray(data)) {
        setMyFlights(data);
        AsyncStorage.setItem('offline_myFlights', JSON.stringify(data));
      }
    } catch (e) {
      console.log('📡 [OFFLINE MODE] Cargando vuelos desde caché local...');
      const cached = await AsyncStorage.getItem('offline_myFlights');
      if (cached) setMyFlights(JSON.parse(cached));
    }
  };

  const removeMyFlight = async (id: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/myFlights?id=${id}`, { 
        method: 'DELETE',
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      const data = await response.json();
      if (data.success && user?.email) loadMyFlights(user.email);
    } catch (e) {
      console.error('[Frontend] Error removing flight:', e);
    }
  };

  const loadMyTrips = async (email: string) => {
    try {
      const resp = await fetch(`${BACKEND_URL}/api/trips?email=${email}`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      if (!resp.ok) throw new Error("Network response not ok");
      const data = await resp.json();
      if (Array.isArray(data)) {
        setMyTrips(data);
        AsyncStorage.setItem('offline_myTrips', JSON.stringify(data));
      }
    } catch (e) {
      console.log('📡 [OFFLINE MODE] Cargando viajes desde caché local...');
      const cached = await AsyncStorage.getItem('offline_myTrips');
      if (cached) setMyTrips(JSON.parse(cached));
    }
  };

  const saveTrip = async (title: string, destination: string, hotelName?: string, hotelPhone?: string, flightNumber?: string, startDate?: string, endDate?: string) => {
    if (!user?.email) return Alert.alert('Error', 'Inicia sesión primero');
    try {
      const resp = await fetch(`${BACKEND_URL}/api/trips`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ 
          userEmail: user.email, 
          title, 
          destination, 
          hotelName, 
          hotelPhone, 
          flightNumber, 
          startDate, 
          endDate 
        })
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

  const updateTrip = async (tripId: string, hotelName?: string, hotelPhone?: string, flightNumber?: string) => {
    try {
      const resp = await fetch(`${BACKEND_URL}/api/trips/${tripId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ hotelName, hotelPhone, flightNumber })
      });
      const data = await resp.json();
      if (data.id && user?.email) {
        Alert.alert('Éxito', 'Viaje actualizado correctamente');
        loadMyTrips(user.email);
      }
    } catch (e: any) {
      console.error("Error actualizando viaje:", e);
      Alert.alert('Error de conexión', `No se pudo actualizar el viaje: ${e.message}. Verifica que el backend esté corriendo.`);
    }
  };

  // ✅ GENERACIÓN AUTOMÁTICA DE RECLAMACIONES DINÁMICAS (Importado de utils)

  // La generación ahora es impulsada directamente desde searchFlight para evitar problemas de async/useEffect

  const confirmFlightRescue = async (rescueData: any) => {
    if (!rescueData) return;
    
    setIsScanning(true);
    speak("Gestión de reubicación iniciada. Estoy conectando con los servicios de reserva para asegurar tu plaza.");
    
    // Simular latencia de red/agente
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 1. Actualizar Datos de Vuelo Globales (Congruencia)
    const newFlight = {
      ...flightData,
      flightNumber: rescueData.flightNumber || 'IB3167',
      airline: rescueData.airline || 'Iberia',
      status: 'scheduled',
      departure: {
        ...flightData?.departure,
        iata: flightData?.departure?.iata || 'MAD',
        delay: 0,
        estimated: new Date(Date.now() + 3600000).toISOString(), // 1h desde ahora
      },
      arrival: {
        ...flightData?.arrival,
        iata: flightData?.arrival?.iata || 'CDG',
        estimated: new Date(Date.now() + 10800000).toISOString(), // 3h desde ahora
      },
      isRescued: true
    };
    
    setFlightData(newFlight);
    AsyncStorage.setItem('lastFlightData', JSON.stringify(newFlight));
    
    // 2. Actualizar el documento en la Bóveda (De Propuesta a Confirmado)
    setExtraDocs((prev: any[]) => prev.map(doc => {
      if (doc.t?.includes('PROPUESTA RESCATE')) {
        return {
          ...doc,
          t: `TICKET CONFIRMADO: ${newFlight.flightNumber}`,
          s: `Reubicación Exitosa · Puerta ${Math.floor(Math.random() * 20) + 1}A`,
          icon: '✅',
          verified: true,
          isActionable: false, // Ya no se puede volver a ejecutar
          isConfirmed: true
        };
      }
      return doc;
    }));
    
    setIsScanning(false);
    speak(`Reserva completada con éxito. Te he reubicado en el vuelo ${newFlight.flightNumber}. Tienes tu nuevo pase de abordar en la sección de Documentos.`);
    
    // 3. Notificación local de éxito
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "✅ REUBICACIÓN COMPLETADA",
        body: `IA Agent ha confirmado tu plaza en el vuelo ${newFlight.flightNumber}. ¡Buen viaje!`,
        sound: true,
      },
      trigger: null,
    });
  };

  const removeTrip = async (id: string) => {
    try {
      await fetch(`${BACKEND_URL}/api/trips?id=${id}`, { 
        method: 'DELETE',
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      if (user?.email) loadMyTrips(user.email);
    } catch (e) {
      console.error("Error eliminando viaje:", e);
    }
  };

  const fetchWeather = async (location: string) => {
    try {
      const sanitized = location.toLowerCase().includes('bora bora') ? 'Bora Bora, French Polynesia' : location;
      const resp = await fetch(`${BACKEND_URL}/api/weather?location=${encodeURIComponent(sanitized)}`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      if (!resp.ok) throw new Error("Backend weather failed");
      const data = await resp.json();
      if (data.temp) {
        setWeatherMap(prev => ({ ...prev, [location.toLowerCase()]: data }));
      }
    } catch (e) {
      console.error(`Error cargando clima para ${location}:`, e);
      // Fallback local instantáneo si el backend falla
      const fallbacks: any = {
        'madrid': { temp: '18', condition: 'Despejado', icon: '☀️' },
        'barcelona': { temp: '19', condition: 'Soleado', icon: '☀️' },
        'londres': { temp: '12', condition: 'Lluvia', icon: '🌧️' },
        'london': { temp: '12', condition: 'Lluvia', icon: '🌧️' },
        'paris': { temp: '14', condition: 'Nublado', icon: '☁️' },
        'parís': { temp: '14', condition: 'Nublado', icon: '☁️' },
        'tokio': { temp: '16', condition: 'Parcialmente Nublado', icon: '⛅' },
        'tokyo': { temp: '16', condition: 'Parcialmente Nublado', icon: '⛅' },
        'bora bora': { temp: '28', condition: 'Tormenta tropical', icon: '⛈️' }
      };
      const query = location.toLowerCase();
      if (fallbacks[query]) {
        setWeatherMap(prev => ({ ...prev, [query]: fallbacks[query] }));
      }
    }
  };

  useEffect(() => {
    if (myTrips.length > 0) {
      myTrips.forEach((trip: any) => {
        const dest = trip.destination || (trip.title || '').split('|')[1]?.trim() || trip.title;
        if (dest && !weatherMap[dest.toLowerCase()]) {
          fetchWeather(dest);
        }
      });
    }
  }, [myTrips]);

  const removeExtraDoc = (id: string) => {
    console.log(`📡 [AppContext] Intentando borrar documento ID: ${id}`);
    setExtraDocs(prev => {
      let filtered = prev.filter((d: any) => d.id !== id);
      // Si no se borró nada por ID, intentar por título como respaldo
      if (filtered.length === prev.length) {
        const idx = prev.findIndex((d: any) => d.t === id || d.id === id);
        if (idx >= 0) filtered = [...prev.slice(0, idx), ...prev.slice(idx + 1)];
      }
      console.log(`📡 [AppContext] Quedan ${filtered.length} en la Bóveda.`);
      return filtered;
    });
  };

  const removeClaim = (id: string) => {
    const claim = claims.find(c => c.id === id);
    if (claim && claim.vuelo) {
      setDismissedClaims(prev => [...prev.filter(v => v !== claim.vuelo), claim.vuelo]);
    }
    setClaims(prev => prev.filter(c => c.id !== id));
  };

  const simulateGmailSync = () => {
    // 1. Estados iniciales obligatorios
    setIsExtracting(true);
    setBrowserLogs(['[Sistema] Iniciando sincronización segura con Google Mail...']);
    setShowBrowser(true);

    const dest = flightData?.arrival?.iata || flightData?.arrival?.airport || "GBL";
    const destName = (flightData?.arrival?.airport || "tu destino").toUpperCase();
    
    let docTitle = 'RESGUARDO PARKING';
    let docSub = `Parking P1 · Aeropuerto // Ticket ID: #G-9921`;
    let docIcon = '🅿️';
    let docImg = 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=400';

    if (destName.includes('MADRID') || dest === 'MAD') {
      docTitle = 'PARKING T4 BARAJAS';
      docSub = 'Plaza 422 - Planta 2 // Madrid Barajas';
    } else if (destName.includes('LONDRES') || destName.includes('LONDON') || ['LHR','LGW','STN'].includes(dest)) {
      docTitle = 'HEATHROW EXPRESS';
      docSub = 'Billete ida/vuelta · Confirmación: #HE-882';
      docIcon = '🚆';
      docImg = 'https://images.unsplash.com/photo-1544006659-f0b21f04cb1d?w=400';
    } else if (destName.includes('PARIS') || destName.includes('PARÍS') || ['CDG','ORY'].includes(dest)) {
      docTitle = 'TICKET RER B / DISNEY';
      docSub = 'Traslado Aeropuerto-Centro // Ref: #PAR-002';
      docIcon = '🚇';
      docImg = 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400';
    }

    // 2. Secuencia de logs con tiempos ajustados para visibilidad fluida
    const logs = [
        { t: 600, m: `🔐 Estableciendo túnel seguro con la pasarela de Google...` },
        { t: 1500, m: `🔍 Escaneando correos relacionados con ${destName}...` },
        { t: 2600, m: '📄 Filtrando adjuntos y metadatos de confirmación...' },
        { t: 3700, m: '🛡️ Verificando autenticidad y firmas digitales...' },
        { t: 4800, m: `🧠 IA detectó relevancia crítica: '${docTitle}'.` },
        { t: 5900, m: '⚙️ Encriptando copia local en Bóveda AES-256...' },
        { t: 6900, m: '✅ Extracción Élite finalizada. Registros sincronizados.' }
    ];

    logs.forEach(log => {
        setTimeout(() => {
            setBrowserLogs(prev => {
                // Evitamos duplicados si el Vigilante ya puso el suyo
                if (prev.includes(log.m)) return prev;
                return [...prev, log.m];
            });
        }, log.t);
    });
    // 3. Finalización y creación del documento
    setTimeout(() => {
      const newDoc = {
        id: `gmail_${Date.now()}`,
        t: docTitle,
        s: docSub,
        i: docImg,
        source: 'GMAIL',
        icon: docIcon,
        verified: true,
      };

      setExtraDocs((prev: any) => [newDoc, ...prev]);
      setHasNewDoc(true);
      
      speak(`Excelente noticia. He sincronizado tu correo y he localizado un documento relevante para tu viaje a ${destName}. He guardado tu ${docTitle.toLowerCase()} en la Bóveda.`);
      
      // No cerramos el navegador aquí, dejamos que el usuario vea el ✅ y pulse Volver
      Alert.alert('✅ EXTRACCIÓN COMPLETADA', `Se ha sincronizado tu correo. He detectado 1 documento nuevo: ${docTitle}.`);
      setIsExtracting(false);
    }, 7500);
  };

  const value = {
    user, authEmail, setAuthEmail, authName, setAuthName, authPassword, setAuthPassword, authMode, setAuthMode, authLoading,
    handleLogin, handleRegister, handleLogout,
    tab, setTab, showSOS, setShowSOS, showSOSMenu, setShowSOSMenu,
    selectedPlan, setSelectedPlan, viewDoc, setViewDoc, isScanning, setIsScanning, scanAnim, sosPulse,
    showChat, setShowChat, showBrowser, setShowBrowser, browserLogs, setBrowserLogs, legalShieldActive, setLegalShieldActive,
    claims, setClaims, removeClaim, clearAgentLogs, inputText, setInputText, messages, setMessages, isSpeaking, waveAnim, compensationEligible, setCompensationEligible,
    isGenerating, apiPlan, setApiPlan, isTyping, availableVoices, selectedVoice, setSelectedVoice, loadingStep, flightInput, setFlightInput,
    flightData, setFlightData, isSearching, searchError, planes, setPlanes, searchFlight, clearFlight, showPlan, fetchContingencyPlan, handleSendMessage,
    agentLogs, fetchAgentLogs,
    myFlights, saveMyFlight, loadMyFlights, removeMyFlight, simulatePushNotification,
    myTrips, saveTrip, loadMyTrips, removeTrip, updateTrip,
    weather: weatherMap,
    fetchWeather,
    hasSeenOnboarding, setHasSeenOnboarding,
    confirmFlightRescue,
    removeExtraDoc,
    hasNewDoc, setHasNewDoc,
    speak, stopSpeak, formatTime, getStatusColor, getStatusLabel, scrollViewRef,
    clearMessages, isDictating, startDictation, stopDictation,
    userPhone, setUserPhone,
    isReplayingTutorial, setIsReplayingTutorial,
    savedTime, setSavedTime,
    recoveredMoney, setRecoveredMoney,
    selectedRescuePlan, setSelectedRescuePlan,
    hasSeenPlan, setHasSeenPlan,
    activeSearches, removeActiveSearch,
    travelProfile, setTravelProfile,
    masterReset,
    pendingVIPRedirect, setPendingVIPRedirect,
    compBannerDismissed, setCompBannerDismissed,
    chatOrigin, setChatOrigin,
    showVIPAlternatives, setShowVIPAlternatives,
    pendingVIPScroll, setPendingVIPScroll,
    showCancellation, setShowCancellation,
    showPrivateVault, setShowPrivateVault,
    vaultPin, setVaultPin,
    extraDocs, setExtraDocs,
    isExtracting, simulateGmailSync,
    lastSearchId
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
