import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, Typography, Row, Col, Tag, Spin, Button, Drawer, Alert, Table, Space } from 'antd';
import { AimOutlined, PlusOutlined, MinusOutlined } from '@ant-design/icons';
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup } from 'react-leaflet';
import { createMockGeoJSONPolygon, generatePlantingCoordinates } from './simulationEngine';
import { findFeatureForZone, getFeatureBounds, getFeatureCenter } from './geoSimulationUtils';

const { Title, Text } = Typography;

export default function SimulationMapCard({
  selectedZone,
  projection,
  geoData,
  usedMockGeo,
  simulated,
  isSimulating,
  timeHorizon
}) {
  const mapBeforeRef = useRef(null);
  const mapAfterRef = useRef(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  // 1. Resolve GeoJSON polygon matching
  const matchingFeature = useMemo(() => {
    if (usedMockGeo || !geoData || !geoData.features) return null;
    return findFeatureForZone(geoData, selectedZone);
  }, [geoData, selectedZone, usedMockGeo]);

  // 2. Compute Center
  const center = useMemo(() => {
    if (matchingFeature) return getFeatureCenter(matchingFeature);
    return [18.5204, 73.8567]; // default Pune
  }, [matchingFeature]);

  // 3. Fallback or Real ROI
  const activeFeature = useMemo(() => {
    if (matchingFeature) return matchingFeature;
    return createMockGeoJSONPolygon(center);
  }, [matchingFeature, center]);

  const bounds = useMemo(() => {
    return getFeatureBounds(activeFeature);
  }, [activeFeature]);

  useEffect(() => {
    const fitOpts = { padding: [20, 20], maxZoom: 15, animate: false };
    if (bounds) {
      setTimeout(() => {
        if (mapBeforeRef.current) mapBeforeRef.current.fitBounds(bounds, fitOpts);
        if (mapAfterRef.current) mapAfterRef.current.fitBounds(bounds, fitOpts);
      }, 150);
    }
  }, [bounds, activeFeature]);

  // 4. Base Dots and Planted Dots
  const simulatePoints = useMemo(() => {
    if (!simulated) return [];
    return generatePlantingCoordinates(center, projection.candidateSpots, selectedZone.zone_id);
  }, [simulated, center, projection.candidateSpots, selectedZone.zone_id]);
  
  // 5. Timeline Tree Scale
  const treeRadius = useMemo(() => {
    if (timeHorizon <= 6) return 6;
    if (timeHorizon <= 12) return 8;
    if (timeHorizon <= 60) return 12;
    return 16;
  }, [timeHorizon]);

  // Zoom Handlers
  const handleZoom = (mapRef, direction) => {
    if (!mapRef.current) return;
    if (direction === 'in') mapRef.current.zoomIn();
    else mapRef.current.zoomOut();
  };

  return (
    <Card 
       style={{ borderRadius: 16, boxShadow: '0 8px 24px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', height: '100%' }}
       bodyStyle={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Title level={4} style={{ margin: 0, fontWeight: 700, letterSpacing: '-0.3px', color: '#0f172a' }}>ROI Intervention Maps</Title>
          <div style={{ marginTop: 6 }}>
            {!matchingFeature || usedMockGeo ? (
              <Tag color="orange" style={{ border: 'none', borderRadius: 6 }}>Heuristic ROI Boundary</Tag>
            ) : (
              <Tag color="cyan" style={{ border: 'none', borderRadius: 6 }}>GIS Boundary Bound</Tag>
            )}
          </div>
        </div>
        {usedMockGeo && <Alert type="info" message={<Text strong style={{ fontSize: 13 }}>Demo Map Mode</Text>} showIcon style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#eff6ff' }} />}
      </div>

      <Row gutter={24} style={{ flexGrow: 1, minHeight: 400 }}>
        {/* LEFT MAP: BEFORE */}
        <Col span={12} style={{ display: 'flex', flexDirection: 'column' }}>
           <div style={{ paddingBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <Text strong style={{ fontSize: 15, color: '#334155' }}>Before Simulation</Text>
             <Tag style={{ borderRadius: 12, border: 'none', background: '#f1f5f9', color: '#64748b' }}>Baseline State</Tag>
           </div>
           <div style={{ position: 'relative', flexGrow: 1, borderRadius: 16, overflow: 'hidden', border: '2px solid #e2e8f0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)', background: '#f8fafc' }}>
              
              {/* Custom Zoom Controls */}
              <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 4, background: '#fff', padding: 4, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                 <Button type="text" size="small" icon={<PlusOutlined />} onClick={() => handleZoom(mapBeforeRef, 'in')} />
                 <Button type="text" size="small" icon={<MinusOutlined />} onClick={() => handleZoom(mapBeforeRef, 'out')} />
              </div>

              <MapContainer 
                 center={center} 
                 zoom={14} 
                 style={{ height: '100%', width: '100%', zIndex: 1 }}
                 ref={mapBeforeRef}
                 scrollWheelZoom={false}
                 zoomControl={false}
              >
                 <TileLayer
                   attribution='&copy; OpenStreetMap contributors'
                   url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                 />
                 <GeoJSON 
                    key={selectedZone.zone_id + 'before'} 
                    data={activeFeature} 
                    style={() => ({ color: '#94a3b8', weight: 2, fillColor: '#cbd5e1', fillOpacity: 0.15 })} 
                 />
              </MapContainer>
           </div>
        </Col>

        {/* RIGHT MAP: AFTER */}
        <Col span={12} style={{ display: 'flex', flexDirection: 'column' }}>
           <div style={{ paddingBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <Text strong style={{ fontSize: 15, color: simulated ? '#065f46' : '#334155' }}>After Simulation</Text>
             <Tag color={simulated ? "green" : "default"} style={{ borderRadius: 12, border: 'none' }}>
                {simulated ? `${projection.candidateSpots} Trees Planted` : 'Awaiting simulation...'}
             </Tag>
           </div>
           <div style={{ position: 'relative', flexGrow: 1, borderRadius: 16, overflow: 'hidden', border: simulated ? '2px solid #34d399' : '2px solid #e2e8f0', boxShadow: simulated ? '0 4px 20px rgba(16, 185, 129, 0.15)' : 'inset 0 2px 4px rgba(0,0,0,0.02)', background: simulated ? '#ecfdf5' : '#f8fafc', transition: 'all 0.4s ease' }}>
              {isSimulating && (
                 <div style={{ position: 'absolute', inset: 0, zIndex: 1000, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
                    <Spin size="large" tip={<div style={{ marginTop: 12, fontWeight: 500 }}>Computing Impact...</div>} />
                 </div>
              )}
              
              {/* Custom Zoom Controls */}
              <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 4, background: '#fff', padding: 4, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                 <Button type="text" size="small" icon={<PlusOutlined />} onClick={() => handleZoom(mapAfterRef, 'in')} />
                 <Button type="text" size="small" icon={<MinusOutlined />} onClick={() => handleZoom(mapAfterRef, 'out')} />
              </div>

              <MapContainer 
                 center={center} 
                 zoom={14} 
                 style={{ height: '100%', width: '100%', zIndex: 1 }}
                 ref={mapAfterRef}
                 scrollWheelZoom={false}
                 zoomControl={false}
              >
                 <TileLayer
                   attribution='&copy; OpenStreetMap contributors'
                   url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                 />
                 
                 <GeoJSON 
                    key={selectedZone.zone_id + (simulated ? 'after' : 'after-wait')} 
                    data={activeFeature} 
                    style={() => ({
                      color: simulated ? '#10b981' : '#94a3b8',
                      weight: 2,
                      fillColor: simulated ? '#34d399' : '#cbd5e1',
                      fillOpacity: simulated ? 0.2 : 0.15
                    })} 
                 />

                 {simulated && simulatePoints.map((pt) => (
                   <CircleMarker
                     key={pt.id}
                     center={[pt.lat, pt.lng]}
                     radius={treeRadius}
                     pathOptions={{
                       color: '#064e3b',
                       fillColor: '#10b981',
                       fillOpacity: 0.85,
                       weight: treeRadius > 10 ? 2 : 1
                     }}
                   >
                     <Popup className="premium-popup">
                       <div style={{ padding: '4px 0' }}>
                         <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>Tree Cluster {pt.id}</Text>
                         <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Lat: {pt.lat}</Text>
                         <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>Lng: {pt.lng}</Text>
                         <Tag color="success" style={{ margin: 0, borderRadius: 4 }}>Survival Prob: {pt.suitability}</Tag>
                       </div>
                     </Popup>
                   </CircleMarker>
                 ))}
              </MapContainer>

              {/* EMBEDDED DYNAMIC FAB */}
              <Button 
                type="primary" 
                size="middle"
                shape="round"
                icon={<AimOutlined />}
                disabled={!simulated}
                onClick={() => setDrawerVisible(true)}
                style={{
                  position: 'absolute',
                  bottom: 16,
                  right: 16,
                  boxShadow: simulated ? '0 8px 16px rgba(16, 185, 129, 0.4)' : 'none',
                  background: simulated ? '#10b981' : '#cbd5e1',
                  color: '#fff',
                  border: 'none',
                  zIndex: 2000,
                  fontWeight: 600,
                  padding: '0 20px'
                }}
              >
                Coordinates
              </Button>
           </div>
        </Col>
      </Row>

      <Drawer
        title={<Text strong style={{ fontSize: 16 }}>Intervention Coordinates</Text>}
        placement="right"
        width={420}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        zIndex={10000}
        bodyStyle={{ background: '#f8fafc', padding: 24 }}
        headerStyle={{ borderBottom: '1px solid #f1f5f9' }}
      >
        {!simulated ? (
           <Alert message="No planting coordinates available yet. Run simulation first." type="warning" showIcon style={{ borderRadius: 12, border: 'none' }} />
        ) : (
           <>
             <Alert 
               message={<Text strong>Generated Target Zones</Text>} 
               description="These exact latitude and longitude points specify the maximal cooling impact locations for intervention."
               type="info"
               showIcon
               style={{ marginBottom: 20, borderRadius: 12, border: 'none', background: '#eff6ff' }}
             />
             <Card bodyStyle={{ padding: 0 }} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
               <Table 
                 dataSource={simulatePoints}
                 pagination={false}
                 size="middle"
                 rowKey="id"
                 columns={[
                   { title: 'Tree ID', dataIndex: 'id', render: (val) => <Text strong>{val}</Text> },
                   { title: 'Latitude', dataIndex: 'lat', render: (val) => <Text type="secondary">{val}</Text> },
                   { title: 'Longitude', dataIndex: 'lng', render: (val) => <Text type="secondary">{val}</Text> }
                 ]}
               />
             </Card>
           </>
        )}
      </Drawer>
    </Card>
  );
}
