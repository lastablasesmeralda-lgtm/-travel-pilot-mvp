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
async function check() {
    const tables = ['users', 'trips', 'flights', 'agent_logs', 'user_trips', 'user_flights', 'user_push_tokens'];
    for (const t of tables) {
        process.stdout.write(`Checking ${t}... `);
        const { data, error } = await supabase.from(t).select('*').limit(1);
        if (error) {
            console.log(`❌ ERROR: ${error.message}`);
        }
        else {
            console.log(`✅ OK (Count: ${data.length})`);
        }
    }
}
check();
