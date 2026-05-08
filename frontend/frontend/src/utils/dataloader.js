import { fetchCityGeoJson, fetchCityTelemetry } from './api';

export async function loadCityGeoJson(city) {
  if (!city) {
    throw new Error('City parameter is required');
  }

  try {
    return await fetchCityGeoJson(String(city).toLowerCase().trim());
  } catch (error) {
    throw new Error('GeoJSON not available - City GeoJSON could not be loaded');
  }
}

export async function loadCityScoredZones(city, options = {}) {
  if (!city) {
    throw new Error('City parameter is required');
  }

  try {
    const payload = await fetchCityTelemetry({
      city: String(city).toLowerCase().trim(),
      droughtMode: options.droughtMode || 'normal',
    });
    return payload.zones || [];
  } catch (error) {
    throw new Error(`Scored zones data not available for city: ${String(city).toLowerCase().trim()}`);
  }
}

export async function loadCitySimulation(city, options = {}) {
  return loadCityScoredZones(city, options);
}

export async function loadData(city, options = {}) {
  const zones = await loadCityScoredZones(city, options);
  return JSON.stringify(zones);
}
