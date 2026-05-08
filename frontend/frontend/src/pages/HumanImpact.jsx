import React, { useEffect, useMemo, useState } from 'react';
import { Typography, Space, Skeleton, Select, Card, Divider, Alert } from 'antd';
import WorkerHeatBurden from '../components/WorkerHeatBurden';
import SeasonPlanner from '../components/SeasonPlanner';
import { loadCityScoredZones } from '../utils/dataloader';

const { Title, Text } = Typography;

const cityList = [
  'ahmedabad', 'bangalore', 'chennai', 'delhi', 'hyderabad',
  'indore', 'jaipur', 'kanpur', 'kolkata', 'lucknow',
  'mumbai', 'nagpur', 'pune', 'surat', 'vadodara'
];

export default function HumanImpact() {
  const [selectedCity, setSelectedCity] = useState('pune');
  const [zones, setZones] = useState([]);
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const fetchZones = async () => {
      setLoading(true);
      setError('');

      try {
        const fetchedZones = await loadCityScoredZones(selectedCity);
        if (!active) {
          return;
        }

        const normalized = fetchedZones.map((zone, index) => ({
          ...zone,
          zone_id: String(zone.zone_id || zone.Zone_ID || index),
          lst_c: Number.isFinite(Number(zone.lst_c ?? zone.LST)) ? Number(zone.lst_c ?? zone.LST) : null,
          ndvi: Number.isFinite(Number(zone.ndvi ?? zone.NDVI)) ? Number(zone.ndvi ?? zone.NDVI) : null
        }));

        setZones(normalized);
        if (normalized.length > 0) {
          setSelectedZoneId(normalized[0].zone_id);
        }
      } catch (fetchError) {
        if (!active) {
          return;
        }

        console.error('Fetch Error:', fetchError);
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load human impact telemetry');
        setZones([]);
        setSelectedZoneId(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchZones();

    return () => {
      active = false;
    };
  }, [selectedCity]);

  const selectedZone = zones.find((zone) => String(zone.zone_id) === String(selectedZoneId)) || zones[0] || {};
  const minLST = zones.length > 0 ? Math.min(...zones.map((zone) => zone.lst_c).filter(Number.isFinite)) : null;
  const maxLST = zones.length > 0 ? Math.max(...zones.map((zone) => zone.lst_c).filter(Number.isFinite)) : null;

  const regionalTelemetry = useMemo(() => {
    const lstValues = zones.map((zone) => zone.lst_c).filter(Number.isFinite);
    const ndviValues = zones.map((zone) => zone.ndvi).filter(Number.isFinite);
    return {
      avgLST: lstValues.length ? lstValues.reduce((sum, value) => sum + value, 0) / lstValues.length : null,
      avgNDVI: ndviValues.length ? ndviValues.reduce((sum, value) => sum + value, 0) / ndviValues.length : null,
    };
  }, [zones]);

  return (
    <div style={{ background: 'transparent' }}>
      <Card
        style={{ marginBottom: 40, borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}
        bodyStyle={{ padding: '24px 32px' }}
      >
        <Space size={32} align="center" wrap>
          <div>
            <Text type="secondary" strong style={{ display: 'block', fontSize: 12, marginBottom: 4, textTransform: 'uppercase' }}>Select Region</Text>
            <Select
              value={selectedCity}
              style={{ width: 180 }}
              size="large"
              onChange={setSelectedCity}
              options={cityList.map((city) => ({ label: city.toUpperCase(), value: city }))}
            />
          </div>
          <div>
            <Text type="secondary" strong style={{ display: 'block', fontSize: 12, marginBottom: 4, textTransform: 'uppercase' }}>Sector Scope</Text>
            <Select
              value={selectedZoneId}
              style={{ width: 260 }}
              size="large"
              onChange={setSelectedZoneId}
              disabled={loading || zones.length === 0}
              options={zones.map((zone) => ({ label: zone.zone_name || `Zone ${zone.zone_id}`, value: zone.zone_id }))}
            />
          </div>
        </Space>
      </Card>

      {error ? (
        <Alert
          type="warning"
          showIcon
          message="Human impact telemetry fallback"
          description={error}
          style={{ marginBottom: 24 }}
        />
      ) : null}

      {loading ? <Skeleton active paragraph={{ rows: 8 }} /> : (
        <>
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 20, flexWrap: 'wrap' }}>
              <Title level={3} style={{ margin: 0, fontWeight: 700 }}>Climate Burden</Title>
              <Divider type="vertical" style={{ margin: '0 16px' }} />
              <Text type="secondary" style={{ fontSize: 16 }}>{selectedZone.zone_name || 'Region Data'} • </Text>
              <Text strong style={{ fontSize: 16, marginLeft: 8, color: '#0f172a' }}>
                LST {selectedZone.lst_c != null ? `${selectedZone.lst_c.toFixed(2)}C` : 'N/A'}
              </Text>
              <Text type="secondary" style={{ fontSize: 16, marginLeft: 8 }}>
                • NDVI {selectedZone.ndvi != null ? selectedZone.ndvi.toFixed(3) : 'N/A'}
              </Text>
              <Text type="secondary" style={{ fontSize: 16, marginLeft: 8 }}>
                • Regional LST {regionalTelemetry.avgLST != null ? `${regionalTelemetry.avgLST.toFixed(2)}C` : 'N/A'}
              </Text>
              <Text type="secondary" style={{ fontSize: 16, marginLeft: 8 }}>
                • Regional NDVI {regionalTelemetry.avgNDVI != null ? regionalTelemetry.avgNDVI.toFixed(3) : 'N/A'}
              </Text>
            </div>

            <WorkerHeatBurden
              lst={selectedZone.lst_c}
              ndvi={selectedZone.ndvi}
              droughtIndex={selectedZone.drought_index}
              waterFeasible={selectedZone.water_feasible ?? selectedZone.water_ok}
              minLST={minLST}
              maxLST={maxLST}
            />
          </div>

          <div style={{ marginTop: 48 }}>
            <SeasonPlanner zones={zones} />
          </div>
        </>
      )}
    </div>
  );
}
