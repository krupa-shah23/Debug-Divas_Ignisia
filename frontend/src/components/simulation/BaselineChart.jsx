import React from 'react';
import { Card } from 'antd';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

export default function BaselineChart({ selectedZone }) {
  const data = [
    { metric: 'Canopy %', value: selectedZone.tree_canopy_pct },
    { metric: 'NDVI', value: selectedZone.ndvi },
    { metric: 'LST °C', value: selectedZone.lst_c },
    { metric: 'Impact', value: selectedZone.impact_score }
  ];

  return (
    <Card className="eco-card" title="Current Baseline Metrics" style={{ marginBottom: 16 }}>
      <div style={{ width: '100%', minHeight: 360, height: 360 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="metric" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

