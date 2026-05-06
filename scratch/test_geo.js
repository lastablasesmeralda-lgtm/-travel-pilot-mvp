
async function test() {
    const mainQuery = 'VLC';
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(mainQuery)}&count=5&language=es`);
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
}
test();
