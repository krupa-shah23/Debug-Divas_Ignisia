import { ensureCelsiusNumber } from './lst';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function toFiniteNumber(value, fallback = null) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

export function toBoolean(value, fallback = false) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  return fallback;
}

export function deriveCanopyProxyFromNdvi(ndvi) {
  if (!Number.isFinite(ndvi)) {
    return null;
  }

  // Architectural note: until the backend exposes measured canopy cover, we use
  // a proxy derived from live NDVI so simulation baselines remain telemetry-led.
  return Number(clamp(ndvi * 100, 0, 95).toFixed(1));
}

export function getClimateStressLevel({ LST, NDVI, drought_index }) {
  const heatScore = Number.isFinite(LST) ? clamp((LST - 32) / 10, 0, 1) : 0;
  const canopyStress = Number.isFinite(NDVI) ? clamp((0.45 - NDVI) / 0.45, 0, 1) : 0;
  const droughtScore = Number.isFinite(drought_index) ? clamp(drought_index, 0, 1) : 0;
  const composite = (heatScore * 0.45) + (canopyStress * 0.3) + (droughtScore * 0.25);

  if (composite >= 0.7) {
    return 'High';
  }
  if (composite >= 0.4) {
    return 'Moderate';
  }
  return 'Low';
}

export function buildTelemetryReason(zone) {
  if (zone?.reason) {
    return zone.reason;
  }

  const reasons = [];
  if (Number.isFinite(zone?.LST) && zone.LST >= 37) {
    reasons.push('surface temperatures are elevated');
  }
  if (Number.isFinite(zone?.NDVI) && zone.NDVI <= 0.3) {
    reasons.push('vegetation cover is limited');
  }
  if (zone?.water_feasible === false || zone?.water_ok === false) {
    reasons.push('water infrastructure is constrained');
  }
  if (zone?.selected) {
    reasons.push('the optimizer selected this zone for intervention');
  }

  return reasons.length
    ? reasons.join(', ')
    : 'environmental conditions are comparatively stable';
}

export function normalizeZoneTelemetry(zone, index = 0) {
  const zoneId = String(zone?.zone_id || zone?.Zone_ID || zone?.id || zone?.zone || `zone_${index + 1}`);
  const NDVI = toFiniteNumber(zone?.NDVI ?? zone?.ndvi);
  const LST = ensureCelsiusNumber(
    zone?.LST ?? zone?.lst ?? zone?.lst_c ?? zone?.lst_mean_c ?? zone?.temp_before,
    null
  );
  const priorityScore = toFiniteNumber(zone?.priority_score ?? zone?.impact_score ?? zone?.score, null);
  const droughtIndex = toFiniteNumber(zone?.drought_index, null);
  const trees = Math.max(
    0,
    Math.round(toFiniteNumber(zone?.trees ?? zone?.required_trees ?? zone?.recommended_trees, 0))
  );
  const waterFeasible = toBoolean(zone?.water_feasible ?? zone?.water_ok ?? zone?.water_available ?? zone?.water_access, true);
  const canopy = toFiniteNumber(
    zone?.tree_canopy_pct ?? zone?.canopy_pct ?? zone?.canopy ?? zone?.canopyPercent,
    deriveCanopyProxyFromNdvi(NDVI)
  );

  const normalizedZone = {
    ...zone,
    zone_id: zoneId,
    zone_name: zone?.zone_name || zone?.name || `Zone ${zoneId}`,
    NDVI,
    ndvi: NDVI,
    LST,
    lst: LST,
    lst_c: LST,
    impact_score: priorityScore,
    priority_score: priorityScore,
    drought_index: droughtIndex,
    water_feasible: waterFeasible,
    water_ok: toBoolean(zone?.water_ok, waterFeasible),
    water_available: waterFeasible,
    trees,
    required_trees: trees,
    selected: toBoolean(zone?.selected, false),
    tree_canopy_pct: canopy,
    canopy,
    soil_moisture: toFiniteNumber(zone?.soil_moisture),
    risk_level: zone?.risk_level || null,
  };

  normalizedZone.reason = buildTelemetryReason(normalizedZone);
  normalizedZone.climate_stress_level = getClimateStressLevel(normalizedZone);
  return normalizedZone;
}

export function normalizeZones(zones = []) {
  const normalizedZones = zones.map((zone, index) => normalizeZoneTelemetry(zone, index));
  const rankedZones = [...normalizedZones].sort((left, right) => {
    const rightScore = toFiniteNumber(right.priority_score, -Infinity);
    const leftScore = toFiniteNumber(left.priority_score, -Infinity);
    return rightScore - leftScore;
  });

  const rankLookup = new Map(rankedZones.map((zone, index) => [zone.zone_id, index + 1]));
  return normalizedZones.map((zone) => ({
    ...zone,
    priority_rank: rankLookup.get(zone.zone_id) || null,
  }));
}

export function normalizeOptimizationPayload(payload = {}) {
  const zones = normalizeZones(Array.isArray(payload?.zones) ? payload.zones : []);
  const zoneLookup = new Map(zones.map((zone) => [zone.zone_id, zone]));
  const selectedZones = (Array.isArray(payload?.selected_zones) ? payload.selected_zones : [])
    .map((zone, index) => {
      const normalizedZone = normalizeZoneTelemetry(zone, index);
      return zoneLookup.get(normalizedZone.zone_id) || normalizedZone;
    });

  return {
    ...payload,
    zones,
    selected_zones: selectedZones,
    summary: {
      ...(payload?.summary || {}),
      total_trees: toFiniteNumber(payload?.summary?.total_trees ?? payload?.total_trees, 0),
      count_selected: toFiniteNumber(payload?.summary?.count_selected ?? payload?.count_selected, selectedZones.length),
    },
    total_trees: toFiniteNumber(payload?.summary?.total_trees ?? payload?.total_trees, 0),
    count_selected: toFiniteNumber(payload?.summary?.count_selected ?? payload?.count_selected, selectedZones.length),
  };
}
