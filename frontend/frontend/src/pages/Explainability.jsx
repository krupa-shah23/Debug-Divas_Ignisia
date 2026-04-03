import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Spin, Statistic, Divider } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

export default function Explainability() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:8000/api/zones')
      .then(res => {
        setData(res.data.zones);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <Title level={2}>AI Explainability</Title>
      <Text type="secondary" style={{ fontSize: '1.1rem', marginBottom: 20, display: 'block' }}>
        Understand why specific zones received their scores based on raw environmental features.
      </Text>
      
      <Spin spinning={loading}>
        <Row gutter={[24, 24]}>
          {data.map(zone => (
            <Col xs={24} md={12} lg={8} key={zone.zone_id}>
              <Card className="eco-card" title={`Zone: ${zone.zone_id}`} hoverable>
                <Statistic title="Impact Score" value={zone.impact_score} precision={3} valueStyle={{ color: 'var(--primary)' }} />
                <Divider style={{ margin: '12px 0' }} />
                <Row gutter={16}>
                  <Col span={12}><Statistic title="NDVI" value={zone.NDVI} precision={2} /></Col>
                  <Col span={12}><Statistic title="LST (°C)" value={zone.LST} precision={1} /></Col>
                </Row>
                <div style={{ marginTop: 20, padding: 12, background: 'var(--background)', borderRadius: 8 }}>
                  <Text strong>Model Reasoning:</Text><br />
                  <Text>{zone.explanation}</Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Spin>
    </div>
  );
}
