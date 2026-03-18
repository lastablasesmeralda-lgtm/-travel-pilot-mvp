import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import dotenv from 'dotenv';
import { supabase } from './supabase';

dotenv.config();

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
// INTERFACES DE TYPESCRIPT
// ============================================================
interface HotelBooking {
    name: string;
    check_in_limit: string;
    check_in_limit_iso: string;
    address: string;
    cost_per_night: number;
    is_refundable: boolean;
}

interface ConnectingFlight {
    flightId: string;
    boarding_closes_iso: string;
    min_transfer_minutes: number;
}

interface GroundTransport {
    type: string;
    last_departure_iso: string;
}

interface FlightContext {
    flightId: string;
    flightNumber: string;
    status: string;
    delayMinutes: number;
    departure_airport: string;
    arrival_airport: string;
    original_arrival: string;
    estimated_arrival_iso: string;
    hotel_booking: HotelBooking;
    connecting_flight: ConnectingFlight | null;
    ground_transport: GroundTransport | null;
}

// ============================================================
// FUNCIONES DE ANÁLISIS
// ============================================================
function evaluateImpact(ctx: FlightContext) {
    let severity = 'LOW';
    let potentialLoss = 0;
    let compensationEligible = false;
    let compensationAmount = 0;
    let hotelAlert = '';
    let hotelRisk = false;
    let connectionRisk = false;
    let groundTransportRisk = false;

    if (ctx.delayMinutes >= 180) {
        severity = 'CRITICAL';
        compensationEligible = true;
        compensationAmount = 600;
    } else if (ctx.delayMinutes >= 30) {
        severity = 'MEDIUM';
        compensationEligible = true;
        compensationAmount = 250;
    }

    if (!ctx.hotel_booking.is_refundable) {
        potentialLoss += ctx.hotel_booking.cost_per_night;
        hotelAlert = `Habitación no reembolsable en ${ctx.hotel_booking.name}`;
        hotelRisk = true;
    }

    if (ctx.connecting_flight) {
        const boardingCloses = new Date(ctx.connecting_flight.boarding_closes_iso);
        const estimatedArrival = new Date(ctx.estimated_arrival_iso);
        const transferTime = (boardingCloses.getTime() - estimatedArrival.getTime()) / 60000;
        if (transferTime < ctx.connecting_flight.min_transfer_minutes) {
            connectionRisk = true;
        }
    }

    if (ctx.ground_transport) {
        const lastDeparture = new Date(ctx.ground_transport.last_departure_iso);
        const estimatedArrival = new Date(ctx.estimated_arrival_iso);
        if (estimatedArrival > lastDeparture) {
            groundTransportRisk = true;
        }
    }

    return { severity, potentialLoss, compensationEligible, compensationAmount, hotelAlert, hotelRisk, connectionRisk, groundTransportRisk };
}

function getModel() {
    return new ChatGoogleGenerativeAI({
        model: 'gemini-1.5-flash-latest',
        apiKey: process.env.GOOGLE_API_KEY,
        temperature: 0.5,
        maxOutputTokens: 1024,
    });
}

// ============================================================
// DATOS DEL VUELO — AviationStack API (Real)
// ============================================================
async function checkFlightStatus(flightId: string): Promise<FlightContext> {
    const now = new Date();
    const AVIATION_KEY = process.env.AVIATIONSTACK_API_KEY;

    try {
        if (flightId.toUpperCase() === 'TP404') {
            const originalArrival = new Date(now.getTime() + 2 * 60 * 60 * 1000);
            const delayMinutes = 210;
            const estimatedArrival = new Date(originalArrival.getTime() + delayMinutes * 60 * 1000);
            return {
                flightId,
                flightNumber: 'TP404',
                status: 'delayed',
                delayMinutes,
                departure_airport: 'MAD',
                arrival_airport: 'LHR',
                original_arrival: originalArrival.toTimeString().slice(0, 5),
                estimated_arrival_iso: estimatedArrival.toISOString(),
                hotel_booking: {
                    name: 'The Ritz London',
                    check_in_limit: '23:00',
                    check_in_limit_iso: new Date(now.toDateString() + ' 23:00').toISOString(),
                    address: '848 Washington St, Nueva York', // Just for consistency with UI mockup
                    cost_per_night: 150,
                    is_refundable: false,
                },
                connecting_flight: null,
                ground_transport: null,
            };
        }

        const response = await fetch(
            `http://api.aviationstack.com/v1/flights?access_key=${AVIATION_KEY}&flight_iata=${flightId}&limit=1`
        );
        const data = await response.json();

        if (data && data.data && data.data.length > 0) {
            const flight = data.data[0];
            const depDelay = flight.departure?.delay || 0;
            const arrDelay = flight.arrival?.delay || 0;
            const delayMinutes = Math.max(depDelay, arrDelay);
            const status = delayMinutes > 30 ? 'delayed' : flight.flight_status || 'scheduled';

            const estimatedArrival = new Date(
                flight.arrival?.estimated || flight.arrival?.scheduled || now.getTime() + 2 * 60 * 60 * 1000
            );

            const hotelBooking: HotelBooking = {
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
                departure_airport: flight.departure?.iata || 'N/A',
                arrival_airport: flight.arrival?.iata || 'N/A',
                original_arrival: new Date(flight.arrival?.scheduled || now).toTimeString().slice(0, 5),
                estimated_arrival_iso: estimatedArrival.toISOString(),
                hotel_booking: hotelBooking,
                connecting_flight: null,
                ground_transport: null,
            };
        }
    } catch (e) {
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
        departure_airport: 'MAD',
        arrival_airport: 'LHR',
        original_arrival: originalArrival.toTimeString().slice(0, 5),
        estimated_arrival_iso: estimatedArrival.toISOString(),
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
export async function handleFlightMonitoring(flightId: string) {
    console.log(`[Agent] Performing Deep Impact Assessment for: ${flightId}`);

    const context = await checkFlightStatus(flightId);

    if (context.status === "delayed" && context.delayMinutes > 30) {
        console.log(`[Agent] CRITICAL DELAY: ${context.delayMinutes} mins. Evaluating constraints...`);

        const impact = evaluateImpact(context);
        console.log(`[Agent] Severity: ${impact.severity} | Loss: $${impact.potentialLoss} | EU261: ${impact.compensationEligible}`);

        try {
            const prompt = new PromptTemplate({
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
   - RÁPIDO: La forma más rápida de llegar hoy. Ejemplo: Reubicación en el próximo vuelo disponible de otra aerolínea o tren de alta velocidad.
   - ECONÓMICO: Opción barata que aprovecha la compensación EU261 ({compensationAmount}€). Ejemplo: Esperar al vuelo original pero reclamando el dinero + pase de Sala VIP.
   - CONFORT: Priorizar el descanso. Ejemplo: Reservar un hotel cerca del aeropuerto esta noche y volar mañana por la mañana tranquilos.

{format_instructions}

IMPORTANT: Return ONLY the raw JSON object. Do not include markdown code blocks like \`\`\`json.
`,
                inputVariables: [
                    "flightNumber", "departure", "arrival", "delay", "original_arrival",
                    "hotelName", "hotelCheckIn", "connectionRisk", "groundTransportRisk",
                    "compensationEligible", "compensationAmount", "format_instructions"
                ],
            });

            const input = await prompt.format({
                flightNumber: context.flightNumber,
                departure: context.departure_airport,
                arrival: context.arrival_airport,
                delay: context.delayMinutes.toString(),
                original_arrival: context.original_arrival,
                hotelName: context.hotel_booking.name,
                hotelCheckIn: context.hotel_booking.check_in_limit,
                connectionRisk: impact.connectionRisk ? "SÍ — conexión en riesgo" : "NO",
                groundTransportRisk: impact.groundTransportRisk ? "SÍ — último tren perdido" : "NO",
                compensationEligible: impact.compensationEligible ? "SÍ" : "NO",
                compensationAmount: impact.compensationAmount.toString(),
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
                if (altMatch) jsonMatch = [altMatch[1]];
            }

            if (!jsonMatch) throw new Error("No JSON in AI response after cleanup");

            const parsedPlan = JSON.parse(jsonMatch[0].trim());
            const result = { ...parsedPlan, impact };
            console.log(`[Agent] ✅ AI Plan Generated successfully with ${result.options?.length || 0} options.`);
            return result;
        } catch (e: any) {
            console.error("[Agent] Analysis Error, falling back to static scenarios:", e.message);
            const fallback = {
                options: [
                    { type: 'RÁPIDO', title: 'Próximo vuelo disponible', description: 'Reubicación en el siguiente vuelo operado por otra aerolínea.', estimatedCost: 250, actionType: 'flight_change' },
                    { type: 'ECONÓMICO', title: 'Esperar y Reclamar', description: 'Esperar tu vuelo original. Gestionaremos automáticamente tu compensación de hasta 600€.', estimatedCost: 0, actionType: 'transport' },
                    { type: 'CONFORT', title: 'Noche de Hotel + Vuelo matutino', description: 'Ir a dormir a un hotel cercano y volar mañana relajado.', estimatedCost: 120, actionType: 'hotel' }
                ],
                impact
            };
            console.log("[Agent] ⚠️ Sending static fallback scenarios.");
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

export async function monitorFlight(flightId: string) {
    return await handleFlightMonitoring(flightId);
}
