
export const getEU261Amount = (f: any): string => {
    if (!f) return '250';
    const origin = f.departure?.iata;
    const dest = f.arrival?.iata;
    
    // Rutas comunes cortas (< 1500km) -> 250
    const shortHaul = ['MAD', 'BCN', 'CDG', 'ORY', 'LHR', 'LGW', 'FRA', 'MUC', 'AMS', 'LIS', 'BIO'];
    if (shortHaul.includes(origin) && shortHaul.includes(dest)) return '250';
    
    // Rutas transatlánticas o largas (> 3500km) -> 600
    const longHaul = ['JFK', 'EWR', 'LAX', 'MIA', 'SFO', 'GRU', 'MEX', 'BOG', 'DAR', 'SYE', 'NRT', 'HND', 'HAV', 'EZE'];
    if (longHaul.includes(origin) || longHaul.includes(dest)) return '600';

    return '400'; // Por defecto para media distancia
};

export const getRegulationName = (f: any): string => {
    if (!f) return 'EU261';
    const origin = (f.departure?.iata || '').toUpperCase();
    const dest = (f.arrival?.iata || '').toUpperCase();
    
    const euAirports = ['MAD', 'BCN', 'CDG', 'ORY', 'FRA', 'MUC', 'AMS', 'LIS', 'BIO', 'TFN', 'TFS', 'LPA', 'BER', 'WAW', 'FCO', 'MXP', 'VIE', 'BRU', 'CPH', 'ATH', 'DUB'];
    const usAirports = ['JFK', 'EWR', 'LAX', 'MIA', 'SFO', 'ORD', 'ATL', 'DFW', 'LAS', 'SEA', 'BOS', 'MCO'];
    
    if (euAirports.includes(origin) || euAirports.includes(dest)) return 'EU261';
    if (usAirports.includes(origin) && usAirports.includes(dest)) return 'US DOT';
    return 'MONTREAL';
};
