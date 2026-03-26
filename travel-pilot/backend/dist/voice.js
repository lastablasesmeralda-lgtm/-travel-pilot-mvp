"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyHotelOfDelay = notifyHotelOfDelay;
const twilio_1 = __importDefault(require("twilio"));
// Initialize the Twilio Client
// Ensure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER are in the .env file
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
// We only initialize if the variables exist to prevent crashes during design time
const client = (accountSid && authToken) ? (0, twilio_1.default)(accountSid, authToken) : null;
/**
 * Automates a call to a hotel using Twilio Programmable Voice.
 * This can be used if the AI Agent decides to notify a hotel for a delayed passenger.
 *
 * @param hotelPhoneNumber The phone number of the target hotel (e.g. "+1234567890")
 * @param passengerName Name of the passenger
 * @param delayMinutes How long the flight is delayed
 * @param passengerPhone The contact number of the passenger
 */
async function notifyHotelOfDelay(hotelPhoneNumber, passengerName, delayMinutes, passengerPhone = "No registrado") {
    if (!client) {
        console.warn("[Voice API] Twilio credentials not fully set. Mocking voice call.");
        return "mock_call_sid_12345";
    }
    console.log(`[Voice API] Initiating call to hotel ${hotelPhoneNumber} for passenger ${passengerName} (${passengerPhone})...`);
    try {
        // TwiML (Twilio Markup Language) to dictate what the voice bot says
        const twimlMessage = `
            <Response>
                <Say voice="alice" language="es-ES">
                    Hola. Esta es una llamada automatizada de Travel Pilot en nombre de su huésped, ${passengerName}.
                    Su vuelo se ha retrasado ${delayMinutes} minutos. 
                    Aún llegarán esta noche, por favor mantengan su reserva activa. 
                    Si necesitan contactar con el pasajero, su número es: ${passengerPhone.split('').join(' ')}.
                    Gracias. Hasta luego.
                </Say>
            </Response>
        `;
        const call = await client.calls.create({
            twiml: twimlMessage,
            to: hotelPhoneNumber,
            from: twilioPhoneNumber
        });
        console.log(`[Voice API] Call initiated successfully. Call SID: ${call.sid}`);
        return call.sid;
    }
    catch (error) {
        console.error(`[Voice API] Failed to initiate call:`, error);
        throw error;
    }
}
