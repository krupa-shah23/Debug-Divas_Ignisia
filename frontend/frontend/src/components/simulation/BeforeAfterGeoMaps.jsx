// import React, { useEffect, useMemo, useRef } from 'react';
// import { Card, Typography, Divider, Row, Col, Statistic, Alert, Tag } from 'antd';
// import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup } from 'react-leaflet';

// import {
//   findFeatureForZone,
//   getFeatureBounds,
//   getFeatureCenter,
//   generatePlantingPoints,
//   getFeatureDisplayName
// } from './geoSimulationUtils';

// const { Text } = Typography;

// function seededValue(seedStr, min, max) {
//   let hash = 0;
//   for (let i = 0; i < seedStr.length; i++) {
//     hash = (hash * 31 + seedStr.charCodeAt(i)) >>> 0;
//   }
//   const normalized = (hash % 1000) / 1000;
//   return min + normalized * (max - min);
// }

// function SingleMap({
//   title,
//   subtitle,
//   feature,
//   featureCenter,
//   featureBounds,
//   showPoints = false,
//   visiblePoints = [],
//   isAfter = false
// }) {
//   const mapRef = useRef(null);

//   useEffect(() => {
//     if (mapRef.current && featureBounds) {
//       setTimeout(() => {
//         mapRef.current.fitBounds(featureBounds, {
//           padding: [60, 60],
//           maxZoom: 14
//         });
//       }, 100);
//     }
//   }, [featureBounds]);

//   const zoneStyle = {
//     color: isAfter ? '#16a34a' : '#f97316',
//     weight: 3,
//     fillColor: isAfter ? '#22c55e' : '#fb923c',
//     fillOpacity: isAfter ? 0.18 : 0.12
//   };

//   return (
//     <div>
//       <div style={{ marginBottom: 10 }}>
//         <Text strong>{title}</Text>
//         <br />
//         <Text type="secondary">{subtitle}</Text>
//       </div>

//       <div
//         style={{
//           height: 300,
//           minHeight: 300,
//           borderRadius: 16,
//           overflow: 'hidden',
//           border: '1px solid #cbd5e1'
//         }}
//       >
//         <MapContainer
//           center={featureCenter}
//           zoom={13}
//           style={{ height: '100%', width: '100%' }}
//           ref={mapRef}
//           scrollWheelZoom={false}
//           doubleClickZoom={false}
//           dragging={true}
//           zoomControl={false}
//         >
//           <TileLayer
//             attribution='&copy; OpenStreetMap contributors'
//             url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
//           />

//           <GeoJSON data={feature} style={() => zoneStyle} />

//           {showPoints &&
//             visiblePoints.map((pt, idx) => (
//               <CircleMarker
//                 key={pt.id || idx}
//                 center={[pt.lat, pt.lng]}
//                 radius={6 + ((idx % 3) * 1.5)}
//                 pathOptions={{
//                   color: '#166534',
//                   fillColor: '#22c55e',
//                   fillOpacity: 0.9,
//                   weight: 2
//                 }}
//               >
//                 <Popup>
//                   <div>
//                     <strong>AI Planting Spot #{idx + 1}</strong>
//                     <br />
//                     Candidate intervention point
//                   </div>
//                 </Popup>
//               </CircleMarker>
//             ))}
//         </MapContainer>
//       </div>
//     </div>
//   );
// }

// export default function BeforeAfterGeoMaps({
//   geoData,
//   selectedZone,
//   simulated,
//   isSimulating,
//   timeHorizon,
//   progress,
//   treeCount,
//   usedFallback
// }) {
//   const selectedFeature = useMemo(() => {
//     if (!geoData) return null;
//     return findFeatureForZone(geoData, selectedZone);
//   }, [geoData, selectedZone]);

//   const featureBounds = useMemo(() => {
//     if (!selectedFeature) return null;
//     return getFeatureBounds(selectedFeature);
//   }, [selectedFeature]);

//   const featureCenter = useMemo(() => {
//     if (!selectedFeature) return [18.5204, 73.8567];
//     return getFeatureCenter(selectedFeature);
//   }, [selectedFeature]);

//   const plantingPoints = useMemo(() => {
//     if (!selectedFeature) {
//       if (usedFallback) {
//          // Create safe fallback spots
//          const count = Math.round(seededValue(selectedZone.zone_id || "fallback", 12, 35));
//          return Array.from({ length: count }).map((_, i) => ({ id: i, lat: 0, lng: 0 }));
//       }
//       return [];
//     }
//     return generatePlantingPoints(selectedFeature, treeCount);
//   }, [selectedFeature, treeCount, usedFallback, selectedZone.zone_id]);

//   const visibleCount = Math.max(0, Math.round((plantingPoints.length * progress) / 100));
//   const visiblePoints = plantingPoints.slice(0, visibleCount);

//   const matchedFeatureName = useMemo(() => {
//     if (!selectedFeature || !geoData?.features) return \`Zone \${selectedZone.zone_id}\`;
//     const index = geoData.features.findIndex((f) => f === selectedFeature);
//     return getFeatureDisplayName(selectedFeature, index);
//   }, [selectedFeature, geoData, selectedZone.zone_id]);

//   const showAfterPanel = isSimulating || simulated;

//   return (
//     <>
//       <div style={{ marginBottom: 16 }}>
//         <Typography.Title level={4} style={{ margin: 0 }}>
//           {showAfterPanel ? 'Projected GIS Simulation' : 'Current Baseline Geography'}
//         </Typography.Title>
//       </div>
//       <div
//         style={{
//           background: 'linear-gradient(180deg, #eff6ff 0%, #f0fdf4 100%)',
//           borderRadius: 18,
//           padding: 16,
//           border: '1px solid #dbeafe'
//         }}
//       >
//         <div style={{ marginBottom: 16 }}>
//           <Text strong>{selectedZone.zone_name || \`Zone \${selectedZone.zone_id}\`}</Text>
//           <br />
//           <Text type="secondary">
//             {showAfterPanel
//               ? 'Compare the current polygon ROI with the projected post-planting scenario.'
//               : 'Current baseline ROI before any planting intervention.'}
//           </Text>
//           <div style={{ marginTop: 8 }}>
//             <Tag color={usedFallback ? "orange" : "blue"}>
//               {usedFallback ? "Fallback Demographic Simulation" : \`GeoJSON ROI: \${matchedFeatureName}\`}
//             </Tag>
//           </div>
//         </div>

//         {usedFallback || !geoData || !selectedFeature ? (
//           <Alert
//             type="info"
//             message="Map Rendering Skipped"
//             description="Geospatial bounds missing. We are running the pure numerical heuristic simulation fallback, but polygon rendering is disabled."
//             style={{ marginBottom: 16, background: '#fff' }}
//           />
//         ) : (
//           <Row gutter={[16, 16]}>
//             <Col xs={24} md={showAfterPanel ? 12 : 24}>
//               <SingleMap
//                 title="Before Intervention"
//                 subtitle="Current ROI condition"
//                 feature={selectedFeature}
//                 featureCenter={featureCenter}
//                 featureBounds={featureBounds}
//                 showPoints={false}
//                 visiblePoints={[]}
//                 isAfter={false}
//               />
//             </Col>

//             {showAfterPanel && (
//               <Col xs={24} md={12}>
//                 <SingleMap
//                   title="After Intervention"
//                   subtitle={\`Projected \${timeHorizon}-month planting scenario\`}
//                   feature={selectedFeature}
//                   featureCenter={featureCenter}
//                   featureBounds={featureBounds}
//                   showPoints={true}
//                   visiblePoints={visiblePoints}
//                   isAfter={true}
//                 />
//               </Col>
//             )}
//           </Row>
//         )}

//         {/* ALWAYS SHOW FALLBACK STATS SO IT DOES NOT ZERO OUT */}
//         <Divider />
//         <Row gutter={12}>
//           <Col xs={8}>
//             <Statistic title="Candidate Spots" value={plantingPoints.length} />
//           </Col>
//           <Col xs={8}>
//             <Statistic
//               title="Visible Trees Generated"
//               value={showAfterPanel ? visibleCount : 0}
//               suffix={showAfterPanel ? \`/ \${plantingPoints.length}\` : ''}
//               valueStyle={{ color: showAfterPanel ? '#16a34a' : 'inherit' }}
//             />
//           </Col>
//           <Col xs={8}>
//             <Statistic 
//               title="Simulation Progress" 
//               value={showAfterPanel ? progress : 0} 
//               suffix="%" 
//               valueStyle={{ color: progress === 100 ? '#16a34a' : 'inherit' }}
//             />
//           </Col>
//         </Row>
//       </div>
//     </>
//   );
// }


import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, Typography, Divider, Row, Col, Statistic, Alert, Tag, Button } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup } from 'react-leaflet';

import {
  findFeatureForZone,
  getFeatureBounds,
  getFeatureCenter,
  generatePlantingPoints,
  getFeatureDisplayName
} from './geoSimulationUtils';

const { Text } = Typography;

function seededValue(seedStr, min, max) {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash * 31 + seedStr.charCodeAt(i)) >>> 0;
  }
  const normalized = (hash % 1000) / 1000;
  return min + normalized * (max - min);
}

function SingleMap({
  title,
  subtitle,
  feature,
  featureCenter,
  featureBounds,
  showPoints = false,
  visiblePoints = [],
  isAfter = false
}) {
  const mapRef = useRef(null);

  useEffect(() => {
    if (mapRef.current && featureBounds) {
      setTimeout(() => {
        mapRef.current.fitBounds(featureBounds, {
          padding: [60, 60],
          maxZoom: 14
        });
      }, 100);
    }
  }, [featureBounds]);

  const zoneStyle = {
    color: isAfter ? '#16a34a' : '#f97316',
    weight: 3,
    fillColor: isAfter ? '#22c55e' : '#fb923c',
    fillOpacity: isAfter ? 0.18 : 0.12
  };

  return (
    <div>
      <div style={{ marginBottom: 10 }}>
        <Text strong>{title}</Text>
        <br />
        <Text type="secondary">{subtitle}</Text>
      </div>

      <div
        style={{
          height: 300,
          minHeight: 300,
          borderRadius: 16,
          overflow: 'hidden',
          border: '1px solid #cbd5e1'
        }}
      >
        <MapContainer
          center={featureCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
          scrollWheelZoom={false}
          doubleClickZoom={false}
          dragging={true}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />

          <GeoJSON data={feature} style={() => zoneStyle} />

          {showPoints &&
            visiblePoints.map((pt, idx) => (
              <CircleMarker
                key={pt.id || idx}
                center={[pt.lat, pt.lng]}
                radius={6 + ((idx % 3) * 1.5)}
                pathOptions={{
                  color: '#166534',
                  fillColor: '#22c55e',
                  fillOpacity: 0.9,
                  weight: 2
                }}
              >
                <Popup>
                  <div>
                    <strong>AI Planting Spot #{idx + 1}</strong>
                    <br />
                    Candidate intervention point
                  </div>
                </Popup>
              </CircleMarker>
            ))}
        </MapContainer>
      </div>
    </div>
  );
}

export default function BeforeAfterGeoMaps({
  geoData,
  selectedZone,
  simulated,
  isSimulating,
  timeHorizon,
  progress,
  treeCount,
  usedFallback
}) {


  const selectedFeature = useMemo(() => {
    if (!geoData) return null;
    return findFeatureForZone(geoData, selectedZone);
  }, [geoData, selectedZone]);

  const featureBounds = useMemo(() => {
    if (!selectedFeature) return null;
    return getFeatureBounds(selectedFeature);
  }, [selectedFeature]);

  const featureCenter = useMemo(() => {
    if (!selectedFeature) return [18.5204, 73.8567];
    return getFeatureCenter(selectedFeature);
  }, [selectedFeature]);

  const plantingPoints = useMemo(() => {
    if (!selectedFeature) {
      if (usedFallback) {
        const count = Math.round(seededValue(selectedZone.zone_id || "fallback", 12, 35));
        return Array.from({ length: count }).map((_, i) => ({ id: i, lat: 0, lng: 0 }));
      }
      return [];
    }
    return generatePlantingPoints(selectedFeature, treeCount);
  }, [selectedFeature, treeCount, usedFallback, selectedZone.zone_id]);

  // Play animation locally


  const effectiveProgress = progress;

  const visibleCount = Math.max(0, Math.round((plantingPoints.length * effectiveProgress) / 100));
  const visiblePoints = plantingPoints.slice(0, visibleCount);

  const matchedFeatureName = useMemo(() => {
    if (!selectedFeature || !geoData?.features) return `Zone ${selectedZone.zone_id}`;
    const index = geoData.features.findIndex((f) => f === selectedFeature);
    return getFeatureDisplayName(selectedFeature, index);
  }, [selectedFeature, geoData, selectedZone.zone_id]);

  const showAfterPanel = isSimulating || simulated;



  return (
    <>
      <div
        style={{
          background: 'linear-gradient(180deg, #eff6ff 0%, #f0fdf4 100%)',
          borderRadius: 18,
          padding: 16,
          border: '1px solid #dbeafe'
        }}
      >
        {/* HEADER ROW */}
        <div
          style={{
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12
          }}
        >
          <Typography.Title level={4} style={{ margin: 0 }}>
            ROI Intervention Maps
          </Typography.Title>

          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handlePlaySimulation}
            disabled={usedFallback || !geoData || !selectedFeature || isPlaying}
            style={{
              borderRadius: 999,
              height: 40,
              paddingInline: 18,
              fontWeight: 600,
              background: '#10b981',
              borderColor: '#10b981',
              boxShadow: '0 6px 18px rgba(16,185,129,0.18)'
            }}
          >
            {isPlaying ? 'Simulating...' : 'Play Simulation'}
          </Button>
        </div>
        <div style={{ marginBottom: 16 }}>
          <Text strong>{selectedZone.zone_name || `Zone ${selectedZone.zone_id}`}</Text>
          <br />
          <Text type="secondary">
            {showAfterPanel
              ? 'Compare the current polygon ROI with the projected post-planting scenario.'
              : 'Current baseline ROI before any planting intervention.'}
          </Text>
          <div style={{ marginTop: 8 }}>
            <Tag color={usedFallback ? "orange" : "blue"}>
              {usedFallback ? "Fallback Demographic Simulation" : `GeoJSON ROI: ${matchedFeatureName}`}
            </Tag>
          </div>
        </div>

        {/* PLAY BUTTON ABOVE MAPS */}


        {usedFallback || !geoData || !selectedFeature ? (
          <Alert
            type="info"
            message="Map Rendering Skipped"
            description="Geospatial bounds missing. We are running the pure numerical heuristic simulation fallback, but polygon rendering is disabled."
            style={{ marginBottom: 16, background: '#fff' }}
          />
        ) : (
          <Row gutter={[16, 16]}>
            <Col xs={24} md={showAfterPanel ? 12 : 24}>
              <SingleMap
                title="Before Intervention"
                subtitle="Current ROI condition"
                feature={selectedFeature}
                featureCenter={featureCenter}
                featureBounds={featureBounds}
                showPoints={false}
                visiblePoints={[]}
                isAfter={false}
              />
            </Col>

            {showAfterPanel && (
              <Col xs={24} md={12}>
                <SingleMap
                  title="After Intervention"
                  subtitle={`Projected ${timeHorizon}-month planting scenario`}
                  feature={selectedFeature}
                  featureCenter={featureCenter}
                  featureBounds={featureBounds}
                  showPoints={true}
                  visiblePoints={visiblePoints}
                  isAfter={true}
                />
              </Col>
            )}
          </Row>
        )}

        <Divider />
        <Row gutter={12}>
          <Col xs={8}>
            <Statistic title="Candidate Spots" value={plantingPoints.length} />
          </Col>
          <Col xs={8}>
            <Statistic
              title="Visible Trees Generated"
              value={showAfterPanel ? visibleCount : 0}
              suffix={showAfterPanel ? `/ ${plantingPoints.length}` : ''}
              valueStyle={{ color: showAfterPanel ? '#16a34a' : 'inherit' }}
            />
          </Col>
          <Col xs={8}>
            <Statistic
              title="Simulation Progress"
              value={showAfterPanel ? effectiveProgress : 0}
              suffix="%"
              valueStyle={{ color: effectiveProgress === 100 ? '#16a34a' : 'inherit' }}
            />
          </Col>
        </Row>
      </div>
    </>
  );
}