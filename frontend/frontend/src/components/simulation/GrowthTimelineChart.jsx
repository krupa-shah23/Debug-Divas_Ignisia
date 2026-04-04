import React, { useMemo } from 'react';
import { Card, Typography } from 'antd';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceDot
} from 'recharts';

const { Title, Text } = Typography;

export default function GrowthTimelineChart({ selectedZone, projection, simulated, timeHorizon }) {
  const data = useMemo(() => {
    // Before simulation -> Flat line
    if (!simulated) {
      return [0, 6, 12, 60, 120].map((m) => {
        let label = 'Baseline';
        if (m === 6) label = '6 Months';
        if (m === 12) label = '1 Year';
        if (m === 60) label = '5 Years';
        if (m === 120) label = '10 Years';
        return {
          month: label,
          xVal: m,
          Canopy: selectedZone.canopy,
          NDVI: selectedZone.ndvi * 100, // Normalized
          LST_Drop: 0
        };
      });
    }

    return [0, 6, 12, 60, 120].map((m) => {
       const ratio = Math.min(1, m / timeHorizon); // Reaches 100% of projection at timeHorizon
       let label = 'Baseline';
       if (m === 6) label = '6 Months';
       if (m === 12) label = '1 Year';
       if (m === 60) label = '5 Years';
       if (m === 120) label = '10 Years';
       return {
          month: label,
          xVal: m,
          Canopy: selectedZone.canopy + (projection.canopyGain * ratio),
          NDVI: (selectedZone.ndvi + (projection.ndviGain * ratio)) * 100,
          LST_Drop: projection.coolingBenefit * ratio
       };
    });
  }, [selectedZone, projection, simulated, timeHorizon]);

  return (
    <Card 
       style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.04)', border: 'none', height: '100%' }}
       title={<div style={{ padding: '8px 0' }}><Title level={4} style={{ margin: 0, fontWeight: 600 }}>Projected Growth Timeline</Title></div>}
    >
      {!simulated && <div style={{ marginBottom: 16 }}><Text type="secondary">Showing flat baseline. Run the simulation to generate projected progression curves.</Text></div>}
      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fill: '#475569', fontWeight: 500 }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
            
            <Tooltip 
               contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 8px 16px rgba(0,0,0,0.08)' }}
               formatter={(value, name) => [value.toFixed(2) + (name === 'Cooling Drop (°C)' ? '°C' : name === 'Canopy %' ? '%' : ''), name]}
               labelStyle={{ fontWeight: 700, color: '#0f172a', marginBottom: 8 }}
            />
            <Legend wrapperStyle={{ paddingTop: 20 }} iconType="circle" />
            
            <Line yAxisId="left" type="monotone" dataKey="Canopy" name="Canopy %" stroke="#16a34a" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 8, stroke: '#fff', strokeWidth: 2 }} />
            <Line yAxisId="left" type="monotone" dataKey="NDVI" name="Greenness (NDVIx100)" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 8, stroke: '#fff', strokeWidth: 2 }} />
            <Line yAxisId="right" type="monotone" dataKey="LST_Drop" name="Cooling Drop (°C)" stroke="#ef4444" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 8, stroke: '#fff', strokeWidth: 2 }} />
            
            {/* Highlight Active Timeline Selection */}
            {simulated && (
               <ReferenceDot yAxisId="left" x={data.find(d => d.xVal === timeHorizon)?.month} y={data.find(d => d.xVal === timeHorizon)?.Canopy} r={8} fill="#16a34a" stroke="#fff" strokeWidth={3} />
            )}
            {simulated && (
               <ReferenceDot yAxisId="right" x={data.find(d => d.xVal === timeHorizon)?.month} y={data.find(d => d.xVal === timeHorizon)?.LST_Drop} r={8} fill="#ef4444" stroke="#fff" strokeWidth={3} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
