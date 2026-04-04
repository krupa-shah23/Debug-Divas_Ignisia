import React from 'react';
import { Card, Typography } from 'antd';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell
} from 'recharts';

const { Title } = Typography;

export default function BaselineChart({ selectedZone }) {
  const normalize = (val, type) => {
    if (val === undefined || val === null || isNaN(val)) return 0;
    
    if (type === 'canopy') return Number(val);
    if (type === 'ndvi') return Number(val) * 100;
    if (type === 'lst') return Math.max(0, Math.min(100, 100 - (Number(val) - 20) * 4));
    if (type === 'impact') return Number(val) * 100;
    return Number(val);
  };

  const data = [
    { metric: 'Canopy %', value: normalize(selectedZone.canopy, 'canopy'), color: '#16a34a' },     // Green
    { metric: 'Greenness', value: normalize(selectedZone.ndvi, 'ndvi'), color: '#0d9488' },        // Teal
    { metric: 'Cooling', value: normalize(selectedZone.lst, 'lst'), color: '#0284c7' },            // Blue
    { metric: 'Impact', value: normalize(selectedZone.impact, 'impact'), color: '#d97706' }        // Amber
  ];

  return (
    <Card 
      style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.04)', border: 'none', height: '100%' }}
      title={<div style={{ padding: '8px 0' }}><Title level={4} style={{ margin: 0, fontWeight: 600 }}>Current Baseline Metrics</Title></div>}
    >
      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="metric" tick={{ fill: '#475569', fontSize: 13, fontWeight: 500 }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
            <Tooltip 
               cursor={{ fill: '#f8fafc' }}
               contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 8px 16px rgba(0,0,0,0.08)' }}
               formatter={(value) => [Number(value).toFixed(1), "Score (Normalized 0-100)"]} 
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={50}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
