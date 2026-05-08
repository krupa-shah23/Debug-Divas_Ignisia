import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography
} from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { runZoneOptimization } from '../utils/api';
import { toFiniteNumber } from '../utils/telemetry';

const { Title, Text } = Typography;

const cityOptions = [
  'ahmedabad', 'bangalore', 'chennai', 'delhi', 'hyderabad',
  'indore', 'jaipur', 'kanpur', 'kolkata', 'lucknow',
  'mumbai', 'nagpur', 'pune', 'surat', 'vadodara'
].map((city) => ({
  value: city,
  label: city.charAt(0).toUpperCase() + city.slice(1)
}));

const droughtOptions = [
  { value: 'normal', label: 'Normal' },
  { value: 'moderate', label: 'Moderate Drought' },
  { value: 'severe', label: 'Severe Drought' }
];

function formatScore(value, digits = 2) {
  return Number.isFinite(Number(value)) ? Number(value).toFixed(digits) : 'N/A';
}

function getRiskTag(level) {
  if (level === 'High') {
    return <Tag color="red">High</Tag>;
  }
  if (level === 'Medium') {
    return <Tag color="gold">Medium</Tag>;
  }
  return <Tag color="green">Low</Tag>;
}

function getClimateStressTag(level) {
  if (level === 'High') {
    return <Tag color="red">High Stress</Tag>;
  }
  if (level === 'Moderate') {
    return <Tag color="gold">Moderate Stress</Tag>;
  }
  return <Tag color="green">Low Stress</Tag>;
}

function buildAverage(zones, key, digits = 2) {
  const values = zones.map((zone) => toFiniteNumber(zone[key], null)).filter((value) => value != null);
  if (!values.length) {
    return 'N/A';
  }

  return (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(digits);
}

export default function Optimization() {
  const [selectedCity, setSelectedCity] = useState('pune');
  const [droughtMode, setDroughtMode] = useState('normal');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await runZoneOptimization({
        city: selectedCity,
        droughtMode
      });
      setResult(data);
    } catch (e) {
      setError(e.message || 'Failed to fetch data');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCity, droughtMode]);

  const selectedZoneColumns = [
    {
      title: 'Zone',
      dataIndex: 'zone_id',
      key: 'zone_id',
      render: (value) => <Text strong>{value}</Text>
    },
    {
      title: 'NDVI',
      dataIndex: 'NDVI',
      key: 'NDVI',
      render: (value) => formatScore(value, 3)
    },
    {
      title: 'LST',
      dataIndex: 'LST',
      key: 'LST',
      render: (value) => (value != null ? `${formatScore(value)} C` : 'N/A')
    },
    {
      title: 'Trees',
      dataIndex: 'trees',
      key: 'trees'
    },
    {
      title: 'Score',
      dataIndex: 'priority_score',
      key: 'priority_score',
      render: (value) => formatScore(value)
    },
    {
      title: 'Water',
      dataIndex: 'water_feasible',
      key: 'water_feasible',
      render: (value) => (
        <Tag color={value ? 'green' : 'orange'}>
          {value ? 'Feasible' : 'Constrained'}
        </Tag>
      )
    },
    {
      title: 'Climate Stress',
      dataIndex: 'climate_stress_level',
      key: 'climate_stress_level',
      render: (value) => getClimateStressTag(value)
    },
    {
      title: 'Risk',
      dataIndex: 'risk_level',
      key: 'risk_level',
      render: (value) => getRiskTag(value)
    },
    {
      title: 'Drought',
      dataIndex: 'drought_index',
      key: 'drought_index',
      render: (value) => formatScore(value)
    },
    {
      title: 'Reason / Why Selected',
      dataIndex: 'reason',
      key: 'reason',
      render: (value) => <Text type="secondary">{value || 'No explanation available'}</Text>
    }
  ];

  const allZoneColumns = [
    {
      title: 'Zone',
      dataIndex: 'zone_id',
      key: 'zone_id'
    },
    {
      title: 'Selected',
      dataIndex: 'selected',
      key: 'selected',
      render: (value) => (
        <Tag color={value ? 'blue' : 'default'}>
          {value ? 'Yes' : 'No'}
        </Tag>
      )
    },
    {
      title: 'NDVI',
      dataIndex: 'NDVI',
      key: 'NDVI',
      render: (value) => formatScore(value, 3)
    },
    {
      title: 'LST',
      dataIndex: 'LST',
      key: 'LST',
      render: (value) => (value != null ? `${formatScore(value)} C` : 'N/A')
    },
    {
      title: 'Trees',
      dataIndex: 'trees',
      key: 'trees'
    },
    {
      title: 'Score',
      dataIndex: 'priority_score',
      key: 'priority_score',
      render: (value) => formatScore(value)
    },
    {
      title: 'Climate Stress',
      dataIndex: 'climate_stress_level',
      key: 'climate_stress_level',
      render: (value) => getClimateStressTag(value)
    },
    {
      title: 'Risk',
      dataIndex: 'risk_level',
      key: 'risk_level',
      render: (value) => getRiskTag(value)
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      render: (value) => <Text type="secondary">{value || 'No explanation available'}</Text>
    }
  ];

  const avgNdvi = useMemo(() => buildAverage(result?.zones || [], 'NDVI', 3), [result]);
  const avgLst = useMemo(() => buildAverage(result?.zones || [], 'LST', 2), [result]);

  return (
    <div style={{ background: 'transparent' }}>
      <Card
        style={{
          borderRadius: 20,
          border: '1px solid #d8e2dc',
          boxShadow: '0 10px 30px rgba(27, 67, 50, 0.08)',
          marginBottom: 24
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <Title level={3} style={{ margin: 0, color: '#1b4332' }}>
                Optimization API
              </Title>
              <Text type="secondary">
                Live backend pipeline results from `localhost:5000/optimize`
              </Text>
            </div>

            <Button
              type="primary"
              icon={<ReloadOutlined />}
              loading={loading}
              disabled={loading}
              onClick={fetchData}
              className="eco-btn"
            >
              {loading ? 'Running...' : 'Run Optimization'}
            </Button>
          </div>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                City
              </Text>
              <Select
                value={selectedCity}
                onChange={setSelectedCity}
                options={cityOptions}
                size="large"
                style={{ width: '100%' }}
              />
            </Col>

            <Col xs={24} md={12}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                Climate Simulation
              </Text>
              <Select
                value={droughtMode}
                onChange={setDroughtMode}
                options={droughtOptions}
                size="large"
                style={{ width: '100%' }}
              />
            </Col>
          </Row>

          {error ? (
            <Alert
              type="error"
              showIcon
              message="API request failed"
              description={error}
            />
          ) : null}

          {droughtMode !== 'normal' ? (
            <Alert
              type="warning"
              showIcon
              message={droughtMode === 'severe' ? 'Severe Drought Scenario Active' : 'Moderate Drought Scenario Active'}
              description={
                droughtMode === 'severe'
                  ? 'Extreme drought stress is reducing feasibility and shrinking final tree allocations.'
                  : 'Moderate water stress is influencing zone selection and tree allocation.'
              }
            />
          ) : null}
        </Space>
      </Card>

      <Spin spinning={loading} tip="Fetching optimization results...">
        {result ? (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Card style={{ borderRadius: 18 }}>
                  <Statistic title="Selected Zones" value={result.summary?.count_selected || 0} />
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card style={{ borderRadius: 18 }}>
                  <Statistic title="Total Trees" value={result.summary?.total_trees || 0} />
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card style={{ borderRadius: 18 }}>
                  <Statistic title="City" value={selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1)} />
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card style={{ borderRadius: 18 }}>
                  <Statistic title="Avg NDVI" value={avgNdvi} />
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card style={{ borderRadius: 18 }}>
                  <Statistic title="Avg LST" value={avgLst} suffix={avgLst !== 'N/A' ? 'C' : ''} />
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card style={{ borderRadius: 18 }}>
                  <Statistic title="Drought Mode" value={droughtMode.charAt(0).toUpperCase() + droughtMode.slice(1)} />
                </Card>
              </Col>
            </Row>

            <Card
              title="Selected Zones"
              style={{ borderRadius: 18 }}
            >
              <div style={{ marginBottom: 12 }}>
                {droughtMode === 'moderate' ? (
                  <span style={{ color: 'orange', fontSize: 12 }}>
                    Moderate drought impact applied
                  </span>
                ) : null}
                {droughtMode === 'severe' ? (
                  <span style={{ color: '#dc2626', fontSize: 12 }}>
                    Severe drought conditions affecting selection
                  </span>
                ) : null}
              </div>
              {result.selected_zones?.length ? (
                <Table
                  dataSource={result.selected_zones}
                  columns={selectedZoneColumns}
                  rowKey="zone_id"
                  pagination={false}
                  rowClassName={(record) => (
                    Number(record?.drought_index || 0) > 0.6 ? 'high-drought' : ''
                  )}
                />
              ) : (
                <Empty description="No zones selected" />
              )}
            </Card>

            <Card
              title="All Returned Zones"
              extra={<Text type="secondary">{result.zones?.length || 0} zones</Text>}
              style={{ borderRadius: 18 }}
            >
              <Table
                dataSource={result.zones || []}
                columns={allZoneColumns}
                rowKey="zone_id"
                pagination={{ pageSize: 8 }}
                rowClassName={(record) => (
                  Number(record?.drought_index || 0) > 0.6 ? 'high-drought' : ''
                )}
              />
            </Card>
          </Space>
        ) : (
          !loading && <Empty description="Run the optimization to see results" />
        )}
      </Spin>

      <style>{`
        .high-drought td {
          background-color: rgba(255, 0, 0, 0.05) !important;
        }
      `}</style>
    </div>
  );
}
