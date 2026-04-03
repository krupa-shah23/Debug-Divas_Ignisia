import React from 'react';
import { Card, Typography, Divider, Row, Col } from 'antd';
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

const { Text, Paragraph } = Typography;

export default function GrowthTimelineChart({
  timelineData,
  selectedZone,
  treeType
}) {
  return (
    <Card className="eco-card" title="Projected Growth Timeline">
      <div style={{ width: '100%', minHeight: 320, height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={timelineData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="canopy" />
            <Line type="monotone" dataKey="ndvi" />
            <Line type="monotone" dataKey="lst" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <Divider />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card size="small">
            <Text strong>Planning Assumption</Text>
            <Paragraph style={{ marginTop: 8, marginBottom: 0 }}>
              This simulation uses heuristic estimates for early-stage planning, not exact ecological forecasting.
              It is intended to support scenario comparison and intervention storytelling.
            </Paragraph>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card size="small">
            <Text strong>Operational Insight</Text>
            <Paragraph style={{ marginTop: 8, marginBottom: 0 }}>
              {selectedZone.water_access
                ? 'This zone is operationally feasible under current irrigation assumptions.'
                : treeType === 'drought'
                ? 'This water-constrained zone remains viable because drought-resilient species were selected.'
                : 'This zone may require irrigation support or drought-resilient species before planting at scale.'}
            </Paragraph>
          </Card>
        </Col>
      </Row>
    </Card>
  );
}

