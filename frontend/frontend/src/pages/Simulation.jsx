import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Spin, Alert } from 'antd';
import { loadCityGeoJson, loadCityScoredZones } from '../utils/dataloader';
import { normalizeZoneMetrics, generateHeuristicSimulation } from '../components/simulation/simulationEngine';
import ProjectedImpactSummary from '../components/simulation/ProjectedImpactSummary';
import BaselineChart from '../components/simulation/BaselineChart';
import GrowthTimelineChart from '../components/simulation/GrowthTimelineChart';
import SimulationMapCard from '../components/simulation/SimulationMapCard';

const CITY_OPTIONS = [
  'ahmedabad',
  'bangalore',
  'chennai',
  'delhi',
  'hyderabad',
  'indore',
  'jaipur',
  'kanpur',
  'kolkata',
  'lucknow',
  'pune',
  'surat',
  'vadodara'
];

const DROUGHT_OPTIONS = [
  { label: 'Normal Baseline', value: 'normal' },
  { label: 'Moderate Drought', value: 'moderate' },
  { label: 'Severe Drought', value: 'severe' }
];

export default function Simulation() {
  const [hasStartedSimulation, setHasStartedSimulation] = useState(false);
  const [selectedCity, setSelectedCity] = useState('pune');
  const [droughtMode, setDroughtMode] = useState('normal');
  const [zones, setZones] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [timeHorizon, setTimeHorizon] = useState(12);
  const [geoData, setGeoData] = useState(null);
  const [usedMockGeo, setUsedMockGeo] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setLoadingData(true);
      setUsedMockGeo(false);
      setError('');

      try {
        const [geo, zoneRows] = await Promise.all([
          loadCityGeoJson(selectedCity).catch(() => {
            if (active) {
              setUsedMockGeo(true);
            }
            return { type: 'FeatureCollection', features: [] };
          }),
          loadCityScoredZones(selectedCity, { droughtMode }),
        ]);

        if (!active) {
          return;
        }

        const normalizedZones = zoneRows.map((zone, index) => normalizeZoneMetrics(zone, index));
        setGeoData(geo);
        setZones(normalizedZones);
        setSelectedZoneId(normalizedZones.length ? String(normalizedZones[0].zone_id) : '');
        setHasStartedSimulation(false);
        setIsSimulating(false);
      } catch (err) {
        if (!active) {
          return;
        }

        console.error('Simulation data load failed:', err);
        setError(err instanceof Error ? err.message : 'Failed to load simulation telemetry');
        setZones([]);
        setGeoData({ type: 'FeatureCollection', features: [] });
        setSelectedZoneId('');
        setHasStartedSimulation(false);
        setIsSimulating(false);
      } finally {
        if (active) {
          setLoadingData(false);
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [selectedCity, droughtMode]);

  useEffect(() => {
    if (!loadingData) {
      setHasStartedSimulation(false);
      setIsSimulating(false);
    }
  }, [selectedZoneId, timeHorizon, selectedCity, droughtMode, loadingData]);

  const selectedZone = useMemo(
    () => zones.find((zone) => String(zone.zone_id) === String(selectedZoneId)) || zones[0] || null,
    [zones, selectedZoneId]
  );

  const projection = useMemo(() => {
    if (!selectedZone || !hasStartedSimulation) {
      return null;
    }

    return generateHeuristicSimulation(selectedZone, timeHorizon, { droughtMode });
  }, [selectedZone, timeHorizon, droughtMode, hasStartedSimulation]);

  const handleRunSimulation = () => {
    if (!selectedZone) {
      return;
    }

    setHasStartedSimulation(true);
    setIsSimulating(true);

    setTimeout(() => {
      setIsSimulating(false);
    }, 1200);
  };

  if (loadingData) {
    return (
      <div
        style={{
          padding: 40,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '70vh',
          background: 'transparent'
        }}
      >
        <Spin size="large" description="Initializing Simulation Engine..." />
      </div>
    );
  }

  if (!selectedZone) {
    return (
      <div style={{ padding: 24 }}>
        {error ? <Alert type="error" showIcon message={error} /> : 'No zone data available for this city.'}
      </div>
    );
  }

  return (
    <div style={{ background: 'transparent' }}>
      {error ? (
        <Alert
          type="warning"
          showIcon
          message="Simulation fallback mode"
          description={error}
          style={{ marginBottom: 24 }}
        />
      ) : null}

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={10}>
          <ProjectedImpactSummary
            selectedCity={selectedCity}
            setSelectedCity={setSelectedCity}
            cityOptions={CITY_OPTIONS}
            zones={zones}
            selectedZoneId={selectedZoneId}
            setSelectedZoneId={setSelectedZoneId}
            droughtMode={droughtMode}
            setDroughtMode={setDroughtMode}
            droughtOptions={DROUGHT_OPTIONS}
            selectedZone={selectedZone}
            projection={projection}
            timeHorizon={timeHorizon}
            setTimeHorizon={setTimeHorizon}
            isSimulating={hasStartedSimulation ? isSimulating : false}
            simulated={hasStartedSimulation}
          />
        </Col>

        <Col xs={24} lg={14}>
          <SimulationMapCard
            selectedZone={selectedZone}
            projection={projection}
            geoData={geoData}
            usedMockGeo={usedMockGeo}
            simulated={hasStartedSimulation}
            isSimulating={hasStartedSimulation ? isSimulating : false}
            timeHorizon={timeHorizon}
            onRunSimulation={handleRunSimulation}
          />
        </Col>

        {hasStartedSimulation && projection && (
          <>
            <Col xs={24} lg={10}>
              <BaselineChart selectedZone={selectedZone} />
            </Col>

            <Col xs={24} lg={14}>
              <GrowthTimelineChart
                selectedZone={selectedZone}
                projection={projection}
                simulated
                timeHorizon={timeHorizon}
              />
            </Col>
          </>
        )}
      </Row>
    </div>
  );
}
