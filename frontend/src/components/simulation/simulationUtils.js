export const calculateProjectedMetrics = (selectedZone, treeCount, profile, horizonFactor) => {
  const canopyGainRaw = Math.min(10, treeCount * 0.12) * profile.canopyMultiplier * horizonFactor;
  const ndviGainRaw = Math.min(0.14, treeCount * 0.003) * profile.ndviMultiplier * horizonFactor;
  const lstDropRaw = Math.min(1.8, treeCount * 0.025) * profile.coolingMultiplier * horizonFactor;

  const canopyAfter = Math.min(100, +(selectedZone.tree_canopy_pct + canopyGainRaw).toFixed(1));
  const ndviAfter = Math.min(0.95, +(selectedZone.ndvi + ndviGainRaw).toFixed(2));
  const lstAfter = Math.max(20, +(selectedZone.lst_c - lstDropRaw).toFixed(1));

  const coolingBenefit = +(selectedZone.lst_c - lstAfter).toFixed(1);
  const canopyGain = +(canopyAfter - selectedZone.tree_canopy_pct).toFixed(1);
  const ndviGain = +(ndviAfter - selectedZone.ndvi).toFixed(2);

  const benefitScore = Math.min(
    100,
    Math.round(
      (coolingBenefit * 30) +
      (canopyGain * 4) +
      (ndviGain * 120) +
      (selectedZone.water_access ? 8 : -5)
    )
  );

  return {
    canopyAfter,
    ndviAfter,
    lstAfter,
    coolingBenefit,
    canopyGain,
    ndviGain,
    benefitScore
  };
};

export const getAnimatedMetrics = (selectedZone, projected, progress) => {
  return {
    canopy: +(
      selectedZone.tree_canopy_pct +
      (projected.canopyAfter - selectedZone.tree_canopy_pct) * (progress / 100)
    ).toFixed(1),
    ndvi: +(
      selectedZone.ndvi +
      (projected.ndviAfter - selectedZone.ndvi) * (progress / 100)
    ).toFixed(2),
    lst: +(
      selectedZone.lst_c +
      (projected.lstAfter - selectedZone.lst_c) * (progress / 100)
    ).toFixed(1),
    benefit: Math.round(projected.benefitScore * (progress / 100))
  };
};

export const getBeforeAfterData = (selectedZone, projected, simulated, isSimulating) => {
  return [
    {
      metric: 'Canopy %',
      Before: selectedZone.tree_canopy_pct,
      After: simulated || isSimulating ? projected.canopyAfter : selectedZone.tree_canopy_pct
    },
    {
      metric: 'NDVI',
      Before: selectedZone.ndvi,
      After: simulated || isSimulating ? projected.ndviAfter : selectedZone.ndvi
    },
    {
      metric: 'LST °C',
      Before: selectedZone.lst_c,
      After: simulated || isSimulating ? projected.lstAfter : selectedZone.lst_c
    }
  ];
};

export const getTimelineData = (selectedZone, projected, timeHorizon) => {
  return [
    {
      month: '0',
      canopy: selectedZone.tree_canopy_pct,
      ndvi: selectedZone.ndvi,
      lst: selectedZone.lst_c
    },
    {
      month: '6',
      canopy: +(selectedZone.tree_canopy_pct + projected.canopyGain * 0.6).toFixed(1),
      ndvi: +(selectedZone.ndvi + projected.ndviGain * 0.6).toFixed(2),
      lst: +(selectedZone.lst_c - projected.coolingBenefit * 0.6).toFixed(1)
    },
    {
      month: '12',
      canopy: +(selectedZone.tree_canopy_pct + projected.canopyGain * 0.9).toFixed(1),
      ndvi: +(selectedZone.ndvi + projected.ndviGain * 0.9).toFixed(2),
      lst: +(selectedZone.lst_c - projected.coolingBenefit * 0.9).toFixed(1)
    },
    {
      month: `${timeHorizon}`,
      canopy: projected.canopyAfter,
      ndvi: projected.ndviAfter,
      lst: projected.lstAfter
    }
  ];
};

