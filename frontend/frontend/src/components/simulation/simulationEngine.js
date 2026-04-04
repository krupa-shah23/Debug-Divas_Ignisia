import { useMemo } from 'react';

// Seeded pseudo-random generator (0.0 to 1.0)
export function seededValue(seedStr, min, max) {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash * 31 + seedStr.charCodeAt(i)) >>> 0;
  }
  const normalized = (hash % 1000) / 1000;
  return min + normalized * (max - min);
}

// Ensure data is numeric
const num = (v, fallback) => (Number.isFinite(Number(v)) ? Number(v) : fallback);

// Convert Kelvin to Celsius if LST looks like Kelvin
export function fixLst(val) {
  const n = num(val, 36.5);
  return n > 100 ? n - 273.15 : n;
}

// Compute Impact fallback
export function computeFallbackImpact({ canopy, ndvi, lst }) {
  const canopyNorm = Math.max(0, Math.min(1, 1 - canopy / 100));
  const ndviNorm = Math.max(0, Math.min(1, 1 - ndvi));
  const lstNorm = Math.max(0, Math.min(1, (lst - 25) / 20));
  const score = 0.35 * canopyNorm + 0.25 * ndviNorm + 0.4 * lstNorm;
  return Number(score.toFixed(3));
}

// Master normalization function for baseline
export function normalizeZoneMetrics(z, index) {
  const rawCanopy = z.tree_canopy_pct ?? z.canopy_pct ?? z.canopy ?? z.canopyPercent ?? 2.5;
  const rawNdvi = z.ndvi ?? z.avg_ndvi ?? z.ndvi_mean ?? 0.25;
  const rawLst = z.lst ?? z.lst_c ?? z.lst_mean ?? z.avg_lst ?? 310;
  const rawImpact = z.impact_score ?? z.score ?? z.priority_score ?? z.benefit_score ?? null;

  const lstC = fixLst(rawLst);
  const canopy = num(rawCanopy, 0);
  const ndvi = num(rawNdvi, 0.25);

  const impactValue = rawImpact !== null && Number.isFinite(Number(rawImpact))
    ? Number(Number(rawImpact).toFixed(3))
    : computeFallbackImpact({ canopy, ndvi, lst: lstC });

  const zoneId = String(z.zone_id || z.Zone_ID || z.id || z.zone || `Z-${index}`);

  return {
    ...z,
    zone_id: zoneId,
    zone_name: z.zone_name || z.name || `Zone ${zoneId}`,
    canopy: Number(canopy.toFixed(1)),
    ndvi: Number(ndvi.toFixed(2)),
    lst: Number(lstC.toFixed(1)),
    impact: impactValue
  };
}

// Heuristic Fallback Generator for Post-Simulation
export function generateHeuristicSimulation(zone, timeHorizon) {
  const seed = String(zone.zone_id);
  
  const baseSpots = Math.round(seededValue(seed + 'spots', 8, 28));
  
  let canopyGainMin, canopyGainMax, ndviGainMin, ndviGainMax, lstDropMin, lstDropMax;

  if (timeHorizon === 6) { // 6 Months
    canopyGainMin = 1.0; canopyGainMax = 2.5;
    ndviGainMin = 0.01; ndviGainMax = 0.04;
    lstDropMin = 0.5; lstDropMax = 1.2;
  } else if (timeHorizon === 12) { // 1 Year
    canopyGainMin = 2.0; canopyGainMax = 4.0;
    ndviGainMin = 0.03; ndviGainMax = 0.07;
    lstDropMin = 1.0; lstDropMax = 2.0;
  } else if (timeHorizon === 60) { // 5 Years
    canopyGainMin = 5.0; canopyGainMax = 10.0;
    ndviGainMin = 0.08; ndviGainMax = 0.15;
    lstDropMin = 2.5; lstDropMax = 4.5;
  } else { // 10 Years (120 months)
    canopyGainMin = 10.0; canopyGainMax = 18.0;
    ndviGainMin = 0.15; ndviGainMax = 0.28;
    lstDropMin = 4.0; lstDropMax = 7.0;
  }

  const gainCanopy = seededValue(seed + 'c', canopyGainMin, canopyGainMax);
  const gainNdvi = seededValue(seed + 'n', ndviGainMin, ndviGainMax);
  const dropLst = seededValue(seed + 'l', lstDropMin, lstDropMax);

  return {
    candidateSpots: baseSpots,
    visibleTrees: Math.round(baseSpots * seededValue(seed + 'v', 0.75, 0.90)),
    canopyGain: gainCanopy,
    ndviGain: gainNdvi,
    coolingBenefit: dropLst,
    canopyAfter: Math.min(100, zone.canopy + gainCanopy),
    ndviAfter: Math.min(1.0, zone.ndvi + gainNdvi),
    lstAfter: Math.max(20, zone.lst - dropLst),
  };
}

// Generate Mock Planting Coordinates around a center
export function generatePlantingCoordinates(center, count, seed) {
  return Array.from({ length: count }).map((_, i) => {
    const angle = seededValue(`${seed}a${i}`, 0, Math.PI * 2);
    const radius = seededValue(`${seed}r${i}`, 0.0005, 0.003); // approx 50m to 300m
    const lat = center[0] + radius * Math.cos(angle);
    const lng = center[1] + radius * Math.sin(angle);
    return {
      id: `P-${i+1}`,
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      suitability: seededValue(`${seed}s${i}`, 75, 95).toFixed(1) + '%'
    };
  });
}

// Generate Mock Circular Polygon for GeoJSON fallback
export function createMockGeoJSONPolygon(center) {
  const points = 12;
  const radius = 0.0035;
  const coordinates = [];
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * Math.PI * 2;
    coordinates.push([
      center[1] + radius * Math.sin(angle), // Lng
      center[0] + radius * Math.cos(angle)  // Lat
    ]);
  }
  return {
    type: "Feature",
    properties: { name: "Generated Demo ROI" },
    geometry: {
      type: "Polygon",
      coordinates: [coordinates]
    }
  };
}
