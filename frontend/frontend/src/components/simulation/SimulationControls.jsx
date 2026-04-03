import React, { useEffect, useMemo, useRef } from 'react';
import { Card, Typography, Divider, Row, Col, Statistic, Alert, Tag } from 'antd';
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup } from 'react-leaflet';

import {
  findFeatureForZone,
  getFeatureBounds,
  getFeatureCenter,
  generatePlantingPoints,
  getFeatureDisplayName
} from './geoSimulationUtils';

const { Text } = Typography;

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
                key={pt.id}
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
                    Candidate micro-intervention point
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
  treeCount
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
    if (!selectedFeature) return [];
    return generatePlantingPoints(selectedFeature, treeCount);
  }, [selectedFeature, treeCount]);

  const visibleCount = Math.max(0, Math.round((plantingPoints.length * progress) / 100));
  const visiblePoints = plantingPoints.slice(0, visibleCount);

  const matchedFeatureName = useMemo(() => {
    if (!selectedFeature || !geoData?.features) return 'Selected Zone';
    const index = geoData.features.findIndex((f) => f === selectedFeature);
    return getFeatureDisplayName(selectedFeature, index);
  }, [selectedFeature, geoData]);

  const showAfterPanel = isSimulating || simulated;

  return (
    <Card
      className="eco-card"
      title={showAfterPanel ? 'Before vs After Geo Simulation' : 'Current Zone (Before Simulation)'}
    >
      <div
        style={{
          background: 'linear-gradient(180deg, #eff6ff 0%, #f0fdf4 100%)',
          borderRadius: 18,
          padding: 16,
          border: '1px solid #dbeafe'
        }}
      >
        <div style={{ marginBottom: 12 }}>
          <Text strong>{selectedZone.zone_name}</Text>
          <br />
          <Text type="secondary">
            {showAfterPanel
              ? 'Compare the current polygon ROI with the projected post-planting scenario.'
              : 'Current baseline ROI before any planting intervention.'}
          </Text>
          <div style={{ marginTop: 8 }}>
            <Tag color="blue">GeoJSON ROI: {matchedFeatureName}</Tag>
          </div>
        </div>

        {!geoData ? (
          <Alert
            type="warning"
            showIcon
            message="GeoJSON not available"
            description="City GeoJSON could not be loaded for this simulation."
          />
        ) : !selectedFeature ? (
          <Alert
            type="warning"
            showIcon
            message="No polygon available"
            description="No valid polygon could be matched for the selected zone."
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
            <Statistic title="Candidate Spots" value={showAfterPanel ? plantingPoints.length : 0} />
          </Col>
          <Col xs={8}>
            <Statistic
              title="Visible Trees (After)"
              value={showAfterPanel ? visibleCount : 0}
              suffix={showAfterPanel ? `/ ${plantingPoints.length}` : ''}
            />
          </Col>
          <Col xs={8}>
            <Statistic title="Simulation Progress" value={showAfterPanel ? progress : 0} suffix="%" />
          </Col>
        </Row>
      </div>
    </Card>
  );
}