import React, { useMemo, useState } from 'react';
import { Card, Select, Row, Col, Typography, Tag, Progress, Divider } from 'antd';

const { Title, Text } = Typography;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export default function SeasonPlanner({ zones = [] }) {
  const [season, setSeason] = useState('summer');

  const telemetryFallbacks = useMemo(() => {
    const validLst = zones.map((zone) => Number(zone.lst_c ?? zone.LST)).filter(Number.isFinite);
    const validNdvi = zones.map((zone) => Number(zone.ndvi ?? zone.NDVI)).filter(Number.isFinite);

    return {
      lst: validLst.length ? validLst.reduce((sum, value) => sum + value, 0) / validLst.length : null,
      ndvi: validNdvi.length ? validNdvi.reduce((sum, value) => sum + value, 0) / validNdvi.length : null,
    };
  }, [zones]);

  const getDynamicContent = (zone, currentSeason, index) => {
    const lst = Number.isFinite(Number(zone.lst_c ?? zone.LST)) ? Number(zone.lst_c ?? zone.LST) : telemetryFallbacks.lst;
    const ndvi = Number.isFinite(Number(zone.ndvi ?? zone.NDVI)) ? Number(zone.ndvi ?? zone.NDVI) : telemetryFallbacks.ndvi;
    const droughtIndex = Number(zone.drought_index ?? 0) || 0;
    const waterFeasible = zone.water_feasible ?? zone.water_ok ?? zone.water_access ?? true;

    const heatStress = Number.isFinite(lst) ? clamp((lst - 30) / 12, 0, 1) : 0;
    const canopyStress = Number.isFinite(ndvi) ? clamp((0.45 - ndvi) / 0.45, 0, 1) : 0;
    const waterStress = waterFeasible ? 0 : 0.25;
    const seasonalModifier = currentSeason === 'summer' ? 0.15 : currentSeason === 'monsoon' ? -0.1 : 0.05;
    const composite = clamp(heatStress * 0.45 + canopyStress * 0.35 + droughtIndex * 0.2 + waterStress + seasonalModifier, 0, 1);
    const score = Math.max(1, Math.min(10, Math.round(composite * 10)));

    const prefixes = ['Critical:', 'Priority:', 'Scheduled:', 'Monitoring:'];
    const prefix = prefixes[index % prefixes.length];

    let detail = 'Telemetry gap detected.';
    if (currentSeason === 'summer' && Number.isFinite(lst)) {
      detail = lst > 40 ? `High thermal stress (${lst.toFixed(1)}C).` : `Thermal conditions remain manageable at ${lst.toFixed(1)}C.`;
    } else if (currentSeason === 'monsoon' && Number.isFinite(ndvi)) {
      detail = ndvi < 0.2 ? `Low greenness (${ndvi.toFixed(2)}) needs planting support.` : `Vegetation is responding well to moisture availability.`;
    } else if (currentSeason === 'winter') {
      detail = Number.isFinite(lst)
        ? `Cool-season logistics should account for baseline heat of ${lst.toFixed(1)}C.`
        : 'Cool-season logistics should account for local telemetry variability.';
    }

    return { score, reason: `${prefix} ${detail}` };
  };

  return (
    <Card
      title={<div style={{ padding: '8px 0' }}><Title level={4} style={{ margin: 0, fontWeight: 700 }}>Agricultural Season Planner</Title></div>}
      style={{ borderRadius: 16, boxShadow: '0 8px 24px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}
      bodyStyle={{ padding: '24px' }}
    >
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center' }}>
        <Text strong style={{ fontSize: 13, textTransform: 'uppercase', color: '#64748b', marginRight: 16 }}>Forecast Window</Text>
        <Select
          value={season}
          onChange={setSeason}
          style={{ width: 220 }}
          size="large"
          options={[
            { value: 'summer', label: 'Summer Analysis' },
            { value: 'monsoon', label: 'Monsoon Planning' },
            { value: 'winter', label: 'Winter Logistics' }
          ]}
        />
      </div>

      <Row gutter={[24, 24]}>
        {zones.slice(0, 6).map((zone, index) => {
          const { score, reason } = getDynamicContent(zone, season, index);
          const displayLST = Number.isFinite(Number(zone.lst_c ?? zone.LST)) ? Number(zone.lst_c ?? zone.LST) : telemetryFallbacks.lst;
          const displayNDVI = Number.isFinite(Number(zone.ndvi ?? zone.NDVI)) ? Number(zone.ndvi ?? zone.NDVI) : telemetryFallbacks.ndvi;

          const isCritical = score > 7;
          const isWarning = score > 4;
          const accentColor = isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981';
          const trackColor = isCritical ? '#fef2f2' : isWarning ? '#fffbeb' : '#ecfdf5';
          const badgeText = isCritical ? 'Critical' : isWarning ? 'Priority' : 'Monitoring';

          return (
            <Col xs={24} md={12} key={zone.zone_id || index}>
              <div style={{
                padding: '24px',
                background: '#fff',
                borderRadius: '16px',
                border: `1px solid ${isCritical ? '#fecaca' : '#e2e8f0'}`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sector {zone.zone_id}</Text>
                    <Title level={5} style={{ margin: '4px 0 0 0', fontWeight: 600 }}>{zone.zone_name || `Zone ${zone.zone_id}`}</Title>
                  </div>
                  <Tag color={isCritical ? 'red' : isWarning ? 'orange' : 'green'} style={{ margin: 0, borderRadius: 6, fontWeight: 500, padding: '4px 10px' }}>
                    {badgeText}: {score}/10
                  </Tag>
                </div>

                <div style={{ flexGrow: 1 }}>
                  <Text style={{ display: 'block', marginTop: 16, fontSize: '14px', color: '#334155', lineHeight: 1.5 }}>
                    {reason}
                  </Text>
                </div>

                <div style={{ marginTop: 24 }}>
                  <Progress
                    percent={score * 10}
                    size={[-1, 8]}
                    showInfo={false}
                    strokeColor={accentColor}
                    trailColor={trackColor}
                  />
                  <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <Text type="secondary" strong>Telemetry Data</Text>
                    <Text type="secondary">
                      {displayLST != null ? `${displayLST.toFixed(1)}C` : 'LST N/A'}
                      <Divider type="vertical" />
                      {displayNDVI != null ? `${displayNDVI.toFixed(2)} NDVI` : 'NDVI N/A'}
                    </Text>
                  </div>
                </div>
              </div>
            </Col>
          );
        })}
      </Row>
    </Card>
  );
}
