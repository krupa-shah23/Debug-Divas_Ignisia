import { normalizeOptimizationPayload } from './telemetry';

function buildPublicUrl(pathname) {
  const basePath = import.meta.env.BASE_URL || '/';
  return `${basePath}${pathname}`.replace(/([^:]\/)\/+/g, '$1');
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
export const DEFAULT_OPTIMIZATION_BUDGET = 500;

function normalizeCity(city) {
  return String(city || '').trim().toLowerCase();
}

function normalizeBudget(budget) {
  if (budget == null || budget === '') {
    return DEFAULT_OPTIMIZATION_BUDGET;
  }

  const numericBudget = Number(budget);
  if (!Number.isFinite(numericBudget)) {
    throw new Error('Budget must be a valid number.');
  }

  const normalizedBudget = Math.trunc(numericBudget);
  if (normalizedBudget < 0) {
    throw new Error('Budget must be zero or greater.');
  }

  return normalizedBudget;
}

function normalizeDroughtMode(droughtMode, drought_mode) {
  const resolved = drought_mode ?? droughtMode ?? 'normal';
  return String(resolved).trim().toLowerCase() || 'normal';
}

function buildOptimizePayload({ city, budget, droughtMode, drought_mode }) {
  const normalizedCity = normalizeCity(city);
  if (!normalizedCity) {
    throw new Error('City is required before running optimization.');
  }

  const payload = {
    city: normalizedCity,
    budget: normalizeBudget(budget),
    drought_mode: normalizeDroughtMode(droughtMode, drought_mode),
  };

  console.log('[optimize] outgoing payload', payload);
  return payload;
}

async function parseJsonResponse(response, fallbackMessage) {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const validationSummary = Array.isArray(payload?.details)
      ? payload.details.map((detail) => detail?.msg).filter(Boolean).join(', ')
      : '';
    const message = payload?.error || validationSummary || fallbackMessage;
    throw new Error(message);
  }

  return payload;
}

async function fetchJson(pathname, options = {}, fallbackMessage) {
  const response = await fetch(`${API_BASE_URL}${pathname}`, options);
  return parseJsonResponse(response, fallbackMessage);
}

export async function runZoneOptimization({ city, budget, droughtMode = 'normal', drought_mode } = {}) {
  const requestPayload = buildOptimizePayload({ city, budget, droughtMode, drought_mode });
  const payload = await fetchJson('/optimize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestPayload),
  }, 'Failed to run the optimization pipeline.');

  return normalizeOptimizationPayload(payload);
}

export async function fetchCityTelemetry({ city, budget = DEFAULT_OPTIMIZATION_BUDGET, droughtMode = 'normal', drought_mode } = {}) {
  return runZoneOptimization({ city, budget, droughtMode, drought_mode });
}

export async function fetchCityZones({ city, budget = DEFAULT_OPTIMIZATION_BUDGET, droughtMode = 'normal', drought_mode } = {}) {
  const payload = await fetchCityTelemetry({ city, budget, droughtMode, drought_mode });
  return payload.zones || [];
}

export async function fetchCityAnalytics({ city, budget = DEFAULT_OPTIMIZATION_BUDGET, droughtMode = 'normal', drought_mode } = {}) {
  const payload = await fetchCityTelemetry({ city, budget, droughtMode, drought_mode });
  return {
    city,
    zones: payload.zones || [],
    selected_zones: payload.selected_zones || [],
    summary: payload.summary || {},
    total_trees: payload.total_trees || 0,
    count_selected: payload.count_selected || 0,
  };
}

export async function fetchSimulationTelemetry({ city, budget = DEFAULT_OPTIMIZATION_BUDGET, droughtMode = 'normal', drought_mode } = {}) {
  const payload = await fetchCityTelemetry({ city, budget, droughtMode, drought_mode });
  return {
    city,
    zones: payload.zones || [],
    selected_zones: payload.selected_zones || [],
    summary: payload.summary || {},
    total_trees: payload.total_trees || 0,
  };
}

export async function chatWithZones({
  query,
  city,
  selectedZones = [],
  totalTrees = 0,
  lang = 'en-IN',
}) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      city,
      zones: selectedZones,
      total_trees: totalTrees,
      lang,
    }),
  });

  return parseJsonResponse(response, 'Failed to contact the zone chatbot.');
}

export async function speechToTextAudio({ audioBlob, lang = 'unknown' }) {
  const response = await fetch('/api/speech-to-text', {
    method: 'POST',
    headers: {
      'Content-Type': audioBlob.type || 'audio/webm',
      'X-Language-Code': lang,
    },
    body: audioBlob,
  });

  return parseJsonResponse(response, 'Failed to transcribe audio.');
}

export async function fetchCityGeoJson(city) {
  const response = await fetch(buildPublicUrl(`data/geojson/zones_${city.toLowerCase()}.geojson`));
  return parseJsonResponse(response, `GeoJSON not available for ${city}.`);
}

export { buildPublicUrl };
