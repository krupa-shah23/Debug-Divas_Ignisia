




export const speciesProfiles = [
    {
        id: "neem",
        name: "Neem",
        optimalTemp: [30, 44],
        optimalMoisture: [0.15, 0.35],
        optimalNdvi: [0.10, 0.30],
        droughtTolerance: 0.95
    },
    {
        id: "peepal",
        name: "Peepal",
        optimalTemp: [27, 40],
        optimalMoisture: [0.30, 0.55],
        optimalNdvi: [0.18, 0.45],
        droughtTolerance: 0.75
    },
    {
        id: "banyan",
        name: "Banyan",
        optimalTemp: [28, 41],
        optimalMoisture: [0.25, 0.50],
        optimalNdvi: [0.16, 0.40],
        droughtTolerance: 0.80
    },
    {
        id: "gulmohar",
        name: "Gulmohar",
        optimalTemp: [25, 38],
        optimalMoisture: [0.35, 0.60],
        optimalNdvi: [0.22, 0.50],
        droughtTolerance: 0.65
    },
    {
        id: "rain_tree",
        name: "Rain Tree",
        optimalTemp: [24, 36],
        optimalMoisture: [0.45, 0.75],
        optimalNdvi: [0.28, 0.60],
        droughtTolerance: 0.45
    }
];


function clamp(value, min = 0, max = 1) {
    return Math.max(min, Math.min(max, value));
}


function rangeScore(value, min, max) {
    if (value >= min && value <= max) return 1;


    const distance = value < min ? min - value : value - max;
    const band = Math.max((max - min) * 0.6, 0.1);


    return clamp(1 - distance / band);
}


export function normalizeZoneRow(z, index = 0) {
    const zoneId = z.zone_id || z.Zone_ID || z.id || z.zone || `zone_${index + 1}`;


    let rawLST = Number(z.LST ?? z.lst ?? 38);


    // Convert Kelvin to Celsius if value looks too high
    const LST = rawLST > 100 ? rawLST - 273.15 : rawLST;
    const NDVI = Number(z.NDVI ?? z.ndvi ?? 0.25);


    // derive proxies from real metrics
    const soil_moisture_proxy = clamp((NDVI * 1.4) - ((LST - 35) * 0.03));
    const historical_weather_trend = clamp(1 - ((LST - 35) * 0.04) + (NDVI * 0.35));


    return {
        ...z,
        zone_id: String(zoneId),
        impact_score: Number(z.impact_score ?? z.final_score ?? z.score ?? 0),
        priority_rank: Number(z.priority_rank ?? z.rank ?? index + 1),
        NDVI,
        LST,
        water_available: z.water_available ?? z.water_access ?? z.water_feasible ?? true,
        trees_needed:
            Number(z.trees_needed ?? z.recommended_trees) ||
            Math.max(
                8,
                Math.min(
                    25,
                    Math.round(
                        8 +
                        (LST - 35) * 1.2 +
                        (0.4 - NDVI) * 20
                    )
                )
            ),
        soil_moisture_proxy,
        historical_weather_trend
    };
}


function computeSpeciesSurvival(zone, species) {
    const tempScore = rangeScore(zone.LST, species.optimalTemp[0], species.optimalTemp[1]);
    const moistureScore = rangeScore(zone.soil_moisture_proxy, species.optimalMoisture[0], species.optimalMoisture[1]);
    const ndviScore = rangeScore(zone.NDVI, species.optimalNdvi[0], species.optimalNdvi[1]);
    const historicalWeatherScore = clamp(zone.historical_weather_trend);


    const weightedScore =
        tempScore * 0.35 +
        moistureScore * 0.25 +
        ndviScore * 0.20 +
        historicalWeatherScore * 0.10 +
        species.droughtTolerance * 0.10;


    return Math.round(clamp(weightedScore) * 100);
}


export function getSpeciesRecommendation(zone) {
    const scored = speciesProfiles.map((species) => ({
        speciesId: species.id,
        speciesName: species.name,
        survivalProbability: computeSpeciesSurvival(zone, species)
    }));


    scored.sort((a, b) => b.survivalProbability - a.survivalProbability);


    return {
        recommendedSpecies: scored[0]?.speciesName || 'Neem',
        survivalProbability: scored[0]?.survivalProbability ?? 75,
        allSpeciesScores: scored
    };
}


export function enrichSelectedZonesFromRealData(selectedZoneIds = [], allZones = []) {
    const zoneMap = {};
    allZones.forEach((z, idx) => {
        const normalized = normalizeZoneRow(z, idx);
        zoneMap[String(normalized.zone_id)] = normalized;
    });


    return selectedZoneIds.map((zoneId) => {
        const zone = zoneMap[String(zoneId)];


        if (!zone) {
            return {
                zone_id: String(zoneId),
                LST: 38,
                NDVI: 0.25,
                recommended_species: 'Neem',
                survival_probability: 75
            };
        }


        const rec = getSpeciesRecommendation(zone);


        return {
            zone_id: zone.zone_id,
            LST: zone.LST,
            NDVI: zone.NDVI,
            impact_score: zone.impact_score,
            priority_rank: zone.priority_rank,
            trees_needed: zone.trees_needed,
            recommended_species: rec.recommendedSpecies,
            survival_probability: rec.survivalProbability,
            all_species_scores: rec.allSpeciesScores
        };
    });
}

