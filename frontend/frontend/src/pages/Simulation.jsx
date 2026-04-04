import React, { useEffect, useState, useMemo } from 'react';
import { Row, Col, Typography, message, Spin, Alert } from 'antd';
import { loadCityGeoJson, loadCityScoredZones } from '../utils/dataloader';
import { normalizeZoneMetrics, generateHeuristicSimulation } from '../components/simulation/simulationEngine';
import ProjectedImpactSummary from '../components/simulation/ProjectedImpactSummary';
import BaselineChart from '../components/simulation/BaselineChart';
import GrowthTimelineChart from '../components/simulation/GrowthTimelineChart';
import SimulationMapCard from '../components/simulation/SimulationMapCard'; 

const { Title } = Typography;

const cityOptions = [
  'ahmedabad', 'bangalore', 'chennai', 'delhi', 'hyderabad',
  'indore', 'jaipur', 'kanpur', 'kolkata', 'lucknow',
  'pune', 'surat', 'vadodara'
];

export default function Simulation() {
  const [selectedCity, setSelectedCity] = useState('pune');
  const [zones, setZones] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [timeHorizon, setTimeHorizon] = useState(12);

  // Interactive Simulation State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulated, setSimulated] = useState(false);

  // Geo Data
  const [geoData, setGeoData] = useState(null);
  const [usedMockGeo, setUsedMockGeo] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      setUsedMockGeo(false);

      let geo = null;
      let zoneRows = [];

      try {
        zoneRows = await loadCityScoredZones(selectedCity);
      } catch (err) {
        console.warn("Failed to load baseline metrics.", err);
        zoneRows = Array.from({ length: 3 }).map((_, i) => ({ zone_id: `Fail-Z${i}`, lst: 39 + i, ndvi: 0.2 }));
      }

      try {
        geo = await loadCityGeoJson(selectedCity);
      } catch (err) {
        console.warn('GeoJSON unavailable, falling back to heuristic generated ROI.');
        setUsedMockGeo(true);
        geo = { type: "FeatureCollection", features: [] };
      }

      setGeoData(geo);

      const normalizedZones = zoneRows.map((z, i) => normalizeZoneMetrics(z, i));
      setZones(normalizedZones);

      if (normalizedZones.length > 0) {
        setSelectedZoneId(normalizedZones[0].zone_id);
      }

      setSimulated(false);
      setIsSimulating(false);
      setLoadingData(false);
    };

    loadData();
  }, [selectedCity]);

  useEffect(() => {
    if (simulated) {
      setIsSimulating(true);
      setSimulated(false);
      setTimeout(() => { setIsSimulating(false); setSimulated(true); }, 800);
    }
  }, [timeHorizon]);

  const selectedZone = useMemo(
    () => zones.find((z) => String(z.zone_id) === String(selectedZoneId)) || zones[0],
    [zones, selectedZoneId]
  );

  const projection = useMemo(() => {
    if (!selectedZone) return null;
    return generateHeuristicSimulation(selectedZone, timeHorizon);
  }, [selectedZone, timeHorizon]);

  const runSimulation = () => {
    if (!selectedZone) return;
    setIsSimulating(true);
    setSimulated(false);
    setTimeout(() => {
      setIsSimulating(false);
      setSimulated(true);
      message.success('Simulation complete: projected post-planting scenario generated.');
    }, 1500); 
  };

  if (loadingData) {
    return <div style={{ padding: 40, textAlign: 'center' }}><Spin size="large" /></div>;
  }

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>

      <Row gutter={[24, 24]}>
        {/* TOP LEFT: Controls & Summary */}
        <Col xs={24} lg={10}>
          <ProjectedImpactSummary
            selectedCity={selectedCity}
            setSelectedCity={setSelectedCity}
            cityOptions={cityOptions}
            zones={zones}
            selectedZoneId={selectedZoneId}
            setSelectedZoneId={setSelectedZoneId}
            selectedZone={selectedZone}
            projection={projection}
            timeHorizon={timeHorizon}
            setTimeHorizon={setTimeHorizon}
            isSimulating={isSimulating}
            simulated={simulated}
            runSimulation={runSimulation}
          />
        </Col>

        {/* TOP RIGHT: Geographic Simulation Split */}
        <Col xs={24} lg={14}>
          <SimulationMapCard
            selectedZone={selectedZone}
            projection={projection}
            geoData={geoData}
            usedMockGeo={usedMockGeo}
            simulated={simulated}
            isSimulating={isSimulating}
            timeHorizon={timeHorizon}
          />
        </Col>
        
        {/* BOTTOM LEFT: Baseline Chart */}
        <Col xs={24} lg={10}>
           <BaselineChart selectedZone={selectedZone} />
        </Col>
        
        {/* BOTTOM RIGHT: Timeline Chart */}
        <Col xs={24} lg={14}>
           <GrowthTimelineChart
              selectedZone={selectedZone}
              projection={projection}
              simulated={simulated}
              timeHorizon={timeHorizon}
            />
        </Col>
      </Row>

    </div>
  );
}