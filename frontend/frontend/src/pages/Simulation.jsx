import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Typography, message, Spin, Alert } from 'antd';

import { loadCityGeoJson, loadCityScoredZones, loadCitySimulation } from '../utils/dataloader';
import SimulationControls from '../components/simulation/SimulationControls';
import BeforeAfterGeoMaps from '../components/simulation/BeforeAfterGeoMaps';
import ProjectedImpactSummary from '../components/simulation/ProjectedImpactSummary';
import BeforeAfterChart from '../components/simulation/BeforeAfterChart';
import GrowthTimelineChart from '../components/simulation/GrowthTimelineChart';
import LiveProgressChart from '../components/simulation/LiveProgressChart';
import BaselineChart from '../components/simulation/BaselineChart';
import BeforeAfterMetricsTable from '../components/simulation/BeforeAfterMetricsTable';
import PlantingSpotList from '../components/simulation/PlantingSpotList';

import { treeProfiles, horizonFactors } from '../components/simulation/simulationData';
import {
  calculateProjectedMetrics,
  getAnimatedMetrics,
  getBeforeAfterData,
  getTimelineData
} from '../components/simulation/simulationUtils';

const { Title } = Typography;

const cityOptions = [
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
  'mumbai',
  'nagpur',
  'pune',
  'surat',
  'vadodara'
];

export default function Simulation() {
  const [selectedCity, setSelectedCity] = useState('pune');
  const [zones, setZones] = useState([]);
  const [simulationRows, setSimulationRows] = useState([]);
  const [geoData, setGeoData] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState(null);

  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [treeCount, setTreeCount] = useState(40);
  const [treeType, setTreeType] = useState('native');
  const [timeHorizon, setTimeHorizon] = useState(12);
  const [progress, setProgress] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulated, setSimulated] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        setDataError(null);

        const [geo, zoneRows, simRows] = await Promise.all([
          loadCityGeoJson(selectedCity),
          loadCityScoredZones(selectedCity),
          loadCitySimulation(selectedCity)
        ]);

        setGeoData(geo);

        const normalizedZones = zoneRows.map((z, index) => {
          const zoneId =
            z.zone_id ||
            z.Zone_ID ||
            z.id ||
            z.zone ||
            z.zoneid ||
            `zone_${index + 1}`;

          const waterRaw =
            z.water_access ??
            z.water_available ??
            z.water_feasible ??
            false;

          const waterAccess =
            waterRaw === true ||
            waterRaw === 1 ||
            String(waterRaw).toLowerCase() === 'true' ||
            String(waterRaw).toLowerCase() === 'yes';

          return {
            ...z,
            zone_id: String(zoneId),
            zone_name:
              z.zone_name ||
              z.Zone_Name ||
              z.name ||
              `Zone ${zoneId}`,
            tree_canopy_pct: Number(
              z.tree_canopy_pct ??
              z.canopy_pct ??
              z.tree_coverage_ratio ??
              z.canopy_ratio ??
              0
            ),
            ndvi: Number(z.ndvi ?? z.NDVI ?? 0),
            lst_c: Number(z.lst_c ?? z.LST ?? z.lst ?? 0),
            vulnerability_index: Number(
              z.vulnerability_index ??
              z.vulnerability ??
              0
            ),
            impact_score: Math.round(
              Number(z.impact_score ?? z.final_score ?? z.score ?? 0)
            ),
            recommended_trees: Math.max(
              10,
              Math.round(Number(z.trees_needed ?? z.recommended_trees ?? 30))
            ),
            water_access: waterAccess
          };
        });

        const normalizedSimulation = simRows.map((row, index) => {
          const zoneId =
            row.zone_id ||
            row.Zone_ID ||
            row.id ||
            row.zone ||
            row.zoneid ||
            `zone_${index + 1}`;

          return {
            ...row,
            zone_id: String(zoneId),
            canopyAfter: Number(
              row.canopy_after ??
              row.projected_canopy ??
              row.canopy_pct_after ??
              0
            ),
            ndviAfter: Number(
              row.ndvi_after ??
              row.projected_ndvi ??
              row.NDVI_after ??
              0
            ),
            lstAfter: Number(
              row.lst_after ??
              row.projected_lst ??
              row.LST_after ??
              0
            ),
            benefitScore: Math.round(
              Number(
                row.benefit_score ??
                row.benefitScore ??
                row.projected_score ??
                row.score_after ??
                0
              )
            ),
            coolingBenefit: Number(
              row.cooling_benefit ??
              row.coolingBenefit ??
              row.cooling_delta ??
              0
            ),
            canopyGain: Number(
              row.canopy_gain ??
              row.canopyGain ??
              0
            ),
            ndviGain: Number(
              row.ndvi_gain ??
              row.ndviGain ??
              0
            ),
            explanation: row.explanation || ''
          };
        });

        setZones(normalizedZones);
        setSimulationRows(normalizedSimulation);

        if (normalizedZones.length > 0) {
          setSelectedZoneId(normalizedZones[0].zone_id);
          setTreeCount(normalizedZones[0].recommended_trees || 30);
        } else {
          setSelectedZoneId('');
        }

        setProgress(0);
        setSimulated(false);
        setIsSimulating(false);
      } catch (err) {
        console.error(err);
        setDataError(err.message || 'Failed to load simulation data');
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [selectedCity]);

  const selectedZone = useMemo(
    () => zones.find((z) => String(z.zone_id) === String(selectedZoneId)) || zones[0],
    [zones, selectedZoneId]
  );

  const profile = treeProfiles[treeType];
  const horizonFactor = horizonFactors[timeHorizon];

  const projected = useMemo(() => {
    if (!selectedZone) return null;

    const matched = simulationRows.find(
      (row) => String(row.zone_id) === String(selectedZone.zone_id)
    );

    if (
      matched &&
      matched.canopyAfter > 0 &&
      matched.ndviAfter > 0 &&
      matched.lstAfter > 0
    ) {
      return {
        canopyAfter: matched.canopyAfter,
        ndviAfter: matched.ndviAfter,
        lstAfter: matched.lstAfter,
        coolingBenefit:
          matched.coolingBenefit || +(selectedZone.lst_c - matched.lstAfter).toFixed(1),
        canopyGain:
          matched.canopyGain || +(matched.canopyAfter - selectedZone.tree_canopy_pct).toFixed(1),
        ndviGain:
          matched.ndviGain || +(matched.ndviAfter - selectedZone.ndvi).toFixed(2),
        benefitScore:
          matched.benefitScore || selectedZone.impact_score,
        explanation: matched.explanation || ''
      };
    }

    return calculateProjectedMetrics(selectedZone, treeCount, profile, horizonFactor);
  }, [selectedZone, simulationRows, treeCount, profile, horizonFactor]);

  const animatedMetrics = useMemo(() => {
    if (!selectedZone || !projected) return null;
    return getAnimatedMetrics(selectedZone, projected, progress);
  }, [selectedZone, projected, progress]);

  const beforeAfterData = useMemo(() => {
    if (!selectedZone || !projected) return [];
    return getBeforeAfterData(selectedZone, projected, simulated, isSimulating);
  }, [selectedZone, projected, simulated, isSimulating]);

  const timelineData = useMemo(() => {
    if (!selectedZone || !projected) return [];
    return getTimelineData(selectedZone, projected, timeHorizon);
  }, [selectedZone, projected, timeHorizon]);

  const handleZoneChange = (zoneId) => {
    const zone = zones.find((z) => String(z.zone_id) === String(zoneId));

    setSelectedZoneId(zoneId);
    setTreeCount(zone?.recommended_trees || 30);
    setProgress(0);
    setSimulated(false);
    setIsSimulating(false);
  };

  const runSimulation = () => {
    if (!selectedZone) return;

    if (!selectedZone.water_access && treeType !== 'drought') {
      message.warning(
        'This zone has low water access. Consider using Drought-Resilient Species for better feasibility.'
      );
    }

    setIsSimulating(true);
    setSimulated(false);
    setProgress(0);

    let current = 0;
    const interval = setInterval(() => {
      current += 4;

      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setIsSimulating(false);
        setSimulated(true);
        message.success('Simulation complete: projected post-planting scenario generated.');
      }

      setProgress(current);
    }, 100);
  };

  if (loadingData) {
    return (
      <div style={{ padding: 24, display: 'flex', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (dataError) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          type="error"
          message="Simulation data failed to load"
          description={dataError}
          showIcon
        />
      </div>
    );
  }

  if (!selectedZone || !projected || !animatedMetrics) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          type="warning"
          message="No simulation data available"
          description="Could not find valid zone or simulation rows for the selected city."
          showIcon
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          <SimulationControls
            selectedCity={selectedCity}
            setSelectedCity={setSelectedCity}
            cityOptions={cityOptions}
            mockZones={zones}
            selectedZoneId={selectedZoneId}
            handleZoneChange={handleZoneChange}
            treeType={treeType}
            setTreeType={setTreeType}
            timeHorizon={timeHorizon}
            setTimeHorizon={setTimeHorizon}
            treeCount={treeCount}
            setTreeCount={setTreeCount}
            selectedZone={selectedZone}
            profile={profile}
            runSimulation={runSimulation}
            isSimulating={isSimulating}
            progress={progress}
            setProgress={setProgress}
            setSimulated={setSimulated}
          />
        </Col>

        <Col xs={24} lg={16}>
          <ProjectedImpactSummary
            animatedMetrics={animatedMetrics}
            projected={projected}
            treeCount={treeCount}
            profile={profile}
            selectedZone={selectedZone}
            timeHorizon={timeHorizon}
            simulated={simulated}
            isSimulating={isSimulating}
          />

          <BeforeAfterMetricsTable
            selectedZone={selectedZone}
            projected={projected}
            simulated={simulated}
            isSimulating={isSimulating}
            animatedMetrics={animatedMetrics}
          />
        </Col>
      </Row>

      <Row style={{ marginTop: 24 }}>
        <Col span={24}>
          <div className="eco-card map-card">
            <Title level={3}>Before vs After Geo Simulation</Title>

            <BeforeAfterGeoMaps
              geoData={geoData}
              selectedZone={selectedZone}
              simulated={simulated}
              isSimulating={isSimulating}
              timeHorizon={timeHorizon}
              progress={progress}
              treeCount={treeCount}
            />
          </div>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} md={12}>
          <PlantingSpotList
            geoData={geoData}
            selectedZone={selectedZone}
            treeCount={treeCount}
            simulated={simulated}
            isSimulating={isSimulating}
            progress={progress}
            split="left"
          />
        </Col>

        <Col xs={24} md={12}>
          <PlantingSpotList
            geoData={geoData}
            selectedZone={selectedZone}
            treeCount={treeCount}
            simulated={simulated}
            isSimulating={isSimulating}
            progress={progress}
            split="right"
          />
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        {!isSimulating && !simulated ? (
          <Col span={24}>
            <BaselineChart selectedZone={selectedZone} />
          </Col>
        ) : (
          <>
            <Col xs={24} xl={12}>
              <BeforeAfterChart beforeAfterData={beforeAfterData} />
            </Col>
            <Col xs={24} xl={12}>
              <LiveProgressChart
                selectedZone={selectedZone}
                projected={projected}
                progress={progress}
              />
            </Col>
          </>
        )}
      </Row>

      <Row style={{ marginTop: 24 }}>
        <Col span={24}>
          <GrowthTimelineChart
            timelineData={timelineData}
            selectedZone={selectedZone}
            treeType={treeType}
          />
        </Col>
      </Row>
    </div>
  );
}