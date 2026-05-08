import React, { useMemo } from 'react';
import { Progress, Row, Col, Typography, Card } from 'antd';

const { Title, Text } = Typography;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export default function WorkerHeatBurden({
  lst,
  ndvi,
  droughtIndex = 0,
  waterFeasible = true,
  minLST,
  maxLST
}) {
  const numericLST = Number(lst);
  const safeLST = Number.isFinite(numericLST) ? numericLST : 0;
  const safeNDVI = Number.isFinite(Number(ndvi)) ? Number(ndvi) : 0;
  const safeMin = Number.isFinite(Number(minLST)) ? Number(minLST) : safeLST;
  const safeMax = Number.isFinite(Number(maxLST)) ? Number(maxLST) : safeLST;

  const mapRange = (value, inMin, inMax, outMin, outMax) => {
    if (inMax === inMin) return outMin;
    return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
  };

  const workers = useMemo(() => {
    const heatLoad = clamp(mapRange(safeLST, safeMin, safeMax + 6, 25, 80), 20, 90);
    const canopyPenalty = clamp((0.45 - safeNDVI) / 0.45, 0, 1) * 12;
    const droughtPenalty = clamp(Number(droughtIndex) || 0, 0, 1) * 10;
    const waterPenalty = waterFeasible ? 0 : 8;

    return [
      {
        name: 'Street Vendors',
        icon: 'Vendor',
        color: '#10b981',
        track: '#ecfdf5',
        exposure: heatLoad + canopyPenalty * 0.7 + droughtPenalty * 0.5 + waterPenalty * 0.4
      },
      {
        name: 'Delivery Workers',
        icon: 'Delivery',
        color: '#3b82f6',
        track: '#eff6ff',
        exposure: heatLoad + canopyPenalty * 0.9 + droughtPenalty * 0.7 + waterPenalty * 0.5 + 4
      },
      {
        name: 'Construction Workers',
        icon: 'Construction',
        color: '#f59e0b',
        track: '#fffbeb',
        exposure: heatLoad + canopyPenalty + droughtPenalty + waterPenalty + 8
      }
    ];
  }, [safeLST, safeNDVI, droughtIndex, waterFeasible, safeMin, safeMax]);

  return (
    <Row gutter={[24, 24]}>
      {workers.map((worker) => {
        const pct = Math.max(15, Math.min(96, Math.round(worker.exposure)));
        return (
          <Col xs={24} md={8} key={worker.name}>
            <Card
              bodyStyle={{ padding: '24px' }}
              style={{
                borderRadius: '16px',
                border: '1px solid #f1f5f9',
                borderTop: `4px solid ${worker.color}`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                background: '#fff'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                <Title level={5} style={{ margin: 0, fontWeight: 600, color: '#1e293b' }}>{worker.name}</Title>
              </div>
              <Progress
                percent={pct}
                status="active"
                size={[-1, 12]}
                strokeColor={worker.color}
                trailColor={worker.track}
                format={(value) => <Text strong style={{ color: worker.color }}>{value}%</Text>}
              />
              <Text type="secondary" style={{ display: 'block', marginTop: 12, fontSize: '13px', fontWeight: 500 }}>
                Telemetry-derived heat burden
              </Text>
            </Card>
          </Col>
        );
      })}
    </Row>
  );
}
