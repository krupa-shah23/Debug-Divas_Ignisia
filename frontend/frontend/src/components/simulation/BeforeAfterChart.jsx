import React, { useMemo } from 'react';
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
  const normalizedData = useMemo(() => {
    const normalize = (val, metric) => {
      if (val === undefined || val === null || isNaN(val)) return 0;
      
      if (metric === 'Canopy %') return Number(val);
      if (metric === 'NDVI') return Number(val) * 100;
      if (metric === 'LST °C') return Math.max(0, Math.min(100, 100 - (Number(val) - 20) * 4));
      return Number(val);
    };

    return beforeAfterData.map(item => ({
      metric: item.metric === 'LST °C' ? 'Cooling Score (LST)' : item.metric === 'NDVI' ? 'Greenness (NDVIx100)' : item.metric,
      Before: normalize(item.Before, item.metric),
      After: normalize(item.After, item.metric)
    }));
  }, [beforeAfterData]);

  return (
    <Card className="eco-card" title="Before vs After Comparison (Normalized 0-100)" style={{ marginBottom: 16 }}>
      <div style={{ width: '100%', minHeight: 400, height: 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={normalizedData} barCategoryGap="18%">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="metric" />
            <YAxis domain={[0, 100]} />
            <Tooltip formatter={(value) => [Number(value).toFixed(1), "Score"]} />
            <Legend />
            <Bar dataKey="Before" fill="#f97316" radius={[4, 4, 0, 0]} />
            <Bar dataKey="After" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
