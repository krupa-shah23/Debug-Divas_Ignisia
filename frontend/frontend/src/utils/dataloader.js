function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map(h => h.trim());

    return lines.slice(1).map(line => {
        const values = line.split(",");
        const row = {};

        headers.forEach((header, index) => {
            let value = values[index]?.trim() ?? "";

            if (value !== "" && !isNaN(value)) {
                value = Number(value);
            }

            if (value === "true") value = true;
            if (value === "false") value = false;

            row[header] = value;
        });

        return row;
    });
}

/**
 * Returns a robust URL path taking Vite's BASE_URL into account.
 * This ensures paths don't break dynamically when deployed to subdirectories.
 */
function getSafeUrl(pathPart) {
    const basePath = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.BASE_URL : '/';
    return (basePath + pathPart).replace(/\/\//g, '/');
}

export async function loadCityGeoJson(city) {
    if (!city) throw new Error("City parameter is required");
    
    // Formatting: cleanly lowercase and trim to prevent filename mismatch
    const formattedCity = String(city).toLowerCase().trim();
    const url = getSafeUrl(`data/geojson/zones_${formattedCity}.geojson`);

    try {
        console.log(`[DataLoader] Fetching GeoJSON from: ${url}`);
        const res = await fetch(url);
        
        if (!res.ok) {
            console.error(`[DataLoader] GeoJSON fetch failed with status ${res.status} for URL: ${url}`);
            // Explicit error string requested by the user
            throw new Error("GeoJSON not available – City GeoJSON could not be loaded");
        }

        const text = await res.text();
        return JSON.parse(text);
    } catch (err) {
        console.error(`[DataLoader] Error loading GeoJSON for ${formattedCity}:`, err);
        throw new Error("GeoJSON not available – City GeoJSON could not be loaded");
    }
}

export async function loadCityScoredZones(city) {
    if (!city) throw new Error("City parameter is required");
    const formattedCity = String(city).toLowerCase().trim();
    const url = getSafeUrl(`data/scored/scored_zones_${formattedCity}.csv`);

    try {
        console.log(`[DataLoader] Fetching Scored Zones CSV from: ${url}`);
        const res = await fetch(url);
        
        if (!res.ok) {
            throw new Error(`Scored zones CSV not found (Status: ${res.status})`);
        }

        const csvText = await res.text();
        return parseCSV(csvText);
    } catch (err) {
        console.error(`[DataLoader] Error loading Scored Zones for ${formattedCity}:`, err);
        throw new Error(`Scored zones data not available for city: ${formattedCity}`);
    }
}

export async function loadCitySimulation(city) {
    if (!city) throw new Error("City parameter is required");
    const formattedCity = String(city).toLowerCase().trim();
    const url = getSafeUrl(`data/simulations/simulation_${formattedCity}.csv`);

    try {
        console.log(`[DataLoader] Fetching Simulation CSV from: ${url}`);
        const res = await fetch(url);
        
        if (!res.ok) {
            throw new Error(`Simulation CSV not found (Status: ${res.status})`);
        }

        const csvText = await res.text();
        return parseCSV(csvText);
    } catch (err) {
        console.error(`[DataLoader] Error loading Simulation data for ${formattedCity}:`, err);
        throw new Error(`Simulation data not available for city: ${formattedCity}`);
    }
}

export async function loadData(city) {
    if (!city) return "";
    const formattedCity = String(city).toLowerCase().trim();
    const url = getSafeUrl(`data/processed/scored_zones_${formattedCity}.csv`);
    const response = await fetch(url);
    if (!response.ok) return "";
    return await response.text();
}