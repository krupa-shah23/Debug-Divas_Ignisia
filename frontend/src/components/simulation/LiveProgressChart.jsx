import React from 'react';
import { Card } from 'antd';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts';

export default function LiveProgressChart({ selectedZone, projected, progress }) {
  const steps = [0, 25, 50, 75, 100];

  const data = steps
    .filter((step) => step <= Math.max(progress, 0))
    .map((step) => {
      const ratio = step / 100;

      const canopy = +(
        selectedZone.tree_canopy_pct +
        (projected.canopyAfter - selectedZone.tree_canopy_pct) * ratio
      ).toFixed(1);

      const ndvi = +(
        selectedZone.ndvi +
        (projected.ndviAfter - selectedZone.ndvi) * ratio
      ).toFixed(2);

      const lst = +(
        selectedZone.lst_c +
        (projected.lstAfter - selectedZone.lst_c) * ratio
      ).toFixed(1);

      return {
        step: `${step}%`,
        canopy,
        ndvi,
        lst
      };
    });

  if (data.length === 0) {
    data.push({
      step: '0%',
      canopy: selectedZone.tree_canopy_pct,
      ndvi: selectedZone.ndvi,
      lst: selectedZone.lst_c
    });
  }

  return (
    <Card className="eco-card" title="Live Progress During Simulation" style={{ marginBottom: 16 }}>
      <div style={{ width: '100%', minHeight: 420, height: 420 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="step" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="canopy" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="ndvi" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="lst" stroke="#f97316" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

