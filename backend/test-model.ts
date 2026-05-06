import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import dotenv from 'dotenv';
dotenv.config();

const test = async () => {
    try {
        const model = new ChatGoogleGenerativeAI({
            model: "gemini-flash-latest",
            apiKey: process.env.GOOGLE_API_KEY
        });
        const res = await model.invoke("Hola, responde con 'OK' si me escuchas.");
        console.log("Respuesta:", res.content);
    } catch (e: any) {
        console.error("Error Fallido:", e.message);
    }
}
test();
