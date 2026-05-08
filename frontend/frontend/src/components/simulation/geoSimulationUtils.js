import * as turf from '@turf/turf';

/**
 * Get a human-readable feature name from geojson properties.
 */
export const getFeatureDisplayName = (feature, index = 0) => {
  const p = feature?.properties || {};
  return (
    p.zone_name ||
    p.name ||
    p.ward_name ||
    p.ward ||
    p.locality ||
    p.area_name ||
    p.id ||
    p.OBJECTID ||
    `Zone ${index + 1}`
  );
};

/**
 * Try to match a selected zone to a feature in zones.geojson.
 * If no match is found, fallback to a deterministic feature so simulation still works.
 */
export const findFeatureForZone = (geojsonData, selectedZone) => {
  if (!geojsonData?.features?.length) return null;

  const features = geojsonData.features;

  if (selectedZone) {
    // Try matching by zone_id
    let feature = features.find(
      (f) =>
        String(f?.properties?.zone_id || '') === String(selectedZone.zone_id || '') ||
        String(f?.properties?.id || '') === String(selectedZone.zone_id || '') ||
        String(f?.properties?.OBJECTID || '') === String(selectedZone.zone_id || '')
    );

    if (feature) return feature;

    // Try matching by name
    feature = features.find((f) => {
      const p = f?.properties || {};
      const featureName =
        p.zone_name || p.name || p.ward_name || p.ward || p.locality || p.area_name;

      return String(featureName || '').toLowerCase() === String(selectedZone.zone_name || '').toLowerCase();
    });

    if (feature) return feature;
  }

  // Fallback: pick a stable feature based on zone_id hash / index
  const fallbackIndex = selectedZone?.zone_id
    ? Math.abs(
      String(selectedZone.zone_id)
        .split('')
        .reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
    ) % features.length
    : 0;

  return features[fallbackIndex] || features[0];
};

export const getFeatureBounds = (feature) => {
  if (!feature) return null;
  const [minX, minY, maxX, maxY] = turf.bbox(feature);
  return [
    [minY, minX],
    [maxY, maxX]
  ];
};

export const getFeatureCenter = (feature) => {
  if (!feature) return [18.5204, 73.8567]; // fallback Pune
  const center = turf.center(feature);
  return [center.geometry.coordinates[1], center.geometry.coordinates[0]];
};

export const generatePlantingPoints = (feature, treeCount) => {
  if (!feature) return [];

  const bbox = turf.bbox(feature);
  const visualCount = treeCount;

  const points = [];
  let attempts = 0;
  const maxAttempts = 1000;
  const minDistance = 0.00012;

  while (points.length < visualCount && attempts < maxAttempts) {
    attempts += 1;

    const lng = bbox[0] + Math.random() * (bbox[2] - bbox[0]);
    const lat = bbox[1] + Math.random() * (bbox[3] - bbox[1]);

    const pt = turf.point([lng, lat]);

    if (!turf.booleanPointInPolygon(pt, feature)) continue;

    const tooClose = points.some((existing) => {
      const dx = existing.lng - lng;
      const dy = existing.lat - lat;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist < minDistance;
    });

    if (tooClose) continue;

    points.push({
      id: `plant-${points.length + 1}`,
      lat,
      lng
    });
  }

  return points;
};

