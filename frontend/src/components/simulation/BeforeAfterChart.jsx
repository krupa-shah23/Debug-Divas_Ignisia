import React from 'react';
import { Card } from 'antd';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts';

export default function BeforeAfterChart({ beforeAfterData }) {
  return (
    <Card className="eco-card" title="Before vs After Comparison" style={{ marginBottom: 16 }}>
      <div style={{ width: '100%', minHeight: 420, height: 420 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={beforeAfterData} barCategoryGap="18%">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="metric" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Before" fill="#f97316" />
            <Bar dataKey="After" fill="#22c55e" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

