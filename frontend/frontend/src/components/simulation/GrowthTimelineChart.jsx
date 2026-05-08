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
  }, [selectedZone, projection, timeHorizon]);

  return (
    <Card 
       style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9', height: '100%' }}
       title={<div style={{ padding: '8px 0' }}><Title level={4} style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>Projected Growth Timeline</Title></div>}
    >
      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="month" tick={{ fill: '#475569', fontWeight: 600, fontSize: 13 }} axisLine={{ stroke: '#cbd5e1', strokeWidth: 2 }} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fill: '#64748b', fontSize: 13 }} axisLine={{ stroke: '#cbd5e1', strokeWidth: 2 }} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748b', fontSize: 13 }} axisLine={{ stroke: '#cbd5e1', strokeWidth: 2 }} tickLine={false} />
            
            <Tooltip 
               contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 8px 16px rgba(0,0,0,0.08)', background: '#fff' }}
               formatter={(value, name) => [value.toFixed(2) + (name === 'Cooling Drop (°C)' ? '°C' : name === 'Canopy %' ? '%' : ''), name]}
               labelStyle={{ fontWeight: 700, color: '#0f172a', marginBottom: 8, textTransform: 'uppercase', fontSize: 12 }}
            />
            <Legend wrapperStyle={{ paddingTop: 20 }} iconType="circle" />
            
            <Line yAxisId="left" type="monotone" dataKey="Canopy" name="Canopy %" stroke="#16a34a" strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 8, fill: '#16a34a', stroke: '#fff', strokeWidth: 2 }} />
            <Line yAxisId="left" type="monotone" dataKey="NDVI" name="Greenness (NDVIx100)" stroke="#059669" strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 8, fill: '#059669', stroke: '#fff', strokeWidth: 2 }} />
            <Line yAxisId="right" type="monotone" dataKey="LST_Drop" name="Cooling Drop (°C)" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 8, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} />
            
            {/* Highlight Active Timeline Selection */}
            <ReferenceDot yAxisId="left" x={data.find(d => d.xVal === timeHorizon)?.month} y={data.find(d => d.xVal === timeHorizon)?.Canopy} r={8} fill="#16a34a" stroke="#fff" strokeWidth={3} />
            <ReferenceDot yAxisId="right" x={data.find(d => d.xVal === timeHorizon)?.month} y={data.find(d => d.xVal === timeHorizon)?.LST_Drop} r={8} fill="#3b82f6" stroke="#fff" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
