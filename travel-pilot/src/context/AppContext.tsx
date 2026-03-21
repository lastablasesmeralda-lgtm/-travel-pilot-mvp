import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Alert, Animated, Keyboard, Vibration } from 'react-native';
import * as Speech from 'expo-speech';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { auth, db } from '../../firebaseConfig';
import { BACKEND_URL } from '../../config';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Audio } from 'expo-av';
import { getEU261Amount } from '../utils/flightUtils';

type AppContextType = any;
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
      s: 'ID: ESP-9283 · Vigente',
      i: require('../../assets/pasaporte_puro.png'),
      source: 'DOCS',
      icon: '🛡️',
      verified: true,
      isDemo: true,
    },
    {
      id: 'demo-boarding-premium',
      t: 'TARJETA DE EMBARQUE',
      s: 'GATE 12A // FLIGHT TP-90',
      i: require('../../assets/tarjeta_embarque_pura.png'),
      source: 'GMAIL',
      icon: '🎫',
      verified: true,
      isDemo: true,
    },
    {
      id: 'demo-hotel-premium',
      t: 'RESERVA HOTEL',
      s: 'CONF: #88291-TX // MADRID',
      i: require('../../assets/reserva_hotel_pura.png'),
      source: 'OUTLOOK',
      icon: '🛌',
      verified: true,
      isDemo: true,
    }
  ];

  const [extraDocs, setExtraDocs] = useState<any[]>(demoItems);
  const [flightData, setFlightData] = useState<any>(null);
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
  const [isReplayingTutorial, setIsReplayingTutorial] = useState(false);
  const [travelProfile, setTravelProfile] = useState<'budget' | 'balanced' | 'premium'>('balanced');

  // ESTADO DE PLANES Y CRISIS RECUPERADO
  const [planes, setPlanes] = useState<any[]>([
    { id: '1', destino: 'PARÍS', status: 'OK', hora: 0, img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=500', co: '48.85 N, 2.35 E' },
    { id: '2', destino: 'TOKIO', status: 'OK', hora: 8, img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=500', co: '35.67 N, 139.65 E' }
  ]);

  const [dismissedClaims, setDismissedClaims] = useState<string[]>([]);

  // ✅ PERSISTENCIA DE VUELO EN ASYNCSTORAGE
  const [isStorageReady, setIsStorageReady] = useState(false);

  // Cargar vuelo al arrancar de forma segura
  useEffect(() => {
    const loadState = async () => {
      try {
        const savedInput = await AsyncStorage.getItem('lastFlightInput');
        if (savedInput) setFlightInput(savedInput);

        const savedData = await AsyncStorage.getItem('lastFlightData');
        if (savedData) {
          setFlightData(JSON.parse(savedData));
        }

        const savedClaims = await AsyncStorage.getItem('offline_claims');
        if (savedClaims) {
          const parsed = JSON.parse(savedClaims);
          if (Array.isArray(parsed)) setClaims(parsed);
        }

        const savedDismissed = await AsyncStorage.getItem('offline_dismissedClaims');
        if (savedDismissed) {
          const parsed = JSON.parse(savedDismissed);
          if (Array.isArray(parsed)) setDismissedClaims(parsed);
        }

        const savedDocs = await AsyncStorage.getItem('offline_extraDocs');
        if (savedDocs) {
          const parsed = JSON.parse(savedDocs);
          if (Array.isArray(parsed)) {
            // Asignar ID a documentos antiguos que no lo tienen
            const withIds = parsed.map((d: any, idx: number) => ({
              ...d,
              id: d.id || `legacy_${d.t || 'doc'}_${idx}_${Date.now()}`
            }));
            // Combinar: demos que NO estén ya guardados + los guardados
            const savedIds = withIds.map((d: any) => d.id);
            const missingDemos = demoItems.filter(d => !savedIds.includes(d.id));
            setExtraDocs([...missingDemos, ...withIds]);
          }
        }

        const savedPhone = await AsyncStorage.getItem('userPhone');
        if (savedPhone) setUserPhone(savedPhone);

        const savedProfile = await AsyncStorage.getItem('travelProfile');
        if (savedProfile) {
          setTravelProfile(savedProfile as 'budget' | 'balanced' | 'premium');
        }
      } catch (error) {
        console.error("Error loading from AsyncStorage:", error);
        setFlightData(null);
      } finally {
        // Load onboarding status
        AsyncStorage.getItem('hasSeenOnboarding').then(val => {
          setHasSeenOnboarding(val === 'true');
        });

        setIsStorageReady(true);
      }
    };
    loadState();
  }, []);

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
        // CARGA AUTOMÁTICA DE DEMO PARA BETA TESTERS
        // Si el usuario está logueado y no hay vuelo, cargamos el TP999 de cortesía
        if (user && !flightInput && !isSearching && !searchError) {
           setFlightInput('TP999');
           // Llamamos a la búsqueda interna para que el estado se actualice
           setTimeout(() => searchFlight(), 500);
        }
      }
    }
  }, [flightData, isStorageReady, user]);

  // Guardar rest de datos al cambiar
  useEffect(() => {
    if (isStorageReady) {
      AsyncStorage.setItem('offline_claims', JSON.stringify(claims));
    }
  }, [claims, isStorageReady]);

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
  }, [travelProfile, isStorageReady]);

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
      // Buscar voces en español (incluyendo variantes MX, US, etc.)
      const esVoices = voices.filter(v => v.language.startsWith('es'));
      
      console.log('--- REPORTE DE VOCES NATIVAS ES ---');
      esVoices.forEach((v, i) => console.log(`[ES-${i}] Nombre: ${v.name} | ID: ${v.identifier} | Lenguaje: ${v.language}`));
      console.log('-----------------------------------');
      
      try {
          fetch(`${BACKEND_URL}/api/logVoices`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ voices: esVoices })
          });
      } catch (e) {
          console.warn('No se pudieron logear las voces');
      }

      // Mapeo dinámico y traducción de identificadores nativos (iOS/Android)
      const categorizedVoices = esVoices.map(v => {
          let gender = 'unknown';
          const id = (v.identifier + ' ' + v.name).toLowerCase();
          
          // Clasificación absoluta basada en el hardware y feedback del usuario
          // Femeninas: a, b, c, e / Masculinas: d, f
          if (id.includes('monica') || id.includes('clara') || id.includes('paulina') || id.includes('luciana') || 
              id.includes('-esa') || id.includes('-esc') || id.includes('-esb') || id.includes('-ese')) {
              gender = 'female';
          } else if (id.includes('juan') || id.includes('carlos') || id.includes('jorge') || id.includes('diego') || 
                     id.includes('manuel') || id.includes('pablo') || id.includes('-esd') || id.includes('-esf')) {
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
      const esEsFemales = fPool.filter((v: any) => v.language === 'es-ES' || v.identifier.toLowerCase().includes('es-es'));
      const otherFemales = fPool.filter((v: any) => v.language !== 'es-ES' && !v.identifier.toLowerCase().includes('es-es'));
      
      const esEsMales = mPool.filter((v: any) => v.language === 'es-ES' || v.identifier.toLowerCase().includes('es-es'));
      const otherMales = mPool.filter((v: any) => v.language !== 'es-ES' && !v.identifier.toLowerCase().includes('es-es'));

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
      const fPremVoice = premiumFemalePool[0].identifier === luciaV.identifier && premiumFemalePool.length > 1 ? premiumFemalePool[1] : (premiumFemalePool[0] || fPool[0]);
      const claraV = { ...(fPremVoice || esVoices[0]), humanName: 'Clara', isPremium: true };
      
      const mPremVoice = premiumMalePool[0].identifier === javierV.identifier && premiumMalePool.length > 1 ? premiumMalePool[1] : (premiumMalePool[0] || mPool[0]);
      const marcoV = { ...(mPremVoice || esVoices[0]), humanName: 'Marco', isPremium: true };

      const roles = [luciaV, javierV, claraV, marcoV];

      // Insertamos uniqueId para evitar quejas de React si usamos la misma voz 2 veces
      const visibleRoles = roles.map((r, i) => ({ ...r, uniqueId: r.identifier + '_' + i }));

      setAvailableVoices(visibleRoles);
      
      if (visibleRoles.length > 0) {
        // Javier por defecto si existe, si no, la de Clara (index 0)
        const defaultVoiceId = javierV.identifier || visibleRoles[0].identifier;
        setSelectedVoice(defaultVoiceId);
      }
    })();

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

    return () => clearInterval(timer);
  }, []);

  // SIMULACIÓN DE LOGS DEL NAVEGADOR ASISTENTE (DINÁMICA)
  useEffect(() => {
    let interval: any;
    if (showBrowser && selectedPlan) {
      const airline = flightData?.airline || "Travel-Pilot Air";
      const destCity = flightData?.arrival?.airport || "tu destino";
      const routeStr = flightData ? `${flightData.departure?.iata} → ${flightData.arrival?.iata}` : "tu ruta";

      const sequence = [
        "> Iniciando conexión segura con Travel-Core...",
        "> 🔓 Conexión cifrada establecida con servidor central...",
        `> 🌐 Entrando en portal de contingencias de ${airline}...`,
        `> 🔍 Buscando la mejor ruta para el tramo ${routeStr}...`
      ];

      if (selectedPlan.actionType === 'hotel' || selectedPlan.type?.includes('CONFORT')) {
        sequence.push(`> 🏨 Reservando estancia de emergencia en ${destCity}...`);
        sequence.push("> 🛌 Confirmando disponibilidad de habitación y servicios...");
        sequence.push("> ✉️ Enviando bono de alojamiento a tu Bóveda...");
      } else if (selectedPlan.type?.includes('ECONÓMIC')) {
        sequence.push(`> ⚖️ Activando protocolo de reclamación EU261 por ${airline}...`);
        sequence.push("> 🍔 Solicitando bono de restauración para la espera...");
        sequence.push("> ✅ Gestión de compensación iniciada en segundo plano...");
      } else {
        sequence.push(`> ✨ ¡Vuelo preferente detectado! Bloqueando plaza temporal...`);
        sequence.push(`> 📋 Sincronizando datos de pasaje con ${airline}...`);
        sequence.push("> ✅ Recalculando itinerario óptimo para llegada hoy...");
      }

      sequence.push("> ✅ Operación completada con éxito. Actualizando tu App.");

      let step = 0;
      setBrowserLogs([sequence[0]]);
      step = 1;

      interval = setInterval(() => {
        if (step < sequence.length) {
          setBrowserLogs(prev => [...prev, sequence[step]]);
          step++;
        } else {
          clearInterval(interval);
        }
      }, 1200);
    } else if (!showBrowser) {
      setBrowserLogs([]);
    }
    return () => clearInterval(interval);
  }, [showBrowser, selectedPlan]);

  useEffect(() => {
    const sub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser?.email) {
        loadMyFlights(firebaseUser.email);
        loadMyTrips(firebaseUser.email);
        registerForPushNotificationsAsync(firebaseUser.email);
      }
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
        try { await recordingRef.current.stopAndUnloadAsync(); } catch(e) {}
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
      const token = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId || 'd63abcdb-7fed-46b7-8d1f-5d7a72d98550',
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
      });
    } catch (e) {
      console.log("No se pudo obtener el token push remoto, pero las alertas locales funcionarán:", e);
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
    if (!authEmail || !authPassword || !authName) return Alert.alert('Registro', 'Introduce nombre, email y contraseña.');
    if (authMode === 'register' && !userPhone) return Alert.alert('Registro', 'El teléfono SOS es obligatorio para el blindaje.');
    
    try { 
      setAuthLoading(true); 
      const cred = await createUserWithEmailAndPassword(auth, authEmail, authPassword); 
      await updateProfile(cred.user, { displayName: authName });
      
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

      Alert.alert('Registro', 'Éxito. ¡Bienvenido a Travel-Pilot!'); 
    }
    catch (e: any) { Alert.alert('Error', e.message); } finally { setAuthLoading(false); }
  };

  const handleLogin = async () => {
    if (!authEmail || !authPassword) return Alert.alert('Login', 'Introduce email y contraseña.');
    try { setAuthLoading(true); await signInWithEmailAndPassword(auth, authEmail, authPassword); }
    catch (e: any) { Alert.alert('Error', e.message); } finally { setAuthLoading(false); }
  };

  const handleLogout = async () => { await signOut(auth); };

  const speak = (text: string, overrideVoiceId?: string) => {
    setIsSpeaking(true);
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(waveAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ])
    ).start();
    Speech.speak(text, { language: 'es-ES', voice: overrideVoiceId || selectedVoice || undefined, onDone: () => stopSpeak() });
  };

  const stopSpeak = () => { Speech.stop(); setIsSpeaking(false); waveAnim.stopAnimation(); };

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
      const data = await response.json();
      setFlightData(data);
      if (data.departure?.delay >= 180) {
        setCompensationEligible(true);
      }
      if (data.departure?.delay >= 120 || data.status === 'cancelled') {
        showPlan();
      }
      prefetchPlan();
    } catch (e) {
      setSearchError('Error de conexión con el servidor. Revisa el túnel ngrok.');
      console.error(e);
    } finally { setIsSearching(false); }
  };

  const clearFlight = () => {
    setFlightInput('');
    setFlightData(null);
    setSearchError(null);
    AsyncStorage.removeItem('lastFlightInput');
    AsyncStorage.removeItem('lastFlightData');
  };

  const showPlan = () => { 
    Vibration.vibrate(50); 
    setHasSeenPlan(true);
    if (prefetchedData) { setApiPlan(prefetchedData); setShowSOS(true); }
    else { fetchContingencyPlan(); }
  };

  const fetchContingencyPlan = async () => {
    setIsGenerating(true); setApiPlan(null); setShowSOS(true); setLoadingStep(0); setHasSeenPlan(true);
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
          { type: 'RÁPIDO', title: 'Ruta Alternativa Urgente', description: 'Vuelo directo de sustitución gestionado de forma prioritaria para evitar esperas.', estimatedCost: 850 },
          { type: 'ECONÓMICO', title: 'Gestión de Reembolso Inteligente', description: 'Trámite legal EU261 activo combinado con la mejor conexión de bajo coste disponible.', estimatedCost: 150 },
          { type: 'EQUILIBRADO', title: 'Plan de Estancia y Descanso', description: 'Noche en hotel seleccionado y salida programada para mañana con total comodidad.', estimatedCost: 300 }
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

  const clearAgentLogs = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/logs`, { method: 'DELETE' });
      setAgentLogs([]);
      Alert.alert('✅ COMPLETADO', 'Historial de actividad de la IA vaciado correctamente.');
    } catch (e) {
      console.error('[Frontend] Error clearing logs:', e);
    }
  };

  const handleSendMessage = () => {
    const text = inputText.trim(); if (!text) return;
    const newMessage = { id: Date.now().toString(), text, isUser: true };
    const history = [...messages, newMessage];
    setMessages(history);
    setInputText(''); Keyboard.dismiss();
    (async () => {
      setIsTyping(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); 

      try {
        const response = await fetch(`${BACKEND_URL}/api/chat`, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ 
            text, 
            history: history.slice(-10),
            flightId: flightInput.trim() || undefined
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        const data = await response.json();
        const aiText = data.text || "Lo siento, mi conexión táctica ha fallado.";
        setMessages(prev => [...prev, { id: Date.now().toString(), text: aiText, isUser: false }]);
        speak(aiText);
      } catch (error: any) {
        clearTimeout(timeoutId);
        console.error("[Frontend] Chat Error Details:", error);
        let errorMsg = "Vaya, parece que mi conexión se ha cortado un segundo. ¿Puedes repetirme eso?";
        if (error.name === 'AbortError') errorMsg = "Estoy tardando un poco más de lo normal en pensar. Por favor, vuelve a intentarlo ahora.";
        setMessages(prev => [...prev, { id: Date.now().toString(), text: errorMsg, isUser: false }]);
        speak("Perdona, he perdido la conexión un momento.");
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

  // ✅ GENERACIÓN AUTOMÁTICA DE RECLAMACIONES DINÁMICAS (Importado de utils)

  useEffect(() => {
    // Si hay datos, hay compensacion y NO esta en la lista de purgados
    if (compensationEligible && flightData) {
      if (dismissedClaims.includes(flightData.flightNumber)) return;
      if (claims.find(c => c.vuelo === flightData.flightNumber)) return;

      const amount = getEU261Amount(flightData);
      const newClaim = {
        id: `C-${flightData.flightNumber}-${Date.now()}`,
        aerolinea: flightData.airline || 'Aerolínea',
        vuelo: flightData.flightNumber,
        ruta: `${flightData.departure?.iata} > ${flightData.arrival?.iata}`,
        estado: 'EXPEDIENTE PREPARADO',
        compensacion: amount,
        isDynamic: true
      };
      
      setClaims(prev => [newClaim, ...prev]);
    }
  }, [compensationEligible, flightData, dismissedClaims]);

  const removeTrip = async (id: string) => {
    try {
      await fetch(`${BACKEND_URL}/api/trips?id=${id}`, { method: 'DELETE' });
      if (user?.email) loadMyTrips(user.email);
    } catch (e) {
      console.error("Error eliminando viaje:", e);
    }
  };

  const fetchWeather = async (location: string) => {
    try {
      const resp = await fetch(`${BACKEND_URL}/api/weather?location=${encodeURIComponent(location)}`);
      const data = await resp.json();
      if (data.temp) {
        setWeatherMap(prev => ({ ...prev, [location.toLowerCase()]: data }));
      }
    } catch (e) {
      console.error(`Error cargando clima para ${location}:`, e);
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
    setIsExtracting(true);
    setTimeout(() => {
      // Simulamos que la IA ha detectado un ticket de parking en el email relacionado con este viaje
      const airport = flightData?.departure?.airport || "Aeropuerto de origen";
      const newDoc = {
        id: `parking_${Date.now()}`,
        t: 'RESGUARDO PARKING',
        s: `Parking P1 · ${airport} // Ticket ID: #G-9921`,
        i: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=400',
        source: 'GMAIL',
        icon: '🅿️',
        verified: true,
      };
      
      setExtraDocs(prev => [...prev, newDoc]);
      setIsExtracting(false);
      Alert.alert('✅ EXTRACCIÓN COMPLETADA', 'IA ha detectado y extraído 1 documento nuevo: Ticket de Parking (P1) detectado en tu cuenta de correo.');
    }, 4500);
  };

  const value = {
    user, authEmail, setAuthEmail, authPassword, setAuthPassword, authMode, setAuthMode, authLoading,
    handleLogin, handleRegister, handleLogout,
    tab, setTab, showSOS, setShowSOS, showSOSMenu, setShowSOSMenu,
    selectedPlan, setSelectedPlan, viewDoc, setViewDoc, isScanning, setIsScanning, scanAnim, sosPulse,
    showChat, setShowChat, showBrowser, setShowBrowser, browserLogs, setBrowserLogs, legalShieldActive, setLegalShieldActive,
    claims, setClaims, removeClaim, clearAgentLogs, inputText, setInputText, messages, setMessages, isSpeaking, waveAnim, compensationEligible, setCompensationEligible,
    isGenerating, apiPlan, setApiPlan, isTyping, availableVoices, selectedVoice, setSelectedVoice, loadingStep, flightInput, setFlightInput,
    flightData, setFlightData, isSearching, searchError, planes, setPlanes, searchFlight, clearFlight, showPlan, fetchContingencyPlan, handleSendMessage,
    agentLogs, fetchAgentLogs,
    myFlights, saveMyFlight, loadMyFlights, removeMyFlight, simulatePushNotification,
    myTrips, saveTrip, loadMyTrips, removeTrip,
    weather: weatherMap,
    fetchWeather,
    hasSeenOnboarding, setHasSeenOnboarding,
    isExtracting, simulateGmailSync, extraDocs, setExtraDocs, removeExtraDoc,
    hasNewDoc, setHasNewDoc,
    speak, stopSpeak, formatTime, getStatusColor, getStatusLabel, scrollViewRef,
    clearMessages, isDictating, startDictation, stopDictation,
    userPhone, setUserPhone,
    isReplayingTutorial,
    setIsReplayingTutorial,
    travelProfile,
    setTravelProfile,
    selectedRescuePlan,
    setSelectedRescuePlan,
    hasSeenPlan,
    setHasSeenPlan
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
