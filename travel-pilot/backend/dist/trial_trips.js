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
async function trial() {
    console.log("Trial: Inserting into 'trips' with user_email...");
    const { error } = await supabase.from('trips').insert([{ title: 'Trial Trip', user_email: 'test@example.com' }]);
    console.log("Error:", error?.message);
    console.log("Trial: Inserting into 'trips' with user_id... (dummy uuid)");
    const { error: e2 } = await supabase.from('trips').insert([{ title: 'Trial Trip', user_id: '00000000-0000-0000-0000-000000000000' }]);
    console.log("Error with dummy uuid:", e2?.message);
}
trial();
