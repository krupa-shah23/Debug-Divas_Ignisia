import React from 'react';
import { Card, Typography, Row, Col, Statistic, Select, Button, Segmented, Spin, Tag, Badge, Divider } from 'antd';
import { PlayCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function ProjectedImpactSummary({
  selectedCity,
  setSelectedCity,
  cityOptions,
  zones,
  selectedZoneId,
  setSelectedZoneId,
  selectedZone,
  projection,
  timeHorizon,
  setTimeHorizon,
  isSimulating,
  simulated,
  runSimulation
}) {
  
  return (
    <Card 
      style={{ borderRadius: 16, boxShadow: '0 8px 24px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', height: '100%' }}
      styles={{ body: { padding: 0, height: '100%', display: 'flex', flexDirection: 'column' } }}
    >
      {/* HEADER CONTROLS */}
      <div style={{ padding: '24px 24px 20px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
           <Select
              value={selectedCity}
              onChange={(v) => { setSelectedCity(v); setSelectedZoneId(''); }}
              style={{ width: 140 }}
              size="large"
              options={cityOptions.map(c => ({ value: c, label: c.toUpperCase() }))}
           />
           <Select
              value={selectedZoneId}
              onChange={(v) => { setSelectedZoneId(v); }}
              style={{ flex: 1, minWidth: 200 }}
              size="large"
              options={zones.map(z => ({ value: z.zone_id, label: z.zone_name }))}
              disabled={zones.length === 0}
           />
        </div>

        <Row gutter={[24, 24]}>
           <Col span={6}><Statistic title={<Text type="secondary" style={{ fontSize: 13 }}>Baseline Canopy</Text>} value={selectedZone.canopy} suffix="%" valueStyle={{ fontSize: 22, fontWeight: 600, color: '#0f172a' }} /></Col>
           <Col span={6}><Statistic title={<Text type="secondary" style={{ fontSize: 13 }}>Baseline NDVI</Text>} value={selectedZone.ndvi} precision={2} valueStyle={{ fontSize: 22, fontWeight: 600, color: '#0f172a' }} /></Col>
           <Col span={6}><Statistic title={<Text type="secondary" style={{ fontSize: 13 }}>Telemetry LST</Text>} value={selectedZone.lst} suffix="°C" valueStyle={{ fontSize: 22, fontWeight: 600, color: '#0f172a' }} /></Col>
           <Col span={6}><Statistic title={<Text type="secondary" style={{ fontSize: 13 }}>Impact Score</Text>} value={selectedZone.impact} precision={3} valueStyle={{ fontSize: 22, fontWeight: 600, color: '#0f172a' }} /></Col>
        </Row>
      </div>

      {/* SIMULATION ACTION AREA */}
      <div style={{ padding: '24px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', flexGrow: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
           <div>
              <Text strong style={{ display: 'block', fontSize: 12, letterSpacing: '0.5px', textTransform: 'uppercase', color: '#64748b', marginBottom: 8 }}>Forecast Timeline</Text>
              <Segmented 
                options={[
                  { label: '6 Months', value: 6 }, 
                  { label: '1 Year', value: 12 }, 
                  { label: '5 Years', value: 60 }, 
                  { label: '10 Years', value: 120 }
                ]}
                value={timeHorizon}
                onChange={setTimeHorizon}
                style={{ background: '#e2e8f0', padding: 4, borderRadius: 8 }}
              />
           </div>
           <Button 
             type="primary" 
             size="large" 
             icon={isSimulating ? <Spin size="small" /> : <PlayCircleOutlined />} 
             loading={isSimulating}
             onClick={runSimulation}
             style={{ borderRadius: 8, padding: '0 32px', background: '#2563eb', fontWeight: 600, height: 44, boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }}
           >
             {isSimulating ? 'Computing...' : 'Run Simulation'}
           </Button>
        </div>

      </div>

      {/* RESULTS DISPLAY */}
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
           <ThunderboltOutlined style={{ color: '#10b981', fontSize: 18, marginRight: 8 }} />
           <Title level={5} style={{ margin: 0, fontWeight: 600, color: '#0f172a' }}>
              Projected Improvements
           </Title>
           {simulated && <Tag color="success" style={{ marginLeft: 12, borderRadius: 4, border: 'none' }}>Data Generated</Tag>}
        </div>
        
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Card size="small" bodyStyle={{ padding: '16px' }} style={{ borderRadius: 12, background: simulated ? '#effcf6' : '#f8fafc', border: simulated ? '1px solid #a7f3d0' : '1px solid #f1f5f9', transition: 'all 0.3s' }}>
              <Text style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Canopy Gain</Text>
              <div style={{ marginTop: 8, height: 32, display: 'flex', alignItems: 'center' }}>
                {isSimulating ? <Spin size="small" /> : !simulated ? <Text disabled style={{ fontSize: 24, color: '#cbd5e1' }}>—</Text> : <Text strong style={{ fontSize: 28, color: '#059669', letterSpacing: '-0.5px' }}>+{projection.canopyGain.toFixed(1)}%</Text>}
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" bodyStyle={{ padding: '16px' }} style={{ borderRadius: 12, background: simulated ? '#eff6ff' : '#f8fafc', border: simulated ? '1px solid #bfdbfe' : '1px solid #f1f5f9', transition: 'all 0.3s' }}>
              <Text style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>NDVI Increase</Text>
              <div style={{ marginTop: 8, height: 32, display: 'flex', alignItems: 'center' }}>
                {isSimulating ? <Spin size="small" /> : !simulated ? <Text disabled style={{ fontSize: 24, color: '#cbd5e1' }}>—</Text> : <Text strong style={{ fontSize: 28, color: '#2563eb', letterSpacing: '-0.5px' }}>+{projection.ndviGain.toFixed(2)}</Text>}
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" bodyStyle={{ padding: '16px' }} style={{ borderRadius: 12, background: simulated ? '#fef2f2' : '#f8fafc', border: simulated ? '1px solid #fecaca' : '1px solid #f1f5f9', transition: 'all 0.3s' }}>
              <Text style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Est. Cooling</Text>
              <div style={{ marginTop: 8, height: 32, display: 'flex', alignItems: 'center' }}>
                {isSimulating ? <Spin size="small" /> : !simulated ? <Text disabled style={{ fontSize: 24, color: '#cbd5e1' }}>—</Text> : <Text strong style={{ fontSize: 28, color: '#dc2626', letterSpacing: '-0.5px' }}>-{projection.coolingBenefit.toFixed(1)}°C</Text>}
              </div>
            </Card>
          </Col>
        </Row>
      </div>
      
    </Card>
  );
}
