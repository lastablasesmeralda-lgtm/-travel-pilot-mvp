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
async function findTripsCols() {
    console.log("Checking columns for 'trips' table...");
    const { data, error } = await supabase.from('trips').select('*').limit(1);
    if (error) {
        console.error("Error fetching trips:", error.message);
        return;
    }
    if (data && data.length > 0) {
        console.log("Found a trip! Columns are:", Object.keys(data[0]));
    }
    else {
        console.log("No trips found. Testing column existence via failed inserts...");
        const testCols = ['destination', 'dest', 'location', 'city'];
        for (const col of testCols) {
            const { error: err } = await supabase.from('trips').insert([{ [col]: 'Test' }]);
            if (err) {
                console.log(`Column '${col}' test error:`, err.message);
            }
            else {
                console.log(`Column '${col}' EXISTS!`);
                // Let's delete the test insert
                await supabase.from('trips').delete().eq(col, 'Test');
            }
        }
    }
}
findTripsCols();
