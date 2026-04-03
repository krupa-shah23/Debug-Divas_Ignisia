import React from 'react';
import { Typography, Card, Divider } from 'antd';
import { ReadOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

export default function Methodology() {
  return (
    <div className="eco-card">
      <Title level={2}><ReadOutlined /> Scientific Methodology</Title>
      <Paragraph style={{ fontSize: '1.1rem' }}>
        Our decision support system relies on established remote sensing algorithms combined with socio-economic vulnerability indicators.
      </Paragraph>
      <Divider />
      
      <Title level={4}>1. Remote Sensing Features</Title>
      <ul>
        <li><Text strong>NDVI (Normalized Difference Vegetation Index):</Text> Measures the density of green on a patch of land. Essential for estimating existing tree canopy.</li>
        <li><Text strong>LST (Land Surface Temperature):</Text> Thermal signature measured via satellite, indicating the severity of urban heat islands.</li>
        <li><Text strong>NDWI (Normalized Difference Water Index):</Text> Highlights water bodies and moisture, critical for validating survivability of new saplings.</li>
        <li><Text strong>NDBI (Normalized Difference Built-up Index):</Text> Highlights urbanized/impervious areas. Used as a proxy for physical constraints on planting.</li>
      </ul>

      <Divider />
      <Title level={4}>2. Impact Scoring Engine</Title>
      <Paragraph>
        Each zone receives an <code>Impact Score</code> calculated securely via our pipeline. The formula assigns highest weights to high heat (LST) and low vegetation (NDVI).
      </Paragraph>
      <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 8 }}>
        Impact Score = (1 - NDVI_norm)*0.35 + (LST_norm)*0.35 + (Vulnerability)*0.20 + (NDBI_norm)*0.10
      </pre>

      <Divider />
      <Title level={4}>3. The Optimization Logic</Title>
      <Paragraph>
        While simple frameworks might just select the highest scores (<b>Greedy</b> approach), our advanced system implements a <b>Knapsack Algorithm</b>. This guarantees that for a given budget of trees, we unlock the absolute maximum cumulative ecological impact across the municipality without overshooting availability.
      </Paragraph>
    </div>
  );
}
