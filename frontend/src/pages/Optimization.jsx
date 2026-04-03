import React, { useState } from 'react';
import { Card, Row, Col, Typography, Button, Progress, Table, Alert } from 'antd';
import axios from 'axios';
import { CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function Optimization() {
  const [budget] = useState(100);
  const [greedyRes, setGreedy] = useState(null);
  const [knapsackRes, setKnap] = useState(null);
  const [loading, setLoading] = useState(false);

  const runSim = async () => {
    setLoading(true);
    try {
      const p1 = axios.post('http://localhost:8000/api/optimize', { budget, method: 'greedy' });
      const p2 = axios.post('http://localhost:8000/api/optimize', { budget, method: 'knapsack' });
      const [r1, r2] = await Promise.all([p1, p2]);
      setGreedy(r1.data);
      setKnap(r2.data);
    } catch(e) {}
    setLoading(false);
  };

  return (
    <div className="eco-card">
      <Title level={2}>Optimization Model Comparison</Title>
      <Alert 
        message="Simulating Resource Allocation" 
        description="Compare the baseline Greedy algorithm against our tailored AI Knapsack logic using your max budget constraints." 
        type="info" showIcon icon={<InfoCircleOutlined />} 
        style={{ marginBottom: 20 }}
      />
      <Button type="primary" className="eco-btn" onClick={runSim} loading={loading} style={{ marginBottom: 30 }}>
        Run Optimization Models
      </Button>

      {knapsackRes && greedyRes && (
        <Row gutter={32}>
          <Col span={12}>
            <Card title="Greedy Approach" headStyle={{ background: '#f5f5f5' }}>
              <div style={{ marginBottom: 20 }}>
                <Text strong>Trees Allocated</Text>
                <Progress percent={(greedyRes.trees_used / budget) * 100} format={() => `${greedyRes.trees_used} / ${budget}`} strokeColor="#fc8d59" />
              </div>
              <Text strong>Selected Zones:</Text>
              <p>{greedyRes.selected.join(', ') || 'None'}</p>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="AI Knapsack (Optimal Focus)" headStyle={{ background: '#e6f4ea' }} style={{ border: '2px solid var(--secondary)' }}>
              <div style={{ marginBottom: 20 }}>
                <Text strong>Trees Allocated</Text>
                <Progress percent={(knapsackRes.trees_used / budget) * 100} format={() => `${knapsackRes.trees_used} / ${budget}`} strokeColor="var(--primary)" />
              </div>
              <Text strong>Selected Zones:</Text>
              <p><CheckCircleOutlined style={{ color: 'var(--primary)', marginRight: 5 }}/>{knapsackRes.selected.join(', ') || 'None'}</p>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
}
