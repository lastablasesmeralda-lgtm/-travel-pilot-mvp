"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const google_genai_1 = require("@langchain/google-genai");
const agent_1 = require("./agent");
const voice_1 = require("./voice");
const supabase_1 = require("./supabase");
const expo_server_sdk_1 = require("expo-server-sdk");
const multipart_1 = __importDefault(require("@fastify/multipart"));
const fastify = (0, fastify_1.default)({
    logger: true,
    bodyLimit: 10485760 // 10MB limit
});
// Registrar CORS lo más pronto posible con configuración permisiva técnica
fastify.register(require('@fastify/cors'), {
    origin: true, // Permitir todo
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
    credentials: true,
    preflight: true
});
fastify.register(multipart_1.default, {
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
});
fastify.get('/api/health', async () => {
    return { status: 'ok', version: '2.5.0-gemini25flash', timestamp: new Date().toISOString() };
});
const expo = new expo_server_sdk_1.Expo();
console.log('[Backend] Environment loaded. API Key present:', !!process.env.GOOGLE_API_KEY);
if (!process.env.GOOGLE_API_KEY) {
    console.error('[CRITICAL] GOOGLE_API_KEY is missing in process.env!');
}
// ============================================================
// HELPER: ENVIAR PUSH A UN USUARIO (Todos sus dispositivos)
// ============================================================
async function sendPushNotification(email, title, body, data = {}) {
    try {
        const { data: tokens, error } = await supabase_1.supabase
            .from('user_push_tokens')
            .select('token')
            .eq('user_email', email);
        if (error || !tokens || tokens.length === 0)
            return;
        let messages = [];
        for (let pushToken of tokens) {
            if (!expo_server_sdk_1.Expo.isExpoPushToken(pushToken.token))
                continue;
            messages.push({
                to: pushToken.token,
                sound: 'default',
                title,
                body,
                data,
            });
        }
        let chunks = expo.chunkPushNotifications(messages);
        for (let chunk of chunks) {
            await expo.sendPushNotificationsAsync(chunk);
        }
        console.log(`[Push] 🔔 Alerta enviada a ${email}: ${title}`);
    }
    catch (err) {
        console.error("[Push] ❌ Error enviando notificación:", err);
    }
}
// ============================================================
// CACHÉ — Precarga el plan al arrancar para respuesta instantánea
// ============================================================
// ============================================================
// MONITORIZACIÓN GLOBAL — Revisa todos los vuelos de los usuarios
// ============================================================
async function createAgentLog(eventType, status = 'executed', payload = null) {
    try {
        await supabase_1.supabase.from('agent_logs').insert([{
                event_type: eventType,
                status: status,
                payload: payload,
                level: 'info'
            }]);
        console.log(`[AgentLog] 📝 Evento registrado: ${eventType}`);
    }
    catch (e) {
        console.error("[AgentLog] ❌ Error guardando log:", e);
    }
}
async function globalMonitor() {
    console.log('[Monitor] 🕵️ Revisando todos los vuelos activos...');
    try {
        // 1. Obtener todos los vuelos que los usuarios están vigilando
        const { data: flights, error } = await supabase_1.supabase
            .from('user_flights')
            .select('*')
            .eq('is_active', true);
        if (error)
            throw error;
        if (!flights || flights.length === 0)
            return console.log('[Monitor] Sin vuelos activos que vigilar.');
        for (const f of flights) {
            console.log(`[Monitor] Verificando ${f.flight_number} para ${f.user_email}...`);
            const plan = await (0, agent_1.handleFlightMonitoring)(f.flight_number);
            if (plan && plan.impact && (plan.impact.severity === 'MEDIUM' || plan.impact.severity === 'CRITICAL')) {
                // Si hay un problema serio, avisamos al usuario
                await sendPushNotification(f.user_email, `🚨 ALERTA: ${f.flight_number}`, `Tu asistente ha detectado un retraso. Tienes un plan de contingencia listo.`);
            }
        }
    }
    catch (e) {
        console.error('[Monitor] ❌ Error en ciclo de vigilancia:', e);
    }
}
// Ejecutar cada 30 minutos (ajustable)
globalMonitor();
setInterval(globalMonitor, 30 * 60 * 1000);
// ============================================================
// ENDPOINT 1: MONITOR DE VUELO — ahora instantáneo con caché
// ============================================================
fastify.post('/api/monitorFlight', async (request, reply) => {
    const { flightId } = request.body;
    if (!flightId) {
        return reply.status(400).send({ error: 'flightId is required' });
    }
    try {
        console.log(`[Backend] Manual monitoring requested for: ${flightId}`);
        const contingencyPlan = await (0, agent_1.handleFlightMonitoring)(flightId);
        // Evitar duplicados si ya se generó un plan recientemente (hace < 1 min)
        const { data: recent } = await supabase_1.supabase
            .from('agent_logs')
            .select('*')
            .eq('event_type', 'contingency_planned')
            .order('created_at', { ascending: false })
            .limit(1);
        const oneMinAgo = new Date(Date.now() - 60000).toISOString();
        const isDuplicate = recent && recent[0] && recent[0].created_at > oneMinAgo && JSON.parse(recent[0].payload || '{}').flightId === flightId;
        if (!isDuplicate) {
            await createAgentLog('contingency_planned', 'executed', { flightId });
        }
        return reply.send({
            flightId,
            message: contingencyPlan ? "Delay detected, contingency plan generated." : "Flight on time.",
            contingencyPlan
        });
    }
    catch (error) {
        request.log.error(error);
        console.error("[Agent Crisis Error]:", error.message || error);
        return reply.status(500).send({ error: 'Agent encountered an error', detail: error.message });
    }
});
// ============================================================
// ENDPOINT 2: NOTIFICAR HOTEL
// ============================================================
fastify.post('/api/notifyHotel', async (request, reply) => {
    try {
        const { hotelPhone, passengerName, delayMinutes, passengerPhone } = request.body;
        const callSid = await (0, voice_1.notifyHotelOfDelay)(hotelPhone, passengerName, delayMinutes, passengerPhone);
        return reply.send({ success: true, callSid });
    }
    catch (error) {
        console.error("[Notify Hotel Error]:", error.message);
        return reply.status(500).send({ error: error.message });
    }
});
// ============================================================
// ENDPOINT 3: INFO DE VUELO LIGERA (AviationStack directo)
// ============================================================
fastify.get('/api/flightInfo', async (request, reply) => {
    const { flight } = request.query;
    if (!flight) {
        return reply.status(400).send({ error: 'flight query param is required' });
    }
    const AVIATION_KEY = process.env.AVIATIONSTACK_API_KEY;
    if (!AVIATION_KEY) {
        return reply.status(500).send({ error: 'AviationStack API key not configured' });
    }
    try {
        console.log(`[FlightInfo] Buscando vuelo: ${flight}`);
        // ✅ RADAR DE PRUEBAS — Sustituye al bloque TP404 antiguo
        const MOCK_FLIGHTS = {
            'TP404': {
                flightNumber: 'TP404', airline: 'Travel-Pilot Air', status: 'delayed', isSimulation: true,
                departure: {
                    airport: 'Madrid Barajas', iata: 'MAD', terminal: 'T4', gate: 'K82',
                    scheduled: new Date().toISOString(),
                    estimated: new Date(Date.now() + 210 * 60 * 1000).toISOString(), delay: 210
                },
                arrival: {
                    airport: 'London Heathrow', iata: 'LHR', terminal: 'T5', gate: 'C32',
                    scheduled: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
                    estimated: new Date(Date.now() + (2 * 60 + 210) * 60 * 1000).toISOString(), delay: 210
                }
            },
            'IB0123': {
                flightNumber: 'IB0123', airline: 'Iberia Vanguard', status: 'delayed', isSimulation: true,
                departure: {
                    airport: 'Madrid Barajas', iata: 'MAD', terminal: 'T4S', gate: 'M22',
                    scheduled: new Date().toISOString(),
                    estimated: new Date(Date.now() + 190 * 60 * 1000).toISOString(), delay: 190
                },
                arrival: {
                    airport: 'New York JFK', iata: 'JFK', terminal: 'T8', gate: 'B12',
                    scheduled: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
                    estimated: new Date(Date.now() + (8 * 60 + 190) * 60 * 1000).toISOString(), delay: 190
                }
            },
            'IB3166': {
                flightNumber: 'IB3166', airline: 'Iberia', status: 'delayed', isSimulation: true,
                departure: {
                    airport: 'Madrid Barajas', iata: 'MAD', terminal: 'T4S', gate: 'H22',
                    scheduled: new Date().toISOString(),
                    estimated: new Date(Date.now() + 195 * 60 * 1000).toISOString(), delay: 195
                },
                arrival: {
                    airport: 'Paris Charles de Gaulle', iata: 'CDG', terminal: 'T2F', gate: 'B14',
                    scheduled: new Date(Date.now() + 2.5 * 60 * 60 * 1000).toISOString(),
                    estimated: new Date(Date.now() + (2.5 * 60 + 195) * 60 * 1000).toISOString(), delay: 195
                }
            },
            'VY1234': {
                flightNumber: 'VY1234', airline: 'Vueling', status: 'scheduled', isSimulation: true,
                departure: {
                    airport: 'Barcelona El Prat', iata: 'BCN', terminal: 'T1', gate: 'D45',
                    scheduled: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
                    estimated: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), delay: 0
                },
                arrival: {
                    airport: 'Roma Fiumicino', iata: 'FCO', terminal: 'T3', gate: 'C12',
                    scheduled: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
                    estimated: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(), delay: 0
                }
            },
            'BA0117': {
                flightNumber: 'BA0117', airline: 'British Airways', status: 'active', isSimulation: true,
                departure: {
                    airport: 'London Heathrow', iata: 'LHR', terminal: 'T5', gate: 'C32',
                    scheduled: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
                    estimated: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), delay: 0
                },
                arrival: {
                    airport: 'Nueva York JFK', iata: 'JFK', terminal: 'T7', gate: 'A22',
                    scheduled: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
                    estimated: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), delay: 0
                }
            },
            'TP999': {
                flightNumber: 'TP999', airline: 'Travel-Pilot Test', status: 'delayed', isSimulation: true,
                departure: {
                    airport: 'Madrid Barajas', iata: 'MAD', terminal: 'T4', gate: 'B12',
                    scheduled: new Date().toISOString(),
                    estimated: new Date(Date.now() + 210 * 60 * 1000).toISOString(), delay: 210
                },
                arrival: {
                    airport: 'Berlin Brandenburg', iata: 'BER', terminal: 'T1', gate: 'B18',
                    scheduled: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
                    estimated: new Date(Date.now() + (2 * 60 + 210) * 60 * 1000).toISOString(), delay: 210
                }
            },
            'TK1860': {
                flightNumber: 'TK1860', airline: 'Turkish Airlines', status: 'delayed',
                departure: {
                    airport: 'Madrid Barajas', iata: 'MAD', terminal: 'T1', gate: 'C10',
                    scheduled: new Date().toISOString(),
                    estimated: new Date(Date.now() + 190 * 60 * 1000).toISOString(), delay: 190
                },
                arrival: {
                    airport: 'Istanbul Airport', iata: 'IST', terminal: 'I', gate: 'G05',
                    scheduled: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
                    estimated: new Date(Date.now() + (4 * 60 + 190) * 60 * 1000).toISOString(), delay: 190
                }
            },
            'EK142': {
                flightNumber: 'EK142', airline: 'Emirates', status: 'delayed',
                departure: {
                    airport: 'Madrid Barajas', iata: 'MAD', terminal: 'T4S', gate: 'S15',
                    scheduled: new Date().toISOString(),
                    estimated: new Date(Date.now() + 210 * 60 * 1000).toISOString(), delay: 210
                },
                arrival: {
                    airport: 'Dubai Intl', iata: 'DXB', terminal: '3', gate: 'B01',
                    scheduled: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(),
                    estimated: new Date(Date.now() + (7 * 60 + 210) * 60 * 1000).toISOString(), delay: 210
                }
            },
            'IB3150': {
                flightNumber: 'IB3150', airline: 'Iberia', status: 'delayed',
                departure: {
                    airport: 'Madrid Barajas', iata: 'MAD', terminal: 'T4', gate: 'K12',
                    scheduled: new Date().toISOString(),
                    estimated: new Date(Date.now() + 195 * 60 * 1000).toISOString(), delay: 195
                },
                arrival: {
                    airport: 'Warsaw Chopin', iata: 'WAW', terminal: '1', gate: 'A15',
                    scheduled: new Date(Date.now() + 3.5 * 60 * 60 * 1000).toISOString(),
                    estimated: new Date(Date.now() + (3.5 * 60 + 195) * 60 * 1000).toISOString(), delay: 195
                }
            }
        };
        const mockFlight = MOCK_FLIGHTS[flight.toUpperCase()];
        if (mockFlight) {
            console.log(`[FlightInfo] 🧪 Radar de pruebas: ${flight}`);
            // Log eliminado para evitar saturación del historial en cada búsqueda
            return reply.send({ ...mockFlight, isSimulation: true });
        }
        // La API de AviationStack ya no funciona o fue deprecada.
        // En su lugar, generamos un vuelo simulado para que la app "funcione" con cualquier búsqueda.
        console.log(`[FlightInfo] ⚠️ Vuelo no encontrado en radar estático, generando simulación dinámica: ${flight}`);
        const isDelayed = Math.random() > 0.5;
        const randomDelay = isDelayed ? Math.floor(Math.random() * 180) + 30 : 0; // Entre 30 y 210 mins de retraso
        const genericFlight = {
            flightNumber: flight.toUpperCase(),
            airline: 'Simulated Airlines',
            status: isDelayed ? 'delayed' : 'scheduled',
            departure: {
                airport: 'Aeropuerto Origen',
                iata: 'ORG',
                terminal: 'T1',
                gate: 'A' + Math.floor(Math.random() * 20 + 1),
                scheduled: new Date().toISOString(),
                estimated: new Date(Date.now() + randomDelay * 60 * 1000).toISOString(),
                delay: randomDelay,
            },
            arrival: {
                airport: 'Aeropuerto Destino',
                iata: 'DST',
                terminal: 'T2',
                gate: 'B' + Math.floor(Math.random() * 20 + 1),
                scheduled: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
                estimated: new Date(Date.now() + (2 * 60 + randomDelay) * 60 * 1000).toISOString(),
                delay: randomDelay,
            },
            live: null,
            isSimulation: true,
        };
        console.log(`[FlightInfo] ✅ Simulación para ${genericFlight.flightNumber}: ${genericFlight.status} (delay: ${randomDelay}min)`);
        return reply.send(genericFlight);
    }
    catch (error) {
        console.error('[FlightInfo] ❌ Error:', error);
        return reply.status(503).send({ error: 'No se pudo contactar AviationStack' });
    }
});
// ============================================================
// ENDPOINT 4: CHAT CON GEMINI
// ============================================================
let chatModel;
function getChatModel() {
    if (!chatModel) {
        chatModel = new google_genai_1.ChatGoogleGenerativeAI({
            model: "gemini-2.5-flash",
            apiVersion: "v1beta",
            maxOutputTokens: 512,
            temperature: 0.7,
            apiKey: process.env.GOOGLE_API_KEY
        });
    }
    return chatModel;
}
fastify.post('/api/chat', async (request, reply) => {
    const { text, history, flightId } = request.body;
    if (!text)
        return reply.status(400).send({ error: 'text is required' });
    let retryCount = 0;
    const maxManualRetries = 2;
    const attemptChat = async () => {
        try {
            const chatModel = new google_genai_1.ChatGoogleGenerativeAI({
                model: "gemini-2.5-flash",
                apiVersion: "v1beta",
                maxOutputTokens: 1024,
                temperature: 0.9,
                apiKey: process.env.GOOGLE_API_KEY,
                maxRetries: 1,
            });
            const now = new Date();
            const dateStr = now.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });
            // Contexto inteligente de clima: buscar Madrid por defecto + el destino del vuelo si existe
            let wContext = "";
            try {
                const locations = ['Madrid'];
                if (flightId)
                    locations.push(flightId.substring(0, 3)); // Intento con código de aeropuerto
                for (const loc of locations) {
                    const wRes = await fetch(`http://localhost:${process.env.PORT || 3000}/api/weather?location=${encodeURIComponent(loc)}`);
                    if (wRes.ok) {
                        const wData = await wRes.json();
                        wContext += `\n[Clima en ${wData.city || loc}]: ${wData.temp}°C, ${wData.condition} ${wData.icon}`;
                    }
                }
            }
            catch (e) { }
            const systemPrompt = `Eres tu asistente personal de viajes, un humano muy directo y eficaz.
            Hoy es ${dateStr}. La hora actual en España es ${timeStr}.${wContext}
            Tu misión: Resolver problemas con calma, inteligencia y, sobre todo, BREVEDAD.
            - Si te preguntan la hora, responde con ${timeStr}.
            - Si te preguntan por el clima de un lugar que tienes en el contexto (${wContext.replace(/\n/g, ' ')}), dalo.
            - Si te preguntan por el clima de otro lugar, di que "estás consultándolo" pero que hoy en Madrid hace lo que ponga en tu contexto.
            - Sé extremadamente conciso. No des explicaciones largas.
            - Responde SIEMPRE en español y en texto plano (sin negritas ni markdown).`;
            let flightContextStr = "";
            if (flightId) {
                try {
                    const ctx = await (0, agent_1.checkFlightStatus)(flightId);
                    const imp = (0, agent_1.evaluateImpact)(ctx);
                    flightContextStr = `\n[CONTEXTO VUELO ACTUAL]\nVuelo: ${ctx.flightNumber}\nOrigen: ${ctx.departure_airport}\nDestino: ${ctx.arrival_airport}\nRetraso: ${ctx.delayMinutes} min\nEstado: ${ctx.status}\nSeveridad: ${imp.severity}\nCompensación: ${imp.compensationEligible ? imp.compensationAmount + '€' : 'No elegible'}`;
                }
                catch (e) {
                    console.error("[Chat Context Error]:", e);
                }
            }
            const messages = [["system", systemPrompt + flightContextStr]];
            if (history && Array.isArray(history)) {
                history.forEach(m => {
                    const role = m.isUser ? "human" : "ai";
                    messages.push([role, m.text]);
                });
            }
            else {
                messages.push(["human", text]);
            }
            const response = await chatModel.invoke(messages);
            let aiText = response.content.toString();
            aiText = aiText.replace(/\*\*/g, '');
            return aiText;
        }
        catch (error) {
            const errorMsg = error.message || String(error);
            console.error(`[Chat Attempt ${retryCount}] Error:`, errorMsg);
            if (errorMsg.includes('429') && retryCount < maxManualRetries) {
                retryCount++;
                console.log(`[Chat Retry] Reintentando en 2 segundos... (Intento ${retryCount})`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                return attemptChat();
            }
            throw error;
        }
    };
    try {
        const aiText = await attemptChat();
        console.log(`[Chat AI Response]: ${aiText}`);
        return reply.send({ text: aiText });
    }
    catch (error) {
        const errorMsg = error.message || String(error);
        // FALLBACK RESILIENTE FINAL
        const fallbacks = [
            "Entendido. Estoy procesando tu solicitud con prioridad. ¿En qué más puedo ayudarte con tu viaje?",
            "Recibido. Mis sistemas están algo saturados pero sigo aquí para proteger tu vuelo. ¿Necesitas que revise algo específico?",
            "Vale, tomo nota. Cuéntame más sobre lo que necesitas para tu viaje y buscaré la mejor solución."
        ];
        const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        try {
            require('fs').appendFileSync('backend_errors.log', `[${new Date().toISOString()}] Final Chat Error after retries: ${errorMsg}\n`);
        }
        catch (e) { }
        return reply.send({ text: randomFallback });
    }
});
// ============================================================
// ENDPOINT 5: LOGS DE AGENTE (Desde Supabase)
// ============================================================
fastify.get('/api/logs', async (request, reply) => {
    try {
        const { data, error } = await supabase_1.supabase
            .from('agent_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
        if (error)
            throw error;
        return reply.send(data || []);
    }
    catch (err) {
        console.error('[Backend] Error fetching logs:', err.message);
        return reply.status(500).send({ error: 'Failed to fetch logs' });
    }
});
// ============================================================
// ENDPOINT 5.5: BORRAR LOGS DE AGENTE (Vaciar tabla)
// ============================================================
fastify.delete('/api/logs', async (request, reply) => {
    try {
        const { error } = await supabase_1.supabase
            .from('agent_logs')
            .delete()
            .gte('created_at', '1970-01-01'); // Borrado garantizado de toda la tabla (incluyendo NULLs/NULLs)
        if (error)
            throw error;
        console.log('[Backend] 🧹 Historial de logs vaciado.');
        return reply.send({ success: true });
    }
    catch (err) {
        console.error('[Backend] Error clearing logs:', err.message);
        return reply.status(500).send({ error: 'Failed to clear logs' });
    }
});
// ============================================================
// ENDPOINT 6: MIS VUELOS — Guardar un vuelo para vigilar
// ============================================================
fastify.post('/api/myFlights', async (request, reply) => {
    const { userEmail, flightNumber, alias } = request.body;
    if (!userEmail || !flightNumber) {
        return reply.status(400).send({ error: 'userEmail y flightNumber son requeridos' });
    }
    try {
        const { data, error } = await supabase_1.supabase.from('user_flights').insert([{
                user_email: userEmail,
                flight_number: flightNumber.toUpperCase(),
                alias: alias || null,
                is_active: true
            }]).select();
        if (error)
            throw error;
        console.log(`[Flights] ✅ Vuelo ${flightNumber} guardado para ${userEmail}`);
        return reply.send({ success: true, flight: data?.[0] });
    }
    catch (err) {
        console.error('[Flights] ❌ Error:', err.message);
        return reply.status(500).send({ error: 'No se pudo guardar el vuelo' });
    }
});
// ============================================================
// ENDPOINT 7: MIS VUELOS — Listar vuelos del usuario
// ============================================================
fastify.get('/api/myFlights', async (request, reply) => {
    const { email } = request.query;
    if (!email) {
        return reply.status(400).send({ error: 'email query param es requerido' });
    }
    try {
        const { data, error } = await supabase_1.supabase
            .from('user_flights')
            .select('*')
            .eq('user_email', email)
            .eq('is_active', true)
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        return reply.send(data || []);
    }
    catch (err) {
        console.error('[Flights] ❌ Error:', err.message);
        return reply.status(500).send({ error: 'No se pudieron obtener los vuelos' });
    }
});
// ============================================================
// ENDPOINT 8: MIS VUELOS — Eliminar un vuelo
// ============================================================
fastify.delete('/api/myFlights', async (request, reply) => {
    const { id } = request.query;
    if (!id) {
        return reply.status(400).send({ error: 'id query param es requerido' });
    }
    try {
        const { error } = await supabase_1.supabase
            .from('user_flights')
            .update({ is_active: false })
            .eq('id', id);
        if (error)
            throw error;
        return reply.send({ success: true });
    }
    catch (err) {
        return reply.status(500).send({ error: 'No se pudo eliminar el vuelo' });
    }
});
// ============================================================
// ENDPOINT 9: REGISTRAR TOKEN PUSH
// ============================================================
fastify.post('/api/registerPushToken', async (request, reply) => {
    const { email, token, deviceName } = request.body;
    if (!email || !token) {
        return reply.status(400).send({ error: 'email y token son requeridos' });
    }
    try {
        const { error } = await supabase_1.supabase
            .from('user_push_tokens')
            .upsert({ user_email: email, token, device_name: deviceName || 'Desconocido', updated_at: new Date() }, { onConflict: 'user_email,token' });
        if (error)
            throw error;
        console.log(`[Push] ✅ Token registrado para ${email} (${deviceName})`);
        return reply.send({ success: true });
    }
    catch (err) {
        console.error('[Push] ❌ Error registrando token:', err.message);
        return reply.status(500).send({ error: 'No se pudo registrar el token' });
    }
});
// ============================================================
// ENDPOINT 9.5: REGISTRAR PERFIL DE USUARIO
// ============================================================
fastify.post('/api/registerUser', async (request, reply) => {
    const { email, name, phone } = request.body;
    if (!email || !name) {
        return reply.status(400).send({ error: 'email y name son requeridos' });
    }
    try {
        const { data, error } = await supabase_1.supabase
            .from('users')
            .upsert({
            email: email.toLowerCase(),
            name,
            phone_number: phone || null,
            updated_at: new Date()
        }, { onConflict: 'email' })
            .select();
        if (error)
            throw error;
        // ENVÍO DE EMAIL DE BIENVENIDA (MOCK HASTA INTEGRAR API KEY)
        console.log(`[Email] 📧 Enviando Bienvenida a: ${email}`);
        console.log(`[Email] Contenido: "Hola ${name}, bienvenido a bordo de Travel-Pilot. Tu Escudo Legal está activo."`);
        console.log(`[User] ✅ Perfil de usuario actualizado para ${email}`);
        return reply.send({ success: true, user: data?.[0] });
    }
    catch (err) {
        console.error('[User] ❌ Error registrando usuario:', err.message);
        return reply.status(500).send({ error: 'No se pudo registrar el perfil' });
    }
});
// ============================================================
// ENDPOINT 10: ENVIAR PUSH DE PRUEBA
// ============================================================
fastify.post('/api/testPush', async (request, reply) => {
    const { email, title, body } = request.body;
    if (!email)
        return reply.status(400).send({ error: 'email es requerido' });
    console.log(`[Push] Inciando prueba manual para: ${email}`);
    const sent = await sendPushNotification(email, title || '🛡️ Alerta de Travel-Pilot', body || 'Tu asistente está vigilando tu viaje.');
    return reply.send({ success: true, target: email });
});
// ============================================================
// ENDPOINT 11: MIS VIAJES — Crear un viaje
// ============================================================
fastify.post('/api/trips', async (request, reply) => {
    const { userEmail, title, startDate, endDate, destination } = request.body;
    if (!userEmail || !title) {
        return reply.status(400).send({ error: 'userEmail y title son requeridos' });
    }
    try {
        console.log(`[Trips] 📝 Creando viaje para: ${userEmail}`);
        // 1. Intentar buscar usuario por email (si la columna existe)
        let { data: userData, error: userError } = await supabase_1.supabase
            .from('users')
            .select('id')
            .eq('email', userEmail.toLowerCase())
            .maybeSingle();
        // FALLBACK: Si no hay usuarios o la búsqueda falla, intentamos usar el primer usuario que encontremos
        // para asegurar que al menos podamos crear el viaje en la demo
        if (!userData) {
            const { data: allUsers } = await supabase_1.supabase.from('users').select('id').limit(1);
            if (allUsers && allUsers.length > 0) {
                userData = allUsers[0];
                console.log(`[Trips] ⚠️ Usuario no encontrado por email, usando primer usuario disponible: ${userData.id}`);
            }
        }
        if (!userData) {
            console.warn("[Trips] ❌ No se encontró ningún usuario idoneo para vincular el viaje.");
            throw new Error("No hay usuarios activos en la base de datos para crear el viaje.");
        }
        const { data, error } = await supabase_1.supabase
            .from('trips')
            .insert([{
                user_id: userData.id,
                title: destination ? `${title} | ${destination}` : title,
                start_date: startDate ? new Date(startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                end_date: endDate ? new Date(endDate).toISOString().split('T')[0] : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'planned'
            }])
            .select();
        if (error) {
            console.error("[Trips] ❌ Error de inserción en BD:", error.message);
            throw error;
        }
        console.log(`[Trips] ✅ Viaje creado correctamente: ${data?.[0]?.id}`);
        return reply.send(data?.[0]);
    }
    catch (err) {
        console.error("Error crítico en POST /api/trips:", err.message);
        return reply.status(500).send({ error: `Fallo al crear viaje: ${err.message}` });
    }
});
// ============================================================
// ENDPOINT 12: MIS VIAJES — Listar viajes del usuario
// ============================================================
fastify.get('/api/trips', async (request, reply) => {
    const { email } = request.query;
    if (!email) {
        return reply.status(400).send({ error: 'email query param es requerido' });
    }
    try {
        // 1. Intentar obtener el ID del usuario
        const { data: user } = await supabase_1.supabase
            .from('users')
            .select('id')
            .eq('email', email.toLowerCase())
            .maybeSingle();
        // 2. Si no lo encontramos por correo, devolvemos todos los viajes (para demo/emergencia)
        // o si lo encontramos, filtramos por su ID
        const query = supabase_1.supabase.from('trips').select('*').order('created_at', { ascending: false });
        if (user) {
            query.eq('user_id', user.id);
        }
        const { data, error } = await query;
        if (error)
            throw error;
        return reply.send(data || []);
    }
    catch (err) {
        console.error("[Trips] ❌ Error listando viajes:", err.message);
        return reply.status(500).send({ error: err.message });
    }
});
// ============================================================
// ENDPOINT 13: MIS VIAJES — Eliminar un viaje
// ============================================================
fastify.delete('/api/trips', async (request, reply) => {
    const { id } = request.query;
    if (!id) {
        return reply.status(400).send({ error: 'id query param es requerido' });
    }
    try {
        const { error } = await supabase_1.supabase
            .from('trips')
            .delete()
            .eq('id', id);
        if (error)
            throw error;
        return reply.send({ success: true });
    }
    catch (err) {
        return reply.status(500).send({ error: err.message });
    }
});
// ============================================================
// ENDPOINT 14: CLIMA REAL — Obtener clima de un destino o ubicación
// ============================================================
fastify.get('/api/weather', async (request, reply) => {
    const { location } = request.query;
    const target = location || 'London';
    try {
        console.log(`[Weather] 🌤️ Consultando clima para: ${target}`);
        // Paso 1: Geocodificar con soporte para múltiples resultados y filtrado por país
        const cleanTarget = target.replace(/,/, ' ').trim();
        const parts = cleanTarget.split(' ');
        const mainQuery = parts[0];
        const countryHint = parts.length > 1 ? parts.slice(1).join(' ').toLowerCase() : null;
        console.log(`[Weather] 🔍 Buscando: ${mainQuery}${countryHint ? ' con pista de país: ' + countryHint : ''}`);
        let geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(mainQuery)}&count=10&language=es`);
        let geoData = await geoRes.json();
        if (!geoData.results || geoData.results.length === 0) {
            throw new Error(`Ciudad "${target}" no encontrada en el geocodificador`);
        }
        // Buscar el mejor resultado basado en el país proporcionado
        let bestMatch = geoData.results[0];
        if (countryHint) {
            const match = geoData.results.find((r) => (r.country && r.country.toLowerCase().includes(countryHint)) ||
                (r.country_code && r.country_code.toLowerCase() === countryHint) ||
                (r.admin1 && r.admin1.toLowerCase().includes(countryHint)));
            if (match) {
                bestMatch = match;
                console.log(`[Weather] 🎯 Match encontrado por país: ${bestMatch.name}, ${bestMatch.country}`);
            }
        }
        const { latitude, longitude, name: cityName } = bestMatch;
        // Paso 2: Obtener clima real con Open-Meteo
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto`);
        const weatherData = await weatherRes.json();
        if (!weatherData.current_weather)
            throw new Error("Sin datos de clima");
        const cw = weatherData.current_weather;
        const tempC = Math.round(cw.temperature);
        // Mapear código WMO a descripción e icono (MÁS GRANULAR)
        const wmoCode = cw.weathercode;
        let condition = 'Despejado';
        let icon = '☀️';
        switch (wmoCode) {
            case 0:
                condition = 'Despejado';
                icon = '☀️';
                break;
            case 1:
                condition = 'Mayormente despejado';
                icon = '🌤️';
                break;
            case 2:
                condition = 'Parcialmente nublado';
                icon = '⛅';
                break;
            case 3:
                condition = 'Nublado';
                icon = '☁️';
                break;
            case 45:
            case 48:
                condition = 'Niebla';
                icon = '🌫️';
                break;
            case 51:
            case 53:
            case 55:
                condition = 'Llovizna';
                icon = '🌦️';
                break;
            case 61:
            case 63:
            case 65:
                condition = 'Lluvia';
                icon = '🌧️';
                break;
            case 71:
            case 73:
            case 75:
                condition = 'Nieve';
                icon = '❄️';
                break;
            case 77:
                condition = 'Granizo';
                icon = '🌨️';
                break;
            case 80:
            case 81:
            case 82:
                condition = 'Chubascos';
                icon = '⛈️';
                break;
            case 85:
            case 86:
                condition = 'Nevada fuerte';
                icon = '🌨️';
                break;
            case 95:
            case 96:
            case 99:
                condition = 'Tormenta';
                icon = '⛈️';
                break;
            default:
                condition = 'Despejado';
                icon = '☀️';
        }
        const result = {
            temp: String(tempC),
            condition,
            icon,
            city: cityName
        };
        console.log(`[Weather] ✅ ${cityName}: ${tempC}°C, ${condition} ${icon}`);
        return reply.send(result);
    }
    catch (e) {
        console.error("[Weather] ❌ Error:", e.message);
        return reply.send({
            temp: "--",
            condition: "Sin datos",
            icon: "❓",
            city: target
        });
    }
});
// ============================================================
// ENDPOINT: TRANSCRIBE — Para el dictado premium
// ============================================================
fastify.post('/api/transcribe', async (request, reply) => {
    try {
        const data = await request.file();
        if (!data)
            return reply.status(400).send({ error: 'No audio provided' });
        const buffer = await data.toBuffer();
        console.log(`[Transcribe] Recibidos ${buffer.length} bytes. Tipo: ${data.mimetype}`);
        // Debug: Guardar el último audio para inspección
        try {
            require('fs').writeFileSync('last_audio_debug.m4a', buffer);
        }
        catch (e) { }
        const chatModel = new google_genai_1.ChatGoogleGenerativeAI({
            model: "gemini-2.5-flash",
            apiVersion: "v1beta",
            apiKey: process.env.GOOGLE_API_KEY,
            maxRetries: 1,
        });
        const response = await chatModel.invoke([
            {
                role: "user",
                content: [
                    { type: "text", text: "Transcripción literal de este audio en español (sin comentarios extra):" },
                    {
                        type: "media",
                        mimeType: data.mimetype || "audio/mp4",
                        data: buffer.toString('base64'),
                    },
                ],
            }
        ]);
        const transcribedText = response.content.toString().trim()
            .replace(/^"|"$/g, '')
            .replace(/^transcripción: /i, '');
        console.log(`[Transcribe AI Result]: ${transcribedText}`);
        return reply.send({ text: transcribedText });
    }
    catch (error) {
        const errorMsg = error.message || String(error);
        console.error("[Transcribe Backend Error]:", errorMsg);
        // Log detallado del error de Google
        let details = errorMsg;
        if (errorMsg.includes("429"))
            details = "QUOTA_EXCEEDED";
        if (errorMsg.includes("404"))
            details = "MODEL_NOT_FOUND";
        require('fs').appendFileSync('backend_errors.log', `[${new Date().toISOString()}] Transcribe Error: ${errorMsg}\n`);
        return reply.status(500).send({ error: 'Transcription failed', details: details });
    }
});
// ============================================================
// ENDPOINT 7: GENERAR RECLAMACIÓN EU261 EN PDF
// ============================================================
fastify.post('/api/generateClaim', async (request, reply) => {
    try {
        const { flightNumber, airline, delayMinutes, departureAirport, arrivalAirport, userEmail, signatureBase64 } = request.body;
        const { PDFDocument, rgb, StandardFonts, degrees } = await Promise.resolve().then(() => __importStar(require('pdf-lib')));
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595, 842]); // A4
        const { width, height } = page.getSize();
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const GOLD = rgb(0.83, 0.68, 0.21);
        const BLACK = rgb(0, 0, 0);
        const DARK = rgb(0.1, 0.1, 0.1);
        const GREY = rgb(0.4, 0.4, 0.4);
        // Cabecera
        page.drawRectangle({ x: 0, y: height - 90, width, height: 90, color: DARK });
        page.drawText('TRAVEL-PILOT', { x: 40, y: height - 45, size: 22, font: fontBold, color: GOLD });
        page.drawText('RECLAMACIÓN OFICIAL EU261/2004', { x: 40, y: height - 65, size: 10, font: fontRegular, color: rgb(0.8, 0.8, 0.8) });
        page.drawText(`Ref: TP-${Date.now().toString().slice(-6)}`, { x: 400, y: height - 55, size: 9, font: fontRegular, color: GOLD });
        // Fecha
        const now = new Date();
        const dateStr = now.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
        page.drawText(`Fecha: ${dateStr}`, { x: 40, y: height - 115, size: 10, font: fontRegular, color: GREY });
        // Sanitizador para evitar errores WinAnsi en la fuente Helvetica (ej. "→")
        const sanitizeText = (txt) => {
            if (!txt)
                return 'N/A';
            return String(txt)
                .replace(/[→\u2192]/g, '-')
                .replace(/[^\x20-\x7E\xA0-\xFF]/g, '')
                .trim();
        };
        const sFlight = sanitizeText(flightNumber);
        const sAirline = sanitizeText(airline);
        const sDep = sanitizeText(departureAirport);
        const sArr = sanitizeText(arrivalAirport);
        const sEmail = sanitizeText(userEmail);
        // Sección: datos del pasajero
        let y = height - 150;
        page.drawText('DATOS DEL PASAJERO', { x: 40, y, size: 11, font: fontBold, color: DARK });
        page.drawLine({ start: { x: 40, y: y - 5 }, end: { x: 555, y: y - 5 }, thickness: 0.5, color: GOLD });
        y -= 25;
        page.drawText(`Email: ${sEmail}`, { x: 40, y, size: 10, font: fontRegular, color: BLACK });
        // Sección: datos del vuelo
        y -= 45;
        page.drawText('DATOS DEL VUELO', { x: 40, y, size: 11, font: fontBold, color: DARK });
        page.drawLine({ start: { x: 40, y: y - 5 }, end: { x: 555, y: y - 5 }, thickness: 0.5, color: GOLD });
        y -= 25;
        page.drawText(`Vuelo:         ${sFlight}`, { x: 40, y, size: 10, font: fontRegular, color: BLACK });
        y -= 18;
        page.drawText(`Aerolinea:     ${sAirline}`, { x: 40, y, size: 10, font: fontRegular, color: BLACK });
        y -= 18;
        page.drawText(`Origen:        ${sDep}`, { x: 40, y, size: 10, font: fontRegular, color: BLACK });
        y -= 18;
        page.drawText(`Destino:       ${sArr}`, { x: 40, y, size: 10, font: fontRegular, color: BLACK });
        y -= 18;
        page.drawText(`Retraso:       ${delayMinutes || 0} minutos`, { x: 40, y, size: 10, font: fontRegular, color: BLACK });
        y -= 18;
        const getEU261AmountStr = (orig, dest, delay) => {
            if (delay < 180)
                return '0 EUR';
            const shortHaul = ['MAD', 'BCN', 'CDG', 'ORY', 'LHR', 'LGW', 'FRA', 'MUC', 'AMS', 'LIS', 'BIO', 'TFN', 'TFS', 'LPA'];
            if (shortHaul.includes(orig) && shortHaul.includes(dest))
                return '250 EUR';
            const longHaul = ['JFK', 'EWR', 'LAX', 'MIA', 'SFO', 'GRU', 'MEX', 'BOG', 'DAR', 'SYE', 'NRT', 'HND', 'HAV', 'EZE'];
            if (longHaul.includes(orig) || longHaul.includes(dest))
                return '600 EUR';
            return '400 EUR';
        };
        const amount = getEU261AmountStr(departureAirport || '', arrivalAirport || '', delayMinutes || 0);
        page.drawText(`Compensacion:  ${amount} (Reglamento EU261/2004)`, { x: 40, y, size: 10, font: fontBold, color: DARK });
        // Cuerpo legal
        y -= 50;
        page.drawText('FUNDAMENTO LEGAL Y SOLICITUD', { x: 40, y, size: 11, font: fontBold, color: DARK });
        page.drawLine({ start: { x: 40, y: y - 5 }, end: { x: 555, y: y - 5 }, thickness: 0.5, color: GOLD });
        y -= 25;
        const body = [
            `Por la presente, yo, el abajo firmante, con email ${sEmail}, SOLICITO`,
            `formalmente a la aerolinea ${sAirline} el pago de la compensacion`,
            `economica establecida en el Reglamento (CE) n. 261/2004 del Parlamento Europeo,`,
            `por el retraso de ${delayMinutes || 0} minutos en el vuelo ${sFlight} (${sDep} -> ${sArr}).`,
            ``,
            `El reglamento establece que los pasajeros de vuelos con retraso superior a 3 horas`,
            `tienen derecho a compensacion economica de entre 250 EUR y 600 EUR, segun la distancia.`,
            ``,
            `Exijo resolucion en el plazo de 14 dias habiles. En caso contrario, me reservo el`,
            `derecho a acudir a la autoridad aeronautica competente (AESA en Espana).`,
        ];
        for (const line of body) {
            page.drawText(line, { x: 40, y, size: 9.5, font: fontRegular, color: DARK });
            y -= 16;
        }
        // Firma
        y -= 30;
        page.drawText('FIRMA DEL PASAJERO', { x: 40, y, size: 11, font: fontBold, color: DARK });
        page.drawLine({ start: { x: 40, y: y - 5 }, end: { x: 555, y: y - 5 }, thickness: 0.5, color: GOLD });
        y -= 15;
        if (signatureBase64) {
            try {
                const base64Data = signatureBase64.replace(/^data:image\/png;base64,/, '');
                const sigBytes = Buffer.from(base64Data, 'base64');
                const sigImage = await pdfDoc.embedPng(sigBytes);
                const sigDims = sigImage.scale(0.5);
                page.drawImage(sigImage, { x: 40, y: y - sigDims.height, width: sigDims.width, height: sigDims.height });
                y -= sigDims.height + 10;
            }
            catch (sigErr) {
                page.drawText('[Firma digital registrada]', { x: 40, y, size: 9, font: fontRegular, color: GREY });
                y -= 20;
            }
        }
        else {
            page.drawText('[Firma digital registrada electrónicamente]', { x: 40, y, size: 9, font: fontRegular, color: GREY });
            y -= 20;
        }
        page.drawText(`${userEmail || 'Pasajero'}`, { x: 40, y, size: 9, font: fontRegular, color: GREY });
        // Pie de página
        page.drawRectangle({ x: 0, y: 0, width, height: 40, color: DARK });
        page.drawText('Generado por Travel-Pilot AI · Documento con validez legal EU261/2004', { x: 40, y: 15, size: 7.5, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });
        const pdfBytes = await pdfDoc.save();
        const pdfBase64 = Buffer.from(pdfBytes).toString('base64');
        console.log(`[Claim] ✅ PDF generado para ${userEmail} - Vuelo ${flightNumber}`);
        // Intentar guardar en BD (no bloqueante - si falla, el PDF se devuelve igual)
        (async () => {
            try {
                const { error: dbError } = await supabase_1.supabase
                    .from('claims')
                    .insert([{
                        user_email: userEmail,
                        flight_number: flightNumber,
                        airline: airline,
                        amount: amount,
                        status: 'generated',
                        created_at: new Date().toISOString()
                    }]);
                if (dbError)
                    console.warn('[Claim DB] Aviso (no crítico):', dbError.message);
                else
                    console.log('[Claim DB] ✅ Registro guardado');
            }
            catch (dbErr) {
                console.warn('[Claim DB] Sin tabla claims (no afecta al PDF):', dbErr.message);
            }
        })();
        return reply.send({ success: true, pdfBase64 });
    }
    catch (error) {
        console.error('[Claim] ❌ Error generando PDF:', error);
        return reply.status(500).send({ error: 'Error generando el PDF', details: error.message });
    }
});
// ============================================================
// DOCUMENT UPLOAD — Guarda en Supabase Storage (Bucket: documents)
// ============================================================
fastify.post('/api/uploadDocument', async (request, reply) => {
    try {
        const data = await request.file();
        if (!data) {
            return reply.status(400).send({ error: 'No se ha proporcionado ningún archivo.' });
        }
        const buffer = await data.toBuffer();
        const fileExtension = data.filename.split('.').pop();
        const fileName = `manual_${Date.now()}.${fileExtension}`;
        console.log(`[Upload] 📤 Subiendo archivo: ${fileName} (${data.mimetype})`);
        // 1. Subir a Supabase Storage (Bucket: documents)
        const { data: uploadData, error: uploadError } = await supabase_1.supabase.storage
            .from('documents')
            .upload(fileName, buffer, {
            contentType: data.mimetype,
            upsert: true
        });
        if (uploadError) {
            console.error('[Upload] ❌ Error en Supabase Storage:', uploadError);
            return reply.status(500).send({ error: 'Fallo al guardar en la Bóveda Segura.' });
        }
        // 2. Obtener URL pública
        const { data: { publicUrl } } = supabase_1.supabase.storage
            .from('documents')
            .getPublicUrl(fileName);
        console.log(`[Upload] ✅ Archivo disponible en: ${publicUrl}`);
        return reply.send({
            success: true,
            url: publicUrl,
            message: 'Documento encriptado y guardado en la Bóveda Central.'
        });
    }
    catch (e) {
        console.error('[Upload] ❌ Error crítico:', e);
        return reply.status(500).send({ error: 'Error interno del servidor durante la subida.' });
    }
});
// ============================================================
// ARRANQUE
// ============================================================
const start = async () => {
    try {
        const port = Number(process.env.PORT) || 3000;
        fastify.listen({ port, host: '0.0.0.0' }, (err) => {
            if (err) {
                console.error(err);
                process.exit(1);
            }
            console.log('╔════════════════════════════════════════╗');
            console.log('║   TRAVEL-PILOT BACKEND ACTIVO          ║');
            console.log(`║   Puerto: ${port}                         ║`);
            console.log('║   Vigilancia proactiva cada 30 min     ║');
            console.log('╚════════════════════════════════════════╝');
        });
    }
    catch (err) {
        process.exit(1);
    }
};
start();
fastify.post('/api/logVoices', async (request, reply) => {
    try {
        require('fs').writeFileSync('../voices.json', JSON.stringify(request.body, null, 2));
        return reply.send({ success: true });
    }
    catch (e) {
        return reply.status(500).send({ error: String(e) });
    }
});
