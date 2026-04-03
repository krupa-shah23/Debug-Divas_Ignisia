import React from 'react';
import { Card, Table, Tag } from 'antd';

export default function BeforeAfterMetricsTable({
  selectedZone,
  projected,
  simulated,
  isSimulating,
  animatedMetrics
}) {
  const showProjected = simulated || isSimulating;

  const canopyAfter = showProjected ? animatedMetrics.canopy : selectedZone.tree_canopy_pct;
  const ndviAfter = showProjected ? animatedMetrics.ndvi : selectedZone.ndvi;
  const lstAfter = showProjected ? animatedMetrics.lst : selectedZone.lst_c;
  const scoreAfter = showProjected ? animatedMetrics.benefit : selectedZone.impact_score;

  const rows = [
    {
      key: '1',
      metric: 'Tree Canopy %',
      before: selectedZone.tree_canopy_pct.toFixed(1),
      after: canopyAfter.toFixed(1),
      change: `${(canopyAfter - selectedZone.tree_canopy_pct >= 0 ? '+' : '')}${(
        canopyAfter - selectedZone.tree_canopy_pct
      ).toFixed(1)}%`,
      good: true
    },
    {
      key: '2',
      metric: 'NDVI',
      before: selectedZone.ndvi.toFixed(2),
      after: ndviAfter.toFixed(2),
      change: `${(ndviAfter - selectedZone.ndvi >= 0 ? '+' : '')}${(
        ndviAfter - selectedZone.ndvi
      ).toFixed(2)}`,
      good: true
    },
    {
      key: '3',
      metric: 'Surface Temp (LST)',
      before: `${selectedZone.lst_c.toFixed(1)}°C`,
      after: `${lstAfter.toFixed(1)}°C`,
      change: `${(lstAfter - selectedZone.lst_c).toFixed(1)}°C`,
      good: false
    },
    {
      key: '4',
      metric: 'Impact / Benefit Score',
      before: `${selectedZone.impact_score}`,
      after: `${scoreAfter}`,
      change: `${scoreAfter - selectedZone.impact_score >= 0 ? '+' : ''}${scoreAfter - selectedZone.impact_score}`,
      good: true
    }
  ];

  const columns = [
    {
      title: 'Metric',
      dataIndex: 'metric',
      key: 'metric'
    },
    {
      title: 'Before',
      dataIndex: 'before',
      key: 'before'
    },
    {
      title: 'After',
      dataIndex: 'after',
      key: 'after'
    },
    {
      title: 'Change',
      dataIndex: 'change',
      key: 'change',
      render: (_, record) => (
        <Tag color={record.good ? 'green' : 'blue'}>
          {record.change}
        </Tag>
      )
    }
  ];

  return (
    <Card
      className="eco-card"
      title={showProjected ? 'Exact Before → After Values' : 'Current Baseline Values'}
      style={{ marginBottom: 16 }}
    >
      <Table
        columns={columns}
        dataSource={rows}
        pagination={false}
        size="small"
        scroll={{ x: 500 }}
      />
    </Card>
  );
}

