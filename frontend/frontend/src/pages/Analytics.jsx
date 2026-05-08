import React, { useEffect, useMemo, useState } from 'react';
import { Table, Tag, Card, Typography, Spin, Select, Row, Col, Statistic, message, Button, Empty, Alert } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import Chatbot from '../components/Chatbot';
import { fetchCityAnalytics } from '../utils/api';
import { toFiniteNumber } from '../utils/telemetry';

const { Title, Text } = Typography;

const cityOptions = [
  'ahmedabad', 'bangalore', 'chennai', 'delhi', 'hyderabad',
  'indore', 'jaipur', 'kanpur', 'kolkata', 'lucknow',
  'mumbai', 'nagpur', 'pune', 'surat', 'vadodara'
];

const CompactStatCard = ({ title, value }) => (
  <Card
    styles={{ body: { padding: '20px 24px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' } }}
    style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: 'none', background: '#fff', height: '100%' }}
  >
    <Statistic
      title={<Text type="secondary" style={{ fontSize: '13px', fontWeight: 500, letterSpacing: '0.3px', textTransform: 'uppercase' }}>{title}</Text>}
      value={value}
      valueStyle={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', marginTop: '6px', letterSpacing: '-0.5px' }}
    />
  </Card>
);

function buildAnalyticsRows(zones) {
  return [...zones]
    .sort((left, right) => toFiniteNumber(right.priority_score, -Infinity) - toFiniteNumber(left.priority_score, -Infinity))
    .map((zone, index) => ({
      ...zone,
      priority_rank: zone.priority_rank ?? index + 1,
      impact_score: toFiniteNumber(zone.priority_score ?? zone.impact_score, 0),
      trees_needed: Math.max(0, Math.round(toFiniteNumber(zone.trees ?? zone.required_trees, 0))),
      water_available: Boolean(zone.water_feasible ?? zone.water_ok ?? zone.water_available),
    }));
}

export default function Analytics() {
  const [selectedCity, setSelectedCity] = useState('jaipur');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const fetchCityData = async () => {
      setLoading(true);
      setError('');

      try {
        const payload = await fetchCityAnalytics({ city: selectedCity });
        if (!active) {
          return;
        }

        setData(buildAnalyticsRows(payload.zones || []));
      } catch (err) {
        if (!active) {
          return;
        }

        console.error(err);
        setError(err instanceof Error ? err.message : `Failed to load analytics data for ${selectedCity}`);
        setData([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchCityData();

    return () => {
      active = false;
    };
  }, [selectedCity]);

  const exportToExcel = () => {
    if (!data.length) {
      message.warning('No data to export!');
      return;
    }

    const headers = ['Zone', 'Impact Score', 'NDVI', 'LST (C)', 'Priority Rank', 'Required Trees', 'Water Feasible', 'Climate Stress', 'Reason'];
    const rows = data.map((record) => [
      record.zone_id,
      toFiniteNumber(record.impact_score, 0).toFixed(3),
      record.NDVI != null ? toFiniteNumber(record.NDVI, 0).toFixed(3) : 'N/A',
      record.LST != null ? toFiniteNumber(record.LST, 0).toFixed(2) : 'N/A',
      record.priority_rank,
      record.trees_needed,
      record.water_available ? 'Yes' : 'No',
      record.climate_stress_level || 'N/A',
      `"${String(record.reason || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = `data:text/csv;charset=utf-8,${[headers.join(','), ...rows.map((entry) => entry.join(','))].join('\n')}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `analytics_${selectedCity}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const highPriorityCount = useMemo(
    () => data.filter((row) => toFiniteNumber(row.impact_score, 0) > 6).length,
    [data]
  );
  const avgImpact = useMemo(
    () => (data.length ? (data.reduce((sum, row) => sum + toFiniteNumber(row.impact_score, 0), 0) / data.length).toFixed(3) : '0.000'),
    [data]
  );
  const avgLST = useMemo(
    () => (data.length ? (data.reduce((sum, row) => sum + toFiniteNumber(row.LST, 0), 0) / data.length).toFixed(2) : '0.00'),
    [data]
  );
  const waterAvailableCount = useMemo(
    () => data.filter((row) => row.water_available).length,
    [data]
  );

  const columns = [
    {
      title: 'Zone',
      dataIndex: 'zone_id',
      key: 'zone_id',
      width: 90,
      sorter: (a, b) => String(a.zone_id).localeCompare(String(b.zone_id)),
      render: (value) => <Text strong style={{ color: '#334155' }}>{value}</Text>,
    },
    {
      title: 'Impact Score',
      dataIndex: 'impact_score',
      width: 120,
      key: 'impact_score',
      sorter: (a, b) => toFiniteNumber(a.impact_score, 0) - toFiniteNumber(b.impact_score, 0),
      render: (value) => {
        const score = toFiniteNumber(value, 0);
        return (
          <Tag color={score > 7 ? '#fee2e2' : score > 5 ? '#fef3c7' : '#ecfdf5'} style={{ margin: 0, fontWeight: 600, color: score > 7 ? '#dc2626' : score > 5 ? '#d97706' : '#16a34a', border: 'none', padding: '2px 8px', borderRadius: '6px' }}>
            {score.toFixed(3)}
          </Tag>
        );
      },
    },
    {
      title: 'NDVI',
      dataIndex: 'NDVI',
      key: 'NDVI',
      width: 90,
      sorter: (a, b) => toFiniteNumber(a.NDVI, -Infinity) - toFiniteNumber(b.NDVI, -Infinity),
      render: (value) => <Text type="secondary">{value != null ? toFiniteNumber(value, 0).toFixed(3) : 'N/A'}</Text>,
    },
    {
      title: 'LST (C)',
      dataIndex: 'LST',
      key: 'LST',
      width: 100,
      sorter: (a, b) => toFiniteNumber(a.LST, -Infinity) - toFiniteNumber(b.LST, -Infinity),
      render: (value) => <Text style={{ color: toFiniteNumber(value, 0) > 38 ? '#ef4444' : '#64748b' }}>{value != null ? toFiniteNumber(value, 0).toFixed(2) : 'N/A'}</Text>,
    },
    {
      title: 'Water Feasible',
      dataIndex: 'water_available',
      key: 'water_available',
      width: 120,
      render: (water) => (
        <span style={{ color: water ? '#3b82f6' : '#ef4444', fontWeight: 500 }}>
          {water ? 'Yes' : 'No'}
        </span>
      ),
      filters: [
        { text: 'Available', value: true },
        { text: 'Scarce', value: false }
      ],
      onFilter: (value, record) => record.water_available === value,
    },
    {
      title: 'Priority Rank',
      dataIndex: 'priority_rank',
      key: 'priority_rank',
      width: 100,
      sorter: (a, b) => toFiniteNumber(a.priority_rank, Infinity) - toFiniteNumber(b.priority_rank, Infinity),
    },
    {
      title: 'Required Trees',
      dataIndex: 'trees_needed',
      key: 'trees_needed',
      sorter: (a, b) => toFiniteNumber(a.trees_needed, 0) - toFiniteNumber(b.trees_needed, 0),
      width: 110,
      render: (value) => <Text strong style={{ color: '#10b981' }}>{value}</Text>
    },
    {
      title: 'Climate Stress',
      dataIndex: 'climate_stress_level',
      key: 'climate_stress_level',
      width: 120,
      render: (value) => <Tag color={value === 'High' ? 'red' : value === 'Moderate' ? 'gold' : 'green'}>{value || 'N/A'}</Tag>,
    },
    {
      title: 'Insight',
      dataIndex: 'reason',
      key: 'reason',
      width: 340,
      render: (text) => (
        <div style={{ minWidth: '240px', maxWidth: '320px', whiteSpace: 'normal', color: '#64748b', lineHeight: '1.5', wordWrap: 'break-word' }}>
          {text || 'Telemetry reason unavailable'}
        </div>
      ),
    }
  ];

  return (
    <div style={{ background: 'transparent' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Text strong style={{ fontSize: 13, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px' }}>Select your city</Text>
          <Select
            showSearch
            value={selectedCity}
            style={{ width: 180 }}
            size="large"
            onChange={(value) => setSelectedCity(value)}
            options={cityOptions.map((city) => ({
              value: city,
              label: city.charAt(0).toUpperCase() + city.slice(1)
            }))}
            optionFilterProp="label"
          />
        </div>
        <Tag color="cyan" style={{ border: 'none', padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
          {data.length} Total Records Loaded
        </Tag>
      </div>

      {error ? (
        <Alert
          type="error"
          showIcon
          message="Analytics failed to load"
          description={error}
          style={{ marginBottom: 24 }}
        />
      ) : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <Row gutter={[24, 24]}>
          <Col xs={12} lg={4}><CompactStatCard title="Total Zones" value={data.length} /></Col>
          <Col xs={12} lg={5}><CompactStatCard title="High Priority" value={highPriorityCount} /></Col>
          <Col xs={12} lg={5}><CompactStatCard title="Avg Impact" value={avgImpact} /></Col>
          <Col xs={12} lg={5}><CompactStatCard title="Water Feasible" value={waterAvailableCount} /></Col>
          <Col xs={12} lg={5}><CompactStatCard title="Avg LST" value={`${avgLST}C`} /></Col>
        </Row>

        <Card
          styles={{ body: { padding: 0 } }}
          style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: 'none', overflow: 'hidden' }}
        >
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Title level={5} style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>Zone Performance Analytics</Title>
            <Button type="primary" icon={<DownloadOutlined />} onClick={exportToExcel} style={{ background: '#10b981', borderColor: '#10b981' }}>
              Export to Excel
            </Button>
          </div>
          <Spin spinning={loading}>
            {data.length ? (
              <Table
                dataSource={data}
                columns={columns}
                rowKey="zone_id"
                pagination={{ pageSize: 12, showSizeChanger: false }}
                size="middle"
                rowClassName={(record) => toFiniteNumber(record.impact_score, 0) > 6 ? 'high-priority-row' : ''}
                loading={loading}
                style={{ background: '#fff' }}
                scroll={{ x: 1300 }}
                tableLayout="fixed"
              />
            ) : (
              !loading && <Empty style={{ margin: '48px 0' }} description="No analytics rows available for this city." />
            )}
          </Spin>
        </Card>
      </div>

      <Chatbot data={data} />

      <style dangerouslySetInnerHTML={{
        __html: `
        .high-priority-row { background-color: #fef2f2 !important; }
        .high-priority-row:hover { background-color: #fee2e2 !important; transition: all 0.2s; }
        .ant-table-wrapper .ant-table { background: transparent !important; }
        .ant-table-thead > tr > th {
           background-color: #f8fafc !important;
           font-weight: 600 !important;
           color: #64748b !important;
           font-size: 13px !important;
           text-transform: uppercase;
           white-space: nowrap;
           border-bottom: 2px solid #e2e8f0 !important;
        }
        .ant-table-tbody > tr > td {
           border-bottom: 1px solid #f1f5f9 !important;
           vertical-align: middle !important;
        }
        .ant-table-wrapper .ant-pagination {
           margin: 20px 24px !important;
        }
        .ant-pagination-item-active {
           border-color: #10b981 !important;
           background: #ecfdf5 !important;
        }
        .ant-pagination-item-active a { color: #059669 !important; }
      `}} />
    </div>
  );
}
