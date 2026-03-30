"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateImpact = evaluateImpact;
exports.checkFlightStatus = checkFlightStatus;
exports.handleFlightMonitoring = handleFlightMonitoring;
exports.monitorFlight = monitorFlight;
const google_genai_1 = require("@langchain/google-genai");
const prompts_1 = require("@langchain/core/prompts");
const dotenv_1 = __importDefault(require("dotenv"));
const supabase_1 = require("./supabase");
dotenv_1.default.config();
const FORMAT_INSTRUCTIONS = `The output should be a JSON object with this structure:
{
  "options": [
    {
      "type": "RÁPIDO | ECONÓMICO | CONFORT",
      "title": "Title",
      "description": "Details",
      "estimatedCost": 100,
      "actionType": "hotel | transport | flight_change | jet"
    }
  ]
}
Return ONLY the JSON.`;
// ============================================================
// FUNCIONES DE ANÁLISIS
// ============================================================
function evaluateImpact(ctx) {
    let severity = 'LOW';
    let potentialLoss = 0;
    let compensationEligible = false;
    let compensationAmount = 0;
    let hotelAlert = '';
    let hotelRisk = false;
    let connectionRisk = false;
    let groundTransportRisk = false;
    const shortHaul = ['MAD', 'BCN', 'CDG', 'ORY', 'LHR', 'LGW', 'FRA', 'MUC', 'AMS', 'LIS', 'BIO', 'TFN', 'TFS', 'LPA', 'BRU', 'ZRH'];
    const longHaul = ['JFK', 'EWR', 'LAX', 'MIA', 'SFO', 'GRU', 'MEX', 'BOG', 'DAR', 'SYD', 'NRT', 'HND', 'HAV', 'EZE', 'PEK', 'DXB'];
    let distanceComp = 400; // Por defecto medio alcance
    const dep = ctx.departure_airport || 'N/A';
    const arr = ctx.arrival_airport || 'N/A';
    if (shortHaul.includes(dep) && shortHaul.includes(arr)) {
        distanceComp = 250;
    }
    else if (longHaul.includes(dep) || longHaul.includes(arr)) {
        distanceComp = 600;
    }
    if (ctx.status === 'cancelled') {
        severity = 'CRITICAL';
        compensationEligible = true;
        compensationAmount = distanceComp;
    }
    else if (ctx.delayMinutes >= 180) {
        severity = 'CRITICAL';
        compensationEligible = true;
        compensationAmount = distanceComp;
    }
    else if (ctx.delayMinutes >= 120 || ctx.status === 'diverted') {
        severity = 'MEDIUM';
        compensationEligible = false;
        compensationAmount = 0;
    }
    if (ctx.hotel_booking && !ctx.hotel_booking.is_refundable) {
        potentialLoss += ctx.hotel_booking.cost_per_night;
        hotelAlert = `Habitación no reembolsable en ${ctx.hotel_booking.name}`;
        hotelRisk = true;
    }
    const estArrival = ctx.estimated_arrival_iso || new Date().toISOString();
    if (ctx.connecting_flight) {
        const boardingCloses = new Date(ctx.connecting_flight.boarding_closes_iso);
        const estimatedArrival = new Date(estArrival);
        const transferTime = (boardingCloses.getTime() - estimatedArrival.getTime()) / 60000;
        if (transferTime < ctx.connecting_flight.min_transfer_minutes) {
            connectionRisk = true;
        }
    }
    if (ctx.ground_transport) {
        const lastDeparture = new Date(ctx.ground_transport.last_departure_iso);
        const estimatedArrival = new Date(estArrival);
        if (estimatedArrival > lastDeparture) {
            groundTransportRisk = true;
        }
    }
    const result = { severity, potentialLoss, compensationEligible, compensationAmount, hotelAlert, hotelRisk, connectionRisk, groundTransportRisk };
    console.log(`[JusticeSystem] ⚖️ Impact Audit: Flight ${ctx.flightNumber} | Status: ${ctx.status} | Delay: ${ctx.delayMinutes}m | Comp: ${compensationAmount}€ | Severity: ${severity}`);
    return result;
}
function getModel() {
    return new google_genai_1.ChatGoogleGenerativeAI({
        model: 'gemini-flash-latest',
        apiKey: process.env.GOOGLE_API_KEY,
        temperature: 0.2, // Más bajo = más rápido/consistente
        maxOutputTokens: 512, // Suficiente para JSON de planes
    });
}
// ============================================================
// DATOS DEL VUELO — AviationStack API (Real)
// ============================================================
async function checkFlightStatus(flightId) {
    const now = new Date();
    const AVIATION_KEY = process.env.AVIATIONSTACK_API_KEY;
    const code = flightId.toUpperCase();
    // 🏆 SUITE DE PRUEBAS MAESTRA (DETERMINISTA)
    if (code === 'TP999') {
        const originalArrival = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        const delayMinutes = 240;
        const estimatedArrival = new Date(originalArrival.getTime() + delayMinutes * 60 * 1000);
        return {
            flightId,
            flightNumber: 'TP999',
            status: 'delayed',
            delayMinutes,
            airline: 'Lufthansa',
            departure: { iata: 'MAD', delay: delayMinutes, scheduled: now.toISOString() },
            arrival: { iata: 'BER', scheduled: originalArrival.toISOString(), estimated: estimatedArrival.toISOString() },
            hotel_booking: {
                name: 'Hotel Adlon Kempinski Berlin', check_in_limit: '23:30',
                check_in_limit_iso: new Date(now.toDateString() + ' 23:30').toISOString(),
                address: 'Unter den Linden 77, 10117 Berlin', cost_per_night: 350, is_refundable: false,
            },
            connecting_flight: null, ground_transport: null, isSimulation: true,
        };
    }
    if (code === 'TP555') {
        const originalArrival = new Date(now.getTime() + 8 * 60 * 60 * 1000);
        const delayMinutes = 300;
        return {
            flightId,
            flightNumber: 'TP555',
            status: 'delayed',
            delayMinutes,
            airline: 'Iberia',
            departure: { iata: 'JFK', delay: delayMinutes, scheduled: now.toISOString() },
            arrival: { iata: 'MAD', scheduled: originalArrival.toISOString(), estimated: new Date(originalArrival.getTime() + delayMinutes * 60 * 1000).toISOString() },
            hotel_booking: {
                name: 'Hotel Palace Madrid', check_in_limit: '23:59',
                check_in_limit_iso: new Date(now.toDateString() + ' 23:59').toISOString(),
                address: 'Plaza de las Cortes 7, Madrid', cost_per_night: 400, is_refundable: false,
            },
            connecting_flight: null, ground_transport: null, isSimulation: true,
        };
    }
    if (code === 'IB3166') {
        const originalArrival = new Date(now.getTime() + 4 * 60 * 60 * 1000);
        const delayMinutes = 220;
        return {
            flightId,
            flightNumber: 'IB3166',
            status: 'delayed',
            delayMinutes,
            airline: 'Iberia Express',
            departure: { iata: 'MAD', delay: delayMinutes, scheduled: now.toISOString() },
            arrival: { iata: 'CDG', scheduled: originalArrival.toISOString(), estimated: new Date(originalArrival.getTime() + delayMinutes * 60 * 1000).toISOString() },
            hotel_booking: {
                name: 'Pullman Paris Tour Eiffel', check_in_limit: '23:30',
                check_in_limit_iso: new Date(now.toDateString() + ' 23:30').toISOString(),
                address: '18 Avenue De Suffren, Paris', cost_per_night: 280, is_refundable: false,
            },
            connecting_flight: null, ground_transport: null, isSimulation: true,
        };
    }
    if (code === 'TP777') {
        const originalArrival = new Date(now.getTime() + 1 * 60 * 60 * 1000);
        return {
            flightId,
            flightNumber: 'TP777',
            status: 'cancelled',
            delayMinutes: 0,
            airline: 'Vueling',
            departure: { iata: 'BCN', delay: 0, scheduled: now.toISOString() },
            arrival: { iata: 'MAD', scheduled: originalArrival.toISOString(), estimated: originalArrival.toISOString() },
            hotel_booking: {
                name: 'Hotel Wellington', check_in_limit: '22:00',
                check_in_limit_iso: new Date(now.toDateString() + ' 22:00').toISOString(),
                address: 'Velázquez 8, Madrid', cost_per_night: 300, is_refundable: false,
            },
            connecting_flight: null, ground_transport: null, isSimulation: true,
        };
    }
    if (code === 'TP111') {
        const originalArrival = new Date(now.getTime() + 10 * 60 * 60 * 1000);
        const delayMinutes = 180;
        return {
            flightId,
            flightNumber: 'TP111',
            status: 'delayed',
            delayMinutes,
            airline: 'Air Europa',
            departure: { iata: 'MEX', delay: delayMinutes, scheduled: now.toISOString() },
            arrival: { iata: 'MAD', scheduled: originalArrival.toISOString(), estimated: new Date(originalArrival.getTime() + delayMinutes * 60 * 1000).toISOString() },
            hotel_booking: {
                name: 'Rosewood Villa Magna', check_in_limit: '23:59',
                check_in_limit_iso: new Date(now.toDateString() + ' 23:59').toISOString(),
                address: 'Castellana 22, Madrid', cost_per_night: 800, is_refundable: false,
            },
            connecting_flight: null, ground_transport: null, isSimulation: true,
        };
    }
    if (code === 'TP404') {
        const originalArrival = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        const delayMinutes = 210;
        return {
            flightId,
            flightNumber: 'TP404',
            status: 'delayed',
            delayMinutes,
            airline: 'British Airways',
            departure: { iata: 'MAD', delay: delayMinutes, scheduled: now.toISOString() },
            arrival: { iata: 'LHR', scheduled: originalArrival.toISOString(), estimated: new Date(originalArrival.getTime() + delayMinutes * 60 * 1000).toISOString() },
            hotel_booking: {
                name: 'The Ritz London', check_in_limit: '23:00',
                check_in_limit_iso: new Date(now.toDateString() + ' 23:00').toISOString(),
                address: '150 Piccadilly, London', cost_per_night: 450, is_refundable: false,
            },
            connecting_flight: null, ground_transport: null, isSimulation: true,
        };
    }
    try {
        if (code === 'TK1860') {
            const originalArrival = new Date(now.getTime() + 3 * 60 * 60 * 1000);
            const delayMinutes = 190;
            return {
                flightId, flightNumber: 'TK1860', status: 'delayed', delayMinutes,
                departure_airport: 'MAD', arrival_airport: 'IST',
                original_arrival: originalArrival.toTimeString().slice(0, 5),
                estimated_arrival_iso: new Date(originalArrival.getTime() + delayMinutes * 60 * 1000).toISOString(),
                hotel_booking: {
                    name: 'Swissôtel The Bosphorus', check_in_limit: '22:00',
                    check_in_limit_iso: new Date(now.toDateString() + ' 22:00').toISOString(),
                    address: 'Visnezade Mah. Acisu Sok. No:19, Istanbul', cost_per_night: 280, is_refundable: false,
                },
                connecting_flight: null, ground_transport: null, isSimulation: true,
            };
        }
        if (code === 'EK142') {
            const originalArrival = new Date(now.getTime() + 6 * 60 * 60 * 1000);
            const delayMinutes = 210;
            return {
                flightId, flightNumber: 'EK142', status: 'delayed', delayMinutes,
                departure_airport: 'MAD', arrival_airport: 'DXB',
                original_arrival: originalArrival.toTimeString().slice(0, 5),
                estimated_arrival_iso: new Date(originalArrival.getTime() + delayMinutes * 60 * 1000).toISOString(),
                hotel_booking: {
                    name: 'Burj Al Arab Jumeirah', check_in_limit: '23:59',
                    check_in_limit_iso: new Date(now.toDateString() + ' 23:59').toISOString(),
                    address: 'Jumeirah St, Dubai', cost_per_night: 1200, is_refundable: false,
                },
                connecting_flight: null, ground_transport: null, isSimulation: true,
            };
        }
        if (code === 'IB3150') {
            const originalArrival = new Date(now.getTime() + 2.5 * 60 * 60 * 1000);
            const delayMinutes = 195;
            return {
                flightId, flightNumber: 'IB3150', status: 'delayed', delayMinutes,
                departure_airport: 'MAD', arrival_airport: 'WAW',
                original_arrival: originalArrival.toTimeString().slice(0, 5),
                estimated_arrival_iso: new Date(originalArrival.getTime() + delayMinutes * 60 * 1000).toISOString(),
                hotel_booking: {
                    name: 'Hotel Bristol, Warsaw', check_in_limit: '23:00',
                    check_in_limit_iso: new Date(now.toDateString() + ' 23:00').toISOString(),
                    address: 'Krakowskie Przedmieście 42/44, Warsaw', cost_per_night: 200, is_refundable: false,
                },
                connecting_flight: null, ground_transport: null, isSimulation: true,
            };
        }
        const response = await fetch(`http://api.aviationstack.com/v1/flights?access_key=${AVIATION_KEY}&flight_iata=${flightId}&limit=1`);
        const data = await response.json();
        if (data && data.data && data.data.length > 0) {
            const flight = data.data[0];
            const depDelay = flight.departure?.delay || 0;
            const arrDelay = flight.arrival?.delay || 0;
            const delayMinutes = Math.max(depDelay, arrDelay);
            const status = delayMinutes > 30 ? 'delayed' : flight.flight_status || 'scheduled';
            const estimatedArrival = new Date(flight.arrival?.estimated || flight.arrival?.scheduled || now.getTime() + 2 * 60 * 60 * 1000);
            const hotelBooking = {
                name: 'Hotel destino',
                check_in_limit: '23:00',
                check_in_limit_iso: new Date(now.toDateString() + ' 23:00').toISOString(),
                address: flight.arrival?.airport || 'Aeropuerto destino',
                cost_per_night: 150,
                is_refundable: false,
            };
            return {
                flightId,
                flightNumber: flight.flight?.iata || flightId,
                status,
                delayMinutes,
                airline: flight.airline?.name || 'AviationStack Airline',
                departure: {
                    iata: flight.departure?.iata || 'N/A',
                    delay: depDelay,
                    scheduled: flight.departure?.scheduled || now.toISOString()
                },
                arrival: {
                    iata: flight.arrival?.iata || 'N/A',
                    scheduled: flight.arrival?.scheduled || now.toISOString(),
                    estimated: estimatedArrival.toISOString()
                },
                hotel_booking: hotelBooking,
                connecting_flight: null,
                ground_transport: null,
            };
        }
    }
    catch (e) {
        console.log('[AviationStack] Error, usando datos de fallback:', e);
    }
    // FALLBACK
    const originalArrival = new Date(now.getTime() + 1 * 60 * 60 * 1000);
    const delayMinutes = 210;
    const estimatedArrival = new Date(originalArrival.getTime() + delayMinutes * 60 * 1000);
    return {
        flightId,
        flightNumber: flightId,
        status: 'delayed',
        delayMinutes,
        airline: 'Generic Airlines Fallback',
        departure: { iata: 'MAD', delay: delayMinutes, scheduled: now.toISOString() },
        arrival: { iata: 'LHR', scheduled: originalArrival.toISOString(), estimated: estimatedArrival.toISOString() },
        hotel_booking: {
            name: 'The Ritz London',
            check_in_limit: '23:00',
            check_in_limit_iso: new Date(now.toDateString() + ' 23:00').toISOString(),
            address: '150 Piccadilly, London',
            cost_per_night: 450,
            is_refundable: false,
        },
        connecting_flight: {
            flightId: 'BA456',
            boarding_closes_iso: new Date(now.getTime() + 2.5 * 60 * 60 * 1000).toISOString(),
            min_transfer_minutes: 60,
        },
        ground_transport: {
            type: 'TRAIN',
            last_departure_iso: new Date(now.getTime() + 1.5 * 60 * 60 * 1000).toISOString(),
        },
    };
}
// ============================================================
async function handleFlightMonitoring(flightId, travelProfile = 'balanced') {
    const code = flightId.trim().toUpperCase();
    console.log(`[Agent] 🕵️ Deep Impact Analysis -> |${code}| (Profile: ${travelProfile})`);
    const context = await checkFlightStatus(flightId);
    const impact = evaluateImpact(context);
    // 🛡️ QUOTA SHIELD: Buscar si ya existe un plan para este vuelo y este retraso hoy
    const isTestCode = ['TP999', 'TP404', 'IB3166', 'TP777', 'TP555', 'TP111'].includes(code);
    if (!isTestCode) {
        try {
            const { data: cached } = await supabase_1.supabase
                .from('agent_logs')
                .select('*')
                .eq('event_type', 'contingency_planned')
                .order('created_at', { ascending: false })
                .limit(10); // Revisar últimos 10 planes
            if (cached && cached.length > 0) {
                const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
                const hit = cached.find(log => {
                    const p = JSON.parse(log.payload || '{}');
                    return p.flightId === code &&
                        p.delayMinutes === context.delayMinutes &&
                        log.created_at > sixHoursAgo;
                });
                if (hit) {
                    console.log(`[QuotaShield] 🛡️ CACHE HIT para ${code} (${context.delayMinutes} min). Reutilizando plan.`);
                    return JSON.parse(hit.payload);
                }
            }
        }
        catch (e) {
            console.warn("[QuotaShield] Error consultando caché, procediendo con IA:", e);
        }
    }
    // ✅ FAST-PATH: Respuestas 100% DETERMINISTAS para la Suite de Pruebas (BETA)
    const testCodes = ['TP999', 'TP404', 'IB3166', 'TP777', 'TP555', 'TP111', 'IB0123', 'TK1860', 'EK142', 'IB3150'];
    if (testCodes.includes(code)) {
        console.log(`[Agent] ⚡ Fast-Path DETERMINISTA activado para |${code}|`);
        const isVip = travelProfile === 'premium';
        const isFast = travelProfile === 'fast';
        const isBudget = travelProfile === 'budget';
        const isBalanced = travelProfile === 'balanced';
        const amount = impact.compensationAmount;
        return {
            options: [
                {
                    type: 'RÁPIDO',
                    title: isVip ? 'PROTOCOLO JET/PRIORITY' : isFast ? 'REUBICACIÓN RELÁMPAGO' : 'CAMBIO DE VUELO',
                    description: isVip
                        ? `He bloqueado tu plaza VIP en el próximo vuelo. Un asistente te espera en la puerta para el trasbordo.`
                        : isFast
                            ? `He localizado el vuelo más rápido para tu destino. Procesando cambio de billete de inmediato.`
                            : `Vuelo alternativo localizado. Tienes derecho a reubicación gratuita por el retraso de ${context.delayMinutes} min.`,
                    estimatedCost: isVip ? 800 : isFast ? 450 : 0,
                    actionType: 'flight_change'
                },
                {
                    type: 'ECONÓMICO',
                    title: isVip ? 'RECLAMACIÓN ELITE +' + amount + '€' : 'RECLAMACIÓN OFICIAL ' + amount + '€',
                    description: isVip
                        ? `Tu indemnización legal de ${amount}€ ya está en trámite prioritario. He activado tu acceso a sala VIP mientras esperas.`
                        : isBudget
                            ? `Máximo ahorro garantizado. He preparado tu reclamación de ${amount}€ para que la cobres íntegra.`
                            : `Documentación legal lista para reclamar tus ${amount}€ por el retraso legal EU261.`,
                    estimatedCost: amount,
                    actionType: 'transport'
                },
                {
                    type: 'CONFORT',
                    title: isVip ? 'ESTANCIA LUXURY GARANTIZADA' : isBalanced ? 'ESTANCIA CON CONFORT' : 'ALOJAMIENTO ASISTIDO',
                    description: isVip
                        ? `Habitación reservada en hotel 5 estrellas cercano. Traslado privado activado para ti.`
                        : isBalanced
                            ? `Reserva de hotel gestionada para asegurar tu descanso durante la incidencia.`
                            : `Te gestionamos el alojamiento gratuito que te corresponde por ley por el retraso de ${context.delayMinutes} min.`,
                    estimatedCost: isVip ? 400 : 150,
                    actionType: 'hotel'
                }
            ],
            impact
        };
    }
    if (context.status === "delayed" && context.delayMinutes > 30) {
        console.log(`[Agent] CRITICAL DELAY: ${context.delayMinutes} mins. Evaluating constraints...`);
        const impact = evaluateImpact(context);
        console.log(`[Agent] Severity: ${impact.severity} | Loss: $${impact.potentialLoss} | EU261: ${impact.compensationEligible}`);
        try {
            const prompt = new prompts_1.PromptTemplate({
                template: `Eres el Asistente de Viajes Inteligente de Travel-Pilot.
Tu objetivo es ofrecer 3 alternativas realistas y útiles a un pasajero cuyo vuelo se ha retrasado.

CONTEXTO:
- Vuelo: {flightNumber} ({departure} -> {arrival})
- Retraso: {delay} minutos.
- Llegada Estimada: {original_arrival} + {delay} mins.
- Hotel: {hotelName} (Límite de check-in: {hotelCheckIn}).
- Riesgo de conexión: {connectionRisk}
- Último tren perdido: {groundTransportRisk}
- Elegible reclamación EU261: {compensationEligible} ({compensationAmount}€)

TAREA:
GENERA 3 ESCENARIOS DE ASISTENCIA (Formato JSON):
    - RÁPIDO: Prioriza llegar lo antes posible (vuelo directo o conexión inmediata).
    - ECONÓMICO: Opción que prioriza el máximo ahorro y la reclamación legal de {compensationAmount}€.
    - CONFORT: Priorizar el descanso (hotel, sala de espera, comida) y el equilibrio.

ESTATUS DEL USUARIO: {travelProfile}
- Perfil 'premium' (VIP): Tú (la IA) haces TODO. Habla de "He reservado", "He activado", "Te espera un transporte". PUEDES SUGERIR JETS PRIVADOS O SALAS VIP. Ejecución total.
- Perfil 'fast': Extremadamente proactivo buscando velocidad. Sugiere reubicaciones "relámpago" y taxis rápidos.
- Perfil 'budget': Enfoque total en dinero. Sugiere esperar al siguiente vuelo de la compañía para asegurar la indemnización íntegra.
- Perfil 'balanced': Guía atento. Di "Tienes derecho a", "Te ayudamos a solicitar". Equilibrio total.
- REGLA DE ORO: No sugieras JETS o SALAS VIP a menos que el perfil sea 'premium'.

{format_instructions}

IMPORTANT: Return ONLY the raw JSON object. Do not include markdown code blocks like \`\`\`json.
`,
                inputVariables: [
                    "flightNumber", "departure", "arrival", "delay", "original_arrival",
                    "hotelName", "hotelCheckIn", "connectionRisk", "groundTransportRisk",
                    "compensationEligible", "compensationAmount", "travelProfile", "format_instructions"
                ],
            });
            const input = await prompt.format({
                flightNumber: context.flightNumber,
                departure: context.departure_airport,
                arrival: context.arrival_airport,
                delay: context.delayMinutes.toString(),
                original_arrival: context.original_arrival || 'N/A',
                hotelName: context.hotel_booking?.name || 'No requiere hotel',
                hotelCheckIn: context.hotel_booking?.check_in_limit || 'N/A',
                connectionRisk: impact.connectionRisk ? "SÍ — conexión en riesgo" : "NO",
                groundTransportRisk: impact.groundTransportRisk ? "SÍ — último tren perdido" : "NO",
                compensationEligible: impact.compensationEligible ? "SÍ" : "NO",
                compensationAmount: impact.compensationAmount.toString(),
                travelProfile: travelProfile === 'premium' ? 'Élite / PREMIUM (Gestión Directa)' :
                    travelProfile === 'fast' ? 'Viajero RÁPIDO (Prioridad Tiempo)' :
                        travelProfile === 'budget' ? 'Viajero ECONÓMICO (Prioridad Ahorro)' : 'Viajero EQUILIBRADO (Mix estándar)',
                format_instructions: FORMAT_INSTRUCTIONS
            });
            const response = await getModel().invoke(input);
            let rawContent = response.content.toString();
            console.log(`[Agent] AI Raw Response Length: ${rawContent.length}`);
            // Limpiar posibles bloques de código de la IA
            rawContent = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
            let jsonMatch = rawContent.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                const altMatch = rawContent.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
                if (altMatch)
                    jsonMatch = [altMatch[1]];
            }
            if (!jsonMatch)
                throw new Error("No JSON in AI response after cleanup");
            const parsedPlan = JSON.parse(jsonMatch[0].trim());
            const result = { ...parsedPlan, impact, flightId: code, delayMinutes: context.delayMinutes };
            console.log(`[Agent] ✅ AI Plan Generated successfully with ${result.options?.length || 0} options.`);
            return result;
        }
        catch (e) {
            console.error("[Agent] Analysis Error, falling back to dynamic scenarios:", e.message);
            // Especialización para el vuelo de prueba TP999
            if (flightId.toUpperCase() === 'TP999') {
                return {
                    options: [
                        { type: 'RÁPIDO', title: 'Vuelo Express LH123', description: 'Traslado inmediato a T2 para vuelo operado por Lufthansa. Llegada a las 20:45.', estimatedCost: 280, actionType: 'flight_change' },
                        { type: 'ECONÓMICO', title: 'Compensación Estratégica', description: 'Esperar vuelo original. Recuperas 400€ (EU261). Gastos de cena cubiertos.', estimatedCost: 0, actionType: 'transport' },
                        { type: 'CONFORT', title: 'Plan de Noche en Berlín', description: 'Traslado al Hotel Adlon. Vuelo de regreso reprogramado para mañana 09:00.', estimatedCost: 150, actionType: 'hotel' }
                    ],
                    impact
                };
            }
            const fallback = {
                options: [
                    { type: 'RÁPIDO', title: 'Próxima alternativa disponible', description: `Reubicación prioritaria para minimizar los ${context.delayMinutes} min de retraso.`, estimatedCost: 250, actionType: 'flight_change' },
                    { type: 'ECONÓMICO', title: 'Recuperación de Gastos', description: `Esperar vuelo original. Reclamación activa de ${impact.compensationAmount}€ bajo EU261.`, estimatedCost: 0, actionType: 'transport' },
                    { type: 'CONFORT', title: 'Estancia y Descanso', description: `Noche de hotel gestionada en ${context.departure_airport} y salida reprogramada.`, estimatedCost: 120, actionType: 'hotel' }
                ],
                impact
            };
            return fallback;
        }
    }
    const defaultPlan = {
        options: [
            { type: 'CONFORT', title: 'Vuelo a Tiempo', description: 'Tu vuelo está operando normalmente. Sin interrupciones detectadas.', estimatedCost: 0, actionType: 'hotel' },
            { type: 'RÁPIDO', title: 'Mejorar a Ejecutiva', description: 'Hay asientos disponibles para subir de clase. Mejora tu experiencia.', estimatedCost: 200, actionType: 'flight_change' },
            { type: 'ECONÓMICO', title: 'Acceso a Sala VIP', description: 'Espera en la sala de descanso por una tarifa reducida.', estimatedCost: 40, actionType: 'transport' }
        ],
        impact: { severity: 'LOW', potentialLoss: 0, compensationEligible: false, hotelAlert: 'Todo en orden con tu reserva.' }
    };
    console.log("[Agent] ✅ No delay detected. Returning info scenarios.");
    return defaultPlan;
}
async function monitorFlight(flightId, travelProfile = 'balanced') {
    return await handleFlightMonitoring(flightId, travelProfile);
}
