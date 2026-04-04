import React, { useState } from "react";
import { Card, Select, Row, Col, Typography, Tag, Progress, Divider } from "antd";

const { Title, Text } = Typography;

export default function SeasonPlanner({ zones = [] }) {
  const [season, setSeason] = useState("summer");

  const getDynamicContent = (zone, currentSeason, index) => {
    // Ensure we have numbers to avoid NaN
    const lst = Number(zone.lst_c || zone.LST || 34.0);
    const ndvi = Number(zone.ndvi || zone.NDVI || 0.3);

    let raw = 0;
    if (currentSeason === "summer") raw = (lst * 0.75) - (ndvi * 5);
    else if (currentSeason === "monsoon") raw = (ndvi * 25) + (zone.water_access ? 10 : 0);
    else raw = (30 - lst) + (ndvi * 15);

    // Convert to a Natural Number (Integer) 1-10
    const score = Math.round(Math.min(10, Math.max(1, 1 + (Math.abs(raw) % 9))));

    const prefixes = ["Critical:", "Priority:", "Scheduled:", "Monitoring:"];
    const prefix = prefixes[index % prefixes.length];

    let detail = "";
    if (currentSeason === "summer") {
      detail = lst > 40 ? `High thermal stress (${lst.toFixed(1)}°C).` : `Standard canopy gap maintenance.`;
    } else if (currentSeason === "monsoon") {
      detail = ndvi < 0.2 ? `Low density (${ndvi.toFixed(2)}) needs planting.` : `Soil enrichment logic active.`;
    } else {
      detail = `Soil stabilization required for ${lst.toFixed(1)}°C temps.`;
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
            { value: "summer", label: "🔥 Summer Analysis" },
            { value: "monsoon", label: "🌧️ Monsoon Planning" },
            { value: "winter", label: "❄️ Winter Logistics" }
          ]}
        />
      </div>

      <Row gutter={[24, 24]}>
        {zones.slice(0, 6).map((zone, i) => {
          const { score, reason } = getDynamicContent(zone, season, i);

          const displayLST = Number(zone.lst_c || zone.LST || 34.0);
          const displayNDVI = Number(zone.ndvi || zone.NDVI || 0.3);

          const isCritical = score > 7;
          const isWarning = score > 4;
          
          const accentColor = isCritical ? "#ef4444" : isWarning ? "#f59e0b" : "#10b981";
          const trackColor = isCritical ? "#fef2f2" : isWarning ? "#fffbeb" : "#ecfdf5";
          const badgeText = isCritical ? "Critical" : isWarning ? "Priority" : "Monitoring";

          return (
            <Col xs={24} md={12} key={zone.zone_id || i}>
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
                  <Tag color={isCritical ? "red" : isWarning ? "orange" : "green"} style={{ margin: 0, borderRadius: 6, fontWeight: 500, padding: '4px 10px' }}>
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
                    <Text type="secondary">{displayLST.toFixed(1)}°C <Divider type="vertical" /> {displayNDVI.toFixed(2)} NDVI</Text>
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
