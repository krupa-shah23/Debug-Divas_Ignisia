// import React, { useEffect, useMemo, useState } from 'react';
// import { Card, List, Tag, Typography, Spin, Alert } from 'antd';
// import { findFeatureForZone, generatePlantingPoints } from './geoSimulationUtils';

// const { Text, Paragraph } = Typography;

// function getSpotLabel(point, allPoints) {
//   if (!allPoints.length) return 'Candidate Spot';

//   const avgLat = allPoints.reduce((sum, p) => sum + p.lat, 0) / allPoints.length;
//   const avgLng = allPoints.reduce((sum, p) => sum + p.lng, 0) / allPoints.length;

//   const vertical =
//     point.lat > avgLat + 0.00005
//       ? 'North'
//       : point.lat < avgLat - 0.00005
//       ? 'South'
//       : 'Central';

//   const horizontal =
//     point.lng > avgLng + 0.00005
//       ? 'East'
//       : point.lng < avgLng - 0.00005
//       ? 'West'
//       : 'Core';

//   if (vertical === 'Central' && horizontal === 'Core') return 'Central Heat Pocket';
//   if (vertical === 'Central') return `${horizontal} Edge Corridor`;
//   if (horizontal === 'Core') return `${vertical} Open Patch`;

//   return `${vertical}-${horizontal} Planting Cluster`;
// }

// function getSpotReason(index) {
//   const reasons = [
//     'Low canopy + high exposed built surface',
//     'Thermal hotspot with strong cooling ROI',
//     'Feasible open micro-space inside ROI',
//     'High shade potential near dense built-up edge',
//     'Suitable spacing for clustered sapling placement'
//   ];

//   return reasons[index % reasons.length];
// }

// export default function PlantingSpotList({
//   selectedZone,
//   treeCount,
//   simulated,
//   isSimulating,
//   progress
// }) {
//   const [geojsonData, setGeojsonData] = useState(null);
//   const [loadingGeo, setLoadingGeo] = useState(true);
//   const [geoError, setGeoError] = useState(null);

//   useEffect(() => {
//     const loadGeo = async () => {
//       try {
//         setLoadingGeo(true);
//         setGeoError(null);

//         const res = await fetch('/zones.geojson');
//         if (!res.ok) {
//           throw new Error('Could not load zones.geojson');
//         }

//         const data = await res.json();
//         setGeojsonData(data);
//       } catch (err) {
//         console.error('GeoJSON load error:', err);
//         setGeoError(err.message || 'Failed to load GeoJSON');
//       } finally {
//         setLoadingGeo(false);
//       }
//     };

//     loadGeo();
//   }, []);

//   const selectedFeature = useMemo(() => {
//     if (!geojsonData) return null;
//     return findFeatureForZone(geojsonData, selectedZone);
//   }, [geojsonData, selectedZone]);

//   const plantingPoints = useMemo(() => {
//     if (!selectedFeature) return [];
//     return generatePlantingPoints(selectedFeature, treeCount);
//   }, [selectedFeature, treeCount]);

//   const visibleCount = Math.max(0, Math.round((plantingPoints.length * progress) / 100));
//   const visiblePoints =
//     simulated || isSimulating ? plantingPoints.slice(0, visibleCount) : [];

//   return (
//     <Card className="eco-card" title="Exact Planting Locations" style={{ marginTop: 16 }}>
//       {loadingGeo ? (
//         <div
//           style={{
//             minHeight: 100,
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center'
//           }}
//         >
//           <Spin />
//         </div>
//       ) : geoError ? (
//         <Alert
//           type="warning"
//           showIcon
//           title="GeoJSON unavailable"
//           description="Unable to load planting spot recommendations."
//         />
//       ) : !(simulated || isSimulating) ? (
//         <Paragraph style={{ marginBottom: 0 }}>
//           Run the simulation to reveal named AI-suggested planting zones inside the selected polygon.
//         </Paragraph>
//       ) : visiblePoints.length === 0 ? (
//         <Paragraph style={{ marginBottom: 0 }}>
//           Simulation is starting… planting locations will appear progressively.
//         </Paragraph>
//       ) : (
//         <List
//           size="small"
//           dataSource={visiblePoints}
//           renderItem={(point, index) => {
//             const label = getSpotLabel(point, plantingPoints);
//             const reason = getSpotReason(index);
//             const treesPerSpot = Math.max(2, Math.round(treeCount / Math.max(1, plantingPoints.length)));

//             return (
//               <List.Item style={{ padding: '10px 0' }}>
//                 <div style={{ width: '100%' }}>
//                   <div
//                     style={{
//                       display: 'flex',
//                       justifyContent: 'space-between',
//                       gap: 8,
//                       flexWrap: 'wrap'
//                     }}
//                   >
//                     <Text strong>{label}</Text>
//                     <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
//                       <Tag color="green">{treesPerSpot} trees</Tag>
//                       <Tag color="blue">Spot #{index + 1}</Tag>
//                     </div>
//                   </div>

//                   <div style={{ marginTop: 4 }}>
//                     <Text type="secondary">{reason}</Text>
//                   </div>

//                   <div style={{ marginTop: 4 }}>
//                     <Text style={{ fontSize: 12 }}>
//                       Lat: {point.lat.toFixed(5)} | Lng: {point.lng.toFixed(5)}
//                     </Text>
//                   </div>
//                 </div>
//               </List.Item>
//             );
//           }}
//         />
//       )}
//     </Card>
//   );
// }

import React, { useEffect, useMemo, useState } from 'react';
import { Card, List, Tag, Typography, Spin, Alert } from 'antd';
import { findFeatureForZone, generatePlantingPoints } from './geoSimulationUtils';

const { Text, Paragraph } = Typography;

function getSpotLabel(point, allPoints) {
  if (!allPoints.length) return 'Candidate Spot';

  const avgLat = allPoints.reduce((sum, p) => sum + p.lat, 0) / allPoints.length;
  const avgLng = allPoints.reduce((sum, p) => sum + p.lng, 0) / allPoints.length;

  const vertical =
    point.lat > avgLat + 0.00005
      ? 'North'
      : point.lat < avgLat - 0.00005
      ? 'South'
      : 'Central';

  const horizontal =
    point.lng > avgLng + 0.00005
      ? 'East'
      : point.lng < avgLng - 0.00005
      ? 'West'
      : 'Core';

  if (vertical === 'Central' && horizontal === 'Core') return 'Central Heat Pocket';
  if (vertical === 'Central') return `${horizontal} Edge Corridor`;
  if (horizontal === 'Core') return `${vertical} Open Patch`;

  return `${vertical}-${horizontal} Planting Cluster`;
}

function getSpotReason(index) {
  const reasons = [
    'Low canopy + high exposed built surface',
    'Thermal hotspot with strong cooling ROI',
    'Feasible open micro-space inside ROI',
    'High shade potential near dense built-up edge',
    'Suitable spacing for clustered sapling placement'
  ];

  return reasons[index % reasons.length];
}

export default function PlantingSpotList({
  selectedZone,
  treeCount,
  simulated,
  isSimulating,
  progress,
  split // ✅ ADDED
}) {
  const [geojsonData, setGeojsonData] = useState(null);
  const [loadingGeo, setLoadingGeo] = useState(true);
  const [geoError, setGeoError] = useState(null);

  useEffect(() => {
    const loadGeo = async () => {
      try {
        setLoadingGeo(true);
        setGeoError(null);

        const res = await fetch('/zones.geojson');
        if (!res.ok) {
          throw new Error('Could not load zones.geojson');
        }

        const data = await res.json();
        setGeojsonData(data);
      } catch (err) {
        console.error('GeoJSON load error:', err);
        setGeoError(err.message || 'Failed to load GeoJSON');
      } finally {
        setLoadingGeo(false);
      }
    };

    loadGeo();
  }, []);

  const selectedFeature = useMemo(() => {
    if (!geojsonData) return null;
    return findFeatureForZone(geojsonData, selectedZone);
  }, [geojsonData, selectedZone]);

  const plantingPoints = useMemo(() => {
    if (!selectedFeature) return [];
    return generatePlantingPoints(selectedFeature, treeCount);
  }, [selectedFeature, treeCount]);

  const visibleCount = Math.max(0, Math.round((plantingPoints.length * progress) / 100));
  const visiblePoints =
    simulated || isSimulating ? plantingPoints.slice(0, visibleCount) : [];

  // ✅ ADDED SPLIT LOGIC
  const half = Math.ceil(visiblePoints.length / 2);
  const displayPoints =
    split === 'left'
      ? visiblePoints.slice(0, half)
      : split === 'right'
      ? visiblePoints.slice(half)
      : visiblePoints;

  return (
    <Card className="eco-card" title="Exact Planting Locations" style={{ marginTop: 16 }}>
      {loadingGeo ? (
        <div
          style={{
            minHeight: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Spin />
        </div>
      ) : geoError ? (
        <Alert
          type="warning"
          showIcon
          title="GeoJSON unavailable"
          description="Unable to load planting spot recommendations."
        />
      ) : !(simulated || isSimulating) ? (
        <Paragraph style={{ marginBottom: 0 }}>
          Run the simulation to reveal named AI-suggested planting zones inside the selected polygon.
        </Paragraph>
      ) : displayPoints.length === 0 ? (
        <Paragraph style={{ marginBottom: 0 }}>
          Simulation is starting… planting locations will appear progressively.
        </Paragraph>
      ) : (
        <List
          size="small"
          dataSource={displayPoints} // ✅ CHANGED
          renderItem={(point, index) => {
            const label = getSpotLabel(point, plantingPoints);
            const reason = getSpotReason(index);
            const treesPerSpot = Math.max(2, Math.round(treeCount / Math.max(1, plantingPoints.length)));

            return (
              <List.Item style={{ padding: '10px 0' }}>
                <div style={{ width: '100%' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 8,
                      flexWrap: 'wrap'
                    }}
                  >
                    <Text strong>{label}</Text>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <Tag color="green">{treesPerSpot} trees</Tag>
                      <Tag color="blue">Spot #{index + 1}</Tag>
                    </div>
                  </div>

                  <div style={{ marginTop: 4 }}>
                    <Text type="secondary">{reason}</Text>
                  </div>

                  <div style={{ marginTop: 4 }}>
                    <Text style={{ fontSize: 12 }}>
                      Lat: {point.lat.toFixed(5)} | Lng: {point.lng.toFixed(5)}
                    </Text>
                  </div>
                </div>
              </List.Item>
            );
          }}
        />
      )}
    </Card>
  );
}

