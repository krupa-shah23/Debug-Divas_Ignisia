export const mockZones = [
  {
    zone_id: 'zone_1',
    zone_name: 'North Market',
    tree_canopy_pct: 5,
    ndvi: 0.16,
    lst_c: 40.2,
    vulnerability_index: 0.84,
    impact_score: 89,
    recommended_trees: 35,
    water_access: true
  },
  {
    zone_id: 'zone_2',
    zone_name: 'North Central',
    tree_canopy_pct: 11,
    ndvi: 0.24,
    lst_c: 37.9,
    vulnerability_index: 0.69,
    impact_score: 76,
    recommended_trees: 28,
    water_access: true
  },
  {
    zone_id: 'zone_3',
    zone_name: 'North Transit Belt',
    tree_canopy_pct: 9,
    ndvi: 0.21,
    lst_c: 38.5,
    vulnerability_index: 0.61,
    impact_score: 72,
    recommended_trees: 30,
    water_access: false
  },
  {
    zone_id: 'zone_5',
    zone_name: 'Central Core',
    tree_canopy_pct: 4,
    ndvi: 0.14,
    lst_c: 41.1,
    vulnerability_index: 0.79,
    impact_score: 91,
    recommended_trees: 40,
    water_access: true
  },
  {
    zone_id: 'zone_7',
    zone_name: 'Industrial South',
    tree_canopy_pct: 6,
    ndvi: 0.17,
    lst_c: 40.0,
    vulnerability_index: 0.72,
    impact_score: 85,
    recommended_trees: 32,
    water_access: false
  }
];

export const treeProfiles = {
  native: {
    label: 'Native Shade Tree',
    canopyMultiplier: 1.0,
    coolingMultiplier: 1.0,
    ndviMultiplier: 1.0,
    waterNeed: 'Medium',
    color: 'green'
  },
  fast: {
    label: 'Fast-Growth Urban Tree',
    canopyMultiplier: 1.2,
    coolingMultiplier: 0.9,
    ndviMultiplier: 1.1,
    waterNeed: 'High',
    color: 'blue'
  },
  drought: {
    label: 'Drought-Resilient Species',
    canopyMultiplier: 0.8,
    coolingMultiplier: 0.85,
    ndviMultiplier: 0.9,
    waterNeed: 'Low',
    color: 'gold'
  }
};

export const horizonFactors = {
  6: 0.6,
  12: 1.0,
  18: 1.18,
  24: 1.35
};

