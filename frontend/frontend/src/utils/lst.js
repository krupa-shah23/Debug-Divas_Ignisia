const KELVIN_TO_CELSIUS_OFFSET = 273.15;
const KELVIN_THRESHOLD = 100;

export function ensureCelsiusNumber(value, fallback = null) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return numericValue > KELVIN_THRESHOLD
    ? numericValue - KELVIN_TO_CELSIUS_OFFSET
    : numericValue;
}

export function normalizeLstFields(row) {
  const normalized = { ...row };

  ["LST", "lst", "lst_c", "lst_mean_c", "temp_before", "temp_after"].forEach((key) => {
    if (key in normalized) {
      const converted = ensureCelsiusNumber(normalized[key], normalized[key]);
      normalized[key] = converted;
    }
  });

  return normalized;
}
