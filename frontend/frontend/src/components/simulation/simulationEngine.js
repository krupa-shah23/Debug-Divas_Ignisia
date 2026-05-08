import { ensureCelsiusNumber } from '../../utils/lst';
import { deriveCanopyProxyFromNdvi, toFiniteNumber } from '../../utils/telemetry';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function fixLst(value) {
  return ensureCelsiusNumber(value, null);
}

function deriveZoneReason(zone) {
  if (zone?.reason) {
    return zone.reason;
  }

  if (Number(zone.drought_index ?? 0) > 0.7) {
    return 'High drought risk due to climate stress';
  }

  if (Number(zone.soil_moisture ?? 0) < 0.2) {
    return 'Low soil moisture impacting vegetation survival';
  }

  if (zone.water_feasible === false || zone.water_ok === false) {
    return 'Water infrastructure constraints';
  }

  if (Number(zone.NDVI ?? zone.ndvi ?? 0) < 0.3) {
    return 'Low vegetation density detected';
  }

  return 'Favorable conditions for tree plantation';
}

export function normalizeZoneMetrics(zone, index) {
  const zoneId = String(zone?.zone_id || zone?.Zone_ID || zone?.id || zone?.zone || `Z-${index + 1}`);
  const ndvi = toFiniteNumber(zone?.NDVI ?? zone?.ndvi, null);
  const lst = fixLst(zone?.LST ?? zone?.lst ?? zone?.lst_c ?? zone?.temp_before);
  const canopy = toFiniteNumber(
    zone?.tree_canopy_pct ?? zone?.canopy_pct ?? zone?.canopy,
    deriveCanopyProxyFromNdvi(ndvi)
  );
  const trees = Math.max(0, Math.round(toFiniteNumber(zone?.trees ?? zone?.required_trees ?? zone?.recommended_trees, 0)));
  const impact = toFiniteNumber(zone?.impact_score ?? zone?.priority_score ?? zone?.score, 0);

  return {
    ...zone,
    zone_id: zoneId,
    zone_name: zone?.zone_name || zone?.name || `Zone ${zoneId}`,
    canopy: canopy ?? 0,
    tree_canopy_pct: canopy ?? 0,
    ndvi: ndvi ?? 0,
    NDVI: ndvi,
    lst: lst ?? 0,
    lst_c: lst,
    LST: lst,
    impact,
    impact_score: impact,
    trees,
    water_access: zone?.water_access ?? zone?.water_available ?? zone?.water_feasible ?? zone?.water_ok ?? true,
    reason: deriveZoneReason(zone),
  };
}

export function generateHeuristicSimulation(zone, timeHorizon, options = {}) {
  const droughtMode = options.droughtMode || 'normal';
  const baselineLst = toFiniteNumber(zone?.lst ?? zone?.LST, 0);
  const baselineNdvi = toFiniteNumber(zone?.ndvi ?? zone?.NDVI, 0);
  const baselineCanopy = toFiniteNumber(zone?.canopy ?? zone?.tree_canopy_pct, deriveCanopyProxyFromNdvi(baselineNdvi) ?? 0);
  const treeCount = Math.max(0, Math.round(toFiniteNumber(zone?.trees ?? zone?.required_trees, 0)));
  const waterFactor = zone?.water_access === false || zone?.water_feasible === false ? 0.82 : 1;
  const droughtPenalty = droughtMode === 'severe' ? 0.72 : droughtMode === 'moderate' ? 0.86 : 1;
  const horizonFactor = timeHorizon === 6 ? 0.55 : timeHorizon === 12 ? 1 : timeHorizon === 60 ? 1.85 : 2.55;
  const heatFactor = clamp((baselineLst - 30) / 12, 0.35, 1.25);
  const canopyNeedFactor = clamp((0.55 - baselineNdvi) / 0.55, 0.25, 1.2);
  const growthFactor = horizonFactor * waterFactor * droughtPenalty * heatFactor * canopyNeedFactor;

  const candidateSpots = Math.max(treeCount, Math.round(treeCount * horizonFactor * 0.5));
  const canopyGain = clamp((treeCount * 0.08) * growthFactor, 0.5, 24);
  const ndviGain = clamp((treeCount * 0.0018) * growthFactor, 0.01, 0.32);
  const coolingBenefit = clamp((treeCount * 0.018) * growthFactor * clamp(baselineLst / 36, 0.75, 1.35), 0.2, 8);

  return {
    candidateSpots,
    visibleTrees: Math.max(0, Math.round(candidateSpots * 0.85)),
    canopyGain: Number(canopyGain.toFixed(1)),
    ndviGain: Number(ndviGain.toFixed(3)),
    coolingBenefit: Number(coolingBenefit.toFixed(2)),
    canopyAfter: Number(clamp(baselineCanopy + canopyGain, 0, 100).toFixed(1)),
    ndviAfter: Number(clamp(baselineNdvi + ndviGain, 0, 1).toFixed(3)),
    lstAfter: Number(Math.max(20, baselineLst - coolingBenefit).toFixed(2)),
  };
}
