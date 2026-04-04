import React, { useMemo } from "react";
import { Progress, Row, Col, Typography, Card } from "antd";

const { Title, Text } = Typography;

export default function WorkerHeatBurden({ lst, zoneIndex = 0, citySeed = 1, minLST, maxLST }) {
  const numericLST = Number(lst) || 34.0;
  const safeMin = Number(minLST) || 28;
  const safeMax = (Number(maxLST) || 48) + 10; // Extra buffer prevents 98% saturation

  const mapRange = (value, inMin, inMax, outMin, outMax) => {
    if (inMax === inMin) return outMin;
    return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
  };

  const workers = useMemo(() => {
    // Unique City Offset ensures different cities don't look identical
    const cityBaseShift = (citySeed % 12) - 6;
    const getJitter = (id) => Math.sin(citySeed + zoneIndex + id) * 4;

    return [
      {
        name: "Street Vendors",
        icon: "🏪",
        color: "#10b981", // teal/green
        track: "#ecfdf5",
        exposure: mapRange(numericLST, safeMin, safeMax, 30, 70) + cityBaseShift + getJitter(1)
      },
      {
        name: "Delivery Workers",
        icon: "🛵",
        color: "#3b82f6", // blue
        track: "#eff6ff",
        exposure: mapRange(numericLST, safeMin, safeMax, 35, 75) + cityBaseShift + getJitter(2)
      },
      {
        name: "Construction Workers",
        icon: "🏗️",
        color: "#f59e0b", // amber
        track: "#fffbeb",
        exposure: mapRange(numericLST, safeMin, safeMax, 40, 80) + cityBaseShift + getJitter(3)
      }
    ];
  }, [numericLST, zoneIndex, citySeed, safeMin, safeMax]);

  return (
    <Row gutter={[24, 24]}>
      {workers.map((w, i) => {
        const pct = Math.max(15, Math.min(96, Math.round(w.exposure)));
        return (
          <Col xs={24} md={8} key={i}>
            <Card 
              bodyStyle={{ padding: '24px' }}
              style={{ 
                borderRadius: '16px', 
                border: '1px solid #f1f5f9', 
                borderTop: `4px solid ${w.color}`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                background: '#fff'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 28, marginRight: 12 }}>{w.icon}</span>
                <Title level={5} style={{ margin: 0, fontWeight: 600, color: '#1e293b' }}>{w.name}</Title>
              </div>
              <Progress
                percent={pct}
                status="active"
                size={[-1, 12]}
                strokeColor={w.color}
                trailColor={w.track}
                format={(p) => <Text strong style={{ color: w.color }}>{p}%</Text>}
              />
              <Text type="secondary" style={{ display: 'block', marginTop: 12, fontSize: '13px', fontWeight: 500 }}>
                Zone-Specific Risk Profile
              </Text>
            </Card>
          </Col>
        );
      })}
    </Row>
  );
}
