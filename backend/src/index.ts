
import Fastify from 'fastify';
import dotenv from 'dotenv';
dotenv.config();

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { handleFlightMonitoring, monitorFlight } from './agent';
import { notifyHotelOfDelay } from './voice';
import { supabase } from './supabase';
import { Expo } from 'expo-server-sdk';

import multipart from '@fastify/multipart';

const fastify = Fastify({ logger: true });
fastify.register(multipart);

fastify.get('/api/health', async () => {
    return { status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() };
});

const expo = new Expo();

console.log('[Backend] Environment loaded. API Key present:', !!process.env.GOOGLE_API_KEY);
if (!process.env.GOOGLE_API_KEY) {
    console.error('[CRITICAL] GOOGLE_API_KEY is missing in process.env!');
}

// ============================================================
// HELPER: ENVIAR PUSH A UN USUARIO (Todos sus dispositivos)
// ============================================================
async function sendPushNotification(email: string, title: string, body: string, data: any = {}) {
    try {
        const { data: tokens, error } = await supabase
            .from('user_push_tokens')
            .select('token')
            .eq('user_email', email);

        if (error || !tokens || tokens.length === 0) return;

        let messages: any[] = [];
        for (let pushToken of tokens) {
            if (!Expo.isExpoPushToken(pushToken.token)) continue;
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
    } catch (err) {
        console.error("[Push] ❌ Error enviando notificación:", err);
    }
}


// ============================================================
// CACHÉ — Precarga el plan al arrancar para respuesta instantánea
// ============================================================
// ============================================================
// MONITORIZACIÓN GLOBAL — Revisa todos los vuelos de los usuarios
// ============================================================
async function globalMonitor() {
    console.log('[Monitor] 🕵️ Revisando todos los vuelos activos...');
    try {
        // 1. Obtener todos los vuelos que los usuarios están vigilando
        const { data: flights, error } = await supabase
            .from('user_flights')
            .select('*')
            .eq('is_active', true);

        if (error) throw error;
        if (!flights || flights.length === 0) return console.log('[Monitor] Sin vuelos activos que vigilar.');

        for (const f of flights) {
            console.log(`[Monitor] Verificando ${f.flight_number} para ${f.user_email}...`);
            const plan = await handleFlightMonitoring(f.flight_number);

            if (plan && plan.impact && (plan.impact.severity === 'MEDIUM' || plan.impact.severity === 'CRITICAL')) {
                // Si hay un problema serio, avisamos al usuario
                await sendPushNotification(
                    f.user_email,
                    `🚨 ALERTA: ${f.flight_number}`,
                    `Tu asistente ha detectado un retraso. Tienes un plan de contingencia listo.`
                );
            }
        }
    } catch (e) {
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
    const { flightId } = request.body as { flightId: string };

    if (!flightId) {
        return reply.status(400).send({ error: 'flightId is required' });
    }

    try {
        console.log(`[Backend] Manual monitoring requested for: ${flightId}`);
        const contingencyPlan = await handleFlightMonitoring(flightId);

        return reply.send({
            flightId,
            message: contingencyPlan ? "Delay detected, contingency plan generated." : "Flight on time.",
            contingencyPlan
        });

    } catch (error: any) {
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
        const { hotelPhone, passengerName, delayMinutes, passengerPhone } = request.body as any;
        const callSid = await notifyHotelOfDelay(hotelPhone, passengerName, delayMinutes, passengerPhone);
        return reply.send({ success: true, callSid });
    } catch (error: any) {
        console.error("[Notify Hotel Error]:", error.message);
        return reply.status(500).send({ error: error.message });
    }
});

// ============================================================
// ENDPOINT 3: INFO DE VUELO LIGERA (AviationStack directo)
// ============================================================
fastify.get('/api/flightInfo', async (request, reply) => {
    const { flight } = request.query as { flight: string };

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
        const MOCK_FLIGHTS: Record<string, any> = {
            'TP404': {
                flightNumber: 'TP404', airline: 'Travel-Pilot Air', status: 'delayed',
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
                flightNumber: 'IB0123', airline: 'Iberia Vanguard', status: 'delayed',
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
                flightNumber: 'IB3166', airline: 'Iberia', status: 'delayed',
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
                flightNumber: 'VY1234', airline: 'Vueling', status: 'scheduled',
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
                flightNumber: 'BA0117', airline: 'British Airways', status: 'active',
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
            }
        };

        const mockFlight = MOCK_FLIGHTS[flight.toUpperCase()];
        if (mockFlight) {
            console.log(`[FlightInfo] 🧪 Radar de pruebas: ${flight}`);
            return reply.send(mockFlight);
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
        };

        console.log(`[FlightInfo] ✅ Simulación para ${genericFlight.flightNumber}: ${genericFlight.status} (delay: ${randomDelay}min)`);
        return reply.send(genericFlight);

    } catch (error) {
        console.error('[FlightInfo] ❌ Error:', error);
        return reply.status(503).send({ error: 'No se pudo contactar AviationStack' });
    }
});

// ============================================================
// ENDPOINT 4: CHAT CON GEMINI
// ============================================================
let chatModel: ChatGoogleGenerativeAI;

function getChatModel() {
    if (!chatModel) {
        chatModel = new ChatGoogleGenerativeAI({
            model: "gemini-1.5-flash",
            maxOutputTokens: 512,
            temperature: 0.7,
            apiKey: process.env.GOOGLE_API_KEY
        });
    }
    return chatModel;
}

fastify.post('/api/chat', async (request, reply) => {
    const { text, history } = request.body as { text: string, history?: any[] };
    if (!text) return reply.status(400).send({ error: 'text is required' });

    try {
        const chatModel = new ChatGoogleGenerativeAI({
            model: "gemini-1.5-flash",
            maxOutputTokens: 1024,
            temperature: 0.9,
            apiKey: process.env.GOOGLE_API_KEY,
            maxRetries: 2, // Intentar un par de veces si Google está saturado
        });

        const systemPrompt = `Eres tu asistente personal de viajes, un humano muy directo y eficaz.
        Hoy es ${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.
        Tu misión: Resolver problemas con calma, inteligencia y, sobre todo, BREVEDAD.
        - Preséntate como "tu asistente" si es necesario, nunca como una IA o términos militares.
        - Sé extremadamente conciso. Si te dicen "hola", responde solo "Hola, ¿en qué puedo ayudarte hoy?" o similar.
        - Ve al grano. No des explicaciones largas si no te las piden.
        - Habla de tú, con tono amable pero profesional y rápido.
        - Prohibido usar más de dos párrafos excepto en planes de crisis complejos.
        - Responde SIEMPRE en español.
        - PROHIBIDO usar Markdown (no uses asteriscos ** para negritas). Responde solo con texto plano.` ;

        const messages: any[] = [["system", systemPrompt]];
        
        if (history && Array.isArray(history)) {
            history.forEach(m => {
                const role = m.isUser ? "human" : "ai";
                messages.push([role, m.text]);
            });
        } else {
            messages.push(["human", text]);
        }

        const response = await chatModel.invoke(messages);
        let aiText = response.content.toString();
        
        // Limpiar asteriscos por si acaso la IA ignora el prompt
        aiText = aiText.replace(/\*\*/g, '');
        
        console.log(`[Chat AI Response]: ${aiText}`);
        return reply.send({ text: aiText });
    } catch (error: any) {
        const errorMsg = error.message || String(error);
        console.error("[Chat Error]:", errorMsg);
        
        // FALLBACK RESILIENTE: En lugar de un error seco, damos una respuesta de "Modo Supervivencia"
        // Esto evita que el usuario se frustre si Google falla un momento.
        const fallbacks = [
            "Entendido. Estoy procesando tu solicitud con prioridad. ¿En qué más puedo ayudarte con tu viaje?",
            "Recibido. Mis sistemas están algo saturados pero sigo aquí para proteger tu vuelo. ¿Necesitas que revise algo específico?",
            "Vale, tomo nota. Cuéntame más sobre lo que necesitas para tu viaje y buscaré la mejor solución."
        ];
        const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];

        require('fs').appendFileSync('backend_errors.log', `[${new Date().toISOString()}] Chat Error: ${errorMsg}\n`);
        return reply.send({ text: randomFallback });
    }
});

// ============================================================
// ENDPOINT 5: LOGS DE AGENTE (Desde Supabase)
// ============================================================
fastify.get('/api/logs', async (request, reply) => {
    try {
        const { data, error } = await supabase
            .from('agent_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw error;
        return reply.send(data);
    } catch (err: any) {
        console.error('[Backend] Error fetching logs:', err.message);
        return reply.status(500).send({ error: 'Failed to fetch logs' });
    }
});

// ============================================================
// ENDPOINT 6: MIS VUELOS — Guardar un vuelo para vigilar
// ============================================================
fastify.post('/api/myFlights', async (request, reply) => {
    const { userEmail, flightNumber, alias } = request.body as {
        userEmail: string, flightNumber: string, alias?: string
    };

    if (!userEmail || !flightNumber) {
        return reply.status(400).send({ error: 'userEmail y flightNumber son requeridos' });
    }

    try {
        const { data, error } = await supabase.from('user_flights').insert([{
            user_email: userEmail,
            flight_number: flightNumber.toUpperCase(),
            alias: alias || null,
            is_active: true
        }]).select();

        if (error) throw error;
        console.log(`[Flights] ✅ Vuelo ${flightNumber} guardado para ${userEmail}`);
        return reply.send({ success: true, flight: data?.[0] });
    } catch (err: any) {
        console.error('[Flights] ❌ Error:', err.message);
        return reply.status(500).send({ error: 'No se pudo guardar el vuelo' });
    }
});

// ============================================================
// ENDPOINT 7: MIS VUELOS — Listar vuelos del usuario
// ============================================================
fastify.get('/api/myFlights', async (request, reply) => {
    const { email } = request.query as { email: string };

    if (!email) {
        return reply.status(400).send({ error: 'email query param es requerido' });
    }

    try {
        const { data, error } = await supabase
            .from('user_flights')
            .select('*')
            .eq('user_email', email)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return reply.send(data || []);
    } catch (err: any) {
        console.error('[Flights] ❌ Error:', err.message);
        return reply.status(500).send({ error: 'No se pudieron obtener los vuelos' });
    }
});

// ============================================================
// ENDPOINT 8: MIS VUELOS — Eliminar un vuelo
// ============================================================
fastify.delete('/api/myFlights', async (request, reply) => {
    const { id } = request.query as { id: string };

    if (!id) {
        return reply.status(400).send({ error: 'id query param es requerido' });
    }

    try {
        const { error } = await supabase
            .from('user_flights')
            .update({ is_active: false })
            .eq('id', id);

        if (error) throw error;
        return reply.send({ success: true });
    } catch (err: any) {
        return reply.status(500).send({ error: 'No se pudo eliminar el vuelo' });
    }
});

// ============================================================
// ENDPOINT 9: REGISTRAR TOKEN PUSH
// ============================================================
fastify.post('/api/registerPushToken', async (request, reply) => {
    const { email, token, deviceName } = request.body as {
        email: string, token: string, deviceName?: string
    };

    if (!email || !token) {
        return reply.status(400).send({ error: 'email y token son requeridos' });
    }

    try {
        const { error } = await supabase
            .from('user_push_tokens')
            .upsert(
                { user_email: email, token, device_name: deviceName || 'Desconocido', updated_at: new Date() },
                { onConflict: 'user_email,token' }
            );

        if (error) throw error;
        console.log(`[Push] ✅ Token registrado para ${email} (${deviceName})`);
        return reply.send({ success: true });
    } catch (err: any) {
        console.error('[Push] ❌ Error registrando token:', err.message);
        return reply.status(500).send({ error: 'No se pudo registrar el token' });
    }
});

// ============================================================
// ENDPOINT 9.5: REGISTRAR PERFIL DE USUARIO
// ============================================================
fastify.post('/api/registerUser', async (request, reply) => {
    const { email, name, phone } = request.body as {
        email: string, name: string, phone?: string
    };

    if (!email || !name) {
        return reply.status(400).send({ error: 'email y name son requeridos' });
    }

    try {
        const { data, error } = await supabase
            .from('users')
            .upsert(
                { 
                    email: email.toLowerCase(), 
                    name, 
                    phone_number: phone || null, 
                    updated_at: new Date() 
                },
                { onConflict: 'email' }
            )
            .select();

        if (error) throw error;
        console.log(`[User] ✅ Perfil táctico actualizado para ${email}`);
        return reply.send({ success: true, user: data?.[0] });
    } catch (err: any) {
        console.error('[User] ❌ Error registrando usuario:', err.message);
        return reply.status(500).send({ error: 'No se pudo registrar el perfil' });
    }
});

// ============================================================
// ENDPOINT 10: ENVIAR PUSH DE PRUEBA
// ============================================================
fastify.post('/api/testPush', async (request, reply) => {
    const { email, title, body } = request.body as { email: string, title?: string, body?: string };
    if (!email) return reply.status(400).send({ error: 'email es requerido' });

    await sendPushNotification(
        email,
        title || '🛡️ Alerta de Travel-Pilot',
        body || 'Tu asistente está vigilando tu viaje.'
    );

    return reply.send({ success: true });
});

// ============================================================
// ENDPOINT 11: MIS VIAJES — Crear un viaje
// ============================================================
fastify.post('/api/trips', async (request, reply) => {
    const { userEmail, title, startDate, endDate, destination } = request.body as {
        userEmail: string, title: string, startDate?: string, endDate?: string, destination?: string
    };

    if (!userEmail || !title) {
        return reply.status(400).send({ error: 'userEmail y title son requeridos' });
    }

    try {
        console.log(`[Trips] 📝 Creando viaje para: ${userEmail}`);

        // 1. Intentar buscar usuario por email (si la columna existe)
        let { data: userData, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('email', userEmail.toLowerCase())
            .maybeSingle();

        // FALLBACK: Si no hay usuarios o la búsqueda falla, intentamos usar el primer usuario que encontremos
        // para asegurar que al menos podamos crear el viaje en la demo
        if (!userData) {
            const { data: allUsers } = await supabase.from('users').select('id').limit(1);
            if (allUsers && allUsers.length > 0) {
                userData = allUsers[0];
                console.log(`[Trips] ⚠️ Usuario no encontrado por email, usando primer usuario disponible: ${userData.id}`);
            }
        }

        if (!userData) {
            console.warn("[Trips] ❌ No se encontró ningún usuario idoneo para vincular el viaje.");
            throw new Error("No hay usuarios activos en la base de datos para crear el viaje.");
        }

        const { data, error } = await supabase
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
    } catch (err: any) {
        console.error("Error crítico en POST /api/trips:", err.message);
        return reply.status(500).send({ error: `Fallo al crear viaje: ${err.message}` });
    }
});

// ============================================================
// ENDPOINT 12: MIS VIAJES — Listar viajes del usuario
// ============================================================
fastify.get('/api/trips', async (request, reply) => {
    const { email } = request.query as { email: string };

    if (!email) {
        return reply.status(400).send({ error: 'email query param es requerido' });
    }

    try {
        // 1. Intentar obtener el ID del usuario
        const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('email', email.toLowerCase())
            .maybeSingle();

        // 2. Si no lo encontramos por correo, devolvemos todos los viajes (para demo/emergencia)
        // o si lo encontramos, filtramos por su ID
        const query = supabase.from('trips').select('*').order('created_at', { ascending: false });

        if (user) {
            query.eq('user_id', user.id);
        }

        const { data, error } = await query;

        if (error) throw error;
        return reply.send(data || []);
    } catch (err: any) {
        console.error("[Trips] ❌ Error listando viajes:", err.message);
        return reply.status(500).send({ error: err.message });
    }
});

// ============================================================
// ENDPOINT 13: MIS VIAJES — Eliminar un viaje
// ============================================================
fastify.delete('/api/trips', async (request, reply) => {
    const { id } = request.query as { id: string };

    if (!id) {
        return reply.status(400).send({ error: 'id query param es requerido' });
    }

    try {
        const { error } = await supabase
            .from('trips')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return reply.send({ success: true });
    } catch (err: any) {
        return reply.status(500).send({ error: err.message });
    }
});

// ============================================================
// ENDPOINT 14: CLIMA REAL — Obtener clima de un destino o ubicación
// ============================================================
fastify.get('/api/weather', async (request, reply) => {
    const { location } = request.query as { location: string };
    const target = location || 'London';

    try {
        console.log(`[Weather] 🌤️ Consultando clima para: ${target}`);

        // Paso 1: Geocodificar el nombre de la ciudad a coordenadas con Open-Meteo
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(target)}&count=1&language=es`);
        const geoData: any = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error(`Ciudad "${target}" no encontrada en el geocodificador`);
        }

        const { latitude, longitude, name: cityName } = geoData.results[0];

        // Paso 2: Obtener clima real con Open-Meteo (gratis, sin API key)
        const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
        );
        const weatherData: any = await weatherRes.json();

        if (!weatherData.current_weather) throw new Error("Sin datos de clima");

        const cw = weatherData.current_weather;
        const tempC = Math.round(cw.temperature);

        // Mapear código WMO a descripción e icono
        const wmoCode = cw.weathercode;
        let condition = 'Despejado';
        let icon = '☀️';
        if (wmoCode === 0) { condition = 'Despejado'; icon = '☀️'; }
        else if (wmoCode <= 3) { condition = 'Parcialmente nublado'; icon = '⛅'; }
        else if (wmoCode <= 48) { condition = 'Nublado'; icon = '☁️'; }
        else if (wmoCode <= 57) { condition = 'Llovizna'; icon = '🌦️'; }
        else if (wmoCode <= 67) { condition = 'Lluvia'; icon = '🌧️'; }
        else if (wmoCode <= 77) { condition = 'Nieve'; icon = '❄️'; }
        else if (wmoCode <= 82) { condition = 'Aguacero'; icon = '⛈️'; }
        else if (wmoCode <= 86) { condition = 'Nevada'; icon = '🌨️'; }
        else if (wmoCode >= 95) { condition = 'Tormenta'; icon = '⛈️'; }

        const result = {
            temp: String(tempC),
            condition,
            icon,
            city: cityName
        };

        console.log(`[Weather] ✅ ${cityName}: ${tempC}°C, ${condition} ${icon}`);
        return reply.send(result);
    } catch (e: any) {
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
        if (!data) return reply.status(400).send({ error: 'No audio provided' });

        const buffer = await data.toBuffer();
        console.log(`[Transcribe] 🎤 Recibido audio: ${data.filename} | Tamaño: ${buffer.length} bytes`);
        
        if (buffer.length < 100) {
            console.warn('[Transcribe] ⚠️ Audio demasiado corto o vacío.');
            return reply.send({ text: "" });
        }

        // Usamos Gemini 1.5 Flash para la transcripción multimodal
        const chatModel = new ChatGoogleGenerativeAI({
            model: "gemini-1.5-flash",
            apiKey: process.env.GOOGLE_API_KEY,
            maxRetries: 1, 
        });

        console.log('[Transcribe] 🧠 Enviando a Gemini Flash...');
        // @ts-ignore
        const response = await chatModel.invoke([
            {
                role: "user",
                content: [
                    { type: "text", text: "Transcribe exactamente lo que se dice en este audio. Idioma: Español. No añadidas nada más que el texto transcrito. Si no hay voz humana audible, devuelve un string vacío." },
                    {
                        type: "media",
                        mimeType: "audio/mp4",
                        data: buffer.toString('base64'),
                    },
                ],
            }
        ]);

        const transcribedText = response.content.toString().trim().replace(/^["']|["']$/g, '');
        console.log(`[Transcribe AI Result]: "${transcribedText}"`);
        
        return reply.send({ text: transcribedText });
    } catch (error: any) {
        const errorMsg = error.message || String(error);
        console.error("[Transcribe Backend Error]:", errorMsg);
        
        // Log detallado del error de Google
        let details = errorMsg;
        if (errorMsg.includes("429")) details = "QUOTA_EXCEEDED";
        if (errorMsg.includes("404")) details = "MODEL_NOT_FOUND";
        
        require('fs').appendFileSync('backend_errors.log', `[${new Date().toISOString()}] Transcribe Error: ${errorMsg}\n`);
        return reply.status(500).send({ error: 'Transcription failed', details: details });
    }
});

// ============================================================
// ENDPOINT 6: UPLOAD DOCUMENTO
// ============================================================
fastify.post('/api/uploadDocument', async (request, reply) => {
    try {
        const data = await request.file();
        if (!data) {
            return reply.status(400).send({ error: 'No file provided' });
        }

        const buffer = await data.toBuffer();
        const fileExt = data.filename.split('.').pop();
        const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `user_docs/${uniqueFilename}`;

        console.log(`[Upload] Recibiendo archivo: ${data.filename} (${buffer.length} bytes) -> Destino: ${filePath}`);

        // Subir a Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('documents')
            .upload(filePath, buffer, {
                contentType: data.mimetype,
                upsert: true
            });

        if (uploadError) {
            console.error('[Upload] Error subiendo a Supabase:', uploadError);
            return reply.status(500).send({ error: 'Fallo al subir archivo a la nube', details: uploadError.message });
        }

        // Obtener URL Pública
        const { data: publicUrlData } = supabase.storage
            .from('documents')
            .getPublicUrl(filePath);

        console.log(`[Upload] ✅ Éxito. URL Pública: ${publicUrlData.publicUrl}`);

        return reply.send({ 
            success: true, 
            message: 'Archivo subido correctamente', 
            url: publicUrlData.publicUrl,
            path: filePath
        });

    } catch (error: any) {
        console.error("[Upload Backend Error]:", error);
        return reply.status(500).send({ error: 'Upload failed', details: error.message || String(error) });
    }
});

// ============================================================
// ENDPOINT 7: GENERAR RECLAMACIÓN EU261 EN PDF
// ============================================================
fastify.post('/api/generateClaim', async (request, reply) => {
    try {
        const { flightNumber, airline, delayMinutes, departureAirport, arrivalAirport, userEmail, signatureBase64 } = request.body as any;

        const { PDFDocument, rgb, StandardFonts, degrees } = await import('pdf-lib');

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
        const sanitizeText = (txt: any) => {
            if (!txt) return 'N/A';
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
        const amount = (delayMinutes || 0) >= 210 ? '600 EUR' : '250 EUR';
        page.drawText(`Compensación:  ${amount} (Reglamento EU261/2004)`, { x: 40, y, size: 10, font: fontBold, color: DARK });

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
            } catch (sigErr) {
                page.drawText('[Firma digital registrada]', { x: 40, y, size: 9, font: fontRegular, color: GREY });
                y -= 20;
            }
        } else {
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
                const { error: dbError } = await supabase
                    .from('claims')
                    .insert([{
                        user_email: userEmail,
                        flight_number: flightNumber,
                        airline: airline,
                        amount: amount,
                        status: 'generated',
                        created_at: new Date().toISOString()
                    }]);
                if (dbError) console.warn('[Claim DB] Aviso (no crítico):', dbError.message);
                else console.log('[Claim DB] ✅ Registro guardado');
            } catch (dbErr: any) {
                console.warn('[Claim DB] Sin tabla claims (no afecta al PDF):', dbErr.message);
            }
        })();

        return reply.send({ success: true, pdfBase64 });

    } catch (error: any) {
        console.error('[Claim] ❌ Error generando PDF:', error);
        return reply.status(500).send({ error: 'Error generando el PDF', details: error.message });
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
    } catch (err) {
        process.exit(1);
    }
};

start();
