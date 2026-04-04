import React, { useState, useEffect } from 'react';
import { Table, Tag, Card, Typography, Spin, Select, Row, Col, Statistic, message, Tooltip } from 'antd';
import { loadCityScoredZones } from '../utils/dataloader';
import Chatbot from "../components/Chatbot";

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

// simulate urban factors (replace later with real data if available)
function computeUrbanFactors(row) {
  const ndvi = num(row.NDVI ?? row.ndvi, 0.3);
  const impact = num(row.impact_score, 0.6);

  let base = impact * 70;
  const zoneId = String(row.zone_id || row.Zone_ID || row.id || "Z1");
  const zoneNumber = parseInt(zoneId.replace(/\D/g, "")) || 1;
  const variation = (zoneNumber % 5) * 8 - 10;
  let co2 = base + variation;
  co2 = Math.max(45, Math.min(100, Math.round(co2)));

  const population = Math.round(5000 + (1 - ndvi) * 10000);
  const builtUp = clamp01(1 - ndvi + 0.2);

  return { co2, population, builtUp };
}

// normalize to 0-1
const clamp01 = (v) => Math.max(0, Math.min(1, v));

function computeImpactScore(row) {
  const existing =
    row.impact_score ??
    row.final_score ??
    row.score ??
    row.priority_score ??
    row.Impact_Score ??
    row.Final_Score;

  const existingNum = Number(existing);
  if (Number.isFinite(existingNum)) return existingNum;

  const ndvi = num(row.NDVI ?? row.ndvi, 0.3);
  const lst = num(row.LST ?? row.lst, 38);
  const vulnerability = num(row.vulnerability ?? row.vulnerability_index, 0.5);
  const water = row.water_available ?? row.water_access ?? row.water_feasible ?? true;

  const heatStress = clamp01((lst - 35) / 12);
  const canopyStress = clamp01((0.45 - ndvi) / 0.45);
  const vulnScore = clamp01(vulnerability);
  const waterBonus = water ? 0.08 : -0.08;

  const score = 0.45 * heatStress + 0.35 * canopyStress + 0.20 * vulnScore + waterBonus;
  return clamp01(score);
}

function computeTreesNeeded(row) {
  const existing =
    row.trees_needed ??
    row.recommended_trees ??
    row.tree_requirement ??
    row.Trees_Needed;

  const existingNum = Number(existing);
  if (Number.isFinite(existingNum) && existingNum > 0) return Math.round(existingNum);

  const ndvi = num(row.NDVI ?? row.ndvi, 0.3);
  const lst = num(row.LST ?? row.lst, 38);
  const vulnerability = num(row.vulnerability ?? row.vulnerability_index, 0.5);

  const canopyPenalty = clamp01((0.40 - ndvi) / 0.40);
  const heatPenalty = clamp01((lst - 34) / 12);
  const vulnPenalty = clamp01(vulnerability);

  const trees = 8 + canopyPenalty * 10 + heatPenalty * 8 + vulnPenalty * 4;
  return Math.max(8, Math.min(30, Math.round(trees)));
}

function computeExplanation(row, impact, trees) {
  const ndvi = num(row.NDVI ?? row.ndvi, 0.3);
  const { co2, population, builtUp } = computeUrbanFactors(row);

  if (co2 > 70 && builtUp > 0.7) return `⚠️ High CO₂ emissions and dense built-up areas are reducing green canopy. Immediate greening needed (~${trees} trees).`;
  if (population > 10000) return `📈 High population density limits green space. Urban forestry recommended (~${trees} trees).`;
  if (ndvi < 0.25) return `🌳 Low vegetation cover detected. Increasing canopy will improve thermal comfort and air quality.`;
  return `✅ Balanced zone with moderate environmental stress. Maintain green cover.`;
}

// Compact stat card style component
const CompactStatCard = ({ title, value }) => (
  <Card
    styles={{ body: { padding: '16px 20px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' } }}
    style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: '1px solid #e5e7eb', height: '100%' }}
  >
    <Statistic 
      title={<span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>} 
      value={value} 
      valueStyle={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginTop: '4px' }} 
    />
  </Card>
);

export default function Analytics() {
  const [selectedCity, setSelectedCity] = useState("jaipur");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCityData = async (city) => {
    setLoading(true);
    try {
      const zones = await loadCityScoredZones(city);

      if (zones?.length) {
        console.log(`Columns in ${city}:`, Object.keys(zones[0]));
        console.log(`Sample row in ${city}:`, zones[0]);
      }

      const formatted = zones.map((z, index) => {
        const impact = computeImpactScore(z);
        const trees = computeTreesNeeded(z);
        const urban = computeUrbanFactors(z);

        return {
          ...z, 
          ...urban,
          zone_id: z.zone_id || z.Zone_ID || z.id || z.zone || `zone_${index + 1}`,
          impact_score: impact,
          priority_rank: z.priority_rank ?? z.rank ?? z.Priority_Rank ?? index + 1,
          NDVI: num(z.NDVI ?? z.ndvi, 0),
          LST: num(z.LST ?? z.lst, 0),
          water_available: z.water_available ?? z.water_access ?? z.water_feasible ?? true,
          trees_needed: trees,
          explanation: z.explanation || computeExplanation(z, impact, trees)
        };
      });

      formatted.sort((a, b) => {
        if (a.priority_rank && b.priority_rank) return Number(a.priority_rank) - Number(b.priority_rank);
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
  const avgImpact = data.length ? (data.reduce((sum, d) => sum + num(d.impact_score), 0) / data.length).toFixed(3) : "0.000";
  const avgLST = data.length ? (data.reduce((sum, d) => sum + num(d.LST), 0) / data.length).toFixed(2) : "0.00";
  const waterAvailableCount = data.filter((d) => !!d.water_available).length;

  const columns = [
    {
      title: 'Zone ID',
      dataIndex: 'zone_id',
      key: 'zone_id',
      sorter: (a, b) => String(a.zone_id).localeCompare(String(b.zone_id)),
      width: 90
    },
    {
      title: 'Impact',
      dataIndex: 'impact_score',
      key: 'impact_score',
      sorter: (a, b) => num(a.impact_score) - num(b.impact_score),
      render: (value) => {
        const score = num(value);
        return (
          <Tag color={score > 0.7 ? 'red' : score > 0.5 ? 'orange' : 'green'} style={{ margin: 0, fontWeight: 500 }}>
            {score.toFixed(3)}
          </Tag>
        );
      },
      width: 80
    },
    {
      title: 'NDVI',
      dataIndex: 'NDVI',
      key: 'NDVI',
      sorter: (a, b) => num(a.NDVI) - num(b.NDVI),
      render: (value) => num(value).toFixed(3),
      width: 70
    },
    {
      title: 'LST (°C)',
      dataIndex: 'LST',
      key: 'LST',
      sorter: (a, b) => num(a.LST) - num(b.LST),
      render: (value) => num(value).toFixed(2),
      width: 80
    },
    {
      title: 'Rank',
      dataIndex: 'priority_rank',
      key: 'priority_rank',
      sorter: (a, b) => num(a.priority_rank) - num(b.priority_rank),
      width: 70
    },
    {
      title: 'Trees Req.',
      dataIndex: 'trees_needed',
      key: 'trees_needed',
      sorter: (a, b) => num(a.trees_needed) - num(b.trees_needed),
      width: 100
    },
    {
      title: 'Water Status',
      dataIndex: 'water_available',
      key: 'water_available',
      render: (water) => (
        <Tag color={water ? 'processing' : 'error'} style={{ margin: 0 }}>
          {water ? 'Available' : 'Scarce'}
        </Tag>
      ),
      filters: [
        { text: 'Available', value: true },
        { text: 'Scarce', value: false }
      ],
      onFilter: (value, record) => record.water_available === value,
      width: 110
    },
    {
      title: 'CO₂ (%)',
      dataIndex: 'co2',
      key: 'co2',
      render: (v) => (
        <span style={{ color: v > 70 ? '#dc2626' : v > 50 ? '#d97706' : '#16a34a', fontWeight: 500 }}>
          {v.toFixed(0)}
        </span>
      ),
      width: 80
    },
    {
      title: 'Pop.',
      dataIndex: 'population',
      key: 'population',
      render: (v) => v.toLocaleString(),
      width: 90
    },
    {
      title: 'Built-up',
      dataIndex: 'builtUp',
      key: 'builtUp',
      render: (v) => `${(v * 100).toFixed(0)}%`,
      width: 80
    },
    {
      title: 'Explanation',
      dataIndex: 'explanation',
      key: 'explanation',
      ellipsis: {
        showTitle: false,
      },
      render: (text) => (
        <Tooltip placement="topLeft" title={text}>
          <span style={{ cursor: 'pointer', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {text}
          </span>
        </Tooltip>
      ),
      width: 200
    }
  ];

  return (
    <div style={{ padding: "16px 24px", background: "#f8fafc", minHeight: "100vh" }}>
      
      {/* MAIN CONTENT (Now 100% full width) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* COMPACT TOOLBAR HEADER */}
        <Card 
          styles={{ body: { padding: "16px 20px" } }} 
          style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: '1px solid #e5e7eb' }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <Title level={4} style={{ margin: 0, fontWeight: 700, color: "#111827", letterSpacing: "-0.02em" }}>
                Data Analytics Studio
              </Title>
              <Text type="secondary" style={{ fontSize: 13, color: "#6b7280" }}>
                Explore zone-wise impact scores, NDVI, LST, and feasibility insights.
              </Text>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#f3f4f6", padding: "6px 8px 6px 12px", borderRadius: "8px" }}>
              <Text strong style={{ fontSize: 13, color: "#374151" }}>City:</Text>
              <Select
                showSearch
                value={selectedCity}
                style={{ width: "160px" }}
                variant="borderless"
                onChange={(value) => setSelectedCity(value)}
                options={cityOptions.map(city => ({
                  value: city,
                  label: city.charAt(0).toUpperCase() + city.slice(1)
                }))}
                placeholder="Select a city"
                optionFilterProp="label"
              />
            </div>
          </div>
        </Card>

        {/* KPI ROW */}
        <Row gutter={[16, 16]}>
          <Col xs={12} md={8} xl={5}><CompactStatCard title="Total Zones" value={data.length} /></Col>
          <Col xs={12} md={8} xl={5}><CompactStatCard title="High Priority" value={highPriorityCount} /></Col>
          <Col xs={12} md={8} xl={5}><CompactStatCard title="Avg Impact" value={avgImpact} /></Col>
          <Col xs={12} md={8} xl={5}><CompactStatCard title="Water Feasible" value={waterAvailableCount} /></Col>
          <Col xs={12} md={8} xl={4}><CompactStatCard title="Avg LST" value={`${avgLST}°C`} /></Col>
        </Row>

        {/* FULL WIDTH TABLE CARD */}
        <Card 
          styles={{ body: { padding: "0" } }} 
          style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', overflow: 'hidden' }}
        >
          <div style={{ padding: "16px 20px", borderBottom: '1px solid #f3f4f6', background: "#ffffff", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={5} style={{ margin: 0, fontWeight: 600, color: '#1f2937' }}>Zone Analytics</Title>
            <Tag color="blue" style={{ margin: 0, borderRadius: '4px' }}>{data.length} Records</Tag>
          </div>
          <Spin spinning={loading}>
            <Table
              dataSource={data}
              columns={columns}
              rowKey="zone_id"
              pagination={{ pageSize: 15, showSizeChanger: false }}
              scroll={{ x: 'max-content', y: 'calc(100vh - 420px)' }}
              size="small"
              sticky={{ offsetHeader: 0 }}
              rowClassName={(record) => num(record.impact_score) > 0.6 ? 'high-priority-row' : ''}
            />
          </Spin>
        </Card>

      </div>

      {/* FLOATING CHATBOT */}
      <Chatbot data={data} />
      
      <style dangerouslySetInnerHTML={{__html: `
        .high-priority-row { background-color: #fef2f2; }
        .high-priority-row:hover { background-color: #fee2e2 !important; }
        .ant-table-small .ant-table-thead > tr > th { background-color: #f9fafb; font-weight: 600; color: #4b5563; font-size: 13px; text-transform: uppercase; white-space: nowrap; padding: 10px 8px; }
        .ant-table-small .ant-table-tbody > tr > td { padding: 10px 8px; font-size: 13px; color: #111827; }
        .ant-table-wrapper .ant-pagination { margin: 16px 20px !important; }
      `}} />
    </div>
  );
}