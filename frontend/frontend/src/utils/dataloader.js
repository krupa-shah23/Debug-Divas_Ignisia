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

export async function loadCityGeoJson(city) {
    const res = await fetch(`/data/geojson/zones_${city}.geojson`);
    if (!res.ok) throw new Error(`GeoJSON not found for ${city}`);

    const text = await res.text();
    return JSON.parse(text);
}

export async function loadCityScoredZones(city) {
    const res = await fetch(`/data/scored/scored_zones_${city}.csv`);
    if (!res.ok) throw new Error(`Scored zones CSV not found for ${city}`);

    const csvText = await res.text();
    return parseCSV(csvText);
}

export async function loadCitySimulation(city) {
    const res = await fetch(`/data/simulations/simulation_${city}.csv`);
    if (!res.ok) throw new Error(`Simulation CSV not found for ${city}`);

    const csvText = await res.text();
    return parseCSV(csvText);
}

export async function loadData(city) {
  const response = await fetch(`/data/processed/scored_zones_${city}.csv`);
  const text = await response.text();
  return text;
}