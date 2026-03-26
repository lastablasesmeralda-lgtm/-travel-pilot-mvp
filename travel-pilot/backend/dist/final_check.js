"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
async function findTable() {
    console.log("Checking if user_trips or similar exists...");
    const { data, error } = await supabase.from('trips').select('*').limit(1);
    console.log("trips table check:", { data, error });
    // Check user_flights also
    const { data: df, error: ef } = await supabase.from('user_flights').select('*').limit(1);
    console.log("user_flights table check:", { df, ef });
}
findTable();
