
require('dotenv').config({ path: 'c:/Users/HP/.gemini/antigravity/playground/golden-pulsar/travel-pilot/backend/.env' });

async function testAviation() {
    const key = process.env.AVIATIONSTACK_API_KEY;
    console.log('Testing AviationStack with key:', key ? 'FOUND' : 'MISSING');
    if (!key) return;
    
    try {
        const url = `http://api.aviationstack.com/v1/flights?access_key=${key}&limit=1`;
        console.log('Fetching:', url.replace(key, 'REDACTED'));
        const response = await fetch(url);
        const data = await response.json();
        console.log('Response Status:', response.status);
        console.log('Data (first 200 chars):', JSON.stringify(data).slice(0, 200));
        
        if (data.error) {
            console.log('API Error:', data.error.code, data.error.message);
        } else if (data.data && data.data.length > 0) {
            console.log('SUCCESS: API is returning real flight data.');
        } else {
            console.log('WARNING: API returned no data but no error.');
        }
    } catch (e) {
        console.error('Fetch Error:', e.message);
    }
}
testAviation();
