// import React, { useMemo, useState } from 'react';
// import { Row, Col, Typography, message } from 'antd';

// import SimulationControls from '../components/simulation/SimulationControls';
// import BeforeAfterGeoMaps from '../components/simulation/BeforeAfterGeoMaps';
// import ProjectedImpactSummary from '../components/simulation/ProjectedImpactSummary';
// import BeforeAfterChart from '../components/simulation/BeforeAfterChart';
// import GrowthTimelineChart from '../components/simulation/GrowthTimelineChart';
// import LiveProgressChart from '../components/simulation/LiveProgressChart';
// import BaselineChart from '../components/simulation/BaselineChart';
// import BeforeAfterMetricsTable from '../components/simulation/BeforeAfterMetricsTable';
// import PlantingSpotList from '../components/simulation/PlantingSpotList';

// import { mockZones, treeProfiles, horizonFactors } from '../components/simulation/simulationData';
// import {
//   calculateProjectedMetrics,
//   getAnimatedMetrics,
//   getBeforeAfterData,
//   getTimelineData
// } from '../components/simulation/simulationUtils';

// const { Title, Paragraph } = Typography;

// export default function Simulation() {
//   const [selectedZoneId, setSelectedZoneId] = useState('zone_5');
//   const [treeCount, setTreeCount] = useState(40);
//   const [treeType, setTreeType] = useState('native');
//   const [timeHorizon, setTimeHorizon] = useState(12);
//   const [progress, setProgress] = useState(0);
//   const [isSimulating, setIsSimulating] = useState(false);
//   const [simulated, setSimulated] = useState(false);

//   const selectedZone = useMemo(
//     () => mockZones.find((z) => z.zone_id === selectedZoneId) || mockZones[0],
//     [selectedZoneId]
//   );

//   const profile = treeProfiles[treeType];
//   const horizonFactor = horizonFactors[timeHorizon];
//   const showSimulationOutputs = isSimulating || simulated;

//   const projected = useMemo(
//     () => calculateProjectedMetrics(selectedZone, treeCount, profile, horizonFactor),
//     [selectedZone, treeCount, profile, horizonFactor]
//   );

//   const animatedMetrics = useMemo(
//     () => getAnimatedMetrics(selectedZone, projected, progress),
//     [selectedZone, projected, progress]
//   );

//   const beforeAfterData = useMemo(
//     () => getBeforeAfterData(selectedZone, projected, simulated, isSimulating),
//     [selectedZone, projected, simulated, isSimulating]
//   );

//   const timelineData = useMemo(
//     () => getTimelineData(selectedZone, projected, timeHorizon),
//     [selectedZone, projected, timeHorizon]
//   );

//   const handleZoneChange = (zoneId) => {
//     const zone = mockZones.find((z) => z.zone_id === zoneId);
//     setSelectedZoneId(zoneId);
//     setTreeCount(zone?.recommended_trees || 30);
//     setProgress(0);
//     setSimulated(false);
//   };

//   const runSimulation = () => {
//     if (!selectedZone.water_access && treeType !== 'drought') {
//       message.warning(
//         'This zone has low water access. Consider using Drought-Resilient Species for better feasibility.'
//       );
//     }

//     setIsSimulating(true);
//     setSimulated(false);
//     setProgress(0);

//     let current = 0;
//     const interval = setInterval(() => {
//       current += 4;

//       if (current >= 100) {
//         current = 100;
//         clearInterval(interval);
//         setIsSimulating(false);
//         setSimulated(true);
//         message.success('Simulation complete: projected post-planting scenario generated.');
//       }

//       setProgress(current);
//     }, 100);
//   };

//   return (
//     <div>
//       <Title level={2} style={{ marginBottom: 8 }}>Before vs After Simulation</Title>
//       <Paragraph type="secondary" style={{ marginBottom: 24 }}>
//         Start with the baseline condition of a selected intervention zone, then run a planting simulation to reveal
//         projected improvements, exact planting locations, and metric changes over time.
//       </Paragraph>

//       <Row gutter={[24, 24]}>
//         {/* LEFT SIDE */}
//         <Col xs={24} lg={8}>
//           <SimulationControls
//             mockZones={mockZones}
//             selectedZoneId={selectedZoneId}
//             handleZoneChange={handleZoneChange}
//             treeType={treeType}
//             setTreeType={setTreeType}
//             timeHorizon={timeHorizon}
//             setTimeHorizon={setTimeHorizon}
//             treeCount={treeCount}
//             setTreeCount={setTreeCount}
//             selectedZone={selectedZone}
//             profile={profile}
//             runSimulation={runSimulation}
//             isSimulating={isSimulating}
//             progress={progress}
//             setProgress={setProgress}
//             setSimulated={setSimulated}
//           />

//           <BeforeAfterGeoMaps
//             selectedZone={selectedZone}
//             simulated={simulated}
//             isSimulating={isSimulating}
//             timeHorizon={timeHorizon}
//             progress={progress}
//             treeCount={treeCount}
//           />

//           <PlantingSpotList
//             selectedZone={selectedZone}
//             treeCount={treeCount}
//             simulated={simulated}
//             isSimulating={isSimulating}
//             progress={progress}
//           />
//         </Col>

//         {/* RIGHT SIDE */}
//         <Col xs={24} lg={16}>
//           <ProjectedImpactSummary
//             animatedMetrics={animatedMetrics}
//             projected={projected}
//             treeCount={treeCount}
//             profile={profile}
//             selectedZone={selectedZone}
//             timeHorizon={timeHorizon}
//             simulated={simulated}
//             isSimulating={isSimulating}
//           />

//           <BeforeAfterMetricsTable
//             selectedZone={selectedZone}
//             projected={projected}
//             simulated={simulated}
//             isSimulating={isSimulating}
//             animatedMetrics={animatedMetrics}
//           />

//           {!showSimulationOutputs ? (
//             <BaselineChart selectedZone={selectedZone} />
//           ) : (
//             <Row gutter={[20, 20]} style={{ marginBottom: 16 }}>
//               <Col xs={24} xl={12}>
//                 <BeforeAfterChart beforeAfterData={beforeAfterData} />
//               </Col>
//               <Col xs={24} xl={12}>
//                 <LiveProgressChart
//                   selectedZone={selectedZone}
//                   projected={projected}
//                   progress={progress}
//                 />
//               </Col>
//             </Row>
//           )}

//           <GrowthTimelineChart
//             timelineData={timelineData}
//             selectedZone={selectedZone}
//             treeType={treeType}
//           />
//         </Col>
//       </Row>
//     </div>
//   );
// }

import React, { useMemo, useState } from 'react';
import { Row, Col, Typography, message } from 'antd';

import SimulationControls from '../components/simulation/SimulationControls';
import BeforeAfterGeoMaps from '../components/simulation/BeforeAfterGeoMaps';
import ProjectedImpactSummary from '../components/simulation/ProjectedImpactSummary';
import BeforeAfterChart from '../components/simulation/BeforeAfterChart';
import GrowthTimelineChart from '../components/simulation/GrowthTimelineChart';
import LiveProgressChart from '../components/simulation/LiveProgressChart';
import BaselineChart from '../components/simulation/BaselineChart';
import BeforeAfterMetricsTable from '../components/simulation/BeforeAfterMetricsTable';
import PlantingSpotList from '../components/simulation/PlantingSpotList';

import { mockZones, treeProfiles, horizonFactors } from '../components/simulation/simulationData';
import {
  calculateProjectedMetrics,
  getAnimatedMetrics,
  getBeforeAfterData,
  getTimelineData
} from '../components/simulation/simulationUtils';

const { Title, Paragraph } = Typography;

export default function Simulation() {
  const [selectedZoneId, setSelectedZoneId] = useState('zone_5');
  const [treeCount, setTreeCount] = useState(40);
  const [treeType, setTreeType] = useState('native');
  const [timeHorizon, setTimeHorizon] = useState(12);
  const [progress, setProgress] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulated, setSimulated] = useState(false);

  const selectedZone = useMemo(
    () => mockZones.find((z) => z.zone_id === selectedZoneId) || mockZones[0],
    [selectedZoneId]
  );

  const profile = treeProfiles[treeType];
  const horizonFactor = horizonFactors[timeHorizon];
  const showSimulationOutputs = isSimulating || simulated;

  const projected = useMemo(
    () => calculateProjectedMetrics(selectedZone, treeCount, profile, horizonFactor),
    [selectedZone, treeCount, profile, horizonFactor]
  );

  const animatedMetrics = useMemo(
    () => getAnimatedMetrics(selectedZone, projected, progress),
    [selectedZone, projected, progress]
  );

  const beforeAfterData = useMemo(
    () => getBeforeAfterData(selectedZone, projected, simulated, isSimulating),
    [selectedZone, projected, simulated, isSimulating]
  );

  const timelineData = useMemo(
    () => getTimelineData(selectedZone, projected, timeHorizon),
    [selectedZone, projected, timeHorizon]
  );

  const handleZoneChange = (zoneId) => {
    const zone = mockZones.find((z) => z.zone_id === zoneId);
    setSelectedZoneId(zoneId);
    setTreeCount(zone?.recommended_trees || 30);
    setProgress(0);
    setSimulated(false);
  };

  const runSimulation = () => {
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

  return (
    <div style={{ padding: '20px' }}>

      {/* TOP SECTION */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          <SimulationControls
            mockZones={mockZones}
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

      {/* 🔥 FULL WIDTH MAP */}
      <Row style={{ marginTop: 24 }}>
        <Col span={24}>
          <div className="eco-card map-card">
            <Title level={3}>Before vs After Geo Simulation</Title>

            <BeforeAfterGeoMaps
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

      {/* 🔥 SPLIT PLANTING SPOTS */}
<Row gutter={[24, 24]} style={{ marginTop: 24 }}>
  
  <Col xs={24} md={12}>
    <PlantingSpotList
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
      selectedZone={selectedZone}
      treeCount={treeCount}
      simulated={simulated}
      isSimulating={isSimulating}
      progress={progress}
      split="right"
    />
  </Col>

</Row>

      {/* CHARTS */}
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

      {/* TIMELINE */}
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

