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
async function fuzz() {
    const list = ['user_trips', 'user_trip', 'users_trips', 'users_trip', 'my_trips', 'trips_user'];
    for (const t of list) {
        const { error } = await supabase.from(t).select('*').limit(1);
        if (error) {
            console.log(`❌ ${t}: ${error.code} - ${error.message}`);
        }
        else {
            console.log(`✅ ${t}: FOUND!`);
        }
    }
}
fuzz();
