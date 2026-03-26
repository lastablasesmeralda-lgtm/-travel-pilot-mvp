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
async function checkTrips() {
    console.log("Inserting a test trip into 'trips' to see what happens...");
    // We will try a blind insert and see error message for column info
    const { error } = await supabase.from('trips').insert([{ title: 'Test' }]);
    console.log("Insert error (reveals schema):", error);
}
checkTrips();
