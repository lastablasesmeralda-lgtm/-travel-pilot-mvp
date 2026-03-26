"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const google_genai_1 = require("@langchain/google-genai");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function test() {
    console.log('Testing Gemini API with key:', process.env.GOOGLE_API_KEY?.substring(0, 10) + '...');
    try {
        const model = new google_genai_1.ChatGoogleGenerativeAI({
            model: "gemini-flash-latest",
            maxOutputTokens: 100,
        });
        const res = await model.invoke("Hola, responde 'Conectado exitosamente' si puedes leer esto.");
        console.log('Gemini Response:', res.content);
    }
    catch (error) {
        console.error('Gemini Error:', error.message || error);
    }
}
test();
