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
async function discover() {
    console.log("--- DISCOVERY ---");
    // Check user_flights columns
    const { error: fErr } = await supabase.from('user_flights').insert([{ dummy_col: 1 }]);
    console.log("user_flights error:", fErr?.message);
    // Check trips columns
    const { error: tErr } = await supabase.from('trips').insert([{ dummy_col: 1 }]);
    console.log("trips error:", tErr?.message);
    // Check users columns
    const { error: uErr } = await supabase.from('users').insert([{ dummy_col: 1 }]);
    console.log("users error:", uErr?.message);
}
discover();
