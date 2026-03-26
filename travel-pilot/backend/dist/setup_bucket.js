"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = (0, supabase_js_1.createClient)(SUPABASE_URL, SUPABASE_SECRET);
async function setupBucket() {
    console.log('Verifying Supabase Storage Bucket...');
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
        console.error('Error listing buckets:', error);
        return;
    }
    const bucketName = 'documents';
    const exists = buckets.find(b => b.name === bucketName);
    if (exists) {
        console.log(`✅ Bucket '${bucketName}' ya existe.`);
    }
    else {
        console.log(`CREANDO BUCKET '${bucketName}'...`);
        const { data, error: createError } = await supabase.storage.createBucket(bucketName, {
            public: true, // Hacemos público el bucket para facilitar la visualización en esta fase MVP
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'],
        });
        if (createError) {
            console.error('❌ Error creando bucket:', createError);
        }
        else {
            console.log(`✅ Bucket '${bucketName}' creado exitosamente.`);
        }
    }
}
setupBucket();
