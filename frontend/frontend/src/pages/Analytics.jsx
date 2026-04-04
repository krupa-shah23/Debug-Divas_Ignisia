import React, { useState, useEffect } from 'react';
import { Table, Tag, Card, Typography, Spin, Select, Row, Col, Statistic, message } from 'antd';
import { loadCityScoredZones } from '../utils/dataloader';

const { Title, Text } = Typography;

const cityOptions = [
  "ahmedabad", "bangalore", "chennai", "delhi", "hyderabad",
  "indore", "jaipur", "kanpur", "kolkata", "lucknow",
  "mumbai", "nagpur", "pune", "surat", "vadodara"
];

// safe number parser
const num = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

// normalize to 0-1
const clamp01 = (v) => Math.max(0, Math.min(1, v));

function computeImpactScore(row) {
  // If CSV already has a real score, use it
  const existing =
    row.impact_score ??
    row.final_score ??
    row.score ??
    row.priority_score ??
    row.Impact_Score ??
    row.Final_Score;

  const existingNum = Number(existing);
  if (Number.isFinite(existingNum)) return existingNum;

  // Otherwise compute from actual metrics
  const ndvi = num(row.NDVI ?? row.ndvi, 0.3);
  const lst = num(row.LST ?? row.lst, 38);
  const vulnerability = num(row.vulnerability ?? row.vulnerability_index, 0.5);
  const water = row.water_available ?? row.water_access ?? row.water_feasible ?? true;

  // Convert metrics into normalized stress indicators
  const heatStress = clamp01((lst - 35) / 12);     // 35–47 °C -> 0..1
  const canopyStress = clamp01((0.45 - ndvi) / 0.45); // lower NDVI = higher need
  const vulnScore = clamp01(vulnerability);
  const waterBonus = water ? 0.08 : -0.08;

  const score =
    0.45 * heatStress +
    0.35 * canopyStress +
    0.20 * vulnScore +
    waterBonus;

  return clamp01(score);
}

function computeTreesNeeded(row) {
  // Use actual CSV if available
  const existing =
    row.trees_needed ??
    row.recommended_trees ??
    row.tree_requirement ??
    row.Trees_Needed;

  const existingNum = Number(existing);
  if (Number.isFinite(existingNum) && existingNum > 0) return Math.round(existingNum);

  // Otherwise compute from real environmental stress
  const ndvi = num(row.NDVI ?? row.ndvi, 0.3);
  const lst = num(row.LST ?? row.lst, 38);
  const vulnerability = num(row.vulnerability ?? row.vulnerability_index, 0.5);

  const canopyPenalty = clamp01((0.40 - ndvi) / 0.40); // low NDVI => more trees
  const heatPenalty = clamp01((lst - 34) / 12);        // higher LST => more trees
  const vulnPenalty = clamp01(vulnerability);

  const trees =
    8 +
    canopyPenalty * 10 +
    heatPenalty * 8 +
    vulnPenalty * 4;

  return Math.max(8, Math.min(30, Math.round(trees)));
}

function computeExplanation(row, impact, trees) {
  const ndvi = num(row.NDVI ?? row.ndvi, 0.3);
  const lst = num(row.LST ?? row.lst, 38);
  const water = row.water_available ?? row.water_access ?? row.water_feasible ?? true;

  const reasons = [];

  if (ndvi < 0.22) reasons.push('very low canopy cover');
  else if (ndvi < 0.30) reasons.push('low vegetation');

  if (lst > 42) reasons.push('severe heat stress');
  else if (lst > 38) reasons.push('elevated land surface temperature');

  if (water) reasons.push('feasible irrigation access');
  else reasons.push('water-constrained implementation');

  if (impact > 0.7) {
    return `High-priority zone due to ${reasons.join(', ')}. Recommended intervention: ~${trees} trees.`;
  }
  if (impact > 0.45) {
    return `Moderate-priority zone due to ${reasons.join(', ')}. Suggested intervention: ~${trees} trees.`;
  }
  return `Lower-priority zone with ${reasons.join(', ')}. Monitor and intervene selectively (~${trees} trees).`;
}

export default function Analytics() {
  const [selectedCity, setSelectedCity] = useState("jaipur");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCityData = async (city) => {
    setLoading(true);
    try {
      const zones = await loadCityScoredZones(city);

      // DEBUG: see actual CSV columns in browser console
      if (zones?.length) {
        console.log(`Columns in ${city}:`, Object.keys(zones[0]));
        console.log(`Sample row in ${city}:`, zones[0]);
      }

      const formatted = zones.map((z, index) => {
        const impact = computeImpactScore(z);
        const trees = computeTreesNeeded(z);

        return {
          ...z,
          zone_id: z.zone_id || z.Zone_ID || z.id || z.zone || `zone_${index + 1}`,
          impact_score: impact,
          priority_rank:
            z.priority_rank ??
            z.rank ??
            z.Priority_Rank ??
            index + 1,
          NDVI: num(z.NDVI ?? z.ndvi, 0),
          LST: num(z.LST ?? z.lst, 0),
          water_available:
            z.water_available ??
            z.water_access ??
            z.water_feasible ??
            true,
          trees_needed: trees,
          explanation:
            z.explanation ||
            computeExplanation(z, impact, trees)
        };
      });

      // Sort by best priority logic
      formatted.sort((a, b) => {
        if (a.priority_rank && b.priority_rank) {
          return Number(a.priority_rank) - Number(b.priority_rank);
        }
        return Number(b.impact_score) - Number(a.impact_score);
      });

      setData(formatted);
    } catch (err) {
      console.error(err);
      message.error(`Failed to load analytics data for ${city}`);
      setData([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCityData(selectedCity);
  }, [selectedCity]);

  const highPriorityCount = data.filter((d) => Number(d.impact_score) > 0.6).length;

  const avgImpact = data.length
    ? (
      data.reduce((sum, d) => sum + num(d.impact_score), 0) / data.length
    ).toFixed(3)
    : "0.000";

  const avgLST = data.length
    ? (
      data.reduce((sum, d) => sum + num(d.LST), 0) / data.length
    ).toFixed(2)
    : "0.00";

  const waterAvailableCount = data.filter((d) => !!d.water_available).length;

  const columns = [
    {
      title: 'Zone ID',
      dataIndex: 'zone_id',
      key: 'zone_id',
      sorter: (a, b) => String(a.zone_id).localeCompare(String(b.zone_id)),
      width: 120
    },
    {
      title: 'Impact Score',
      dataIndex: 'impact_score',
      key: 'impact_score',
      sorter: (a, b) => num(a.impact_score) - num(b.impact_score),
      render: (value) => {
        const score = num(value);
        return (
          <Tag color={score > 0.7 ? 'red' : score > 0.5 ? 'orange' : 'green'}>
            {score.toFixed(3)}
          </Tag>
        );
      },
      width: 130
    },
    {
      title: 'NDVI',
      dataIndex: 'NDVI',
      key: 'NDVI',
      sorter: (a, b) => num(a.NDVI) - num(b.NDVI),
      render: (value) => num(value).toFixed(3),
      width: 100
    },
    {
      title: 'LST (°C)',
      dataIndex: 'LST',
      key: 'LST',
      sorter: (a, b) => num(a.LST) - num(b.LST),
      render: (value) => num(value).toFixed(2),
      width: 110
    },
    {
      title: 'Priority Rank',
      dataIndex: 'priority_rank',
      key: 'priority_rank',
      sorter: (a, b) => num(a.priority_rank) - num(b.priority_rank),
      width: 120
    },
    {
      title: 'Trees Needed',
      dataIndex: 'trees_needed',
      key: 'trees_needed',
      sorter: (a, b) => num(a.trees_needed) - num(b.trees_needed),
      width: 130
    },
    {
      title: 'Water Status',
      dataIndex: 'water_available',
      key: 'water_available',
      render: (water) => (
        <Tag color={water ? 'blue' : 'red'}>
          {water ? 'Available' : 'Scarce'}
        </Tag>
      ),
      filters: [
        { text: 'Available', value: true },
        { text: 'Scarce', value: false }
      ],
      onFilter: (value, record) => record.water_available === value,
      width: 130
    },
    {
      title: 'Explanation',
      dataIndex: 'explanation',
      key: 'explanation',
      ellipsis: true
    }
  ];

  return (
  <div style={{ padding: '28px', background: '#f5f7fa' }}>
    
    {/* HEADER */}
    <Card className="eco-card" style={{ marginBottom: 24, borderRadius: 12 }}>
      <Row gutter={[16, 16]} align="middle" justify="space-between">
        
        <Col xs={24} md={12}>
          <Title level={2} style={{ margin: 0, fontWeight: 600 }}>
            Data Analytics Studio
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Explore zone-wise impact scores, NDVI, LST, and feasibility insights city-by-city.
          </Text>
        </Col>

        <Col xs={24} md={6}>
          <Text strong style={{ fontSize: 14 }}>Select City</Text>
          <Select
            showSearch
            value={selectedCity}
            style={{ width: '100%', marginTop: 6 }}
            onChange={(value) => setSelectedCity(value)}
            options={cityOptions.map(city => ({
              value: city,
              label: city.charAt(0).toUpperCase() + city.slice(1)
            }))}
            placeholder="Select a city"
            optionFilterProp="label"
          />
        </Col>

      </Row>
    </Card>

    {/* ✅ 5 STATS IN ONE ROW */}
   <Row
  gutter={20}
  style={{ marginBottom: 24 }}
  wrap={false}   // 🚨 THIS FORCES SINGLE ROW
>

  <Col flex="1">
    <Card className="eco-card stat-card">
      <Statistic title="Total Zones" value={data.length} />
    </Card>
  </Col>

  <Col flex="1">
    <Card className="eco-card stat-card">
      <Statistic title="High Priority Zones" value={highPriorityCount} />
    </Card>
  </Col>

  <Col flex="1">
    <Card className="eco-card stat-card">
      <Statistic title="Avg Impact Score" value={avgImpact} />
    </Card>
  </Col>

  <Col flex="1">
    <Card className="eco-card stat-card">
      <Statistic title="Water Feasible Zones" value={waterAvailableCount} />
    </Card>
  </Col>

  <Col flex="1">
    <Card className="eco-card stat-card">
      <Statistic title="Avg LST (°C)" value={avgLST} />
    </Card>
  </Col>

</Row>

    {/* TABLE */}
    <Card className="eco-card" style={{ borderRadius: 12 }}>
      <Spin spinning={loading}>
        <Table
          dataSource={data}
          columns={columns}
          rowKey="zone_id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1300 }}
          rowClassName={(record) =>
            num(record.impact_score) > 0.6 ? 'high-priority-row' : ''
          }
        />
      </Spin>
    </Card>

  </div>
);
}