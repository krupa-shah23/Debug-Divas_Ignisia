import React, { useState, useEffect } from 'react';
import { Table, Tag, Card, Typography, Spin } from 'antd';
import axios from 'axios';

const { Title } = Typography;

export default function Analytics() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:8000/api/zones')
      .then(res => {
        setData(res.data.zones);
        setLoading(false);
      });
  }, []);

  const columns = [
    { title: 'Zone ID', dataIndex: 'zone_id', key: 'zone_id', sorter: (a, b) => a.zone_id.localeCompare(b.zone_id) },
    { title: 'Impact Score', dataIndex: 'impact_score', key: 'impact_score', sorter: (a, b) => a.impact_score - b.impact_score },
    { title: 'NDVI', dataIndex: 'NDVI', key: 'NDVI', sorter: (a, b) => a.NDVI - b.NDVI },
    { title: 'LST (°C)', dataIndex: 'LST', key: 'LST', sorter: (a, b) => a.LST - b.LST },
    { title: 'Priority Rank', dataIndex: 'priority_rank', key: 'priority_rank', sorter: (a, b) => a.priority_rank - b.priority_rank },
    { 
      title: 'Water Status', 
      dataIndex: 'water_available', 
      key: 'water_available',
      render: (water) => (
        <Tag color={water ? 'green' : 'red'}>{water ? 'Available' : 'Scarce'}</Tag>
      ),
      filters: [{ text: 'Available', value: true }, { text: 'Scarce', value: false }],
      onFilter: (value, record) => record.water_available === value
    },
    { title: 'Explanation', dataIndex: 'explanation', key: 'explanation' }
  ];

  return (
    <Card className="eco-card">
      <Title level={2}>Data Analytics Studio</Title>
      <Spin spinning={loading}>
        <Table 
          dataSource={data} 
          columns={columns} 
          rowKey="zone_id"
          pagination={{ pageSize: 15 }}
          rowClassName={(record) => record.impact_score > 0.6 ? 'high-priority-row' : ''}
        />
      </Spin>
    </Card>
  );
}
