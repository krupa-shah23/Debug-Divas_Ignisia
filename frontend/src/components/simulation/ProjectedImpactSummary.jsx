import React from 'react';
import { Card, Typography, Row, Col, Statistic, Divider, Tag } from 'antd';

const { Text, Paragraph } = Typography;

export default function ProjectedImpactSummary({
  animatedMetrics,
  projected,
  treeCount,
  profile,
  selectedZone,
  timeHorizon,
  simulated,
  isSimulating
}) {
  const showProjected = simulated || isSimulating;

  const canopyValue = showProjected ? animatedMetrics.canopy : selectedZone.tree_canopy_pct;
  const ndviValue = showProjected ? animatedMetrics.ndvi : selectedZone.ndvi;
  const lstValue = showProjected ? animatedMetrics.lst : selectedZone.lst_c;
  const benefitValue = showProjected ? animatedMetrics.benefit : selectedZone.impact_score;

  return (
    <Card
      className="eco-card"
      title={showProjected ? 'Projected Impact Summary' : 'Current Baseline Summary'}
      style={{ marginBottom: 16 }}
    >
      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Statistic title="Canopy %" value={canopyValue} precision={1} suffix="%" />
        </Col>
        <Col xs={12} md={6}>
          <Statistic title="NDVI" value={ndviValue} precision={2} />
        </Col>
        <Col xs={12} md={6}>
          <Statistic title="LST" value={lstValue} precision={1} suffix="°C" />
        </Col>
        <Col xs={12} md={6}>
          <Statistic title={showProjected ? 'Benefit Score' : 'Impact Score'} value={benefitValue} />
        </Col>
      </Row>

      <Divider />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card size="small">
            <Text strong>Estimated Cooling</Text>
            <div style={{ marginTop: 8 }}>
              <Tag color="blue">{showProjected ? `-${projected.coolingBenefit}°C` : 'Baseline'}</Tag>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card size="small">
            <Text strong>Canopy Gain</Text>
            <div style={{ marginTop: 8 }}>
              <Tag color="green">{showProjected ? `+${projected.canopyGain}%` : 'Baseline'}</Tag>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card size="small">
            <Text strong>NDVI Improvement</Text>
            <div style={{ marginTop: 8 }}>
              <Tag color="purple">{showProjected ? `+${projected.ndviGain}` : 'Baseline'}</Tag>
            </div>
          </Card>
        </Col>
      </Row>

      <div style={{ marginTop: 16 }}>
        <Paragraph style={{ marginBottom: 0 }}>
          {showProjected ? (
            <>
              <Text strong>Why this matters: </Text>
              This projected scenario estimates how planting <Text strong>{treeCount}</Text> {profile.label.toLowerCase()}s
              in <Text strong>{selectedZone.zone_name}</Text> could improve canopy coverage, increase vegetation density,
              and reduce localized urban heat over a <Text strong>{timeHorizon}-month</Text> period.
            </>
          ) : (
            <>
              <Text strong>Current baseline: </Text>
              This zone currently has low canopy cover, existing urban heat exposure, and social vulnerability indicators.
              Run the simulation to compare projected improvement after tree planting intervention.
            </>
          )}
        </Paragraph>
      </div>
    </Card>
  );
}

