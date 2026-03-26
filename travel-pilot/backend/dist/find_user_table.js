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
    console.log("Checking for ANY table with 'user' in the name...");
    // Intentar invocar un rpc que liste tablas si existiera, o simplemente probar nombres comunes
    const names = ['profiles', 'user_profile', 'accounts', 'user_data'];
    for (const n of names) {
        const { error } = await supabase.from(n).select('*').limit(1);
        if (error && error.code === 'PGRST205') {
            console.log(`❌ ${n} not found`);
        }
        else {
            console.log(`✅ ${n} found (or error different than not found)`);
        }
    }
}
findTable();
