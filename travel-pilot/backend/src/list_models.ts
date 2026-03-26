import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

async function listModels() {
    console.log("Listing Available Models...");
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_API_KEY}`);
        const data = await response.json();
        console.log("Models Response:", JSON.stringify(data, null, 2));
    } catch (e: any) {
        console.error("Failed to list models:", e.message);
    }
}

listModels();
