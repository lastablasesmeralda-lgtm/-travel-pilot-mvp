import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import * as dotenv from "dotenv";
dotenv.config();

const models = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-pro", "gemini-1.0-pro"];
const apiVersions = ["v1", "v1beta"];

async function runTests() {
    console.log("Starting API Diagnostics...");
    console.log("API Key Present:", !!process.env.GOOGLE_API_KEY);

    for (const model of models) {
        for (const apiVersion of apiVersions) {
            console.log(`[Test] Model: ${model} | API: ${apiVersion}`);
            try {
                const chatModel = new ChatGoogleGenerativeAI({
                    model: model,
                    apiVersion: apiVersion,
                    apiKey: process.env.GOOGLE_API_KEY,
                    maxRetries: 0
                });

                const start = Date.now();
                const res = await chatModel.invoke([["human", "Hola, responde solo 'OK'"]]);
                const end = Date.now();
                console.log(`[Success] ${model} on ${apiVersion} works! (${end - start}ms). Response: ${res.content}`);
                return; // Stop if we find one that works
            } catch (e: any) {
                console.error(`[Fail] ${model} on ${apiVersion}: ${e.message}`);
            }
        }
    }
}

runTests();
