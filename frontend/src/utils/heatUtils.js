export const calculateHeatExposure = (lst, baseHours) => {
  const adjusted = baseHours + (lst - 35) * 0.1;
  return Math.min(8, Math.max(3, adjusted)).toFixed(1);
};

export const getHeatRisk = (hours) => {
  if (hours < 4) return "Low";
  if (hours < 6) return "Medium";
  return "High";
};