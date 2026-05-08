import React, { useMemo } from 'react';
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

const { Title, Text } = Typography;

export default function BaselineChart({ selectedZone }) {
  const data = useMemo(() => {
    const canopy = Number(selectedZone?.canopy ?? selectedZone?.tree_canopy_pct ?? 0);
    const ndvi = Number(selectedZone?.ndvi ?? selectedZone?.NDVI ?? 0);
    const lst = Number(selectedZone?.lst ?? selectedZone?.LST ?? 0);
    const impact = Number(selectedZone?.impact ?? selectedZone?.impact_score ?? 0);

    return [
      { metric: 'Canopy %', value: canopy, color: '#059669' },
      { metric: 'Greenness', value: ndvi * 100, color: '#0d9488' },
      { metric: 'Cooling Stress', value: Math.max(0, Math.min(100, ((lst - 20) / 25) * 100)), color: '#3b82f6' },
      { metric: 'Impact', value: Math.max(0, Math.min(100, impact * 10)), color: '#d97706' }
    ];
  }, [selectedZone]);

  return (
    <Card
      style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9', height: '100%' }}
      title={
        <div style={{ padding: '8px 0', borderBottom: 'none' }}>
          <Title level={4} style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>Current Baseline Metrics</Title>
        </div>
      }
    >
      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }} barGap={8}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="metric" tick={{ fill: '#475569', fontSize: 13, fontWeight: 600 }} axisLine={{ stroke: '#e2e8f0', strokeWidth: 2 }} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: '#e2e8f0', strokeWidth: 2 }} tickLine={false} />
            <Tooltip
              cursor={{ fill: '#f8fafc', opacity: 0.5 }}
              contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', background: '#fff' }}
              itemStyle={{ fontWeight: 600, fontSize: 13 }}
              labelStyle={{ display: 'none' }}
              formatter={(value, name, props) => [
                <span style={{ color: props.payload.color }}>{Number(value).toFixed(1)} <span style={{ color: '#94a3b8', fontWeight: 500 }}>/ 100 Score</span></span>,
                <Text strong style={{ color: '#0f172a' }}>{props.payload.metric}</Text>
              ]}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={64} animationDuration={1000} animationEasing="ease-out">
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
